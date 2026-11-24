package com.atmoshaper.app

import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.platform.app.InstrumentationRegistry
import androidx.test.uiautomator.By
import androidx.test.uiautomator.UiDevice
import androidx.test.uiautomator.Until
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test
import org.junit.runner.RunWith

@RunWith(AndroidJUnit4::class)
class HomeJourneyTest {
    private val instrumentation = InstrumentationRegistry.getInstrumentation()
    private val device = UiDevice.getInstance(instrumentation)

    @Test
    fun launcherOpensHomeAndBackReturnsFromAnUnavailableTool() {
        val context = instrumentation.targetContext
        val launcher = checkNotNull(context.packageManager.getLaunchIntentForPackage(context.packageName))
        context.startActivity(launcher)

        waitForText("Your tools")
        for (tool in listOf("Music", "Clock & timer", "Wellness", "My Calendar", "Study & play", "Practice tools")) {
            waitForText(tool)
        }
        device.findObject(By.text("Clock & timer")).click()
        waitForText("Clock & timer")
        waitForText("Coming to the native app")
        assertFalse(device.hasObject(By.clazz("android.webkit.WebView")))

        device.pressBack()
        waitForText("Your tools")
        device.findObject(By.text("Clock & timer")).click()
        waitForText("Coming to the native app")
        device.findObject(By.text("Back to Home")).click()
        waitForText("Your tools")
    }

    private fun waitForText(label: String) {
        assertTrue("Expected the installed app to show '$label'", device.wait(Until.hasObject(By.text(label)), 10_000))
    }
}
