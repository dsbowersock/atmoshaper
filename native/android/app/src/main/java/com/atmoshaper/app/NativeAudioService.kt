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

internal data class NativeStationPlayback(val id: String, val status: NativeAudioStatus)

/** Main-thread publication and transport commands for Compose. The foreground
 * service alone owns the media session, focus request and audible graph. */
internal object NativeAudio {
    const val STATION = "generative-fm-aisatsana"
    const val PLAY = "com.atmoshaper.app.nativeaudio.PLAY"
    const val RESUME = "com.atmoshaper.app.nativeaudio.RESUME"
    const val PAUSE = "com.atmoshaper.app.nativeaudio.PAUSE"
    const val STOP = "com.atmoshaper.app.nativeaudio.STOP"
    const val STOP_STATION = "com.atmoshaper.app.nativeaudio.STOP_STATION"
    const val PLAY_LAYER = "com.atmoshaper.app.nativeaudio.PLAY_LAYER"
    const val STOP_LAYER = "com.atmoshaper.app.nativeaudio.STOP_LAYER"
    const val VOLUME_LAYER = "com.atmoshaper.app.nativeaudio.VOLUME_LAYER"
    const val EXTRA_SOUND = "sound"
    const val EXTRA_VOLUME = "volume"
    const val EXTRA_STATION = "stationId"

    private val mutableStatus = MutableStateFlow(NativeAudioStatus.Idle)
    val status = mutableStatus.asStateFlow()
    private val mutableStation = MutableStateFlow(NativeStationPlayback(STATION, NativeAudioStatus.Idle))
    val station = mutableStation.asStateFlow()
    private val mutableLayers = MutableStateFlow<Map<NativeMixSound, NativeMixLayer>>(emptyMap())
    val layers = mutableLayers.asStateFlow()

    fun publish(value: NativeAudioStatus) { mutableStatus.value = value }
    fun publishStation(id: String, value: NativeAudioStatus) { mutableStation.value = NativeStationPlayback(id, value) }
    fun publishLayers(value: Map<NativeMixSound, NativeMixLayer>) { mutableLayers.value = value }

    fun send(context: Context, command: String, stationId: String? = null) {
        val intent = Intent(context, NativeAudioService::class.java).setAction(command)
        if (stationId != null) intent.putExtra(EXTRA_STATION, stationId)
        send(context, intent)
    }

    fun sendLayer(context: Context, command: String, sound: NativeMixSound, volume: Float = 0.5f) {
        send(context, Intent(context, NativeAudioService::class.java).setAction(command)
            .putExtra(EXTRA_SOUND, sound.id).putExtra(EXTRA_VOLUME, volume))
    }

    private fun send(context: Context, intent: Intent) {
        try {
            if (intent.action == PLAY || intent.action == PLAY_LAYER) ContextCompat.startForegroundService(context, intent)
            else context.startService(intent)
        } catch (_: IllegalStateException) {
            publish(NativeAudioStatus.Failed)
            if (intent.action == PLAY) {
                publishStation(intent.getStringExtra(EXTRA_STATION) ?: station.value.id, NativeAudioStatus.Failed)
            }
        }
    }
}

/** A started media playback service survives both Activity recreation and task
 * removal. It is never sticky after process death or Android Force stop. */
class NativeAudioService : Service() {
    private data class StationRequest(val revision: Int, val station: NativeStation)

