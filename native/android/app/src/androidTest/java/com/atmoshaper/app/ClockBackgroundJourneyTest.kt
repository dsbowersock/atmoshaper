package com.atmoshaper.app

import android.os.SystemClock
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

@RunWith(AndroidJUnit4::class)
class ClockBackgroundJourneyTest {
    private val instrumentation = InstrumentationRegistry.getInstrumentation()
    private val device = UiDevice.getInstance(instrumentation)

    @Test
    fun freeSolidColorRendersAndSurvivesClockReentryAndRecreation() {
        ActivityScenario.launch(HomeActivity::class.java).use { scenario ->
            text("Clock & timer").click()
            val store = ClockAppearanceFile(instrumentation.targetContext)
            text("Backgrounds")
            val original = checkNotNull(store.read())
            try {
                text("Backgrounds").click()
                text("Solid Color").click()
                text("Customize background").click()
                val color = description("Background color")
                color.click()
                color.clear()
                color.text = "#704B25"
                device.pressBack()
                text("Apply background").click()
                awaitBackdrop(0xFF704B25.toInt())

                text("Close Clock").click()
                text("Clock & timer").click()
                awaitBackdrop(0xFF704B25.toInt())
                scenario.recreate()
                text("Backgrounds").click()
                assertTrue("The applied background remains selected", text("Solid Color").let { it.isChecked || it.isSelected })
                device.pressBack()
                awaitBackdrop(0xFF704B25.toInt())
            } finally {
                store.save(original)
            }
        }
    }

    @Test
    fun savedPremiumChoiceRemainsLockedAndLeavesClockUsable() {
        val store = ClockAppearanceFile(instrumentation.targetContext)
        ActivityScenario.launch(HomeActivity::class.java).use {
            text("Clock & timer").click()
            text("Backgrounds")
            val original = checkNotNull(store.read())
            text("Close Clock").click()
            try {
                store.save(original.copy(
                    background = ClockBackground.SolidColor,
                    rememberedBackgroundId = "massage-lab-3d-globe",
                    firstColor = "#FF00FF",
                    secondColor = "#FF00FF",
                ))
                text("Clock & timer").click()
                text("Saved background needs verified access.").also { assertTrue(it.isEnabled) }
                awaitBackdrop(0xFF171519.toInt())
                text("Backgrounds").click()
                val globe = checkNotNull(device.wait(Until.findObject(By.textContains("Pale Blue Dot")), 10_000))
                assertTrue("The unavailable preference stays visible", globe.isChecked || globe.isSelected)
                assertFalse("A remembered ID cannot grant preview access", globe.isEnabled)
                assertFalse(text("Apply background").isEnabled)
                device.pressBack()
                text("Close Clock").click()
                text("Your tools")
                assertEquals("massage-lab-3d-globe", store.read()?.rememberedBackgroundId)
            } finally {
                store.save(original)
            }
        }
    }

    @Test
    fun retainedRadialGradientRendersWithTheAuthoredCenter() {
        val store = ClockAppearanceFile(instrumentation.targetContext)
        ActivityScenario.launch(HomeActivity::class.java).use {
            text("Clock & timer").click()
            text("Backgrounds")
            val original = checkNotNull(store.read())
            text("Close Clock").click()
            try {
                store.save(original.copy(
                    background = ClockBackground.StaticGradient,
                    rememberedBackgroundId = "static-gradient",
                    gradientType = ClockGradientType.Radial,
                    gradientCenterX = 8.33f,
                    gradientCenterY = 33.33f,
                    gradientRadialShape = ClockGradientShape.Circle,
                    gradientColors = listOf("#704B25", "#0F2237"),
                    gradientStops = listOf(10f, 25f),
                ))
                text("Clock & timer").click()
                awaitBackdrop(0xFF704B25.toInt(), across = 1f / 12, down = 1f / 3)
                awaitBackdrop(0xFF0F2237.toInt(), across = 0.9f, down = 0.75f)
                text("Close Clock").click()
                text("Your tools")
            } finally {
                store.save(original)
            }
        }
    }

    private fun text(value: String): UiObject2 =
        checkNotNull(device.wait(Until.findObject(By.text(value)), 10_000)) { "Missing text $value" }

    private fun description(value: String): UiObject2 =
        checkNotNull(device.wait(Until.findObject(By.desc(value)), 10_000)) { "Missing control $value" }

    private fun awaitBackdrop(expected: Int, across: Float = 1f / 12, down: Float = 1f / 3) {
        val start = SystemClock.uptimeMillis()
        var pixel: Int
        do {
            val image = checkNotNull(instrumentation.uiAutomation.takeScreenshot())
            pixel = try {
                image.getPixel((image.width * across).toInt(), (image.height * down).toInt())
            } finally {
                image.recycle()
            }
            if (pixel == expected) return
            SystemClock.sleep(50)
        } while (SystemClock.uptimeMillis() - start < 3_000)
        assertEquals("The rendered Clock backdrop has the expected color", expected, pixel)
    }
}
