package com.atmoshaper.app

import android.os.Build
import android.os.SystemClock
import androidx.core.util.AtomicFile
import androidx.test.core.app.ActivityScenario
import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.platform.app.InstrumentationRegistry
import androidx.test.uiautomator.By
import androidx.test.uiautomator.Direction
import androidx.test.uiautomator.UiDevice
import androidx.test.uiautomator.UiObject2
import androidx.test.uiautomator.Until
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Assume.assumeTrue
import org.junit.Test
import org.junit.runner.RunWith
import java.io.File
import java.util.regex.Pattern

@RunWith(AndroidJUnit4::class)
class NativeTimerJourneyTest {
    private val instrumentation = InstrumentationRegistry.getInstrumentation()
    private val device = UiDevice.getInstance(instrumentation)
    private val digits = By.text(Pattern.compile("""\d{2}:\d{2}:\d{2}"""))

    @Test
    fun clockOpensNativeTimerAndPauseAdjustResumeAndEndSurviveReopening() = withFixture(
        TimerSnapshot(
            TimerSetup(cue = TimerCue.Silent),
            savedSetups = listOf(SavedTimerSetup("Example saved setup", TimerSetup(minutes = 3, cue = TimerCue.Silent))),
        ),
    ) {
        ActivityScenario.launch(HomeActivity::class.java).use {
            text("Clock & timer").click()
            text("Open timer").click()
            text("Choose a saved setup").click()
            text("Example saved setup").click()
            text("Minutes")
            assertFalse(device.hasObject(By.clazz("android.webkit.WebView")))
            val fields = device.findObjects(By.clazz("android.widget.EditText"))
            assertEquals(2, fields.size)
            assertEquals("3", fields[1].text)
            fields[1].text = "2"
            scrollTo("Preset minutes: 15 minutes").click()
            text("1 minute").click()
            device.pressBack()
            text("Open timer").click()
            text("Minutes")
            assertEquals("2", device.findObjects(By.clazz("android.widget.EditText"))[1].text)
            scrollTo("Preset minutes: 1 minute")
            scrollTo("Start timer").click()
            text("Timer running")
            text("Pause timer").click()
            text("Timer paused")
            val paused = seconds()

            text("Close timer").click()
            text("Open timer").click()
            text("Timer paused")
            assertEquals(paused, seconds())
            text("Adjust timer").click()
            scrollTo("+1 min").click()
            text("Timer paused")
            assertEquals(paused + 60, seconds())

            text("Resume timer").click()
            text("Timer running")
            assertTrue(seconds() in (paused + 55)..(paused + 60))
            device.pressBack()
            text("Open timer")
        }
        ActivityScenario.launch(NativeTimerActivity::class.java).use { scenario ->
            text("Timer running")
            val before = seconds()
            scenario.recreate()
            text("Timer running")
            assertTrue(seconds() in (before - 10)..before)
            text("End timer").click()
            text("Minutes")
            assertTrue(scrollTo("Start timer").isEnabled)
            scenario.recreate()
            text("Minutes")
            assertTrue(scrollTo("Start timer").isEnabled)
        }
    }

    @Test
    fun subtractingTheFinalMinuteCompletesAndReopensCompleted() {
        val paused = TimerSnapshot().start(TimerSetup(minutes = 1, cue = TimerCue.Flash), 100_000).pause(125_000)
        withFixture(paused) {
            ActivityScenario.launch(NativeTimerActivity::class.java).use { scenario ->
                text("Timer paused")
                text("Adjust timer").click()
                val minus = scrollTo("−1 min").visibleCenter
                val unlit = timerSurfacePixel()
                assertTrue(device.click(minus.x, minus.y))
                val timeout = SystemClock.uptimeMillis() + 2_000
                var flashed = false
                while (!flashed && SystemClock.uptimeMillis() < timeout) {
                    flashed = timerSurfacePixel() != unlit
                }
                assertTrue("Adjusting to zero visibly flashes the timer surface", flashed)
                text("Timer complete")
                assertEquals(TimerPhase.Complete, NativeTimerFile(instrumentation.targetContext).read()?.phase)
                scenario.recreate()
                text("Timer complete")
                assertEquals("Reopening does not replay the flash", unlit, timerSurfacePixel())
            }
        }
    }

    /** The scroll content is inset, so the far edge only samples the surface. */
    private fun timerSurfacePixel(): Int {
        val screen = checkNotNull(instrumentation.uiAutomation.takeScreenshot())
        return try {
            screen.getPixel(screen.width / 64, screen.height / 2)
        } finally {
            screen.recycle()
        }
    }

    @Test
    fun aDeadlineThatPassedAwayFromTheAppOpensCompleted() {
        val expired = TimerSnapshot().start(TimerSetup(minutes = 2, cue = TimerCue.Silent), System.currentTimeMillis() - 180_000)
        withFixture(expired) {
            ActivityScenario.launch(NativeTimerActivity::class.java).use { scenario ->
                text("Timer complete")
                assertFalse(device.hasObject(By.text("Resume timer")))
                scenario.recreate()
                text("Timer complete")
                text("Set another timer").click()
                text("Minutes")
                assertTrue(scrollTo("Start timer").isEnabled)
            }
        }
    }

    private fun seconds(): Int {
        val value = checkNotNull(device.wait(Until.findObject(digits), 10_000)).text
        val (hours, minutes, seconds) = value.split(':').map(String::toInt)
        return hours * 3_600 + minutes * 60 + seconds
    }

    private fun text(label: String): UiObject2 =
        checkNotNull(device.wait(Until.findObject(By.text(label)), 10_000)) { "Expected '$label'" }

    private fun scrollTo(label: String): UiObject2 {
        repeat(8) {
            device.findObject(By.text(label))?.let { return it }
            checkNotNull(device.findObject(By.scrollable(true))).scroll(Direction.DOWN, 0.75f)
        }
        return text(label)
    }

    /** Seed only the emulator's app-private timer file and restore its prior
     * contents after the journey. Running hardware is never adopted. */
    private fun withFixture(snapshot: TimerSnapshot, journey: () -> Unit) {
        val context = instrumentation.targetContext
        assumeTrue(Build.HARDWARE == "ranchu" && context.packageName.endsWith(".development"))
        val atomic = AtomicFile(File(context.filesDir, "native-timer.json"))
        val original = if (atomic.baseFile.exists()) atomic.readFully() else null
        fun write(bytes: ByteArray) {
            val stream = atomic.startWrite()
            try {
                stream.write(bytes)
                atomic.finishWrite(stream)
            } catch (error: Exception) {
                atomic.failWrite(stream)
                throw error
            }
        }
        try {
            write(snapshot.encode().toByteArray())
            journey()
        } finally {
            if (original == null) atomic.delete() else write(original)
        }
    }
}