    private val mainThread = Handler(Looper.getMainLooper())
    private lateinit var audio: AudioManager
    private lateinit var focus: AudioFocusRequest
    private lateinit var session: MediaSession
    private var ownsFocusRequest = false
    private var foreground = false
    private var resumeOnFocusGain = false
    private var resumePending = false
    private var engine: NativeAudioEngine? = null
    private var engineReady = false
    private var token = 0
    private var nextRequest = 0
    private var stationRequest: StationRequest? = null
    private var stationDispatched = false
    private var stationActive = false
    private val dispatchedLayers = mutableSetOf<Int>()
    private val notifications get() = getSystemService(NotificationManager::class.java)
    private val status get() = NativeAudio.status.value
    private val layers get() = NativeAudio.layers.value
    private val title get() = stationRequest?.station?.title ?: getString(R.string.native_audio_mix_title)

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
                override fun onPlay() = resume()
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
            NativeAudio.PLAY -> play(intent.getStringExtra(NativeAudio.EXTRA_STATION))
            NativeAudio.RESUME -> resume()
            NativeAudio.PAUSE -> pause(NativeAudioStatus.Paused)
            NativeAudio.STOP -> finish(NativeAudioStatus.Idle)
            NativeAudio.STOP_STATION -> stopStation()
            NativeAudio.PLAY_LAYER, NativeAudio.STOP_LAYER, NativeAudio.VOLUME_LAYER -> {
                val sound = NativeMixSound.entries.find { it.id == intent.getStringExtra(NativeAudio.EXTRA_SOUND) }
                if (sound != null) when (intent.action) {
                    NativeAudio.PLAY_LAYER -> playLayer(sound)
                    NativeAudio.STOP_LAYER -> stopLayer(sound)
                    NativeAudio.VOLUME_LAYER -> setLayerVolume(sound, intent.getFloatExtra(NativeAudio.EXTRA_VOLUME, 0.5f))
                }
                if (!foreground && engine == null) stopSelf()
            }
            else -> finish(NativeAudioStatus.Idle)
        }
        return START_NOT_STICKY
    }

    private fun play(stationId: String?) {
        if (status == NativeAudioStatus.Interrupted) return
        val id = stationId ?: NativeAudio.station.value.id
        if (stationRequest?.station?.id == id) {
            if (status == NativeAudioStatus.Paused) resume()
            return
        }
        val choice = runCatching { NativeStationCatalog.read(this).find { it.id == id && it.playable } }.getOrNull()
        if (choice == null) {
            if (!foreground) {
                publishStation(NativeAudioStatus.Failed)
                finish(NativeAudioStatus.Failed)
            }
            return
        }
        // Retire just this station. Ambient layers and the service stay live.
        deactivateStation()
        val request = ++nextRequest
        stationRequest = StationRequest(request, choice)
        publishStation(NativeAudioStatus.Loading)
        mainThread.postDelayed({ if (!stationActive) failStation(request) }, STARTUP_TIMEOUT_MILLIS)
        ensurePlayback()
    }

    private fun playLayer(sound: NativeMixSound) {
        if (status == NativeAudioStatus.Interrupted || layers[sound]?.phase in ACTIVE_LAYER_PHASES) return
        val request = ++nextRequest
        updateLayer(sound, NativeMixLayer(request))
        mainThread.postDelayed({
            val layer = layers[sound]
            if (layer?.request == request && layer.phase == NativeMixPhase.Loading) {
                engine?.stopLayer(sound, layer, token)
                failLayer(sound, layer)
            }
        }, STARTUP_TIMEOUT_MILLIS)
        ensurePlayback()
    }

    private fun ensurePlayback() {
        if (!prepareForeground() || !requestFocus()) return
        if (status == NativeAudioStatus.Paused) {
            startOrResume()
            return
        }
        if (engine == null) openEngine()
        else dispatchPending()
        settleStatus()
    }

    private fun prepareForeground(): Boolean {
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
                return false
            }
        }
        return true
    }

    private fun requestFocus(): Boolean {
        // Android 15 requires foreground service ownership before asking for focus.
        if (!ownsFocusRequest) {
            ownsFocusRequest = audio.requestAudioFocus(focus) == AudioManager.AUDIOFOCUS_REQUEST_GRANTED
            if (!ownsFocusRequest) {
                finish(NativeAudioStatus.Failed)
                return false
            }
        }
        return true
    }

    private fun resume() {
        if (status == NativeAudioStatus.Paused && requestFocus()) startOrResume()
    }

    private fun startOrResume() {
        resumeOnFocusGain = false
        resumePending = engineReady
        publish(NativeAudioStatus.Loading)
        if (engineReady) {
            engine?.setPaused(false, token)
            val request = token
            mainThread.postDelayed({
                if (token == request && resumePending) finish(NativeAudioStatus.Failed)
            }, STARTUP_TIMEOUT_MILLIS)
        }
    }

    private fun openEngine() {
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
            "ready" -> {
                engineReady = true
                if (status == NativeAudioStatus.Paused || status == NativeAudioStatus.Interrupted) {
                    engine?.setPaused(true, token)
                } else {
                    dispatchPending()
                }
            }
            "playing:$request" -> if (resumePending) {
                resumePending = false
                dispatchPending()
                settleStatus()
            }
            "failed:$request", "unavailable" -> finish(NativeAudioStatus.Failed)
            else -> handleLayerMessage(request, message)
        }
    }

    private fun handleLayerMessage(token: Int, message: String) {
        val parts = message.split(':')
        if (parts.size != 3 || parts[1].toIntOrNull() != token) return
        val request = parts[2].toIntOrNull() ?: return
        if (request == stationRequest?.revision) {
            when (parts[0]) {
                "station-playing" -> {
                    stationActive = true
                    settleStatus()
                }
                "station-failed" -> failStation(request)
            }
            return
        }
        val (sound, layer) = layers.entries.find { it.value.request == request } ?: return
        when (parts[0]) {
            "layer-playing" -> if (layer.phase == NativeMixPhase.Loading) {
                updateLayer(sound, layer.copy(phase = NativeMixPhase.Playing))
                settleStatus()
            }
            "layer-failed" -> if (layer.phase == NativeMixPhase.Loading || layer.phase == NativeMixPhase.Playing) {
                failLayer(sound, layer)
            }
            "layer-stopped" -> if (layer.phase == NativeMixPhase.Stopping) {
                dispatchedLayers.remove(layer.request)
                updateLayer(sound, null)
                settleStatus()
            }
        }
    }

    /** Dispatch only into a live, focus-owned document. Async replies identify
     * both the WebView lifetime and the specific station/layer request. */
    private fun dispatchPending() {
        if (!engineReady || !ownsFocusRequest || resumePending ||
            status == NativeAudioStatus.Paused || status == NativeAudioStatus.Interrupted) return
        stationRequest?.let { request ->
            if (!stationDispatched) {
                stationDispatched = true
                engine?.play(request.station.id, token, request.revision)
            }
        }
        for ((sound, layer) in layers) {
            if (layer.phase == NativeMixPhase.Loading && dispatchedLayers.add(layer.request)) {
                engine?.playLayer(sound, layer, token)
            }
        }
    }

    private fun failStation(request: Int) {
        if (stationRequest?.revision != request) return
        clearStation(NativeAudioStatus.Failed)
        settleStatus(NativeAudioStatus.Failed)
    }

    private fun stopStation() {
        clearStation(NativeAudioStatus.Idle)
        settleStatus()
    }

    private fun clearStation(nextStatus: NativeAudioStatus) {
        publishStation(nextStatus)
        deactivateStation()
    }

    private fun deactivateStation() {
        if (stationDispatched) engine?.stopStation(token)
        stationRequest = null
        stationActive = false
        stationDispatched = false
    }

    private fun failLayer(sound: NativeMixSound, layer: NativeMixLayer) {
        dispatchedLayers.remove(layer.request)
        updateLayer(sound, layer.copy(phase = NativeMixPhase.Failed))
        settleStatus(NativeAudioStatus.Failed)
    }

    private fun stopLayer(sound: NativeMixSound) {
        val layer = layers[sound] ?: return
        if (layer.phase == NativeMixPhase.Stopping || layer.phase == NativeMixPhase.Failed) return
        if (layer.request in dispatchedLayers) {
            updateLayer(sound, layer.copy(phase = NativeMixPhase.Stopping))
            engine?.stopLayer(sound, layer, token)
        } else {
            updateLayer(sound, null)
            settleStatus()
        }
    }

    private fun setLayerVolume(sound: NativeMixSound, volume: Float) {
        val layer = layers[sound] ?: return
        if (!volume.isFinite() || layer.phase != NativeMixPhase.Playing) return
        val level = volume.coerceIn(0f, 1f)
        updateLayer(sound, layer.copy(volume = level))
        engine?.setLayerVolume(sound, level, token)
    }

    private fun updateLayer(sound: NativeMixSound, layer: NativeMixLayer?) {
        NativeAudio.publishLayers(if (layer == null) layers - sound else layers + (sound to layer))
    }

    private fun settleStatus(emptyStatus: NativeAudioStatus = NativeAudioStatus.Idle) {
        if (stationRequest == null && layers.values.none { it.phase in ACTIVE_LAYER_PHASES }) {
            finish(emptyStatus)
        } else if (status == NativeAudioStatus.Paused || status == NativeAudioStatus.Interrupted) {
            if (stationActive) publishStation(status)
            publish(status)
        } else if (!resumePending) {
            if (stationActive) publishStation(NativeAudioStatus.Playing)
            val active = stationActive || layers.values.any { it.phase == NativeMixPhase.Playing || it.phase == NativeMixPhase.Stopping }
            publish(if (active) NativeAudioStatus.Playing else NativeAudioStatus.Loading)
        }
    }

    private fun pause(nextStatus: NativeAudioStatus) {
        when (status) {
            NativeAudioStatus.Playing, NativeAudioStatus.Interrupted, NativeAudioStatus.Paused, NativeAudioStatus.Loading -> {
                resumePending = false
                resumeOnFocusGain = nextStatus == NativeAudioStatus.Interrupted
                engine?.setPaused(true, token)
                if (!resumeOnFocusGain) abandonFocus()
                if (stationRequest != null) publishStation(nextStatus)
                publish(nextStatus)
            }
            else -> if (engine == null) stopSelf()
        }
    }

    /** A transient loss retains the current playback requests. Manual Pause or
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
        if (nextStatus == NativeAudioStatus.Failed) {
            if (stationRequest != null) publishStation(nextStatus)
            NativeAudio.publishLayers(layers.mapValues { (_, layer) -> layer.copy(phase = NativeMixPhase.Failed) })
        } else {
            publishStation(NativeAudioStatus.Idle)
            NativeAudio.publishLayers(emptyMap())
        }
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
        resumePending = false
        stationRequest = null
        stationDispatched = false
        stationActive = false
        dispatchedLayers.clear()
        engineReady = false
        mainThread.removeCallbacksAndMessages(null)
        engine?.close()
        engine = null
        abandonFocus()
    }

    override fun onDestroy() {
        releaseEngine()
        if (foreground) {
            stopForeground(STOP_FOREGROUND_REMOVE)
            NativeAudio.publish(NativeAudioStatus.Idle)
            publishStation(NativeAudioStatus.Idle)
            NativeAudio.publishLayers(emptyMap())
        }
        session.release()
        super.onDestroy()
    }

    private fun publishStation(nextStatus: NativeAudioStatus) {
        NativeAudio.publishStation(stationRequest?.station?.id ?: NativeAudio.station.value.id, nextStatus)
    }

    private fun publish(nextStatus: NativeAudioStatus) {
        NativeAudio.publish(nextStatus)
        session.setMetadata(MediaMetadata.Builder().putString(MediaMetadata.METADATA_KEY_TITLE, title).apply {
            stationRequest?.station?.let { station ->
                putString(MediaMetadata.METADATA_KEY_MEDIA_ID, station.id)
                putString(MediaMetadata.METADATA_KEY_ARTIST, station.artist)
            }
        }.build())
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
                builder.addAction(action(android.R.drawable.ic_media_play, R.string.native_audio_play, NativeAudio.RESUME))
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
        val ACTIVE_LAYER_PHASES = setOf(NativeMixPhase.Loading, NativeMixPhase.Playing, NativeMixPhase.Stopping)
    }
}
