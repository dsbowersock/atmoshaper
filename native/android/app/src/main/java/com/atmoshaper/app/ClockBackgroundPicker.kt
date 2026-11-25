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
    access: ClockBackgroundAccess,
    store: ClockAppearanceFile,
    onDismiss: () -> Unit,
    onOpenPreviousTools: () -> Unit,
    onOpenAccess: () -> Unit,
    onSaved: (ClockAppearance) -> Unit,
) {
    fun styleFor(choice: ClockBackgroundChoice): ClockBackgroundStyle? =
        choice.defaults?.backgroundStyle?.takeIf { choice.canUse(access) }?.let { defaults ->
            if (choice.id == appearance.selectedBackgroundId && appearance.background == defaults.background) {
                appearance.backgroundStyle
            } else appearance.savedBackgroundStyles[choice.id] ?: defaults
        }

    var selectedId by rememberSaveable { mutableStateOf(appearance.selectedBackgroundId) }
    var search by rememberSaveable { mutableStateOf("") }
    var primaryEdit by rememberSaveable { mutableStateOf<String?>(null) }
    var secondaryEdit by rememberSaveable { mutableStateOf<String?>(null) }
    var customizing by rememberSaveable { mutableStateOf(false) }
    var motion by rememberSaveable { mutableStateOf(appearance.motion) }
    var saving by rememberSaveable { mutableStateOf(false) }
    var failed by rememberSaveable { mutableStateOf(false) }
    val selected = choices.firstOrNull { it.id == selectedId }
    val source = selected?.let(::styleFor)
    val authoredGradient = source?.takeIf { it.background == ClockBackground.StaticGradient }?.gradientColors
    val primary = primaryEdit ?: authoredGradient?.getOrNull(0) ?: source?.firstColor.orEmpty()
    val secondary = secondaryEdit ?: authoredGradient?.getOrNull(1) ?: source?.secondColor.orEmpty()
    val dualColor = source?.background == ClockBackground.LavaLamp || source?.background == ClockBackground.StaticGradient ||
        source?.background == ClockBackground.Packaged
    val valid = source != null && clockHexColor.matches(primary) && (!dualColor || clockHexColor.matches(secondary))
    LaunchedEffect(saving) {
        if (saving && source != null) {
            val id = selectedId
            // Imported gradient stops can differ from the cached two-color fields.
            // Applying a style leaves both representations intact until a color is edited.
            val gradient = authoredGradient?.mapIndexed { index, color ->
                when (index) {
                    0 -> primaryEdit ?: color
                    1 -> secondaryEdit ?: color
                    else -> color
                }
            } ?: source.gradientColors
            val candidate = source.copy(
                firstColor = primaryEdit ?: source.firstColor,
                secondColor = secondaryEdit ?: source.secondColor,
                gradientColors = gradient,
                motion = motion,
            )
            val saved = withContext(Dispatchers.IO) { runCatching { store.saveBackground(id, candidate) }.getOrNull() }
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
                        val status = when {
                            selected == null -> R.string.clock_background_missing
                            !selected.canUse(access) -> access.denialMessage()
                            else -> R.string.clock_background_renderer_failed
                        }
                        Text(stringResource(status))
                    }
                }
                item {
                    TextButton(onClick = onOpenAccess, enabled = !saving) {
                        Text(stringResource(R.string.clock_background_verify))
                    }
                }
                item {
                    TextButton(onClick = onOpenPreviousTools, enabled = !saving) {
                        Text(stringResource(R.string.clock_background_open_previous))
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
                if (source != null && selected?.customizable == true) {
                    item {
                        TextButton(onClick = { customizing = !customizing }, enabled = !saving) {
                            Text(stringResource(if (customizing) R.string.clock_background_hide_controls else R.string.clock_background_customize))
                        }
                    }
                }
                if (source != null && selected?.customizable == true && customizing) {
                    item {
                        BackgroundColorField(
                            if (dualColor) R.string.clock_background_first_color else R.string.clock_background_color,
                            primary,
                            !saving,
                        ) { primaryEdit = it }
                    }
                    if (dualColor) {
                        item { BackgroundColorField(R.string.clock_background_second_color, secondary, !saving) { secondaryEdit = it } }
                    }
                    if (source.background == ClockBackground.LavaLamp || source.background == ClockBackground.Packaged) {
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
                    val available = choice.canUse(access) && choice.defaults != null
                    Row(
                        Modifier.fillMaxWidth().heightIn(min = 48.dp)
                            .selectable(active, enabled = available && !saving, role = Role.RadioButton) {
                                if (!active) {
                                    val replacement = checkNotNull(styleFor(choice))
                                    selectedId = choice.id
                                    customizing = false
                                    primaryEdit = null
                                    secondaryEdit = null
                                    motion = replacement.motion
                                }
                            },
                        horizontalArrangement = Arrangement.spacedBy(10.dp),
                        verticalAlignment = Alignment.CenterVertically,
                    ) {
                        RadioButton(selected = active, onClick = null, enabled = available && !saving)
                        Column(Modifier.padding(vertical = 4.dp)) {
                            Text(choice.label)
                            if (!choice.guestAccess && !available) {
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
