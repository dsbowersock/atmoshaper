package com.atmoshaper.app

import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.platform.app.InstrumentationRegistry
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test
import org.junit.runner.RunWith

@RunWith(AndroidJUnit4::class)
class ClockBackgroundAccessMutationTest {
    @Test
    fun destroyedDocumentUnblocksExactReadAndItsLateReplyCannotReleaseAnotherMutation() {
        val instrumentation = InstrumentationRegistry.getInstrumentation()
        instrumentation.runOnMainSync {
            val context = instrumentation.targetContext
            val old = ClockBackgroundAccessChanges.MutationOwner(context)
            val current = ClockBackgroundAccessChanges.MutationOwner(context)
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
}
