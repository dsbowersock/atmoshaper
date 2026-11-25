package com.atmoshaper.app

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.heightIn
import androidx.compose.material3.Button
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.semantics.LiveRegionMode
import androidx.compose.ui.semantics.liveRegion
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.unit.dp

@Composable
internal fun NativeAudioControls() {
    val context = LocalContext.current
    val status by NativeAudio.status.collectAsState()
    val canPlay = status == NativeAudioStatus.Idle || status == NativeAudioStatus.Paused || status == NativeAudioStatus.Failed
    val canPause = status == NativeAudioStatus.Playing || status == NativeAudioStatus.Interrupted
    val control = Modifier.heightIn(min = 48.dp)
    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
        Text(stringResource(R.string.native_audio_aisatsana), style = MaterialTheme.typography.titleMedium)
        Text(
            stringResource(status.label),
            modifier = Modifier.semantics { liveRegion = LiveRegionMode.Polite },
            color = MaterialTheme.colorScheme.onSurfaceVariant,
        )
        if (canPause) {
            Button(onClick = { NativeAudio.send(context, NativeAudio.PAUSE) }, modifier = control) {
                Text(stringResource(R.string.native_audio_pause))
            }
        } else {
            Button(onClick = { NativeAudio.send(context, NativeAudio.PLAY) }, enabled = canPlay, modifier = control) {
                Text(stringResource(R.string.native_audio_play))
            }
        }
        OutlinedButton(
            onClick = { NativeAudio.send(context, NativeAudio.STOP) },
            enabled = status != NativeAudioStatus.Idle && status != NativeAudioStatus.Failed,
            modifier = control,
        ) {
            Text(stringResource(R.string.native_audio_stop))
        }
    }
}
