package com.atmoshaper.app

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.selection.selectable
import androidx.compose.foundation.selection.selectableGroup
import androidx.compose.foundation.selection.toggleable
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Checkbox
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.RadioButton
import androidx.compose.material3.Slider
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.saveable.Saver
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.input.KeyboardCapitalization
import androidx.compose.ui.unit.dp
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

/** Save one validated appearance after confirmation, keeping unsaved edits local to the dialog. */
@Composable
internal fun ClockSettings(
    appearance: ClockAppearance,
    store: ClockAppearanceFile,
    onDismiss: () -> Unit,
    onSaved: (ClockAppearance) -> Unit,
) {
    val appearanceSaver = remember { Saver<ClockAppearance, String>(save = { it.encode() }, restore = { ClockAppearance.decode(it) }) }
    var draft by rememberSaveable(stateSaver = appearanceSaver) { mutableStateOf(appearance) }
    var color by rememberSaveable { mutableStateOf(appearance.color) }
    var glowColor by rememberSaveable { mutableStateOf(appearance.glowColor) }
    var shadowColor by rememberSaveable { mutableStateOf(appearance.shadowColor) }
    var strokeColor by rememberSaveable { mutableStateOf(appearance.strokeColor) }
    var saving by rememberSaveable { mutableStateOf(false) }
    var failed by remember { mutableStateOf(false) }
    val validColors = clockHexColor.matches(color) &&
        (!draft.glow || clockHexColor.matches(glowColor)) &&
        (!draft.shadow || clockHexColor.matches(shadowColor)) &&
        (!draft.stroke || clockHexColor.matches(strokeColor))
    LaunchedEffect(saving) {
        if (saving) {
            val updated = draft.copy(
                color = color,
                glowColor = glowColor.takeIf(clockHexColor::matches) ?: draft.glowColor,
                shadowColor = shadowColor.takeIf(clockHexColor::matches) ?: draft.shadowColor,
                strokeColor = strokeColor.takeIf(clockHexColor::matches) ?: draft.strokeColor,
            )
            val saved = withContext(Dispatchers.IO) { runCatching { store.save(updated) }.getOrNull() }
            if (saved != null) onSaved(saved) else {
                failed = true
                saving = false
            }
        }
    }
    AlertDialog(
        onDismissRequest = { if (!saving) onDismiss() },
        title = { Text(stringResource(R.string.clock_settings)) },
        text = {
            Column(Modifier.verticalScroll(rememberScrollState())) {
                ClockToggle(R.string.clock_time_format, draft.twentyFourHour, !saving) { draft = draft.copy(twentyFourHour = it) }
                ClockToggle(R.string.clock_seconds, draft.seconds, !saving) { draft = draft.copy(seconds = it) }
                Text(stringResource(R.string.clock_font), style = MaterialTheme.typography.titleMedium)
                Column(Modifier.selectableGroup()) {
                    ClockTypeface.entries.forEach { option ->
                        val selected = draft.font == option
                        Row(
                            modifier = Modifier.fillMaxWidth().heightIn(min = 48.dp).selectable(
                                selected = selected, enabled = !saving, role = Role.RadioButton,
                                onClick = { draft = draft.copy(font = option) },
                            ),
                            horizontalArrangement = Arrangement.spacedBy(10.dp),
                            verticalAlignment = Alignment.CenterVertically,
                        ) {
                            RadioButton(selected = selected, onClick = null, enabled = !saving)
                            Text(stringResource(option.label))
                        }
                    }
                }
                ClockColorField(R.string.clock_color, color, !saving) { color = it }
                ClockToggle(R.string.clock_keep_awake, draft.keepAwake, !saving) { draft = draft.copy(keepAwake = it) }
                ClockToggle(R.string.clock_glow, draft.glow, !saving) { draft = draft.copy(glow = it) }
                if (draft.glow) {
                    ClockColorField(R.string.clock_glow_color, glowColor, !saving) { glowColor = it }
                    ClockSlider(R.string.clock_glow_strength, draft.glowStrength, ClockEffectRange.strength, !saving) { draft = draft.copy(glowStrength = it) }
                }
                ClockToggle(R.string.clock_shadow, draft.shadow, !saving) { draft = draft.copy(shadow = it) }
                if (draft.shadow) {
                    ClockColorField(R.string.clock_shadow_color, shadowColor, !saving) { shadowColor = it }
                    ClockSlider(R.string.clock_shadow_strength, draft.shadowStrength, ClockEffectRange.strength, !saving) { draft = draft.copy(shadowStrength = it) }
                    ClockSlider(R.string.clock_shadow_direction, draft.shadowDirection, ClockEffectRange.shadowDirection, !saving) { draft = draft.copy(shadowDirection = it) }
                    ClockSlider(R.string.clock_shadow_distance, draft.shadowDistance, ClockEffectRange.shadowDistance, !saving) { draft = draft.copy(shadowDistance = it) }
                    ClockSlider(R.string.clock_shadow_feather, draft.shadowFeather, ClockEffectRange.shadowFeather, !saving) { draft = draft.copy(shadowFeather = it) }
                }
                ClockToggle(R.string.clock_stroke, draft.stroke, !saving) { draft = draft.copy(stroke = it) }
                if (draft.stroke) {
                    ClockColorField(R.string.clock_stroke_color, strokeColor, !saving) { strokeColor = it }
                    ClockSlider(R.string.clock_stroke_width, draft.strokeWidth, ClockEffectRange.strokeWidth, !saving) { draft = draft.copy(strokeWidth = it) }
                }
                ClockToggle(R.string.clock_rotation, draft.rotation, !saving) { draft = draft.copy(rotation = it) }
                if (draft.rotation) {
                    ClockSlider(R.string.clock_rotation_range, draft.rotationRange, ClockEffectRange.rotationRange, !saving) { draft = draft.copy(rotationRange = it) }
                    ClockSlider(R.string.clock_rotation_duration, draft.rotationDuration, ClockEffectRange.rotationDuration, !saving) { draft = draft.copy(rotationDuration = it) }
                }
                ClockToggle(R.string.clock_forward_glow, draft.forwardGlow, !saving) { draft = draft.copy(forwardGlow = it) }
                if (draft.forwardGlow) {
                    ClockSlider(R.string.clock_forward_glow_strength, draft.forwardGlowStrength, ClockEffectRange.strength, !saving) { draft = draft.copy(forwardGlowStrength = it) }
                    ClockSlider(R.string.clock_forward_glow_length, draft.forwardGlowLength, ClockEffectRange.forwardGlowLength, !saving) { draft = draft.copy(forwardGlowLength = it) }
                    ClockSlider(R.string.clock_forward_glow_blur, draft.forwardGlowBlur, ClockEffectRange.forwardGlowBlur, !saving) { draft = draft.copy(forwardGlowBlur = it) }
                }
                if (failed) Text(stringResource(R.string.clock_save_failed), color = MaterialTheme.colorScheme.error)
            }
        },
        confirmButton = {
            TextButton(onClick = { saving = true }, enabled = validColors && !saving) { Text(stringResource(R.string.clock_done)) }
        },
        dismissButton = {
            TextButton(onClick = onDismiss, enabled = !saving) { Text(stringResource(android.R.string.cancel)) }
        },
    )
}

