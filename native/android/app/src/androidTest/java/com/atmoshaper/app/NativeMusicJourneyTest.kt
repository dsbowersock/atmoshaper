package com.atmoshaper.app

import android.media.AudioAttributes
import android.media.AudioFocusRequest
import android.media.AudioManager
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
import org.junit.Assume.assumeTrue
import org.junit.Test
import org.junit.runner.RunWith

@RunWith(AndroidJUnit4::class)
class NativeMusicJourneyTest {
    private val device = UiDevice.getInstance(InstrumentationRegistry.getInstrumentation())

    @Test
    fun musicControlsAreNativeAndIdleUntilPlay() {
        ActivityScenario.launch(HomeActivity::class.java).use {
            openMusic()
            text("aisatsana (generative remix)")
            text("Play")
            assertFalse(device.hasObject(By.text("Playing")))
            assertFalse(device.hasObject(By.clazz("android.webkit.WebView")))
        }
    }

    @Test
    fun androidFocusResumesAnInterruptionUntilTheUserStops() {
        assumeTrue(InstrumentationRegistry.getArguments().getString("verifyAisatsana") == "true")
        val context = InstrumentationRegistry.getInstrumentation().targetContext
        val audio = context.getSystemService(AudioManager::class.java)
        val interruption = AudioFocusRequest.Builder(AudioManager.AUDIOFOCUS_GAIN_TRANSIENT)
            .setAudioAttributes(AudioAttributes.Builder().setUsage(AudioAttributes.USAGE_MEDIA).build())
            .setOnAudioFocusChangeListener { }
            .build()
        ActivityScenario.launch(HomeActivity::class.java).use {
            openMusic()
            text("Play").click()
            text("Playing", timeout = 60_000)
            try {
                assertEquals(AudioManager.AUDIOFOCUS_REQUEST_GRANTED, audio.requestAudioFocus(interruption))
                text("Interrupted")
                audio.abandonAudioFocusRequest(interruption)
                text("Playing")
                assertEquals(AudioManager.AUDIOFOCUS_REQUEST_GRANTED, audio.requestAudioFocus(interruption))
                text("Interrupted")
                text("Stop").click()
                text("Ready to play")
                audio.abandonAudioFocusRequest(interruption)
                assertFalse(device.wait(Until.hasObject(By.text("Playing")), 2_000))
            } finally {
                audio.abandonAudioFocusRequest(interruption)
                device.findObject(By.text("Stop"))?.run { if (isEnabled) click() }
            }
        }
    }

    private fun openMusic() {
        repeat(5) {
            if (device.findObject(By.text("Music")) == null) {
                device.findObject(By.scrollable(true))?.scroll(Direction.DOWN, 0.55f)
            }
        }
        text("Music").click()
    }

    private fun text(label: String, timeout: Long = 10_000): UiObject2 =
        checkNotNull(device.wait(Until.findObject(By.text(label)), timeout)) { "Expected '$label'" }
}
