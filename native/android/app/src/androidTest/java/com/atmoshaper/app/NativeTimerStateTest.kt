package com.atmoshaper.app

import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.platform.app.InstrumentationRegistry
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
            assertEquals(start + 135_000, resumed.cueAtMs)
            val adjusted = store.update { it.adjust(60_000, start + 110_000) }
            assertEquals(start + 375_000, adjusted.deadlineMs)
            assertEquals(start + 135_000, adjusted.cueAtMs)
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
    fun aForegroundIntervalIsConsumedOnceAndRecoverySkipsMissedCues() {
        val running = TimerSnapshot().start(
            TimerSetup(minutes = 4, interval = TimerInterval.Custom, intervalMinutes = 1), start,
        )
        val due = running.advance(start + 60_100, true)
        assertEquals(TimerSignal.Interval, due.cue)
        assertNull(due.snapshot.advance(start + 60_200, true).cue)
        val recovered = running.advance(start + 125_000, false)
        assertNull(recovered.cue)
        assertEquals(start + 180_000, recovered.snapshot.cueAtMs)
        assertEquals(TimerSignal.Completion, running.advance(start + 240_100, true).cue)
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
