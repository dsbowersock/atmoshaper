package com.atmoshaper.app

import android.annotation.SuppressLint
import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.content.pm.ServiceInfo
import android.media.AudioAttributes
import android.media.AudioFocusRequest
import android.media.AudioManager
import android.media.MediaMetadata
import android.media.session.MediaSession
import android.media.session.PlaybackState
import android.os.Build
import android.os.Handler
import android.os.Looper
import androidx.annotation.StringRes
import androidx.core.content.ContextCompat
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow

internal enum class NativeAudioStatus(@get:StringRes val label: Int) {
    Idle(R.string.native_audio_idle),
    Loading(R.string.native_audio_loading),
    Playing(R.string.native_audio_playing),
    Paused(R.string.native_audio_paused),
    Interrupted(R.string.native_audio_interrupted),
    Failed(R.string.native_audio_failed),
}

/** Main-thread publication and transport commands for Compose. The foreground
 * service alone owns the media session, focus request and audible graph. */
internal object NativeAudio {
    const val STATION = "generative-fm-aisatsana"
    const val PLAY = "com.atmoshaper.app.nativeaudio.PLAY"
    const val PAUSE = "com.atmoshaper.app.nativeaudio.PAUSE"
    const val STOP = "com.atmoshaper.app.nativeaudio.STOP"

    private val mutableStatus = MutableStateFlow(NativeAudioStatus.Idle)
    val status = mutableStatus.asStateFlow()

    fun publish(value: NativeAudioStatus) { mutableStatus.value = value }

    fun send(context: Context, command: String) {
        val intent = Intent(context, NativeAudioService::class.java).setAction(command)
        try {
            if (command == PLAY) ContextCompat.startForegroundService(context, intent)
            else context.startService(intent)
        } catch (_: IllegalStateException) {
            publish(NativeAudioStatus.Failed)
        }
    }
}

/** A started media playback service survives both Activity recreation and task
 * removal. It is never sticky after process death or Android Force stop. */
class NativeAudioService : Service() {
    private val mainThread = Handler(Looper.getMainLooper())
    private lateinit var audio: AudioManager
    private lateinit var focus: AudioFocusRequest
    private lateinit var session: MediaSession
    private var ownsFocusRequest = false
    private var foreground = false
    private var resumeOnFocusGain = false
    private var engine: NativeAudioEngine? = null
    private var token = 0
    private val startupTimeout = Runnable { finish(NativeAudioStatus.Failed) }
    private val notifications get() = getSystemService(NotificationManager::class.java)
    private val status get() = NativeAudio.status.value
    private val title get() = getString(R.string.native_audio_aisatsana)

    override fun onCreate() {
        super.onCreate()
        audio = getSystemService(AudioManager::class.java)
        focus = AudioFocusRequest.Builder(AudioManager.AUDIOFOCUS_GAIN)
            .setAudioAttributes(
                AudioAttributes.Builder().setUsage(AudioAttributes.USAGE_MEDIA)
                    .setContentType(AudioAttributes.CONTENT_TYPE_MUSIC).build(),
            )
            .setWillPauseWhenDucked(true)
            .setOnAudioFocusChangeListener(::focusChanged, mainThread)
            .build()
        notifications.createNotificationChannel(
            NotificationChannel(CHANNEL, getString(R.string.native_audio_channel), NotificationManager.IMPORTANCE_LOW),
        )
        session = MediaSession(this, "AtmoShaper audio").apply {
            setMetadata(MediaMetadata.Builder().putString(MediaMetadata.METADATA_KEY_TITLE, title).build())
            setSessionActivity(openHome())
            setCallback(object : MediaSession.Callback() {
                override fun onPlay() = play()
                override fun onPause() = pause(NativeAudioStatus.Paused)
                override fun onStop() = finish(NativeAudioStatus.Idle)
                override fun onCustomAction(action: String, extras: android.os.Bundle?) {
                    if (action == NativeAudio.STOP) finish(NativeAudioStatus.Idle)
                }
            }, mainThread)
        }
    }

