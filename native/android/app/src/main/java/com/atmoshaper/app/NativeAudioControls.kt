package com.atmoshaper.app

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.selection.selectable
import androidx.compose.foundation.selection.selectableGroup
import androidx.compose.foundation.text.selection.SelectionContainer
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.produceState
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.ExperimentalComposeUiApi
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.semantics.LiveRegionMode
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.liveRegion
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.semantics.testTagsAsResourceId
import androidx.compose.ui.unit.dp
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

@Composable
internal fun NativeAudioControls() {
    val context = LocalContext.current
    val result by produceState<Result<List<NativeStation>>?>(null, context) {
        value = withContext(Dispatchers.IO) { runCatching { NativeStationCatalog.read(context) } }
    }
    val stations = result?.getOrNull().orEmpty()
    val playback by NativeAudio.station.collectAsState()
    val status = playback.status
    var chosenId by rememberSaveable { mutableStateOf<String?>(null) }
    var searching by rememberSaveable { mutableStateOf(false) }
    var credits by rememberSaveable { mutableStateOf(false) }
    val chosen = stations.find { it.id == (chosenId ?: playback.id) }
    val active = stations.find { it.id == playback.id }
    val sameStation = chosen?.id == playback.id
    val canPlay = chosen?.playable == true && (!sameStation ||
        status in setOf(NativeAudioStatus.Idle, NativeAudioStatus.Paused, NativeAudioStatus.Failed))
    val canPause = sameStation && status in setOf(NativeAudioStatus.Playing, NativeAudioStatus.Interrupted)
    val control = Modifier.heightIn(min = 48.dp)
    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
        if (chosen != null) {
            Text(chosen.title, style = MaterialTheme.typography.titleMedium)
            Text(chosen.artist)
            if (chosen.description.isNotBlank()) Text(chosen.description, color = MaterialTheme.colorScheme.onSurfaceVariant)
            if (!chosen.playable) Text(stringResource(R.string.native_audio_station_unsupported))
        } else {
            Text(stringResource(if (result == null) R.string.native_audio_loading else R.string.native_audio_catalog_failed))
        }
        OutlinedButton(onClick = { searching = true }, enabled = stations.isNotEmpty(), modifier = control) {
            Text(stringResource(R.string.native_audio_search_stations))
        }
        if (chosen != null) {
            TextButton(onClick = { credits = true }, modifier = control) {
                Text(stringResource(R.string.native_audio_station_credits))
            }
        }
        if (!sameStation && active != null && status !in setOf(NativeAudioStatus.Idle, NativeAudioStatus.Failed)) {
            Text(stringResource(R.string.native_audio_station_active, active.title))
        }
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
            Button(onClick = { NativeAudio.send(context, NativeAudio.PLAY, chosen?.id) }, enabled = canPlay, modifier = control) {
                Text(stringResource(R.string.native_audio_play))
            }
        }
        OutlinedButton(
            onClick = { NativeAudio.send(context, NativeAudio.STOP_STATION) },
            enabled = status != NativeAudioStatus.Idle && status != NativeAudioStatus.Failed,
            modifier = control,
        ) {
            Text(stringResource(R.string.native_audio_stop))
        }
    }
    if (searching) StationPicker(stations, chosen?.id, onDismiss = { searching = false }) {
        chosenId = it
        searching = false
    }
    if (credits && chosen != null) StationCredits(chosen) { credits = false }
}

/** Search and inspect the bundled metadata without requesting any audio. */
@OptIn(ExperimentalComposeUiApi::class)
@Composable
private fun StationPicker(stations: List<NativeStation>, selectedId: String?, onDismiss: () -> Unit, onChoose: (String) -> Unit) {
    var query by rememberSaveable { mutableStateOf("") }
    val term = query.trim()
    val results = stations.filter { station ->
        station.title.contains(term, ignoreCase = true) || station.artist.contains(term, ignoreCase = true) ||
            station.tags.any { it.contains(term, ignoreCase = true) }
    }
    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text(stringResource(R.string.native_audio_station_catalog)) },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(8.dp), modifier = Modifier.semantics { testTagsAsResourceId = true }) {
                OutlinedTextField(
                    value = query,
                    onValueChange = { query = it.take(120) },
                    label = { Text(stringResource(R.string.native_audio_search_stations)) },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth().testTag("native_station_query"),
                )
                if (results.isEmpty()) Text(stringResource(R.string.native_audio_no_stations))
                LazyColumn(Modifier.heightIn(max = 280.dp).selectableGroup()) {
                    items(results, key = { it.id }) { station ->
                        Text(
                            station.title,
                            modifier = Modifier.fillMaxWidth().heightIn(min = 48.dp)
                                .selectable(selected = station.id == selectedId, role = Role.RadioButton, onClick = { onChoose(station.id) })
                                .padding(horizontal = 12.dp, vertical = 12.dp),
                        )
                    }
                }
            }
        },
        confirmButton = { TextButton(onClick = onDismiss) { Text(stringResource(R.string.native_audio_station_close)) } },
    )
}

@Composable
private fun StationCredits(station: NativeStation, onDismiss: () -> Unit) {
    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text(stringResource(R.string.native_audio_station_credits)) },
        text = {
            SelectionContainer {
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Text(station.creditArtist)
                    Text(station.license)
                    Text(station.sourceUrl)
                    if (station.notice.isNotBlank()) Text(station.notice)
                }
            }
        },
        confirmButton = { TextButton(onClick = onDismiss) { Text(stringResource(R.string.native_audio_station_close)) } },
    )
}
