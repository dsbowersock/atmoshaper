package com.atmoshaper.app

import androidx.test.core.app.ActivityScenario
import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.platform.app.InstrumentationRegistry
import androidx.test.uiautomator.By
import androidx.test.uiautomator.Direction
import androidx.test.uiautomator.UiDevice
import androidx.test.uiautomator.UiObject2
import androidx.test.uiautomator.Until
import org.junit.Assert.assertFalse
import org.junit.Test
import org.junit.runner.RunWith

@RunWith(AndroidJUnit4::class)
class BreathingJourneyTest {
    private val device = UiDevice.getInstance(InstrumentationRegistry.getInstrumentation())

    @Test
    fun opensBreathingFromHomeAndReturnsWithAndroidBack() {
        ActivityScenario.launch(HomeActivity::class.java).use {
            text("Open breathing guide").click()
            text("Breathing guide")
            text("Start breathing")
            assertFalse(device.hasObject(By.clazz("android.webkit.WebView")))
            device.pressBack()
            text("Your tools")
            text("Open breathing guide").click()
            text("Ready")
        }
    }

    @Test
    fun pauseSurvivesWellnessNavigationAndActivityRecreation() {
        ActivityScenario.launch(HomeActivity::class.java).use { scenario ->
            visibleAfterScrolling("Wellness").click()
            text("Back to Home")
            text("Open breathing guide").click()
            text("Start breathing").click()
            text("Exhale")
            text("Pause breathing").click()
            text("Paused")
            text("Cycle 1")

            text("Close").click()
            text("Back to Home")
            text("Open breathing guide").click()
            text("Paused")
            scenario.recreate()
            text("Paused")
            text("Cycle 1")
            text("Resume breathing").click()
            text("Pause breathing")
            text("Reset").click()
            text("Ready")
            text("Cycle 1")

            device.pressBack()
            text("Back to Home").click()
            visibleAfterScrolling("Open breathing guide", Direction.UP)
        }
    }

    @Test
    fun allPatternsAdvanceThroughVisiblePhasesAndRepeat() {
        ActivityScenario.launch(HomeActivity::class.java).use {
            text("Open breathing guide").click()
            for ((pattern, phases) in listOf(
                "Coherent" to listOf("Inhale", "Exhale"),
                "Box" to listOf("Inhale", "Hold", "Exhale", "Hold"),
                "Settle" to listOf("Inhale", "Hold", "Exhale"),
            )) {
                val option = checkNotNull(device.wait(Until.findObject(By.textStartsWith(pattern)), 10_000))
                option.click()
                text("Ready")
                text("Start breathing").click()
                phases.forEach { phase -> text(phase) }
                text("Cycle 2")
                text("Pause breathing")
            }
        }
    }

    private fun visibleAfterScrolling(label: String, direction: Direction = Direction.DOWN): UiObject2 {
        repeat(6) {
            device.findObject(By.text(label))?.let { return it }
            val scrollable = checkNotNull(device.findObject(By.scrollable(true))) { "Expected a scrollable Home grid" }
            scrollable.scroll(direction, 0.65f)
        }
        return text(label)
    }

    private fun text(label: String): UiObject2 =
        checkNotNull(device.wait(Until.findObject(By.text(label)), 10_000)) { "Expected '$label'" }
}
