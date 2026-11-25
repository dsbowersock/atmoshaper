package com.atmoshaper.app

import androidx.annotation.StringRes
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.ExperimentalComposeUiApi
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalFocusManager
import androidx.compose.ui.platform.LocalSoftwareKeyboardController
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.semantics.LiveRegionMode
import androidx.compose.ui.semantics.liveRegion
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.semantics.testTagsAsResourceId
import androidx.compose.ui.unit.dp
import kotlinx.coroutines.delay
import org.json.JSONObject

private enum class DownloadState(val wire: String, @get:StringRes val label: Int) {
    Checking("checking", R.string.native_download_checking),
    Missing("missing", R.string.native_download_missing),
    Ready("ready", R.string.native_download_ready),
    Damaged("damaged", R.string.native_download_damaged),
    StorageError("storage-error", R.string.native_download_storage_error),
    DownloadError("download-error", R.string.native_download_error),
    Preparing("preparing", R.string.native_download_preparing),
    Saving("saving", R.string.native_download_saving),
    Committing("committing", R.string.native_download_committing),
    CancelRequested("cancel-requested", R.string.native_download_cancel_requested),
    Cancelled("cancelled", R.string.native_download_cancelled);

    val cancellable: Boolean get() = this == Preparing || this == Saving
    val busy: Boolean get() = cancellable || this == Committing || this == CancelRequested
}

private data class DownloadChoice(val id: String, val title: String, val ambient: NativeMixSound?)
private data class DownloadStatus(val state: DownloadState, val percent: Int = 0)

@Composable
internal fun NativeDownloads() {
    var open by remember { mutableStateOf(false) }
    OutlinedButton(onClick = { open = true }, modifier = Modifier.heightIn(min = 48.dp)) {
        Text(stringResource(R.string.native_downloads))
    }
    if (open) DownloadDialog(onDismiss = { open = false })
}

/** Keep the download transaction attached to the foreground dialog. The media
 * service runs separately and only receives verified-play UI commands. */
