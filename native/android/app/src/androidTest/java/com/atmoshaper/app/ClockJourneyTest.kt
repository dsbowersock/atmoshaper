package com.atmoshaper.app

import androidx.core.view.ViewCompat
import androidx.core.view.WindowCompat
import androidx.core.view.WindowInsetsCompat
import androidx.compose.ui.graphics.Color
import androidx.test.core.app.ActivityScenario
import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.platform.app.InstrumentationRegistry
import androidx.test.uiautomator.By
import androidx.test.uiautomator.UiDevice
import androidx.test.uiautomator.UiObject2
import androidx.test.uiautomator.Until
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test
import org.junit.runner.RunWith
import java.util.regex.Pattern

@RunWith(AndroidJUnit4::class)
class ClockJourneyTest {
    private val device = UiDevice.getInstance(InstrumentationRegistry.getInstrumentation())

    @Test
    fun contrastProtectionCoversInterpolatedColorsAndSmallGlyphs() {
        val grey = Color(0xFF808080)
        assertTrue(clockNeedsContrastOutline(grey, listOf(Color.Black, Color.White)))
        assertFalse(clockNeedsContrastOutline(Color.White, listOf(Color.Black)))
        assertTrue(clockNeedsContrastOutline(Color.White, listOf(Color(0xFFAAAAAA))))
        // Both stops clear 4.5:1 against black. Their RGB midpoint is darker
        // than either stop, so an endpoint-only test would miss the risk.
        assertTrue(clockNeedsContrastOutline(Color.Black, listOf(Color(0xFFFF0000), Color(0xFF008800))))
        assertTrue(clockGlyphStrokeWidth(12f, 20f, smallGlyph = true) < 2f)
        assertTrue(clockGlyphStrokeWidth(12f, 140f, smallGlyph = false) == 12f)
    }

    @Test
    fun clockCanBeEnlargedClosedAndReopenedAfterRecreation() {
        ActivityScenario.launch(HomeActivity::class.java).use { scenario ->
            openClock()
            scenario.onActivity { activity ->
                val bars = WindowCompat.getInsetsController(activity.window, activity.window.decorView)
                assertFalse(bars.isAppearanceLightStatusBars)
                assertTrue(bars.isAppearanceLightNavigationBars)
            }
            text("Fullscreen").click()
            acknowledgeImmersiveTutorial()
            text("Exit fullscreen").click()
            text("Close Clock").click()
            text("Your tools")

            openClock()
            text("Fullscreen").click()
            text("Exit fullscreen")
            scenario.recreate()
            text("Exit fullscreen")
            assertTrue(device.wait(Until.gone(By.text("Fullscreen")), 10_000))
            scenario.onActivity { activity ->
                val insets = checkNotNull(ViewCompat.getRootWindowInsets(activity.window.decorView))
                assertFalse(insets.isVisible(WindowInsetsCompat.Type.statusBars()))
            }
            device.pressBack()
            text("Fullscreen").click()
            text("Close Clock").click()
            text("Your tools")

            openClock()
            device.pressBack()
            text("Your tools")
        }
    }

    @Test
    fun clockSettingsSurviveRecreationAndReopening() {
        ActivityScenario.launch(HomeActivity::class.java).use { scenario ->
            openClock()
            val original = clockShowsDayPeriod()
            text("Clock settings").click()
            text("24-hour time").click()
            text("Done").click()
            assertClockFormat(!original)
            text("Close Clock").click()

            openClock()
            scenario.recreate()
            assertClockFormat(!original)
            text("Clock settings").click()
            text("24-hour time").click()
            text("Done").click()
            assertClockFormat(original)
        }
    }

    private fun openClock() {
        text("Clock & timer").click()
        text("Close Clock")
        text("Fullscreen")
        assertFalse(device.hasObject(By.clazz("android.webkit.WebView")))
        readout()
    }

    private fun readout(): String =
        checkNotNull(device.wait(Until.findObject(By.descStartsWith("Current time ")), 10_000)).contentDescription

    private fun clockShowsDayPeriod() = readout().contains(Regex(" [AP]M$"))

    private fun assertClockFormat(showsDayPeriod: Boolean) {
        val pattern = if (showsDayPeriod) "Current time .+ [AP]M" else "Current time [0-9:]+"
        assertTrue("Expected the saved format in the Clock readout",
            device.wait(Until.hasObject(By.desc(Pattern.compile(pattern))), 10_000))
    }

    private fun text(label: String): UiObject2 =
        checkNotNull(device.wait(Until.findObject(By.text(label)), 10_000)) { "Expected '$label'" }

    /** Fresh emulator profiles may show the OS's first-immersive tutorial. */
    private fun acknowledgeImmersiveTutorial() {
        if (device.wait(Until.hasObject(By.res("android", "immersive_cling_title")), 2_000)) {
            checkNotNull(device.findObject(By.res("android", "ok"))).click()
        }
    }
}
