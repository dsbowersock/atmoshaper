package com.atmoshaper.app

import android.annotation.SuppressLint
import android.content.Context
import android.media.AudioAttributes
import android.media.AudioFormat
import android.media.AudioTrack
import android.os.Build
import android.os.VibrationEffect
import android.os.Vibrator
import android.os.VibratorManager
import kotlin.math.PI
import kotlin.math.pow
import kotlin.math.sin

/** A short, local rendering of the packaged Chimer's two-note sound. Output
 * failures do not change the timer or replay an already consumed cue. */
internal class TimerCuePlayer(private val context: Context) {
    private var track: AudioTrack? = null

    @SuppressLint("MissingPermission") // Manifest VIBRATE is a normal install permission.
    fun play(setup: TimerSetup) {
        stop()
        if (setup.cue.sound && setup.volume > 0) runCatching {
            val output = AudioTrack.Builder()
                .setAudioAttributes(AudioAttributes.Builder().setUsage(AudioAttributes.USAGE_MEDIA)
                    .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION).build())
                .setAudioFormat(AudioFormat.Builder().setEncoding(AudioFormat.ENCODING_PCM_16BIT)
                    .setSampleRate(sampleRate).setChannelMask(AudioFormat.CHANNEL_OUT_MONO).build())
                .setTransferMode(AudioTrack.MODE_STATIC)
                .setBufferSizeInBytes(samples.size * Short.SIZE_BYTES)
                .build()
            track = output
            check(output.write(samples, 0, samples.size) == samples.size)
            output.setVolume(setup.volume.toFloat())
            output.play()
        }.onFailure { releaseTrack() }
        if (setup.cue.vibration) runCatching {
            vibrator()?.vibrate(VibrationEffect.createOneShot(setup.vibrationMs.toLong(), VibrationEffect.DEFAULT_AMPLITUDE))
        }
    }

    @SuppressLint("MissingPermission")
    fun stop() {
        releaseTrack()
        runCatching { vibrator()?.cancel() }
    }

    private fun releaseTrack() {
        track?.release()
        track = null
    }

    @Suppress("DEPRECATION")
    private fun vibrator(): Vibrator? =
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) context.getSystemService(VibratorManager::class.java)?.defaultVibrator
        else context.getSystemService(Vibrator::class.java)

    private companion object {
        const val sampleRate = 16_000
        // Match the packaged chime's frequencies, overlap and 20 ms attack
        // with a single local PCM buffer. The user volume applies at playback.
        val samples by lazy {
            ShortArray(sampleRate * 9 / 10) { index ->
                val t = index.toDouble() / sampleRate
                val gain = if (t < 0.02) 0.0001 * 1_800.0.pow(t / 0.02)
                else 0.18 * (1 / 1_800.0).pow((t - 0.02) / 0.88)
                val first = if (t < 0.32) sin(2 * PI * 784 * t) else 0.0
                val second = if (t >= 0.28) sin(2 * PI * 1046.5 * (t - 0.28)) else 0.0
                ((first + second) * gain * Short.MAX_VALUE).toInt().toShort()
            }
        }
    }
}
