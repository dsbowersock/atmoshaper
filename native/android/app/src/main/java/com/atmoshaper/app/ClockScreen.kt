package com.atmoshaper.app

import android.view.WindowManager
import androidx.activity.compose.BackHandler
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.tween
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.BoxWithConstraints
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.WindowInsets
import androidx.compose.foundation.layout.displayCutout
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.safeDrawing
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.layout.windowInsetsPadding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.selection.toggleable
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Checkbox
import androidx.compose.material3.FilledTonalButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Slider
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.saveable.Saver
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Shadow
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.graphics.luminance
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.clearAndSetSemantics
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.paneTitle
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.PlatformTextStyle
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.Font
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardCapitalization
import androidx.compose.ui.text.rememberTextMeasurer
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.core.view.WindowCompat
import androidx.core.view.WindowInsetsCompat
import androidx.core.view.WindowInsetsControllerCompat
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.delay
import kotlinx.coroutines.withContext
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import kotlin.math.PI
import kotlin.math.abs
import kotlin.math.cos
import kotlin.math.sin
import kotlin.math.sqrt

@OptIn(ExperimentalLayoutApi::class)
@Composable
internal fun ClockScreen(activity: HomeActivity, onClose: () -> Unit) {
    var fullscreen by rememberSaveable { mutableStateOf(false) }
    var settingsOpen by rememberSaveable { mutableStateOf(false) }
    var attempt by remember { mutableIntStateOf(0) }
    var appearance by remember { mutableStateOf<ClockAppearance?>(null) }
    var loadFailed by remember { mutableStateOf(false) }
    val store = remember(activity) { ClockAppearanceFile(activity) }

    LaunchedEffect(store, attempt) {
        loadFailed = false
        try {
            appearance = withContext(Dispatchers.IO) { store.read() }
                ?: readPackagedClockAppearance(activity)?.let { incoming ->
                    withContext(Dispatchers.IO) { store.importIfAbsent(incoming) }
                }
            loadFailed = appearance == null
        } catch (error: CancellationException) {
            throw error
        } catch (_: Exception) {
            loadFailed = true
        }
    }

    BackHandler {
        if (fullscreen) fullscreen = false else onClose()
    }
    val window = activity.window
    val darkIcons = appearance?.backdropColors()?.all { it.luminance() > 0.45f } == true
    DisposableEffect(window, darkIcons) {
        val bars = WindowCompat.getInsetsController(window, window.decorView)
        val lightStatus = bars.isAppearanceLightStatusBars
        val lightNavigation = bars.isAppearanceLightNavigationBars
        bars.isAppearanceLightStatusBars = darkIcons
        bars.isAppearanceLightNavigationBars = darkIcons
        onDispose {
            bars.isAppearanceLightStatusBars = lightStatus
            bars.isAppearanceLightNavigationBars = lightNavigation
        }
    }
    val keepAwake = appearance?.keepAwake == true
    DisposableEffect(window, keepAwake) {
        if (keepAwake) window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
        onDispose {
            if (keepAwake) window.clearFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
        }
    }
    DisposableEffect(window, fullscreen) {
        val bars = WindowCompat.getInsetsController(window, window.decorView)
        if (fullscreen) {
            bars.systemBarsBehavior = WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE
            bars.hide(WindowInsetsCompat.Type.systemBars())
        }
        onDispose {
            if (fullscreen) {
                bars.show(WindowInsetsCompat.Type.systemBars())
                bars.systemBarsBehavior = WindowInsetsControllerCompat.BEHAVIOR_DEFAULT
            }
        }
    }

    val title = stringResource(R.string.clock_title)
    Box(Modifier.fillMaxSize().background(Color(0xFF171519)).semantics { paneTitle = title }) {
        val current = appearance
        if (current != null) ClockBackdrop(current)
        val insets = if (fullscreen) WindowInsets.displayCutout else WindowInsets.safeDrawing
        Column(
            modifier = Modifier.fillMaxSize().windowInsetsPadding(insets).padding(12.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
        ) {
            FlowRow(horizontalArrangement = Arrangement.spacedBy(8.dp, Alignment.CenterHorizontally)) {
                ClockButton(R.string.clock_close, onClose)
                ClockButton(if (fullscreen) R.string.clock_exit_fullscreen else R.string.clock_fullscreen) {
                    fullscreen = !fullscreen
                }
                if (current != null && !fullscreen) {
                    ClockButton(R.string.clock_settings) { settingsOpen = true }
                }
            }
            Box(Modifier.fillMaxWidth().weight(1f), contentAlignment = Alignment.Center) {
                if (current != null) {
                    ClockReadout(current)
                } else if (loadFailed) {
                    Column(Modifier.fillMaxSize(), horizontalAlignment = Alignment.CenterHorizontally) {
                        Box(Modifier.weight(1f)) { ClockReadout(ClockAppearance.readOnly) }
                        Column(
                            modifier = Modifier.weight(1f, fill = false).verticalScroll(rememberScrollState()),
                            horizontalAlignment = Alignment.CenterHorizontally,
                        ) {
                            Text(stringResource(R.string.clock_transfer_failed), color = Color.White)
                            ClockButton(R.string.clock_retry) { attempt++ }
                        }
                    }
                } else {
                    Text(stringResource(R.string.clock_opening), color = Color.White)
                }
            }
        }
        if (settingsOpen && current != null) {
            ClockSettings(current, store, onDismiss = { settingsOpen = false }) {
                appearance = it
                settingsOpen = false
            }
        }
    }
}

@Composable
private fun ClockButton(label: Int, onClick: () -> Unit) {
    FilledTonalButton(onClick = onClick, modifier = Modifier.heightIn(min = 48.dp)) {
        Text(stringResource(label))
    }
}

@Composable
private fun ClockBackdrop(appearance: ClockAppearance) {
    val first = clockColor(appearance.firstColor)
    val second = clockColor(appearance.secondColor)
    val position = if (appearance.background == ClockBackground.LavaLamp && appearance.motion) {
        val animation = rememberInfiniteTransition(label = "Clock background")
        animation.animateFloat(0.2f, 0.8f, infiniteRepeatable(tween(14000), RepeatMode.Reverse), label = "Light position")
    } else {
        null
    }
    Canvas(Modifier.fillMaxSize()) {
        when (appearance.background) {
            ClockBackground.Neutral -> Unit
            ClockBackground.SolidColor -> drawRect(first)
            ClockBackground.StaticGradient -> {
                val colors = appearance.gradientColors.ifEmpty { listOf(appearance.firstColor, appearance.secondColor) }
                val stops = appearance.gradientStops.ifEmpty { listOf(0f, 100f) }
                val angle = appearance.gradientAngle * (PI / 180)
                val dx = sin(angle).toFloat()
                val dy = -cos(angle).toFloat()
                // CSS angles use the projection of the viewport onto the gradient axis.
                val reach = (abs(dx) * size.width + abs(dy) * size.height) / 2f
                val offset = Offset(dx * reach, dy * reach)
                val center = Offset(size.width / 2f, size.height / 2f)
                val colorStops = stops.zip(colors) { stop, color -> (stop / 100f) to clockColor(color) }
                drawRect(Brush.linearGradient(*colorStops.toTypedArray(), start = center - offset, end = center + offset))
            }
            ClockBackground.LavaLamp -> {
                drawRect(second)
                drawRect(Brush.radialGradient(
                    listOf(first, first.copy(alpha = 0f)),
                    center = Offset(size.width * (position?.value ?: 0.35f), size.height * 0.46f),
                    radius = size.maxDimension * 0.67f,
                ))
            }
        }
    }
}

private fun clockColor(value: String) = Color(android.graphics.Color.parseColor(value))

private fun ClockAppearance.backdropColors(): List<Color> = when (background) {
    ClockBackground.Neutral -> listOf(Color(0xFF171519))
    ClockBackground.SolidColor -> listOf(clockColor(firstColor))
    ClockBackground.LavaLamp -> listOf(clockColor(firstColor), clockColor(secondColor))
    ClockBackground.StaticGradient -> gradientColors.ifEmpty { listOf(firstColor, secondColor) }.map(::clockColor)
}

private fun reflectionScale(length: Float) = 0.2f + 0.12f * length
private fun reflectionOffset(length: Float) = 0.45f + 0.11f * length

/** Measure stable hour cells with each selected font. Fit to both axes so
 * digits, leading day period and controls remain visible in short windows. */
@Composable
private fun ClockReadout(appearance: ClockAppearance) {
    var now by remember { mutableStateOf(Date()) }
    LaunchedEffect(Unit) {
        while (true) {
            val time = System.currentTimeMillis()
            now = Date(time)
            delay(1000L - time % 1000L)
        }
    }
    val digital = appearance.font == ClockTypeface.Digital
    val leadingPeriod = digital && !appearance.twentyFourHour
    val pattern = if (appearance.twentyFourHour) "HH:mm" else if (leadingPeriod) "hh:mm" else "h:mm"
    val locale = if (digital) Locale.US else Locale.getDefault()
    val time = SimpleDateFormat(pattern + if (appearance.seconds) ":ss" else "", locale).format(now)
    val period = if (appearance.twentyFourHour) "" else {
        SimpleDateFormat("a", locale).format(now)
    }
    val spokenTime = if (leadingPeriod) time.removePrefix("0") else time
    val spoken = stringResource(R.string.clock_readout, if (period.isEmpty()) spokenTime else "$spokenTime $period")
    val digits = when (appearance.font) {
        ClockTypeface.Digital -> FontFamily(Font(R.font.dseg7_bold, FontWeight.Bold))
        ClockTypeface.Mono -> FontFamily.Monospace
        ClockTypeface.Sans -> FontFamily.SansSerif
        ClockTypeface.Serif -> FontFamily.Serif
    }
    val letters = FontFamily(Font(R.font.dseg14_bold, FontWeight.Bold))
    val text = if (!leadingPeriod && period.isNotEmpty()) "$time $period" else time
    val measurer = rememberTextMeasurer()
    val density = LocalDensity.current
    val style = TextStyle(fontFamily = digits, fontWeight = FontWeight.Bold, fontSize = 100.sp,
        color = clockColor(appearance.color), platformStyle = PlatformTextStyle(includeFontPadding = false),
        fontFeatureSettings = "tnum")
    val ink = style.color.luminance()
    // Keep both saved colors. Add a glyph-local outline only when the fill can
    // disappear against a backdrop, including solid white behind white digits.
    val needsOutline = appearance.backdropColors().any {
        val background = it.luminance()
        (maxOf(ink, background) + 0.05f) / (minOf(ink, background) + 0.05f) < 3f
    }
    val outline = if (needsOutline) {
        if (ink > 0.18f) Color.Black else Color.White
    } else null
    BoxWithConstraints(
        modifier = Modifier.fillMaxSize().padding(horizontal = 8.dp).clearAndSetSemantics { contentDescription = spoken },
        contentAlignment = Alignment.Center,
    ) {
        val sample = measurer.measure(text = text.replace(Regex("[0-9]"), "0"), style = style)
        val reflection = if (appearance.forwardGlow && appearance.forwardGlowStrength > 0f) {
            2f * reflectionOffset(appearance.forwardGlowLength) + reflectionScale(appearance.forwardGlowLength)
        } else 1f
        val fit = with(density) {
            (maxWidth.toPx() / sample.size.width.coerceAtLeast(1))
                .coerceAtMost(maxHeight.toPx() / (sample.size.height.coerceAtLeast(1) * reflection.coerceAtLeast(1f)))
        }
        if (fit <= 0f) return@BoxWithConstraints
        val fontSize = with(density) { (style.fontSize.toPx() * fit * 0.96f).toSp() }
        val fitted = style.copy(fontSize = fontSize)
        val rotation = if (appearance.rotation) {
            rememberInfiniteTransition(label = "Clock rotation").animateFloat(
                -appearance.rotationRange,
                appearance.rotationRange,
                infiniteRepeatable(tween((appearance.rotationDuration * 500).toInt()), RepeatMode.Reverse),
                label = "Clock yaw",
            )
        } else null
        val orientation = Modifier.graphicsLayer { rotationY = rotation?.value ?: 0f }
        if (leadingPeriod) {
            Row(modifier = orientation, verticalAlignment = Alignment.Top) {
                Box {
                    val firstDigit = time.take(1)
                    if (firstDigit == "0") {
                        Text(firstDigit, style = fitted.copy(color = Color.Transparent), softWrap = false)
                    } else {
                        ClockGlyphs(firstDigit, fitted, appearance, outline)
                    }
                    val digitWidth = with(density) { measurer.measure("0", fitted).size.width.toDp() }
                    // The day period occupies the same bounded inset as the web
                    // Clock, centered vertically beside the visible tens glyph.
                    Box(Modifier.matchParentSize(), contentAlignment = Alignment.CenterStart) {
                        Box(Modifier.width(digitWidth * 0.64f), contentAlignment = Alignment.Center) {
                            ClockGlyphs(period, fitted.copy(fontFamily = letters, fontSize = fontSize * 0.18f), appearance, outline)
                        }
                    }
                }
                ClockGlyphs(time.drop(1), fitted, appearance, outline)
            }
        } else {
            Box(orientation) { ClockGlyphs(text, fitted, appearance, outline) }
        }
    }
}

/** Paint independent layers so enabling glow never disables the drop shadow. */
@Composable
private fun ClockGlyphs(text: String, style: TextStyle, appearance: ClockAppearance, outline: Color?) {
    val density = LocalDensity.current
    fun pixels(value: Float) = with(density) { value.dp.toPx() }
    Box {
        if (appearance.forwardGlow && appearance.forwardGlowStrength > 0f) {
            val tint = style.color
            Text(
                text,
                style = style.copy(shadow = Shadow(tint, blurRadius = pixels(appearance.forwardGlowBlur))),
                modifier = Modifier.graphicsLayer {
                    // The native reflection keeps the saved stretch and blur, and
                    // stays out of the foreground glyphs' layout and semantics.
                    scaleY = -reflectionScale(appearance.forwardGlowLength)
                    translationY = size.height * reflectionOffset(appearance.forwardGlowLength)
                    alpha = 0.22f * sqrt(appearance.forwardGlowStrength)
                },
                softWrap = false,
            )
        }
        if (appearance.shadow && appearance.shadowStrength > 0f) {
            val angle = appearance.shadowDirection * (PI / 180)
            val distance = pixels(appearance.shadowDistance)
            val shadow = Shadow(
                clockColor(appearance.shadowColor).copy(alpha = appearance.shadowStrength),
                Offset(distance * cos(angle).toFloat(), distance * sin(angle).toFloat()),
                pixels(appearance.shadowFeather),
            )
            Text(text, style = style.copy(shadow = shadow), softWrap = false)
        }
        if (appearance.glow && appearance.glowStrength > 0f) {
            val glow = Shadow(
                clockColor(appearance.glowColor).copy(alpha = appearance.glowStrength),
                blurRadius = pixels(16f * appearance.glowStrength),
            )
            Text(text, style = style.copy(shadow = glow), softWrap = false)
        }
        if (outline != null) {
            val width = with(density) { style.fontSize.toPx() * 0.04f }.coerceAtLeast(1f)
            Text(text, style = style.copy(color = outline, drawStyle = Stroke(width = width)), softWrap = false)
        }
        if (appearance.stroke && appearance.strokeWidth > 0f) {
            val stroke = Stroke(width = pixels(appearance.strokeWidth * 2f))
            Text(text, style = style.copy(color = clockColor(appearance.strokeColor), drawStyle = stroke), softWrap = false)
        }
        Text(text, style = style, softWrap = false)
    }
}

@Composable
private fun ClockSettings(
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
    val validColors = colorPattern.matches(color) &&
        (!draft.glow || colorPattern.matches(glowColor)) &&
        (!draft.shadow || colorPattern.matches(shadowColor)) &&
        (!draft.stroke || colorPattern.matches(strokeColor))
    LaunchedEffect(saving) {
        if (saving) {
            val updated = draft.copy(
                color = color,
                glowColor = glowColor.takeIf(colorPattern::matches) ?: draft.glowColor,
                shadowColor = shadowColor.takeIf(colorPattern::matches) ?: draft.shadowColor,
                strokeColor = strokeColor.takeIf(colorPattern::matches) ?: draft.strokeColor,
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
                ClockTypeface.entries.forEach { option ->
                    ClockToggle(option.label, draft.font == option, !saving, Role.RadioButton) { draft = draft.copy(font = option) }
                }
                ClockColorField(R.string.clock_color, color, !saving) { color = it }
                ClockToggle(R.string.clock_keep_awake, draft.keepAwake, !saving) { draft = draft.copy(keepAwake = it) }
                ClockToggle(R.string.clock_glow, draft.glow, !saving) { draft = draft.copy(glow = it) }
                if (draft.glow) {
                    ClockColorField(R.string.clock_glow_color, glowColor, !saving) { glowColor = it }
                    ClockSlider(R.string.clock_glow_strength, draft.glowStrength, 0f..1f, !saving) { draft = draft.copy(glowStrength = it) }
                }
                ClockToggle(R.string.clock_shadow, draft.shadow, !saving) { draft = draft.copy(shadow = it) }
                if (draft.shadow) {
                    ClockColorField(R.string.clock_shadow_color, shadowColor, !saving) { shadowColor = it }
                    ClockSlider(R.string.clock_shadow_strength, draft.shadowStrength, 0f..1f, !saving) { draft = draft.copy(shadowStrength = it) }
                    ClockSlider(R.string.clock_shadow_direction, draft.shadowDirection, 0f..360f, !saving) { draft = draft.copy(shadowDirection = it) }
                    ClockSlider(R.string.clock_shadow_distance, draft.shadowDistance, 0f..32f, !saving) { draft = draft.copy(shadowDistance = it) }
                    ClockSlider(R.string.clock_shadow_feather, draft.shadowFeather, 0f..32f, !saving) { draft = draft.copy(shadowFeather = it) }
                }
                ClockToggle(R.string.clock_stroke, draft.stroke, !saving) { draft = draft.copy(stroke = it) }
                if (draft.stroke) {
                    ClockColorField(R.string.clock_stroke_color, strokeColor, !saving) { strokeColor = it }
                    ClockSlider(R.string.clock_stroke_width, draft.strokeWidth, 0f..3f, !saving) { draft = draft.copy(strokeWidth = it) }
                }
                ClockToggle(R.string.clock_rotation, draft.rotation, !saving) { draft = draft.copy(rotation = it) }
                if (draft.rotation) {
                    ClockSlider(R.string.clock_rotation_range, draft.rotationRange, 2f..20f, !saving) { draft = draft.copy(rotationRange = it) }
                    ClockSlider(R.string.clock_rotation_duration, draft.rotationDuration, 10f..120f, !saving) { draft = draft.copy(rotationDuration = it) }
                }
                ClockToggle(R.string.clock_forward_glow, draft.forwardGlow, !saving) { draft = draft.copy(forwardGlow = it) }
                if (draft.forwardGlow) {
                    ClockSlider(R.string.clock_forward_glow_strength, draft.forwardGlowStrength, 0f..1f, !saving) { draft = draft.copy(forwardGlowStrength = it) }
                    ClockSlider(R.string.clock_forward_glow_length, draft.forwardGlowLength, 0.5f..4f, !saving) { draft = draft.copy(forwardGlowLength = it) }
                    ClockSlider(R.string.clock_forward_glow_blur, draft.forwardGlowBlur, 0f..64f, !saving) { draft = draft.copy(forwardGlowBlur = it) }
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

private val colorPattern = Regex("#[a-fA-F0-9]{6}")

@Composable
private fun ClockColorField(label: Int, value: String, enabled: Boolean, onChange: (String) -> Unit) {
    OutlinedTextField(
        value = value,
        onValueChange = { if (it.length <= 7) onChange(it) },
        label = { Text(stringResource(label)) },
        enabled = enabled,
        singleLine = true,
        isError = !colorPattern.matches(value),
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
private fun ClockToggle(label: Int, checked: Boolean, enabled: Boolean, role: Role = Role.Checkbox, onChange: (Boolean) -> Unit) {
    Row(
        modifier = Modifier.fillMaxWidth().heightIn(min = 48.dp)
            .toggleable(value = checked, enabled = enabled, role = role, onValueChange = onChange),
        horizontalArrangement = Arrangement.spacedBy(10.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        if (role == Role.RadioButton) {
            androidx.compose.material3.RadioButton(selected = checked, onClick = null, enabled = enabled)
        } else {
            Checkbox(checked = checked, onCheckedChange = null, enabled = enabled)
        }
        Text(stringResource(label))
    }
}
