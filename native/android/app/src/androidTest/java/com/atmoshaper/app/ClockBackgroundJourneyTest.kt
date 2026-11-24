package com.atmoshaper.app

import android.os.SystemClock
import android.provider.Settings
import androidx.test.core.app.ActivityScenario
import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.platform.app.InstrumentationRegistry
import androidx.test.uiautomator.By
import androidx.test.uiautomator.BySelector
import androidx.test.uiautomator.Direction
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
                pickerControl(By.text("Solid Color"), "Solid Color").click()
                pickerControl(By.text("Customize background"), "Customize background", Direction.UP).click()
                val color = pickerControl(By.clazz("android.widget.EditText").textStartsWith("#"), "Background color")
                color.click()
                color.text = "#704B25"
                checkNotNull(device.wait(Until.findObject(By.clazz("android.widget.EditText").text("#704B25")), 5_000))
                device.pressBack()
                text("Apply background").click()
                awaitBackdrop(0xFF704B25.toInt())

                text("Close Clock").click()
                text("Clock & timer").click()
                awaitBackdrop(0xFF704B25.toInt())
                scenario.recreate()
                text("Backgrounds").click()
                val solid = selectionRow(text("Solid Color"))
                assertTrue("The applied background remains selected", solid.isChecked || solid.isSelected)
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
                val selection = selectionRow(globe)
                assertTrue("The unavailable preference stays selected", selection.isChecked || selection.isSelected)
                assertFalse("A remembered ID cannot grant preview access", selection.isEnabled)
                val apply = generateSequence(text("Apply background")) { it.parent }
                    .first { it.isClickable }
                assertFalse(apply.isEnabled)
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

    @Test
    fun lavaLampCanPauseItsColorFieldsWithoutHidingThem() {
        val store = ClockAppearanceFile(instrumentation.targetContext)
        ActivityScenario.launch(HomeActivity::class.java).use {
            text("Clock & timer").click()
            text("Backgrounds")
            val original = checkNotNull(store.read())
            text("Close Clock").click()
            try {
                store.save(original.copy(
                    background = ClockBackground.LavaLamp,
                    rememberedBackgroundId = "massage-lab-moving-gradient",
                    firstColor = "#FF9900",
                    secondColor = "#5599FF",
                    motion = true,
                ))
                text("Clock & timer").click()
                text("Backgrounds")
                val animatorScale = Settings.Global.getFloat(
                    instrumentation.targetContext.contentResolver, Settings.Global.ANIMATOR_DURATION_SCALE, 1f,
                )
                val initialFrame = backdropSample()
                if (animatorScale > 0f) {
                    val deadline = SystemClock.uptimeMillis() + 6_000L
                    var moved = false
                    while (!moved && SystemClock.uptimeMillis() < deadline) {
                        SystemClock.sleep(250)
                        moved = backdropSample() != initialFrame
                    }
                    assertTrue("Lava Lamp draws visibly changing frames", moved)
                } else {
                    SystemClock.sleep(750)
                    assertEquals("Android's reduced motion keeps the fields still", initialFrame, backdropSample())
                }

                text("Backgrounds").click()
                pickerControl(By.text("Customize background"), "Customize background", Direction.UP).click()
                pickerControl(By.text("Animate background"), "Animate background").click()
                text("Apply background").click()
                check(device.wait(Until.gone(By.text("Apply background")), 10_000))
                SystemClock.sleep(300)
                val pausedFrame = backdropSample()
                SystemClock.sleep(750)
                assertEquals("The authored fields stay visible while paused", pausedFrame, backdropSample())
                assertTrue("The paused renderer still shows color", pausedFrame.any { it != 0xFF171519.toInt() })
            } finally {
                store.save(original)
            }
        }
    }

    private fun text(value: String): UiObject2 =
        checkNotNull(device.wait(Until.findObject(By.text(value)), 10_000)) { "Missing text $value" }

    private fun selectionRow(label: UiObject2): UiObject2 =
        generateSequence(label) { it.parent }.first { it.isCheckable }

    private fun pickerControl(selector: BySelector, label: String, direction: Direction = Direction.DOWN): UiObject2 {
        repeat(4) {
            device.wait(Until.findObject(selector), 1_500)?.let { return it }
            val list = device.findObject(By.scrollable(true)) ?: error("Missing scrollable picker for $label")
            list.scroll(direction, 0.58f)
        }
        return checkNotNull(device.wait(Until.findObject(selector), 1_500)) { "Missing picker control $label" }
    }

    private fun backdropSample(): List<Int> {
        val image = checkNotNull(instrumentation.uiAutomation.takeScreenshot())
        return try {
            listOf(0.12f, 0.28f, 0.72f, 0.88f).map { across ->
                image.getPixel((image.width * across).toInt(), image.height / 3)
            }
        } finally {
            image.recycle()
        }
    }

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
