package com.atmoshaper.app

import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.platform.app.InstrumentationRegistry
import org.json.JSONArray
import org.json.JSONObject
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Assert.assertThrows
import org.junit.Test
import org.junit.runner.RunWith
import java.io.File
import java.nio.file.Files

@RunWith(AndroidJUnit4::class)
class NativeTimerStateTest {
    private val start = 1_700_000_000_000L

    @Test
    fun runningAndPausedTimersKeepTheirDeadlineAndIntervalAcrossFiles() {
        val context = InstrumentationRegistry.getInstrumentation().targetContext
        val directory = Files.createTempDirectory(context.cacheDir.toPath(), "timer-state").toFile()
        val path = File(directory, "timer.json")
        try {
            val setup = TimerSetup(minutes = 4, interval = TimerInterval.Custom, intervalMinutes = 1)
            val store = NativeTimerFile(path)
            store.importIfAbsent(TimerSnapshot())
            val running = store.update { it.start(setup, start) }
            assertEquals(start + 240_000, running.deadlineMs)
            val paused = NativeTimerFile(path).update { it.pause(start + 25_000) }
            assertEquals(215_000L, paused.remainingAt(start + 100_000))
            assertNull(paused.deadlineMs)
            val resumed = store.update { it.resume(start + 100_000) }
            assertEquals(start + 315_000, resumed.deadlineMs)
            assertEquals(TimerCuePosition.Deadline(start + 135_000), resumed.cuePosition)
            val adjusted = store.update { it.adjust(60_000, start + 110_000).snapshot }
            assertEquals(start + 375_000, adjusted.deadlineMs)
            assertEquals(TimerCuePosition.Deadline(start + 135_000), adjusted.cuePosition)
            assertEquals(TimerPhase.Complete, adjusted.advance(start + 400_000, false).snapshot.phase)
            assertNull(adjusted.advance(start + 400_000, false).cue)
            assertEquals(TimerPhase.Ready, store.update { it.end() }.phase)
            assertEquals(TimerPhase.Ready, NativeTimerFile(path).read()?.phase)
        } finally {
            path.delete()
            directory.delete()
        }
    }

    @Test
    fun foregroundAdjustmentCanConsumeFreshExpiryButCannotReplayIt() {
        val running = TimerSnapshot().start(TimerSetup(minutes = 2, cue = TimerCue.Flash), start)
        val deadline = checkNotNull(running.deadlineMs)
        for (observedAt in listOf(deadline, deadline + 1_249)) {
            val adjustments = listOf(running.adjust(-TIMER_MINUTE_MS, observedAt), running.setInterval(1, observedAt))
            for (completed in adjustments) {
                assertEquals(TimerPhase.Complete, completed.snapshot.phase)
                assertEquals(TimerSignal.Completion, completed.cue)
                assertNull(completed.snapshot.advance(observedAt, true).cue)
                assertNull(completed.snapshot.setRemaining(0, observedAt).cue)
                assertNull(completed.snapshot.setInterval(1, observedAt).cue)
            }
        }
        assertNull(running.adjust(-TIMER_MINUTE_MS, deadline + 1_250).cue)
        assertNull(running.setInterval(1, deadline + 1_250).cue)
        assertNull(running.advance(deadline, false).cue)

        val withInterval = TimerSnapshot().start(TimerSetup(minutes = 2, intervalMinutes = 1), start)
        assertNull(withInterval.adjust(TIMER_MINUTE_MS, start + TIMER_MINUTE_MS).cue)
    }

    @Test
    fun aForegroundIntervalIsConsumedOnceAndRecoverySkipsMissedCues() {
        val running = TimerSnapshot().start(
            TimerSetup(minutes = 4, interval = TimerInterval.Custom, intervalMinutes = 1), start,
        )
        val due = running.advance(start + 60_100, true)
        assertEquals(TimerSignal.Interval, due.cue)
        assertNull(due.snapshot.advance(start + 60_200, true).cue)
        val recovered = running.advance(start + 125_000, false)
        assertNull(recovered.cue)
        assertEquals(TimerCuePosition.Deadline(start + 180_000), recovered.snapshot.cuePosition)
        assertEquals(TimerSignal.Completion, running.advance(start + 240_100, true).cue)
    }