@Composable
private fun ClockColorField(label: Int, value: String, enabled: Boolean, onChange: (String) -> Unit) {
    OutlinedTextField(
        value = value,
        onValueChange = { if (it.length <= 7) onChange(it) },
        label = { Text(stringResource(label)) },
        enabled = enabled,
        singleLine = true,
        isError = !clockHexColor.matches(value),
        keyboardOptions = KeyboardOptions(capitalization = KeyboardCapitalization.Characters),
    )
}

@Composable
private fun ClockSlider(label: Int, value: Float, range: ClosedFloatingPointRange<Float>, enabled: Boolean, onChange: (Float) -> Unit) {
    val title = stringResource(label)
    Text(title)
    Slider(
        value = value,
        onValueChange = onChange,
        valueRange = range,
        enabled = enabled,
        modifier = Modifier.semantics { contentDescription = title },
    )
}

@Composable
private fun ClockToggle(label: Int, checked: Boolean, enabled: Boolean, onChange: (Boolean) -> Unit) {
    Row(
        modifier = Modifier.fillMaxWidth().heightIn(min = 48.dp)
            .toggleable(value = checked, enabled = enabled, role = Role.Checkbox, onValueChange = onChange),
        horizontalArrangement = Arrangement.spacedBy(10.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Checkbox(checked = checked, onCheckedChange = null, enabled = enabled)
        Text(stringResource(label))
    }
}