@OptIn(ExperimentalComposeUiApi::class)
@Composable
private fun DownloadDialog(onDismiss: () -> Unit) {
    val context = LocalContext.current
    val focus = LocalFocusManager.current
    val keyboard = LocalSoftwareKeyboardController.current
    var engine by remember { mutableStateOf<NativeDownloadEngine?>(null) }
    var attempt by remember { mutableIntStateOf(0) }
    var request by remember { mutableIntStateOf(0) }
    var catalog by remember { mutableStateOf<List<DownloadChoice>?>(null) }
    var unavailable by remember { mutableStateOf(false) }
    var selected by remember { mutableStateOf<DownloadChoice?>(null) }
    var query by remember { mutableStateOf("") }
    var status by remember { mutableStateOf(DownloadStatus(DownloadState.Checking)) }
    val control = Modifier.heightIn(min = 48.dp)
    val state = status.state
    val canDismiss = !state.busy || unavailable

    DisposableEffect(context, attempt) {
        val host = NativeDownloadEngine(context, onReport = { raw ->
            runCatching {
                val event = JSONObject(raw)
                if (event.has("catalog")) {
                    val entries = event.getJSONArray("catalog")
                    val ambient = NativeMixSound.entries.filter { it.kind == "ambient" }.associateBy { it.id }
                    catalog = (0 until entries.length()).mapNotNull { index ->
                        val row = entries.getJSONObject(index)
                        val id = row.getString("id")
                        val sound = ambient[id]
                        if (row.getString("kind") == "station" || sound != null) DownloadChoice(id, row.getString("title"), sound) else null
                    }
                } else if (event.optString("id") == selected?.id && event.optInt("request", -1) == request) {
                    val next = DownloadState.entries.find { it.wire == event.optString("state") }
                    if (next != null && !(status.state == DownloadState.CancelRequested && next.cancellable)) {
                        val total = event.optLong("total")
                        val percent = if (total > 0) (event.optLong("loaded") * 100 / total).coerceIn(0, 100).toInt() else 0
                        status = DownloadStatus(next, percent)
                    }
                }
            }.onFailure { unavailable = true }
        }, unavailable = { unavailable = true })
        engine = host
        onDispose { host.close() }
    }
    LaunchedEffect(attempt) {
        delay(10_000)
        if (catalog == null) unavailable = true
    }

    fun check(item: DownloadChoice) {
        status = DownloadStatus(DownloadState.Checking)
        engine?.status(item.id, ++request)
    }

    AlertDialog(
        onDismissRequest = { if (canDismiss) onDismiss() },
        title = { Text(stringResource(R.string.native_downloads)) },
        text = {
            Column(
                verticalArrangement = Arrangement.spacedBy(8.dp),
                modifier = Modifier.semantics { testTagsAsResourceId = true },
            ) {
                val choice = selected
                val choices = catalog
                if (unavailable) {
                    Text(stringResource(R.string.native_download_unavailable))
                    OutlinedButton(onClick = {
                        unavailable = false
                        selected = null
                        catalog = null
                        status = DownloadStatus(DownloadState.Checking)
                        attempt++
                    }, modifier = control) { Text(stringResource(R.string.native_download_retry)) }
                } else if (choices == null) {
                    Text(stringResource(R.string.native_audio_loading))
                } else if (choice == null) {
                    OutlinedTextField(
                        value = query,
                        onValueChange = { query = it.take(120) },
                        label = { Text(stringResource(R.string.native_download_search)) },
                        singleLine = true,
                        modifier = Modifier.fillMaxWidth().testTag("native_download_query"),
                    )
                    val matches = choices.filter { it.title.contains(query.trim(), ignoreCase = true) }
                    if (matches.isEmpty()) Text(stringResource(R.string.native_download_no_results))
                    LazyColumn(Modifier.heightIn(max = 250.dp)) {
                        items(matches, key = { it.id }) { item ->
                            TextButton(
                                onClick = {
                                    focus.clearFocus()
                                    keyboard?.hide()
                                    selected = item
                                    check(item)
                                },
                                modifier = control.fillMaxWidth().testTag("native_download_${item.id}"),
                            ) { Text(item.title) }
                        }
                    }
                    Text(stringResource(R.string.native_download_more_sounds))
                } else {
                    Text(choice.title)
                    Text(
                        if (state == DownloadState.Saving) stringResource(state.label, status.percent) else stringResource(state.label),
                        modifier = Modifier.semantics { liveRegion = LiveRegionMode.Polite },
                    )
                    if (state == DownloadState.Saving) LinearProgressIndicator(progress = { status.percent / 100f })
                    if (state.cancellable) {
                        OutlinedButton(onClick = {
                            status = DownloadStatus(DownloadState.CancelRequested)
                            engine?.cancel()
                        }, modifier = control) { Text(stringResource(R.string.native_download_cancel)) }
                    } else if (state == DownloadState.Ready) {
                        DownloadPlayback(choice)
                    } else if (state == DownloadState.StorageError) {
                        OutlinedButton(onClick = { check(choice) }, modifier = control) {
                            Text(stringResource(R.string.native_download_recheck))
                        }
                    } else if (!state.busy && state != DownloadState.Checking) {
                        Button(onClick = {
                            status = DownloadStatus(DownloadState.Preparing)
                            engine?.download(choice.id, ++request)
                        }, modifier = control) {
                            Text(stringResource(if (state == DownloadState.Missing) R.string.native_download_save else R.string.native_download_retry))
                        }
                    }
                }
            }
        },
        dismissButton = {
            if (selected != null && canDismiss && !unavailable) {
                TextButton(onClick = { selected = null }, modifier = control) {
                    Text(stringResource(R.string.native_download_back))
                }
            }
        },
        confirmButton = {
            TextButton(onClick = onDismiss, enabled = canDismiss, modifier = control) {
                Text(stringResource(R.string.native_audio_station_close))
            }
        },
    )
}

@Composable
private fun DownloadPlayback(choice: DownloadChoice) {
    val context = LocalContext.current
    val station by NativeAudio.station.collectAsState()
    val layers by NativeAudio.layers.collectAsState()
    val transport by NativeAudio.status.collectAsState()
    val ambient = choice.ambient
    val layer = ambient?.let(layers::get)
    val status = if (ambient == null) station.takeIf { it.id == choice.id }?.status else when (layer?.phase) {
        NativeMixPhase.Loading, NativeMixPhase.Stopping -> NativeAudioStatus.Loading
        NativeMixPhase.Playing -> transport
        NativeMixPhase.Failed -> NativeAudioStatus.Failed
        null -> null
    }
    val playing = status != null && status != NativeAudioStatus.Idle && status != NativeAudioStatus.Failed
    if (status != null && status != NativeAudioStatus.Idle) {
        Text(
            stringResource(if (status == NativeAudioStatus.Failed) R.string.native_download_play_failed else status.label),
            modifier = Modifier.semantics { liveRegion = LiveRegionMode.Polite },
        )
    }
    Button(
        onClick = {
            if (ambient == null) {
                NativeAudio.send(context, if (playing) NativeAudio.STOP_STATION else NativeAudio.PLAY, choice.id, savedOnly = true)
            } else {
                NativeAudio.sendLayer(context, if (playing) NativeAudio.STOP_LAYER else NativeAudio.PLAY_LAYER, ambient, savedOnly = true)
            }
        },
        enabled = playing || transport != NativeAudioStatus.Interrupted,
        modifier = Modifier.heightIn(min = 48.dp),
    ) { Text(stringResource(if (playing) R.string.native_audio_stop else R.string.native_download_play)) }
}
