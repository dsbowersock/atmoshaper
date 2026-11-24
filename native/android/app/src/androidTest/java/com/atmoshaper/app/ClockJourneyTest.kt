package com.atmoshaper.app

import android.os.SystemClock
import androidx.core.view.ViewCompat
import androidx.core.view.WindowCompat
import androidx.core.view.WindowInsetsCompat
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.luminance
import androidx.test.core.app.ActivityScenario
import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.platform.app.InstrumentationRegistry
import androidx.test.uiautomator.By
import androidx.test.uiautomator.UiDevice
import androidx.test.uiautomator.UiObject2
import androidx.test.uiautomator.Until
import org.junit.Assert.assertEquals
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
    fun fullscreenSwipesRevealProtectedSystemBars() {
        val instrumentation = InstrumentationRegistry.getInstrumentation()
        val store = ClockAppearanceFile(instrumentation.targetContext)
        val status = WindowInsetsCompat.Type.statusBars()
        val navigation = WindowInsetsCompat.Type.navigationBars()
        ActivityScenario.launch(HomeActivity::class.java).use { scenario ->
            openClock()
            text("Close Clock").click()
            val original = checkNotNull(store.read())
            try {
                // White behind status icons and black behind navigation icons
                // make missing protective bands visible at either edge.
                store.save(original.copy(
                    background = ClockBackground.StaticGradient,
                    gradientColors = listOf("#FFFFFF", "#000000"),
                    gradientStops = listOf(0f, 100f),
                    gradientAngle = 180f,
                ))
                openClock()
                val normal = awaitBarVisibility(scenario, true, status, navigation)
                val top = normal.getInsets(status).top
                val bottom = normal.getInsets(navigation).bottom
                assertTrue("The portrait fixture has top and bottom bars", top > 0 && bottom > 0)
                val width = device.displayWidth
                val height = device.displayHeight
                val sampleX = width * 3 / 5
                val topY = top / 2
                val bottomY = height - bottom / 2
                val normalStatus = screenshotPixel(sampleX, topY)
                val normalNavigation = screenshotPixel(sampleX, bottomY)
                assertTrue(Color(normalStatus).luminance() < 0.1f)
                assertTrue(Color(normalNavigation).luminance() > 0.8f)

                text("Fullscreen").click()
                acknowledgeImmersiveTutorial()
                awaitBarVisibility(scenario, false, status, navigation)
                assertTrue("The hidden status bar leaves the gradient visible",
                    Color(screenshotPixel(sampleX, topY)).luminance() > 0.8f)
                assertTrue("The hidden navigation bar leaves the gradient visible",
                    Color(screenshotPixel(sampleX, bottomY)).luminance() < 0.1f)

                assertTrue(device.swipe(width / 2, 0, width / 2, height / 8, 30))
                awaitBarVisibility(scenario, true, status)
                assertEquals("Status band after top swipe", normalStatus, screenshotPixel(sampleX, topY))

                // Re-enter fullscreen so the bottom swipe also starts hidden.
                text("Exit fullscreen").click()
                text("Fullscreen").click()
                awaitBarVisibility(scenario, false, status, navigation)
                assertTrue(device.swipe(width / 2, height - 1, width / 2, height * 7 / 8, 30))
                awaitBarVisibility(scenario, true, navigation)
                assertEquals("Navigation band after bottom swipe", normalNavigation, screenshotPixel(sampleX, bottomY))
            } finally {
                store.save(original)
            }
        }
    }

    /** Read app-facing insets and allow Compose to paint the revealed bands. */
    private fun awaitBarVisibility(
        scenario: ActivityScenario<HomeActivity>, visible: Boolean, vararg types: Int,
    ): WindowInsetsCompat {
        repeat(50) {
            var matched: WindowInsetsCompat? = null
            scenario.onActivity { activity ->
                val insets = ViewCompat.getRootWindowInsets(activity.window.decorView)
                if (insets != null && types.all { insets.isVisible(it) == visible }) matched = insets
            }
            matched?.let {
                device.waitForIdle()
                return it
            }
            SystemClock.sleep(100)
        }
        error("Expected system bar insets ${types.contentToString()} to be ${if (visible) "visible" else "hidden"} in Clock.")
    }

    private fun screenshotPixel(x: Int, y: Int): Int {
        val bitmap = checkNotNull(InstrumentationRegistry.getInstrumentation().uiAutomation.takeScreenshot())
        return try { bitmap.getPixel(x, y) } finally { bitmap.recycle() }
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