    @Test
    fun adjustingToZeroCompletesOnceButAnExpiredDeadlineStaysSilent() {
        val running = TimerSnapshot().start(TimerSetup(minutes = 2, cue = TimerCue.Flash), start)
        val runningZero = running.adjust(-TIMER_MINUTE_MS, start + 75_000)
        val pausedZero = running.pause(start + 75_000).setRemaining(0, start + 150_000)
        for (transition in listOf(runningZero, pausedZero)) {
            assertEquals(TimerPhase.Complete, transition.snapshot.phase)
            assertEquals(TimerSignal.Completion, transition.cue)
            assertEquals(TimerCue.Flash, transition.snapshot.setup.cue)
            val reopened = TimerSnapshot.decode(transition.snapshot.encode())
            assertNull(reopened.advance(start + 150_000, true).cue)
            assertNull(reopened.setRemaining(0, start + 150_000).cue)
        }
        assertNull(running.setRemaining(0, start + 130_000).cue)
    }

    @Test
    fun theBrowserTransferBoundsDecodeInAndroid() {
        val assets = InstrumentationRegistry.getInstrumentation().context.assets
        val fixtures = assets.open("timer-setup-bounds.json").bufferedReader().use { JSONArray(it.readText()) }
        for (index in 0 until fixtures.length()) {
            val expected = fixtures.getJSONObject(index)
            val setup = TimerSetup.decode(expected)
            val roundTrip = TimerSnapshot.decode(TimerSnapshot(setup).encode()).setup.encode()
            val direction = if (index == 0) -1 else 1
            for (key in expected.keys()) {
                val value = expected.get(key)
                if (value is Number) {
                    assertEquals(expected.getDouble(key), roundTrip.getDouble(key), 0.0)
                    val outside: Number = if (key == "volume") value.toDouble() + direction * 0.01 else value.toInt() + direction
                    val invalid = JSONObject(expected.toString()).put(key, outside)
                    assertThrows("Reject out-of-range $key", IllegalArgumentException::class.java) { TimerSetup.decode(invalid) }
                } else {
                    assertEquals(value, roundTrip.get(key))
                }
            }
        }
    }

    @Test
    fun earlierNativeSnapshotWithoutSavedSetupsKeepsItsDeadline() {
        val running = TimerSnapshot().start(TimerSetup(minutes = 4), start)
        val previousFormat = JSONObject(running.encode()).apply { remove("savedSetups") }
        assertEquals(running, TimerSnapshot.decode(previousFormat.toString()))
        previousFormat.put("savedSetups", true)
        assertThrows(Exception::class.java) { TimerSnapshot.decode(previousFormat.toString()) }
    }

    @Test
    fun interruptedTransferCanRetryButAnExistingOrDamagedCopyWins() {
        val context = InstrumentationRegistry.getInstrumentation().targetContext
        val directory = Files.createTempDirectory(context.cacheDir.toPath(), "timer-transfer").toFile()
        val path = File(directory, "timer.json")
        val atomic = androidx.core.util.AtomicFile(path)
        val store = NativeTimerFile(path)
        val imported = TimerSnapshot().start(TimerSetup(minutes = 2), start)
        try {
            atomic.startWrite().use { it.write("{".toByteArray()) }
            assertEquals(imported, store.importIfAbsent(imported))
            assertEquals(imported, store.importIfAbsent(TimerSnapshot()))
            assertEquals(imported, NativeTimerFile(path).read())
            path.writeText("{")
            assertThrows(Exception::class.java) { store.importIfAbsent(TimerSnapshot()) }
            assertEquals("{", path.readText())
        } finally {
            atomic.delete()
            directory.delete()
        }
    }
}
