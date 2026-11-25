package com.atmoshaper.app

import android.app.ActivityManager
import android.content.Intent
import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.platform.app.InstrumentationRegistry
import androidx.test.uiautomator.By
import androidx.test.uiautomator.Direction
import androidx.test.uiautomator.UiDevice
import androidx.test.uiautomator.UiObject2
import androidx.test.uiautomator.Until
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith

@RunWith(AndroidJUnit4::class)
class HomeJourneyTest {
    private val instrumentation = InstrumentationRegistry.getInstrumentation()
    private val context = instrumentation.targetContext
    private val device = UiDevice.getInstance(instrumentation)
    private val webView = By.clazz("android.webkit.WebView")

    @Before
    fun closeExistingAppTasks() {
        // Start each journey with an empty app back stack while retaining saved data.
        val activities = checkNotNull(context.getSystemService(ActivityManager::class.java))
        activities.appTasks.forEach { it.finishAndRemoveTask() }
    }

    @Test
    fun launcherOpensEachNativeCategoryAndReturnsHome() {
        launchFromAppIcon()
        assertNativeHome()
        val categories = listOf("Music", "Clock & timer", "Wellness", "My Calendar", "Study & play", "Practice tools")
        for ((index, category) in categories.withIndex()) {
            findCategory(category).click()
            assertFalse(device.hasObject(webView))
            if (category == "Clock & timer") {
                waitForText("Close Clock").click()
            } else {
                waitForText(when (category) {
                    "Music" -> "Ready to play"
                    "Wellness" -> "Open breathing guide"
                    else -> "Coming to the native app"
                })
                waitForText(category)
                if (index % 2 == 0) device.pressBack() else waitForText("Back to Home").click()
            }
            assertTrue(device.wait(Until.gone(By.text("Back to Home")), 10_000))
            waitForText(category)
        }
    }

    @Test
    fun legacyLinkAllowsLauncherEntryAndBackFromPreviousTools() {
        device.executeShellCommand(
            "am start -W -a android.intent.action.VIEW -c android.intent.category.BROWSABLE " +
                "-d atmoshaper://tool?path=%2F -p ${context.packageName}",
        )
        assertTrue("Expected the legacy link to open the packaged tools", device.wait(Until.hasObject(webView), 10_000))
        device.pressHome()

        launchFromAppIcon()
        assertNativeHome()
        findCategory("Music").click()
        waitForText("Ready to play")
        waitForText("Open previous tools").click()
        assertTrue("Expected previous tools to reopen the existing WebView", device.wait(Until.hasObject(webView), 10_000))

        device.pressBack()
        waitForText("Ready to play")
        waitForText("Music")
        device.pressBack()
        assertNativeHome()
    }

    private fun launchFromAppIcon() {
        val component = checkNotNull(context.packageManager.getLaunchIntentForPackage(context.packageName)?.component)
        // The platform launcher starts the resolved component with both task flags.
        val flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_RESET_TASK_IF_NEEDED
        device.executeShellCommand(
            "am start -W -f 0x${flags.toString(16)} -a android.intent.action.MAIN " +
                "-c android.intent.category.LAUNCHER -n ${component.flattenToShortString()}",
        )
    }

    private fun assertNativeHome() {
        assertTrue("Expected Compose Home without a WebView", device.wait(Until.gone(webView), 10_000))
        waitForText("Your tools")
        assertTrue("Expected an accessible public wordmark", device.wait(Until.hasObject(By.desc("AtmoShaper")), 10_000))
    }

    /** The adaptive grid may place later categories below the initial viewport. */
    private fun findCategory(label: String): UiObject2 {
        val selector = By.text(label)
        repeat(6) {
            device.findObject(selector)?.let { return it }
            val grid = checkNotNull(device.findObject(By.scrollable(true))) { "Expected a scrollable Home grid" }
            grid.scroll(Direction.DOWN, 0.65f)
        }
        return waitForText(label)
    }

    private fun waitForText(label: String): UiObject2 =
        checkNotNull(device.wait(Until.findObject(By.text(label)), 10_000)) { "Expected the installed app to show '$label'" }
}
