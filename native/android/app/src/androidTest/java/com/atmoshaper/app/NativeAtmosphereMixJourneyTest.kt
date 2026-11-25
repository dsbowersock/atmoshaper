package com.atmoshaper.app

import androidx.test.core.app.ActivityScenario
import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.platform.app.InstrumentationRegistry
import androidx.test.uiautomator.By
import androidx.test.uiautomator.BySelector
import androidx.test.uiautomator.Direction
import androidx.test.uiautomator.UiDevice
import androidx.test.uiautomator.UiObject2
import androidx.test.uiautomator.Until
import org.junit.Assert.assertFalse
import org.junit.Test
import org.junit.runner.RunWith

@RunWith(AndroidJUnit4::class)
class NativeAtmosphereMixJourneyTest {
    private val device = UiDevice.getInstance(InstrumentationRegistry.getInstrumentation())

    @Test
    fun generatedLayersReattachAndStopIndependently() {
        ActivityScenario.launch(HomeActivity::class.java).use { scenario ->
            find("Music").click()
            find("Atmosphere sounds and noise").click()
            try {
                find("Play White noise").click()
                find("White noise volume", By.desc("White noise volume"))
                find("Play Pink noise").click()
                find("Pink noise volume", By.desc("Pink noise volume"))
                scenario.recreate()
                find("Stop White noise").click()
                find("Play White noise")
                find("Pink noise volume", By.desc("Pink noise volume"))
                assertFalse(device.hasObject(By.clazz("android.webkit.WebView")))
            } finally {
                runCatching { find("Stop all audio").click() }
            }
        }
    }

    private fun find(label: String, selector: BySelector = By.text(label)): UiObject2 {
        repeat(12) { attempt ->
            device.wait(Until.findObject(selector), 500)?.let { return it }
            val direction = if (attempt < 6) Direction.DOWN else Direction.UP
            device.findObject(By.scrollable(true))?.scroll(direction, 0.55f)
        }
        error("Expected '$label'")
    }
}
