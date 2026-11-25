package com.atmoshaper.app

import android.app.AlarmManager
import android.app.Notification
import android.app.NotificationManager
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
import org.junit.Assert.assertNotNull
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
                text("The timer ended while an alert was unavailable.")
                assertFalse(device.hasObject(By.text("Resume timer")))
                scenario.recreate()
                text("Timer complete")
                text("Set another timer").click()
                text("Minutes")
                assertTrue(scrollTo("Start timer").isEnabled)
            }
        }
    }

    @Test
    fun lockedBackgroundTimerPostsOneCompletionAndOngoingEndActionCancelsTheNextTimer() {
        requireOsFixture()
        val context = instrumentation.targetContext
        val notifications = checkNotNull(context.getSystemService(NotificationManager::class.java))
        assertTrue(notifications.areNotificationsEnabled())
        assertTrue(Build.VERSION.SDK_INT < Build.VERSION_CODES.S ||
            checkNotNull(context.getSystemService(AlarmManager::class.java)).canScheduleExactAlarms())

        val setup = TimerSetup(minutes = 1, cue = TimerCue.Silent, keepAwake = false)
        val due = System.currentTimeMillis() + 20_000
        withFixture(TimerSnapshot().start(setup, due - 60_000)) {
            ActivityScenario.launch(NativeTimerActivity::class.java).use {
                text("Timer running")
                assertNotNull(notice("Timer running"))
                device.pressHome()
                device.sleep()
                try {
                    assertNotNull(notice("Timer complete", 30_000))
                    assertFalse(hasNotice("Timer running"))
                    assertEquals(1, notifications.activeNotifications.count { it.notification.extras.getString("android.title") == "Timer complete" })
                } finally {
                    device.wakeUp()
                    device.executeShellCommand("wm dismiss-keyguard")
                }
            }
        }
        var endedSessionAction: android.app.PendingIntent? = null
        withFixture(TimerSnapshot().start(setup, System.currentTimeMillis())) {
            ActivityScenario.launch(NativeTimerActivity::class.java).use {
                text("Timer running")
                assertNotNull(notice("Timer running"))
                val progress = notifications.activeNotifications
                    .single { it.notification.extras.getString("android.title") == "Timer running" }
                    .notification
                assertTrue(progress.flags and Notification.FLAG_ONGOING_EVENT != 0)
                val end = progress.actions.single()
                assertEquals("End timer", end.title.toString())
                endedSessionAction = end.actionIntent
                device.pressHome()
                // SystemUI can collapse ongoing actions. Invoke the published
                // Android PendingIntent that its End timer action owns.
                end.actionIntent.send()
                assertTrue(waitFor { !hasNotice("Timer running") })
            }
            ActivityScenario.launch(NativeTimerActivity::class.java).use { scrollTo("Start timer") }
        }
        withFixture(TimerSnapshot().start(setup, System.currentTimeMillis())) {
            ActivityScenario.launch(NativeTimerActivity::class.java).use {
                text("Timer running")
                checkNotNull(endedSessionAction).send()
                assertFalse("An End action from the prior session must be ignored",
                    waitFor(1_000) { !hasNotice("Timer running") })
                text("End timer").click()
                text("Minutes")
            }
        }
    }

    @Test
    fun deniedNotificationsLeaveTimerUsableAndShowStatusWithoutPrompting() {
        requireOsFixture()
        val context = instrumentation.targetContext
        assertFalse(checkNotNull(context.getSystemService(NotificationManager::class.java)).areNotificationsEnabled())
        val setup = TimerSetup(minutes = 2, cue = TimerCue.Silent)
        withFixture(TimerSnapshot().start(setup, System.currentTimeMillis())) {
            ActivityScenario.launch(NativeTimerActivity::class.java).use {
                text("Timer running")
                text("Background timer alerts are off. Cues still work on this screen.")
                text("Pause timer").click()
                text("Timer paused")
                text("End timer").click()
                text("Minutes")
                assertFalse(hasNotice("Timer running"))
            }
        }
    }

    private fun requireOsFixture() {
        assumeTrue(InstrumentationRegistry.getArguments().getString("timerOsFixture") == "true")
        val context = instrumentation.targetContext
        assertTrue(Build.HARDWARE == "ranchu" && context.packageName == "com.atmoshaper.app.development")
        val marker = "/data/local/tmp/atmoshaper-parity-fixture"
        assertEquals(marker, device.executeShellCommand("ls -d $marker").trim())
    }

    private fun hasNotice(title: String): Boolean {
        val notifications = checkNotNull(instrumentation.targetContext.getSystemService(NotificationManager::class.java))
        return notifications.activeNotifications.any { it.notification.extras.getString("android.title") == title }
    }

    private fun notice(title: String, timeout: Long = 4_000): String? =
        title.takeIf { waitFor(timeout) { hasNotice(title) } }

    private fun waitFor(timeout: Long = 4_000, condition: () -> Boolean): Boolean {
        val end = SystemClock.elapsedRealtime() + timeout
        while (SystemClock.elapsedRealtime() < end) {
            if (condition()) return true
            SystemClock.sleep(100)
        }
        return condition()
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
