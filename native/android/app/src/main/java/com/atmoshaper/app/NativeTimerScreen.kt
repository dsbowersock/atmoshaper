package com.atmoshaper.app

import androidx.activity.compose.BackHandler
import androidx.annotation.StringRes
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.WindowInsets
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.imePadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.safeDrawing
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.layout.windowInsetsPadding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.selection.toggleable
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Button
import androidx.compose.material3.Checkbox
import androidx.compose.material3.DropdownMenu
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Slider
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.res.pluralStringResource
import androidx.compose.ui.semantics.LiveRegionMode
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.heading
import androidx.compose.ui.semantics.liveRegion
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.font.Font
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import java.util.Locale
import kotlin.math.roundToInt

@Composable
internal fun NativeTimerScreen(
    snapshot: TimerSnapshot?,
    now: Long,
    busy: Boolean,
    @StringRes error: Int?,
    flash: Boolean,
    onClose: () -> Unit,
    onRetry: () -> Unit,
    onSetupChange: (TimerSetup) -> Unit,
    onChange: (TimerCommand) -> Unit,
) {
    val colors = MaterialTheme.colorScheme
    Surface(
        color = if (flash) colors.secondaryContainer else colors.background,
        contentColor = if (flash) colors.onSecondaryContainer else colors.onBackground,
        modifier = Modifier.fillMaxSize(),
    ) {
        Column(
            Modifier.fillMaxSize().windowInsetsPadding(WindowInsets.safeDrawing).imePadding(),
            horizontalAlignment = Alignment.CenterHorizontally,
        ) {
            Column(
                Modifier.widthIn(max = 600.dp).fillMaxWidth().verticalScroll(rememberScrollState()).padding(20.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp),
            ) {
                TextButton(onClick = onClose, modifier = Modifier.heightIn(min = 48.dp)) {
                    Text(stringResource(R.string.timer_close))
                }
                Text(stringResource(R.string.timer_title), style = MaterialTheme.typography.headlineMedium,
                    modifier = Modifier.semantics { heading() })
                if (error != null) {
                    Text(stringResource(error), modifier = Modifier.semantics { liveRegion = LiveRegionMode.Polite })
                    Button(onClick = onRetry, enabled = !busy) { Text(stringResource(R.string.timer_retry)) }
                } else if (snapshot == null) {
                    Text(stringResource(R.string.timer_loading))
                } else {
                    Text(stringResource(R.string.timer_foreground), style = MaterialTheme.typography.bodySmall)
                    when (snapshot.phase) {
                        TimerPhase.Ready -> TimerSetupForm(snapshot, !busy, onSetupChange) { choices ->
                            onChange { state, time -> TimerAdvance(state.start(choices, time)) }
                        }
                        TimerPhase.Running, TimerPhase.Paused -> ActiveTimer(snapshot, now, !busy, onChange)
                        TimerPhase.Complete -> {
                            TimerStatus(R.string.timer_complete)
                            TextButton(onClick = { onChange { state, _ -> TimerAdvance(state.end()) } }, enabled = !busy) {
                                Text(stringResource(R.string.timer_again))
                            }
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun TimerSetupForm(
    snapshot: TimerSnapshot, enabled: Boolean, onSetupChange: (TimerSetup) -> Unit, onStart: (TimerSetup) -> Unit,
) {
    val setup = snapshot.setup
    var hours by rememberSaveable { mutableStateOf(setup.hours.toString()) }
    var minutes by rememberSaveable { mutableStateOf(setup.minutes.toString()) }
    var interval by rememberSaveable { mutableStateOf(setup.interval) }
    var intervalMinutes by rememberSaveable { mutableStateOf(setup.intervalMinutes.toString()) }
    var areas by rememberSaveable { mutableStateOf(setup.areas.toString()) }
    var cue by rememberSaveable { mutableStateOf(setup.cue) }
    var volume by rememberSaveable { mutableStateOf(setup.volume) }
    var haptics by rememberSaveable { mutableStateOf(setup.vibrationMs.toFloat()) }
    var keepAwake by rememberSaveable { mutableStateOf(setup.keepAwake) }
    var showSeconds by rememberSaveable { mutableStateOf(setup.showSeconds) }

    fun validChoices(): TimerSetup? {
        val validHours = hours.numberIn(TimerSetupBounds.hours) ?: return null
        val validMinutes = minutes.numberIn(TimerSetupBounds.minutes) ?: return null
        val validInterval = intervalMinutes.numberIn(TimerSetupBounds.intervalMinutes)
        val validAreas = areas.numberIn(TimerSetupBounds.areas)
        if (interval == TimerInterval.Custom && validInterval == null || interval == TimerInterval.Areas && validAreas == null) {
            return null
        }
        return TimerSetup(validHours, validMinutes, interval, validInterval ?: setup.intervalMinutes, validAreas ?: setup.areas,
            cue, volume, haptics.roundToInt(), keepAwake, showSeconds)
    }
    // Submit within the input event so a Back or Close immediately afterward
    // can wait for this edit even if Compose has not drawn the next frame.
    fun edit(change: () -> Unit) {
        change()
        validChoices()?.let(onSetupChange)
    }
    LaunchedEffect(Unit) { validChoices()?.let(onSetupChange) }

    if (snapshot.savedSetups.isNotEmpty()) {
        TimerDropdown(stringResource(R.string.timer_saved_setups), null, snapshot.savedSetups, enabled,
            { it.name ?: stringResource(R.string.timer_last_packaged_setup) }) { saved ->
            edit {
                val choices = saved.setup
                hours = choices.hours.toString()
                minutes = choices.minutes.toString()
                interval = choices.interval
                intervalMinutes = choices.intervalMinutes.toString()
                areas = choices.areas.toString()
                cue = choices.cue
                volume = choices.volume
                haptics = choices.vibrationMs.toFloat()
            }
        }
    }
    NumberInput(R.string.timer_hours, hours, TimerSetupBounds.hours, enabled) { edit { hours = it } }
    NumberInput(R.string.timer_minutes, minutes, TimerSetupBounds.minutes, enabled) { edit { minutes = it } }
    TimerMenu(R.string.timer_interval, interval, TimerInterval.entries, enabled, TimerInterval::label) { choice ->
        edit {
            if (choice == TimerInterval.Preset && (intervalMinutes.toIntOrNull() ?: 0) !in presets) intervalMinutes = "15"
            interval = choice
        }
    }
    when (interval) {
        TimerInterval.None -> Unit
        TimerInterval.Preset -> {
            val selected = intervalMinutes.toIntOrNull() ?: 15
            TimerDropdown(
                stringResource(R.string.timer_preset), pluralStringResource(R.plurals.timer_minute_choice, selected, selected),
                (presets + selected).distinct().sorted(), enabled,
                { pluralStringResource(R.plurals.timer_minute_choice, it, it) }, { edit { intervalMinutes = it.toString() } },
            )
        }
        TimerInterval.Custom -> NumberInput(R.string.timer_custom_minutes, intervalMinutes, TimerSetupBounds.intervalMinutes, enabled) { edit { intervalMinutes = it } }
        TimerInterval.Areas -> NumberInput(R.string.timer_areas, areas, TimerSetupBounds.areas, enabled) { edit { areas = it } }
    }
    TimerMenu(R.string.timer_cue, cue, TimerCue.entries, enabled, TimerCue::label) { edit { cue = it } }
    if (cue.sound) {
        val label = stringResource(R.string.timer_volume_label)
        Text(stringResource(R.string.timer_volume, (volume * 100).roundToInt()))
        Slider(value = volume.toFloat(), onValueChange = { edit { volume = (it * 100).roundToInt() / 100.0 } }, enabled = enabled, steps = 19,
            modifier = Modifier.semantics { contentDescription = label })
    }
    if (cue.vibration) {
        val label = stringResource(R.string.timer_vibration_label)
        Text(stringResource(R.string.timer_vibration, haptics.roundToInt()))
        val range = TimerSetupBounds.vibrationMs
        Slider(value = haptics, onValueChange = { edit { haptics = it } }, enabled = enabled,
            valueRange = range.first.toFloat()..range.last.toFloat(), steps = range.last - range.first - 1,
            modifier = Modifier.semantics { contentDescription = label })
    }
    TimerCheckbox(R.string.timer_keep_awake, keepAwake, enabled) { edit { keepAwake = it } }
    TimerCheckbox(R.string.timer_show_seconds, showSeconds, enabled) { edit { showSeconds = it } }

    val choices = validChoices()
    Button(
        enabled = enabled && choices != null && choices.durationMs > 0,
        onClick = { validChoices()?.let(onStart) },
    ) { Text(stringResource(R.string.timer_start)) }
}

@Composable
private fun ActiveTimer(
    snapshot: TimerSnapshot,
    now: Long,
    enabled: Boolean,
    onChange: (TimerCommand) -> Unit,
) {
    var adjust by rememberSaveable { mutableStateOf(false) }
    val running = snapshot.phase == TimerPhase.Running
    val remaining = snapshot.remainingAt(now)
    TimerStatus(if (running) R.string.timer_running else R.string.timer_paused)
    Text(
        formatTimer(remaining, snapshot.setup.showSeconds),
        style = MaterialTheme.typography.headlineMedium.copy(fontFamily = FontFamily(Font(R.font.dseg7_bold))),
    )
    if (adjust) {
        BackHandler { adjust = false }
        TimerAdjustment(snapshot, remaining, enabled, { adjust = false }) { change ->
            adjust = false
            onChange(change)
        }
    } else {
        Button(onClick = { onChange { state, time -> TimerAdvance(if (running) state.pause(time) else state.resume(time)) } }, enabled = enabled) {
            Text(stringResource(if (running) R.string.timer_pause else R.string.timer_resume))
        }
        OutlinedButton(onClick = { adjust = true }, enabled = enabled) { Text(stringResource(R.string.timer_adjust)) }
        TextButton(onClick = { onChange { state, _ -> TimerAdvance(state.end()) } }, enabled = enabled) {
            Text(stringResource(R.string.timer_end))
        }
    }
}

@Composable
private fun TimerAdjustment(
    snapshot: TimerSnapshot,
    remaining: Long,
    enabled: Boolean,
    onClose: () -> Unit,
    onApply: (TimerCommand) -> Unit,
) {
    val totalMinutes = remaining / TIMER_MINUTE_MS
    var hours by rememberSaveable { mutableStateOf((totalMinutes / 60).toString()) }
    var minutes by rememberSaveable { mutableStateOf((totalMinutes % 60).toString()) }
    val intervalRange = TimerSetupBounds.activeIntervalMinutes
    var interval by rememberSaveable {
        mutableStateOf((snapshot.intervalMs?.div(TIMER_MINUTE_MS) ?: 0).coerceAtMost(intervalRange.last.toLong()).toString())
    }
    var durationEdited by rememberSaveable { mutableStateOf(false) }
    var intervalEdited by rememberSaveable { mutableStateOf(false) }
    val validHours = hours.numberIn(TimerSetupBounds.hours)
    val validMinutes = minutes.numberIn(TimerSetupBounds.minutes)
    val validInterval = interval.numberIn(intervalRange)
    // Keep adjustment inside the timer window so that it continues to own
    // foreground cues while the user is reading or editing these controls.
    Text(stringResource(R.string.timer_adjust), style = MaterialTheme.typography.titleMedium,
        modifier = Modifier.semantics { heading() })
    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
        OutlinedButton(onClick = { onApply { state, time -> state.adjust(-TIMER_MINUTE_MS, time) } }, enabled = enabled) {
            Text(stringResource(R.string.timer_remove_minute))
        }
        OutlinedButton(onClick = { onApply { state, time -> state.adjust(TIMER_MINUTE_MS, time) } }, enabled = enabled) {
            Text(stringResource(R.string.timer_add_minute))
        }
    }
    NumberInput(R.string.timer_remaining_hours, hours, TimerSetupBounds.hours, enabled) { hours = it; durationEdited = true }
    NumberInput(R.string.timer_remaining_minutes, minutes, TimerSetupBounds.minutes, enabled) { minutes = it; durationEdited = true }
    NumberInput(R.string.timer_active_interval, interval, intervalRange, enabled) { interval = it; intervalEdited = true }
    Text(stringResource(R.string.timer_zero_interval), style = MaterialTheme.typography.bodySmall)
    val valid = (!durationEdited || validHours != null && validMinutes != null) && (!intervalEdited || validInterval != null)
    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
        Button(enabled = enabled && valid && (durationEdited || intervalEdited), onClick = {
            val duration = if (durationEdited) (checkNotNull(validHours) * 60 + checkNotNull(validMinutes)) * TIMER_MINUTE_MS else null
            val intervalMinutes = validInterval?.takeIf { it > 0 }
            onApply { state, time ->
                val change = if (duration != null) state.setRemaining(duration, time) else TimerAdvance(state)
                if (intervalEdited && change.snapshot.phase != TimerPhase.Complete) {
                    change.snapshot.setInterval(intervalMinutes, time)
                } else change
            }
        }) { Text(stringResource(R.string.timer_apply)) }
        TextButton(onClick = onClose) { Text(stringResource(R.string.timer_cancel)) }
    }
}

@Composable
private fun TimerStatus(@StringRes label: Int) {
    Text(stringResource(label), style = MaterialTheme.typography.titleLarge,
        modifier = Modifier.semantics { liveRegion = LiveRegionMode.Polite })
}

@Composable
private fun NumberInput(@StringRes label: Int, value: String, range: IntRange, enabled: Boolean, onChange: (String) -> Unit) {
    OutlinedTextField(
        value = value,
        onValueChange = { if (it.length <= 3 && it.all { digit -> digit in '0'..'9' }) onChange(it) },
        label = { Text(stringResource(label)) },
        isError = value.numberIn(range) == null,
        supportingText = if (value.numberIn(range) == null) {
            { Text(stringResource(R.string.timer_number_range, range.first, range.last)) }
        } else null,
        enabled = enabled,
        singleLine = true,
        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
        modifier = Modifier.fillMaxWidth(),
    )
}

@Composable
private fun TimerCheckbox(@StringRes label: Int, checked: Boolean, enabled: Boolean, onToggle: (Boolean) -> Unit) {
    Row(
        modifier = Modifier.fillMaxWidth().heightIn(min = 48.dp)
            .toggleable(checked, enabled = enabled, role = Role.Checkbox, onValueChange = onToggle),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        Checkbox(checked = checked, onCheckedChange = null, enabled = enabled)
        Text(stringResource(label))
    }
}

@Composable
private fun <T> TimerMenu(
    @StringRes label: Int, selected: T, choices: List<T>, enabled: Boolean,
    name: (T) -> Int, onChange: (T) -> Unit,
) = TimerDropdown(stringResource(label), stringResource(name(selected)), choices, enabled, { stringResource(name(it)) }, onChange)

@Composable
private fun <T> TimerDropdown(
    label: String, selected: String?, choices: List<T>, enabled: Boolean,
    name: @Composable (T) -> String, onChange: (T) -> Unit,
) {
    var expanded by rememberSaveable { mutableStateOf(false) }
    Box {
        OutlinedButton(onClick = { expanded = true }, enabled = enabled) {
            Text(if (selected == null) label else stringResource(R.string.timer_choice, label, selected))
        }
        DropdownMenu(expanded = expanded && enabled, onDismissRequest = { expanded = false }) {
            choices.forEach { choice ->
                DropdownMenuItem(text = { Text(name(choice)) }, onClick = { expanded = false; onChange(choice) })
            }
        }
    }
}

private fun String.numberIn(range: IntRange) = toIntOrNull()?.takeIf { it in range }

private fun formatTimer(remainingMs: Long, showSeconds: Boolean): String {
    val seconds = (remainingMs + 999) / 1_000
    val hours = seconds / 3_600
    val minutes = seconds / 60 % 60
    return if (showSeconds) String.format(Locale.ROOT, "%02d:%02d:%02d", hours, minutes, seconds % 60)
    else String.format(Locale.ROOT, "%02d:%02d", hours, minutes)
}

private val presets = listOf(1, 5, 10, 15, 30)

private val TimerInterval.label get() = when (this) {
    TimerInterval.None -> R.string.timer_no_interval
    TimerInterval.Preset -> R.string.timer_preset
    TimerInterval.Custom -> R.string.timer_custom_minutes
    TimerInterval.Areas -> R.string.timer_areas
}

private val TimerCue.label get() = when (this) {
    TimerCue.Chime -> R.string.timer_chime
    TimerCue.Flash -> R.string.timer_flash
    TimerCue.ChimeFlash -> R.string.timer_chime_flash
    TimerCue.Vibration -> R.string.timer_vibration_only
    TimerCue.ChimeVibration -> R.string.timer_chime_vibration
    TimerCue.FlashVibration -> R.string.timer_flash_vibration
    TimerCue.All -> R.string.timer_all_cues
    TimerCue.Silent -> R.string.timer_silent
}
