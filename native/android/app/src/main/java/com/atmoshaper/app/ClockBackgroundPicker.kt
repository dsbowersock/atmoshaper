package com.atmoshaper.app

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.selection.selectable
import androidx.compose.foundation.selection.selectableGroup
import androidx.compose.foundation.selection.toggleable
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.RadioButton
import androidx.compose.material3.Switch
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
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.input.KeyboardCapitalization
import androidx.compose.ui.unit.dp
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

/** The picker edits a native draft. Only a catalog-enabled choice can become
 * the active display, and Cancel leaves the remembered choice untouched. */
@Composable
internal fun ClockBackgroundPicker(
    appearance: ClockAppearance,
    choices: List<ClockBackgroundChoice>,
    store: ClockAppearanceFile,
    onDismiss: () -> Unit,
    onOpenPreviousTools: () -> Unit,
    onSaved: (ClockAppearance) -> Unit,
) {
    var selectedId by rememberSaveable { mutableStateOf(appearance.selectedBackgroundId) }
    var search by rememberSaveable { mutableStateOf("") }
    var primary by rememberSaveable { mutableStateOf(appearance.firstColor) }
    var secondary by rememberSaveable { mutableStateOf(appearance.secondColor) }
    var customizing by rememberSaveable { mutableStateOf(false) }
    var motion by rememberSaveable { mutableStateOf(appearance.motion) }
    var saving by rememberSaveable { mutableStateOf(false) }
    var failed by rememberSaveable { mutableStateOf(false) }
    val selected = choices.firstOrNull { it.id == selectedId }
    val source = selected?.defaults?.let {
        if (selectedId == appearance.selectedBackgroundId && appearance.background == it.background) appearance else it
    }
    val dualColor = source?.background == ClockBackground.LavaLamp || source?.background == ClockBackground.StaticGradient
    val valid = source != null && clockHexColor.matches(primary) && (!dualColor || clockHexColor.matches(secondary))
    LaunchedEffect(saving) {
        if (saving && source != null) {
            val gradient = source.gradientColors.toMutableList()
            if (source.background == ClockBackground.StaticGradient && gradient.size >= 2) {
                gradient[0] = primary
                gradient[1] = secondary
            }
            val candidate = appearance.withBackground(source.copy(
                firstColor = primary,
                secondColor = if (dualColor) secondary else primary,
                gradientColors = gradient,
                motion = motion,
            ))
            val saved = withContext(Dispatchers.IO) { runCatching { store.save(candidate) }.getOrNull() }
            if (saved != null) onSaved(saved) else {
                failed = true
                saving = false
            }
        } else if (saving) {
            saving = false
        }
    }
    AlertDialog(
        onDismissRequest = { if (!saving) onDismiss() },
        title = { Text(stringResource(R.string.clock_background_picker_title)) },
        text = {
            val query = search.trim()
            val results = choices.filter { it.label.contains(query, ignoreCase = true) }
                .sortedByDescending { it.id == selectedId }
            LazyColumn(Modifier.selectableGroup(), verticalArrangement = Arrangement.spacedBy(6.dp)) {
                if (source == null && selectedId != ClockBackground.Neutral.key) {
                    item {
                        Text(stringResource(if (selected != null) R.string.clock_background_locked else R.string.clock_background_missing))
                        TextButton(onClick = onOpenPreviousTools, enabled = !saving) {
                            Text(stringResource(R.string.clock_background_open_previous))
                        }
                    }
                }
                item {
                    OutlinedTextField(
                        value = search,
                        onValueChange = { search = it.take(100) },
                        label = { Text(stringResource(R.string.clock_background_search)) },
                        enabled = !saving,
                        modifier = Modifier.fillMaxWidth(),
                        singleLine = true,
                    )
                }
                if (source != null) {
                    item {
                        TextButton(onClick = { customizing = !customizing }, enabled = !saving) {
                            Text(stringResource(if (customizing) R.string.clock_background_hide_controls else R.string.clock_background_customize))
                        }
                    }
                }
                if (source != null && customizing) {
                    item {
                        BackgroundColorField(
                            if (dualColor) R.string.clock_background_first_color else R.string.clock_background_color,
                            primary,
                            !saving,
                        ) { primary = it }
                    }
                    if (dualColor) {
                        item { BackgroundColorField(R.string.clock_background_second_color, secondary, !saving) { secondary = it } }
                    }
                    if (source.background == ClockBackground.LavaLamp) {
                        item {
                            Row(
                                Modifier.fillMaxWidth().heightIn(min = 48.dp)
                                    .toggleable(value = motion, enabled = !saving, role = Role.Switch) { motion = it },
                                horizontalArrangement = Arrangement.spacedBy(10.dp),
                                verticalAlignment = Alignment.CenterVertically,
                            ) {
                                Switch(checked = motion, onCheckedChange = null, enabled = !saving)
                                Text(stringResource(R.string.clock_background_motion))
                            }
                        }
                    }
                }
                if (failed) item { Text(stringResource(R.string.clock_save_failed), color = MaterialTheme.colorScheme.error) }
                if (results.isEmpty()) item { Text(stringResource(R.string.clock_background_no_matches)) }
                items(results, key = { it.id }) { choice ->
                    val active = selectedId == choice.id
                    Row(
                        Modifier.fillMaxWidth().heightIn(min = 48.dp)
                            .selectable(active, enabled = choice.canApply && !saving, role = Role.RadioButton) {
                                if (!active) {
                                    val replacement = if (choice.id == appearance.selectedBackgroundId) appearance else
                                        checkNotNull(choice.defaults)
                                    selectedId = choice.id
                                    customizing = false
                                    primary = replacement.firstColor
                                    secondary = replacement.secondColor
                                }
                            },
                        horizontalArrangement = Arrangement.spacedBy(10.dp),
                        verticalAlignment = Alignment.CenterVertically,
                    ) {
                        RadioButton(selected = active, onClick = null, enabled = choice.canApply && !saving)
                        Column(Modifier.padding(vertical = 4.dp)) {
                            Text(choice.label)
                            if (!choice.canApply) {
                                Text(stringResource(R.string.clock_background_premium), style = MaterialTheme.typography.bodySmall)
                            }
                        }
                    }
                }
            }
        },
        confirmButton = {
            TextButton(enabled = valid && !saving, onClick = { saving = true }) {
                Text(stringResource(R.string.clock_background_apply))
            }
        },
        dismissButton = {
            TextButton(enabled = !saving, onClick = onDismiss) { Text(stringResource(android.R.string.cancel)) }
        },
    )
}

@Composable
private fun BackgroundColorField(label: Int, value: String, enabled: Boolean, onChange: (String) -> Unit) {
    val title = stringResource(label)
    OutlinedTextField(
        value = value,
        onValueChange = { if (it.length <= 7) onChange(it) },
        label = { Text(title) },
        supportingText = { Text(stringResource(R.string.clock_background_color_format)) },
        enabled = enabled,
        isError = !clockHexColor.matches(value),
        singleLine = true,
        modifier = Modifier.fillMaxWidth().semantics { contentDescription = title },
        keyboardOptions = KeyboardOptions(capitalization = KeyboardCapitalization.Characters),
    )
}
