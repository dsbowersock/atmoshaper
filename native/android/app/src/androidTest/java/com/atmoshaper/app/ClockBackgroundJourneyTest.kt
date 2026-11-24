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
    // Side gutters here stay below the wrapping toolbar and above the system navigation band.
    private val backdropRow = 0.8f

    @Test
    fun freeSolidColorRendersAndSurvivesClockReentryAndRecreation() {
        ActivityScenario.launch(HomeActivity::class.java).use { scenario ->
            text("Clock & timer").click()
            val store = ClockAppearanceFile(instrumentation.targetContext)
            text("Backgrounds")
            val original = checkNotNull(store.read())
            try {
                text("Backgrounds").click()
                assertTrue(text("Open previous background tools").isEnabled)
                pickerControl(By.text("Solid Color"), "Solid Color").click()
                pickerControl(By.text("Customize background"), "Customize background", Direction.UP).click()
                val color = pickerControl(By.clazz("android.widget.EditText").textStartsWith("#"), "Background color")
                color.click()
                color.text = "#704B25"
                checkNotNull(device.wait(Until.findObject(By.clazz("android.widget.EditText").text("#704B25")), 5_000))
                device.pressBack()
                text("Apply background").click()
                awaitBackdrop(0xFF704B25.toInt())

                applyBackground("Lava Lamp")
                applyBackground("Solid Color")
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
                    savedBackgroundStyles = emptyMap(),
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
                    background = ClockBackground.Neutral,
                    rememberedBackgroundId = null,
                    savedBackgroundStyles = emptyMap(),
                ))
                store.recoverBackgroundIfUnrecorded(original.copy(
                    background = ClockBackground.StaticGradient,
                    rememberedBackgroundId = "static-gradient",
                    firstColor = "#A50316",
                    secondColor = "#19418D",
                    gradientType = ClockGradientType.Radial,
                    gradientCenterX = 8.33f,
                    gradientCenterY = backdropRow * 100f,
                    gradientRadialShape = ClockGradientShape.Circle,
                    gradientColors = listOf("#704B25", "#0F2237"),
                    gradientStops = listOf(10f, 25f),
                    savedBackgroundStyles = emptyMap(),
                ))
                text("Clock & timer").click()
                awaitBackdrop(0xFF704B25.toInt())
                awaitBackdrop(0xFF0F2237.toInt(), across = 0.9f)
                applyBackground("Lava Lamp")
                applyBackground("Static gradient")
                awaitBackdrop(0xFF704B25.toInt())
                awaitBackdrop(0xFF0F2237.toInt(), across = 0.9f)
                val restored = checkNotNull(store.read())
                assertEquals("#A50316", restored.firstColor)
                assertEquals("#19418D", restored.secondColor)
                assertEquals(listOf("#704B25", "#0F2237"), restored.gradientColors)
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
        val resolver = instrumentation.targetContext.contentResolver
        val originalAnimatorScale = Settings.Global.getString(resolver, Settings.Global.ANIMATOR_DURATION_SCALE)
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
                    savedBackgroundStyles = emptyMap(),
                ))
                setAnimatorScale("0")
                text("Clock & timer").click()
                text("Backgrounds")
                val reducedMotionFrame = backdropSample()
                SystemClock.sleep(750)
                assertEquals("Android's reduced motion keeps the fields still", reducedMotionFrame, backdropSample())
                assertTrue("The reduced-motion renderer still shows color", reducedMotionFrame.any { it != 0xFF171519.toInt() })

                setAnimatorScale("1")
                val movingFrame = awaitBackdropFrame("Lava Lamp starts moving") { it != reducedMotionFrame }
                awaitBackdropFrame("Lava Lamp keeps moving") { it != movingFrame && it != reducedMotionFrame }
                setAnimatorScale("0")
                awaitBackdropFrame("Lava Lamp returns to the still frame") { it == reducedMotionFrame }
                SystemClock.sleep(750)
                assertEquals("The mounted Clock honors changes to reduced motion", reducedMotionFrame, backdropSample())

                setAnimatorScale("1")
                text("Backgrounds").click()
                pickerControl(By.text("Customize background"), "Customize background", Direction.UP).click()
                pickerControl(By.text("Animate background"), "Animate background").click()
                text("Apply background").click()
                check(device.wait(Until.gone(By.text("Apply background")), 10_000))
                SystemClock.sleep(300)
                val pausedFrame = backdropSample()
                SystemClock.sleep(750)
                assertEquals("The authored fields stay visible while paused", pausedFrame, backdropSample())
                assertEquals("The local pause retains the same color fields", reducedMotionFrame, pausedFrame)
                applyBackground("Solid Color")
                applyBackground("Lava Lamp")
                val restored = checkNotNull(store.read())
                assertFalse(restored.motion)
                assertEquals("#FF9900", restored.firstColor)
                assertEquals("#5599FF", restored.secondColor)
            } finally {
                try {
                    store.save(original)
                } finally {
                    setAnimatorScale(originalAnimatorScale)
                }
            }
        }
    }

    /** Change only the fixture's animator scale and verify the setting before sampling pixels. */
    private fun setAnimatorScale(value: String?) {
        val setting = Settings.Global.ANIMATOR_DURATION_SCALE
        if (value == null) {
            device.executeShellCommand("settings delete global $setting")
        } else {
            require(value.isNotEmpty() && value.all { it in "0123456789.eE+-" })
            device.executeShellCommand("settings put global $setting $value")
        }
        assertEquals(value, Settings.Global.getString(instrumentation.targetContext.contentResolver, setting))
    }

    private fun awaitBackdropFrame(description: String, matches: (List<Int>) -> Boolean): List<Int> {
        val deadline = SystemClock.uptimeMillis() + 6_000L
        do {
            val frame = backdropSample()
            if (matches(frame)) return frame
            SystemClock.sleep(100)
        } while (SystemClock.uptimeMillis() < deadline)
        error("Expected $description")
    }

    private fun text(value: String): UiObject2 =
        checkNotNull(device.wait(Until.findObject(By.text(value)), 10_000)) { "Missing text $value" }

    private fun applyBackground(label: String) {
        text("Backgrounds").click()
        pickerControl(By.text(label), label).click()
        text("Apply background").click()
        check(device.wait(Until.gone(By.text("Apply background")), 10_000))
    }

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
                image.getPixel((image.width * across).toInt(), (image.height * backdropRow).toInt())
            }
        } finally {
            image.recycle()
        }
    }

    private fun awaitBackdrop(expected: Int, across: Float = 1f / 12) {
        val start = SystemClock.uptimeMillis()
        var pixel: Int
        do {
            val image = checkNotNull(instrumentation.uiAutomation.takeScreenshot())
            pixel = try {
                image.getPixel((image.width * across).toInt(), (image.height * backdropRow).toInt())
            } finally {
                image.recycle()
            }
            if (pixel == expected) return
            SystemClock.sleep(50)
        } while (SystemClock.uptimeMillis() - start < 3_000)
        assertEquals(
            "Clock backdrop ARGB at viewport fraction ($across, $backdropRow)",
            "0x${expected.toUInt().toString(16)}",
            "0x${pixel.toUInt().toString(16)}",
        )
    }
}
