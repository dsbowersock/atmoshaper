package com.atmoshaper.app

import android.content.Context
import android.content.ContextWrapper
import android.os.SystemClock
import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.platform.app.InstrumentationRegistry
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test
import org.junit.runner.RunWith
import org.json.JSONObject
import java.util.UUID

@RunWith(AndroidJUnit4::class)
class ClockBackgroundAccessMutationTest {
    @Test
    fun destroyedDocumentUnblocksExactReadAndItsLateReplyCannotReleaseAnotherMutation() {
        val instrumentation = InstrumentationRegistry.getInstrumentation()
        instrumentation.runOnMainSync {
            val old = ClockBackgroundAccessChanges.MutationOwner()
            val current = ClockBackgroundAccessChanges.MutationOwner()
            val changes = ClockBackgroundAccessChanges.changes
            try {
                old.receive("${old.documentId}:replacing:1")
                assertTrue(changes.value.mutating)
                old.close()
                assertFalse(changes.value.mutating)

                current.receive("${current.documentId}:replacing:1")
                current.receive("${current.documentId}:removing:2")
                val removing = changes.value
                old.receive("${old.documentId}:replaced:1")
                current.receive("${old.documentId}:removed:2")
                current.receive("${current.documentId}:replace-failed:1")
                current.receive("${current.documentId}:replacing:1")
                assertEquals(removing, changes.value)
                current.receive("${current.documentId}:remove-failed:2")
                assertTrue(changes.value.mutating)
                current.close()
                assertFalse(changes.value.mutating)
                assertTrue(changes.value.serial > removing.serial)
            } finally {
                old.close()
                current.close()
            }
        }
    }

    @Test
    fun aVerifiedNewReceiptRecoversFromOldClockEvidenceWithoutATerminalMessage() {
        val target = InstrumentationRegistry.getInstrumentation().targetContext
        val fixture = "clock-mutation-test-${UUID.randomUUID()}"
        val context = object : ContextWrapper(target) {
            override fun getSharedPreferences(name: String, mode: Int) = super.getSharedPreferences(fixture, mode)
        }
        val now = System.currentTimeMillis()
        val paidThrough = now + 600_000L
        val elapsed = SystemClock.elapsedRealtime()
        fun verifiedReceipt(issued: Long) = ClockBackgroundAccess.decode(JSONObject()
            .put("status", "verified").put("issuedAt", issued)
            .put("paidThrough", paidThrough).put("clockValidAfter", issued - 60_000L)
            .put("ownedIds", org.json.JSONArray()).toString())
        try {
            val old = verifiedReceipt(now)
            fun guard() = ClockBackgroundAccessChanges.ClockGuard(context)
            assertEquals(ClockAccessStatus.Verified, guard().evaluate(old, now + 120_000L, elapsed).status)
            assertEquals(ClockAccessStatus.Rollback, guard().evaluate(old, now, elapsed).status)
            assertEquals(ClockAccessStatus.Expired, guard().evaluate(old, paidThrough, elapsed).status)
            assertEquals(ClockAccessStatus.Expired, guard().evaluate(old, now, elapsed).status)

            // Model a durable later approval with the same paid-through value
            // and a missing terminal event: the next verifier export suffices.
            val replacement = verifiedReceipt(now + 1_000L)
            assertEquals(ClockAccessStatus.Verified, guard().evaluate(replacement, now + 1_000L, elapsed).status)
            assertEquals(ClockAccessStatus.Unavailable, guard().evaluate(old, now + 1_000L, elapsed).status)
            assertEquals(ClockAccessStatus.Verified, guard().evaluate(replacement, now + 1_000L, elapsed).status)
        } finally {
            target.deleteSharedPreferences(fixture)
        }
    }
}