    override fun onBind(intent: Intent?) = null

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        when (intent?.action) {
            NativeAudio.PLAY -> play()
            NativeAudio.PAUSE -> pause(NativeAudioStatus.Paused)
            NativeAudio.STOP -> finish(NativeAudioStatus.Idle)
            else -> finish(NativeAudioStatus.Idle)
        }
        return START_NOT_STICKY
    }

    private fun play() {
        if (status in setOf(NativeAudioStatus.Loading, NativeAudioStatus.Playing, NativeAudioStatus.Interrupted)) return
        if (!foreground) {
            publish(NativeAudioStatus.Loading)
            try {
                val notification = notification()
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                    startForeground(NOTIFICATION, notification, ServiceInfo.FOREGROUND_SERVICE_TYPE_MEDIA_PLAYBACK)
                } else {
                    startForeground(NOTIFICATION, notification)
                }
                foreground = true
                session.isActive = true
            } catch (_: RuntimeException) {
                finish(NativeAudioStatus.Failed)
                return
            }
        }
        // Android 15 requires foreground service ownership before asking for focus.
        if (!ownsFocusRequest) {
            ownsFocusRequest = audio.requestAudioFocus(focus) == AudioManager.AUDIOFOCUS_REQUEST_GRANTED
            if (!ownsFocusRequest) {
                finish(NativeAudioStatus.Failed)
                return
            }
        }
        startOrResume()
    }

    private fun startOrResume() {
        resumeOnFocusGain = false
        publish(NativeAudioStatus.Loading)
        mainThread.removeCallbacks(startupTimeout)
        mainThread.postDelayed(startupTimeout, STARTUP_TIMEOUT_MILLIS)
        val retained = engine
        if (retained != null) {
            retained.setPaused(false, token)
            return
        }
        val request = ++token
        try {
            engine = NativeAudioEngine(this) { message -> handleEngineMessage(request, message) }
            engine?.open()
        } catch (_: RuntimeException) {
            finish(NativeAudioStatus.Failed)
        }
    }

    private fun handleEngineMessage(request: Int, message: String) {
        if (request != token) return
        when (message) {
            "ready" -> if (status == NativeAudioStatus.Loading) engine?.play(NativeAudio.STATION, request)
            "playing:$request" -> if (status == NativeAudioStatus.Loading) {
                mainThread.removeCallbacks(startupTimeout)
                publish(NativeAudioStatus.Playing)
            }
            "failed:$request", "unavailable" -> finish(NativeAudioStatus.Failed)
        }
    }

    private fun pause(nextStatus: NativeAudioStatus) {
        when (status) {
            NativeAudioStatus.Playing, NativeAudioStatus.Interrupted, NativeAudioStatus.Paused -> {
                resumeOnFocusGain = nextStatus == NativeAudioStatus.Interrupted
                engine?.setPaused(true, token)
                if (!resumeOnFocusGain) abandonFocus()
                publish(nextStatus)
            }
            NativeAudioStatus.Loading -> finish(NativeAudioStatus.Paused)
            else -> if (engine == null) stopSelf()
        }
    }

    /** A transient loss can only resume an established graph. Manual Pause or
     * Stop revokes that permission even if the system later returns focus. */
    private fun focusChanged(change: Int) {
        if (!ownsFocusRequest) return
        when (change) {
            AudioManager.AUDIOFOCUS_GAIN -> if (resumeOnFocusGain) startOrResume()
            AudioManager.AUDIOFOCUS_LOSS -> pause(NativeAudioStatus.Paused)
            AudioManager.AUDIOFOCUS_LOSS_TRANSIENT, AudioManager.AUDIOFOCUS_LOSS_TRANSIENT_CAN_DUCK ->
                if (status == NativeAudioStatus.Playing || status == NativeAudioStatus.Loading) {
                    pause(NativeAudioStatus.Interrupted)
                }
        }
    }

    private fun abandonFocus() {
        if (!ownsFocusRequest) return
        ownsFocusRequest = false
        audio.abandonAudioFocusRequest(focus)
    }

    private fun finish(nextStatus: NativeAudioStatus) {
        releaseEngine()
        if (foreground) {
            stopForeground(STOP_FOREGROUND_REMOVE)
            foreground = false
        }
        session.isActive = false
        publish(nextStatus)
        stopSelf()
    }

    private fun releaseEngine() {
        token++
        resumeOnFocusGain = false
        mainThread.removeCallbacks(startupTimeout)
        engine?.close()
        engine = null
        abandonFocus()
    }

    override fun onDestroy() {
        releaseEngine()
        if (foreground) {
            stopForeground(STOP_FOREGROUND_REMOVE)
            NativeAudio.publish(NativeAudioStatus.Idle)
        }
        session.release()
        super.onDestroy()
    }

    private fun publish(nextStatus: NativeAudioStatus) {
        NativeAudio.publish(nextStatus)
        val state = when (nextStatus) {
            NativeAudioStatus.Loading -> PlaybackState.STATE_BUFFERING
            NativeAudioStatus.Playing -> PlaybackState.STATE_PLAYING
            NativeAudioStatus.Paused, NativeAudioStatus.Interrupted -> PlaybackState.STATE_PAUSED
            NativeAudioStatus.Failed -> PlaybackState.STATE_ERROR
            NativeAudioStatus.Idle -> PlaybackState.STATE_STOPPED
        }
        val actions = PlaybackState.ACTION_STOP or when (nextStatus) {
            NativeAudioStatus.Playing, NativeAudioStatus.Interrupted -> PlaybackState.ACTION_PAUSE
            NativeAudioStatus.Paused -> PlaybackState.ACTION_PLAY
            else -> 0L
        }
        val builder = PlaybackState.Builder().setActions(actions).setState(
            state, PlaybackState.PLAYBACK_POSITION_UNKNOWN, if (state == PlaybackState.STATE_PLAYING) 1f else 0f,
        )
        if (nextStatus in setOf(NativeAudioStatus.Loading, NativeAudioStatus.Playing, NativeAudioStatus.Paused, NativeAudioStatus.Interrupted)) {
            // Android 13+ uses PlaybackState actions for its system media controls.
            builder.addCustomAction(NativeAudio.STOP, getString(R.string.native_audio_stop), android.R.drawable.ic_menu_close_clear_cancel)
        }
        session.setPlaybackState(builder.build())
        if (foreground) updateMediaNotification()
    }

    // Android's notification runtime permission exempts notifications attached
    // to a media session. This method can only send this service's media card.
    @SuppressLint("NotificationPermission")
    private fun updateMediaNotification() {
        notifications.notify(NOTIFICATION, notification())
    }

    private fun openHome(): PendingIntent = PendingIntent.getActivity(
        this, 0, Intent(this, HomeActivity::class.java).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_SINGLE_TOP),
        PendingIntent.FLAG_IMMUTABLE,
    )

    private fun notification(): Notification {
        val builder = Notification.Builder(this, CHANNEL)
            .setSmallIcon(android.R.drawable.ic_media_play)
            .setContentTitle(title)
            .setContentText(getString(status.label))
            .setContentIntent(openHome())
            .setVisibility(Notification.VISIBILITY_PUBLIC)
            .setOnlyAlertOnce(true)
            .setOngoing(true)
        when (status) {
            NativeAudioStatus.Playing, NativeAudioStatus.Interrupted ->
                builder.addAction(action(android.R.drawable.ic_media_pause, R.string.native_audio_pause, NativeAudio.PAUSE))
            NativeAudioStatus.Paused ->
                builder.addAction(action(android.R.drawable.ic_media_play, R.string.native_audio_play, NativeAudio.PLAY))
            else -> Unit
        }
        builder.addAction(action(android.R.drawable.ic_menu_close_clear_cancel, R.string.native_audio_stop, NativeAudio.STOP))
        return builder.setStyle(
            Notification.MediaStyle().setMediaSession(session.sessionToken).setShowActionsInCompactView(0),
        ).build()
    }

    private fun action(icon: Int, @StringRes label: Int, command: String): Notification.Action =
        Notification.Action.Builder(
            android.graphics.drawable.Icon.createWithResource(this, icon), getString(label),
            PendingIntent.getService(
                this, 0, Intent(this, NativeAudioService::class.java).setAction(command), PendingIntent.FLAG_IMMUTABLE,
            ),
        ).build()

    private companion object {
        const val CHANNEL = "native_audio"
        const val NOTIFICATION = 303
        const val STARTUP_TIMEOUT_MILLIS = 60_000L
    }
}
