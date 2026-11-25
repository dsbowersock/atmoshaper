package com.atmoshaper.app

import androidx.annotation.StringRes
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.heightIn
import androidx.compose.material3.Button
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Slider
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.semantics.LiveRegionMode
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.liveRegion
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.semantics.stateDescription
import androidx.compose.ui.unit.dp

/** These are existing catalog IDs for the representative Stage 1 mixer. */
internal enum class NativeMixSound(val id: String, val kind: String, @get:StringRes val label: Int) {
    WhiteNoise("noise:white", "generated", R.string.native_audio_white_noise),
    PinkNoise("noise:pink", "generated", R.string.native_audio_pink_noise),
    BrownNoise("noise:brown", "generated", R.string.native_audio_brown_noise),
    BoilingWater("moodist-boiling-water", "ambient", R.string.native_audio_boiling_water),
}

internal enum class NativeMixPhase { Loading, Playing, Stopping, Failed }

internal data class NativeMixLayer(
    val request: Int,
    val phase: NativeMixPhase = NativeMixPhase.Loading,
    val volume: Float = 0.5f,
    val savedOnly: Boolean = false,
)

/** Compose observes player-owned state and sends commands only on user input. */
@Composable
internal fun NativeAudioMixControls() {
    val context = LocalContext.current
    val layers by NativeAudio.layers.collectAsState()
    val transport by NativeAudio.status.collectAsState()
    val active = layers.values.any { it.phase != NativeMixPhase.Failed }
    var expanded by rememberSaveable { mutableStateOf(layers.isNotEmpty()) }
    val disclosure = stringResource(if (expanded) R.string.native_audio_expanded else R.string.native_audio_collapsed)
    val control = Modifier.heightIn(min = 48.dp)
    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
        OutlinedButton(
            onClick = { expanded = !expanded },
            modifier = control.semantics { stateDescription = disclosure },
        ) { Text(stringResource(R.string.native_audio_mixer)) }
        if (!expanded) return@Column
        if (active) {
            if (transport != NativeAudioStatus.Playing) {
                Text(
                    stringResource(transport.label),
                    modifier = Modifier.semantics { liveRegion = LiveRegionMode.Polite },
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
            }
            if (transport == NativeAudioStatus.Paused) {
                Button(onClick = { NativeAudio.send(context, NativeAudio.RESUME) }, modifier = control) {
                    Text(stringResource(R.string.native_audio_resume_mix))
                }
            } else if (transport == NativeAudioStatus.Playing || transport == NativeAudioStatus.Interrupted) {
                Button(onClick = { NativeAudio.send(context, NativeAudio.PAUSE) }, modifier = control) {
                    Text(stringResource(R.string.native_audio_pause_mix))
                }
            }
            OutlinedButton(onClick = { NativeAudio.send(context, NativeAudio.STOP) }, modifier = control) {
                Text(stringResource(R.string.native_audio_stop_mix))
            }
        }
        for (sound in NativeMixSound.entries) {
            val title = stringResource(sound.label)
            val layer = layers[sound]
            val canStop = layer != null && layer.phase != NativeMixPhase.Failed
            Button(
                onClick = { NativeAudio.sendLayer(context, if (canStop) NativeAudio.STOP_LAYER else NativeAudio.PLAY_LAYER, sound) },
                enabled = layer?.phase != NativeMixPhase.Stopping && (canStop || transport != NativeAudioStatus.Interrupted),
                modifier = control,
            ) {
                Text(stringResource(if (canStop) R.string.native_audio_stop_layer else R.string.native_audio_play_layer, title))
            }
            when (layer?.phase) {
                NativeMixPhase.Playing -> {
                    val level = stringResource(R.string.native_audio_layer_volume, title)
                    Slider(
                        value = layer.volume,
                        onValueChange = { NativeAudio.sendLayer(context, NativeAudio.VOLUME_LAYER, sound, it) },
                        modifier = Modifier.semantics { contentDescription = level },
                    )
                }
                NativeMixPhase.Loading -> Text(
                    stringResource(R.string.native_audio_layer_loading, title),
                    modifier = Modifier.semantics { liveRegion = LiveRegionMode.Polite },
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
                NativeMixPhase.Failed -> Text(
                    stringResource(
                        if (sound.kind == "ambient") R.string.native_audio_ambient_failed else R.string.native_audio_generated_failed,
                        title,
                    ),
                    modifier = Modifier.semantics { liveRegion = LiveRegionMode.Polite },
                    color = MaterialTheme.colorScheme.error,
                )
                NativeMixPhase.Stopping, null -> Unit
            }
        }
        Text(
            stringResource(R.string.native_audio_more_ambient),
            color = MaterialTheme.colorScheme.onSurfaceVariant,
        )
    }
}
