package com.atmoshaper.app

import android.content.Intent
import android.net.Uri
import android.os.Build
import android.view.Window
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
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.WindowInsets
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.navigationBars
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.safeDrawing
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.statusBars
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.layout.windowInsetsPadding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.FilledTonalButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Shadow
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.graphics.luminance
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.platform.LocalLayoutDirection
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.semantics.clearAndSetSemantics
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.paneTitle
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.PlatformTextStyle
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.Font
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.rememberTextMeasurer
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.LayoutDirection
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
import kotlin.math.cos
import kotlin.math.sin
import kotlin.math.sqrt

@OptIn(ExperimentalLayoutApi::class)
@Composable
internal fun ClockScreen(activity: HomeActivity, onClose: () -> Unit, onOpenTimer: () -> Unit) {
    var fullscreen by rememberSaveable { mutableStateOf(false) }
    var settingsOpen by rememberSaveable { mutableStateOf(false) }
    var backgroundsOpen by rememberSaveable { mutableStateOf(false) }
    var catalog by remember { mutableStateOf<List<ClockBackgroundChoice>?>(null) }
    var attempt by remember { mutableIntStateOf(0) }
    var appearance by remember { mutableStateOf<ClockAppearance?>(null) }
    var loadFailed by remember { mutableStateOf(false) }
    val store = remember(activity) { ClockAppearanceFile(activity) }

    LaunchedEffect(store, attempt) {
        loadFailed = false
        catalog = withContext(Dispatchers.IO) { runCatching { loadClockBackgrounds(activity) }.getOrNull() }
        try {
            val saved = withContext(Dispatchers.IO) { store.read() }
            appearance = saved
            if (saved == null || saved.needsBackgroundRecovery) {
                val incoming = readPackagedClockAppearance(activity)
                if (incoming != null) {
                    appearance = withContext(Dispatchers.IO) {
                        if (saved == null) store.importIfAbsent(incoming) else store.recoverBackgroundIfUnrecorded(incoming)
                    }
                }
            }
        } catch (error: CancellationException) {
            throw error
        } catch (_: Exception) {
            // A failed earlier-format read leaves a valid native snapshot usable.
        }
        loadFailed = appearance == null
    }

    BackHandler {
        if (fullscreen) fullscreen = false else onClose()
    }
    ClockWindowEffects(activity.window, fullscreen, appearance?.keepAwake == true)

    val title = stringResource(R.string.clock_title)
    Box(Modifier.fillMaxSize().background(clockChromeColor).semantics { paneTitle = title }) {
        val current = appearance
        val choices = catalog
        val selected = choices?.firstOrNull { it.id == current?.selectedBackgroundId }
        val shown = current?.let {
            if (selected?.defaults?.background == it.background) it else it.copy(background = ClockBackground.Neutral)
        }
        if (shown != null) ClockBackdrop(shown)
        ClockSystemBarProtection()
        Column(
            modifier = Modifier.fillMaxSize().windowInsetsPadding(WindowInsets.safeDrawing).padding(12.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
        ) {
            FlowRow(
                horizontalArrangement = Arrangement.spacedBy(8.dp, Alignment.CenterHorizontally),
                verticalArrangement = Arrangement.spacedBy(4.dp),
            ) {
                ClockCloseButton(onClose)
                ClockFullscreenButton(fullscreen) { fullscreen = !fullscreen }
                if (current != null && !fullscreen) {
                    ClockButton(R.string.clock_settings) { settingsOpen = true }
                    if (choices != null) ClockButton(R.string.clock_backgrounds) { backgroundsOpen = true }
                }
                if (!fullscreen) ClockButton(R.string.clock_open_timer, onOpenTimer)
            }
            if (!fullscreen && current != null) {
                val notice = when {
                    choices == null -> R.string.clock_background_catalog_failed
                    selected != null && !selected.canApply -> R.string.clock_background_locked
                    selected == null && current.selectedBackgroundId != ClockBackground.Neutral.key -> R.string.clock_background_missing
                    else -> null
                }
                if (notice != null) {
                    Text(
                        stringResource(notice),
                        color = Color.White,
                        modifier = Modifier.background(clockChromeColor).padding(6.dp),
                        textAlign = TextAlign.Center,
                    )
                }
            }
            Box(Modifier.fillMaxWidth().weight(1f), contentAlignment = Alignment.Center) {
                if (shown != null) {
                    ClockReadout(shown)
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
        if (backgroundsOpen && current != null && choices != null) {
            ClockBackgroundPicker(
                appearance = current,
                choices = choices,
                store = store,
                onDismiss = { backgroundsOpen = false },
                onOpenPreviousTools = {
                    // The existing packaged route retains its own verified
                    // access and opens the Backgrounds panel directly.
                    val route = Uri.Builder().scheme("atmoshaper").authority("tool")
                        .appendQueryParameter("path", "/clock?panel=background").build()
                    activity.startActivity(Intent(Intent.ACTION_VIEW, route, activity, MainActivity::class.java))
                },
                onSaved = {
                    appearance = it
                    backgroundsOpen = false
                },
            )
        }
        if (settingsOpen && current != null) {
            ClockSettings(current, store, onDismiss = { settingsOpen = false }) {
                appearance = it
                settingsOpen = false
            }
        }
    }
}

internal val clockChromeColor = Color(0xFF171519)
private val clockNavigationColor = Color(0xFFF9F7F5)

/** Clock owns the temporary window flags only while its screen is composed. */
@Composable
private fun ClockWindowEffects(window: Window, fullscreen: Boolean, keepAwake: Boolean) {
    DisposableEffect(window) {
        val bars = WindowCompat.getInsetsController(window, window.decorView)
        val previousStatus = bars.isAppearanceLightStatusBars
        val previousNavigation = bars.isAppearanceLightNavigationBars
        val previousNavContrast = if (Build.VERSION.SDK_INT >= 29) window.isNavigationBarContrastEnforced else false
        bars.isAppearanceLightStatusBars = false
        bars.isAppearanceLightNavigationBars = true
        if (Build.VERSION.SDK_INT >= 29) window.isNavigationBarContrastEnforced = false
        onDispose {
            bars.isAppearanceLightStatusBars = previousStatus
            bars.isAppearanceLightNavigationBars = previousNavigation
            if (Build.VERSION.SDK_INT >= 29) window.isNavigationBarContrastEnforced = previousNavContrast
        }
    }
    DisposableEffect(window, keepAwake) {
        if (keepAwake) window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
        onDispose {
            if (keepAwake) window.clearFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
        }
    }
    DisposableEffect(window, fullscreen) {
        val bars = WindowCompat.getInsetsController(window, window.decorView)
        val previousBehavior = bars.systemBarsBehavior
        if (fullscreen) {
            // Transient overlays keep the app's insets hidden. Use standard
            // reveal so the bar bands can paint before the icons are used.
            bars.systemBarsBehavior = WindowInsetsControllerCompat.BEHAVIOR_DEFAULT
            bars.hide(WindowInsetsCompat.Type.systemBars())
        }
        onDispose {
            if (fullscreen) {
                bars.show(WindowInsetsCompat.Type.systemBars())
                bars.systemBarsBehavior = previousBehavior
            }
        }
    }
}

/** Protect visible bars, including a swipe reveal, without reserving bands
 * while the device is actually in immersive mode. */
@Composable
private fun ClockSystemBarProtection() {
    val status = WindowInsets.statusBars
    val navigation = WindowInsets.navigationBars
    Canvas(Modifier.fillMaxSize()) {
        val top = status.getTop(this).toFloat()
        val bottom = navigation.getBottom(this).toFloat()
        val left = navigation.getLeft(this, layoutDirection).toFloat()
        val right = navigation.getRight(this, layoutDirection).toFloat()
        drawRect(clockChromeColor, size = Size(size.width, top))
        // Pair Android's dark navigation icons with their own light surface.
        drawRect(clockNavigationColor, topLeft = Offset(0f, size.height - bottom), size = Size(size.width, bottom))
        drawRect(clockNavigationColor, size = Size(left, size.height))
        drawRect(clockNavigationColor, topLeft = Offset(size.width - right, 0f), size = Size(right, size.height))
    }
}

@Composable
private fun ClockCloseButton(onClick: () -> Unit) {
    val ink = MaterialTheme.colorScheme.onSurface
    OutlinedButton(
        onClick = onClick,
        modifier = Modifier.heightIn(min = 48.dp),
        colors = ButtonDefaults.outlinedButtonColors(
            containerColor = MaterialTheme.colorScheme.surface,
            contentColor = ink,
        ),
    ) {
        Canvas(Modifier.size(16.dp)) {
            val inset = 3.dp.toPx()
            val start = Offset(inset, inset)
            val end = Offset(size.width - inset, size.height - inset)
            val width = 2.dp.toPx()
            drawLine(ink, start, end, width, StrokeCap.Round)
            drawLine(ink, Offset(end.x, start.y), Offset(start.x, end.y), width, StrokeCap.Round)
        }
        Spacer(Modifier.width(6.dp))
        Text(stringResource(R.string.clock_close))
    }
}

@Composable
private fun ClockFullscreenButton(fullscreen: Boolean, onClick: () -> Unit) {
    val ink = MaterialTheme.colorScheme.onPrimary
    Button(
        onClick = onClick,
        modifier = Modifier.heightIn(min = 48.dp),
        elevation = ButtonDefaults.buttonElevation(defaultElevation = 3.dp),
    ) {
        Canvas(Modifier.size(16.dp)) {
            val center = size.width / 2
            val near = 2.dp.toPx()
            val corner = if (fullscreen) center - 1.dp.toPx() else near
            val extent = if (fullscreen) near else center - 1.dp.toPx()
            val opposite = size.width - corner
            val oppositeExtent = size.width - extent
            val width = 2.dp.toPx()
            drawLine(ink, Offset(extent, corner), Offset(corner, corner), width, StrokeCap.Round)
            drawLine(ink, Offset(corner, corner), Offset(corner, extent), width, StrokeCap.Round)
            drawLine(ink, Offset(oppositeExtent, opposite), Offset(opposite, opposite), width, StrokeCap.Round)
            drawLine(ink, Offset(opposite, opposite), Offset(opposite, oppositeExtent), width, StrokeCap.Round)
        }
        Spacer(Modifier.width(6.dp))
        Text(stringResource(if (fullscreen) R.string.clock_exit_fullscreen else R.string.clock_fullscreen))
    }
}

@Composable
private fun ClockButton(label: Int, onClick: () -> Unit) {
    FilledTonalButton(onClick = onClick, modifier = Modifier.heightIn(min = 48.dp)) {
        Text(stringResource(label))
    }
}

internal fun clockColor(value: String) = Color(android.graphics.Color.parseColor(value))

private fun ClockAppearance.backdropColors(): List<Color> = when (background) {
    ClockBackground.Neutral -> listOf(clockChromeColor)
    ClockBackground.SolidColor -> listOf(clockColor(firstColor))
    ClockBackground.LavaLamp -> listOf(clockColor(firstColor), clockChromeColor, clockColor(secondColor))
    ClockBackground.StaticGradient -> gradientColors.ifEmpty { listOf(firstColor, secondColor) }.map(::clockColor)
}

/** Bound each interpolated segment in RGB space. Luminance is monotonic in
 * each channel, even when its extrema lie between the gradient stops. */
internal fun clockNeedsContrastOutline(ink: Color, backdrop: List<Color>): Boolean {
    val luminance = ink.luminance()
    return backdrop.zipWithNext().ifEmpty { backdrop.map { it to it } }.any { (first, second) ->
        val dark = Color(minOf(first.red, second.red), minOf(first.green, second.green), minOf(first.blue, second.blue)).luminance()
        val light = Color(maxOf(first.red, second.red), maxOf(first.green, second.green), maxOf(first.blue, second.blue)).luminance()
        val closest = luminance.coerceIn(dark, light)
        (maxOf(luminance, closest) + 0.05f) / (minOf(luminance, closest) + 0.05f) < 4.5f
    }
}

/** Keep a small day-period glyph's segment gaps open even at maximum stroke. */
internal fun clockGlyphStrokeWidth(requested: Float, fontSize: Float, smallGlyph: Boolean): Float =
    if (smallGlyph) requested.coerceAtMost(fontSize * 0.08f) else requested

private const val clockTrailingPeriodScale = 0.22f
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
    val trailingPeriod = !leadingPeriod && period.isNotEmpty()
    val measurer = rememberTextMeasurer()
    val density = LocalDensity.current
    val style = TextStyle(fontFamily = digits, fontWeight = FontWeight.Bold, fontSize = 100.sp,
        color = clockColor(appearance.color), platformStyle = PlatformTextStyle(includeFontPadding = false),
        fontFeatureSettings = "tnum")
    val backdrop = remember(appearance) { appearance.backdropColors() }
    val visibleEdge = if (appearance.stroke && appearance.strokeWidth > 0f) clockColor(appearance.strokeColor) else style.color
    val outlines = remember(style.color, visibleEdge, backdrop) {
        if (!clockNeedsContrastOutline(style.color, backdrop) && !clockNeedsContrastOutline(visibleEdge, backdrop)) {
            emptyList()
        } else if (backdrop.all { it == backdrop.first() }) {
            listOf(clockContrastInk(backdrop.first()))
        } else {
            // Paint outer-to-inner so one of the two bands stays legible
            // along the full range of interpolated background colors.
            val inner = clockContrastInk(visibleEdge)
            listOf(if (inner == Color.Black) Color.White else Color.Black, inner)
        }
    }
    fun periodStyle(style: TextStyle, fraction: Float): TextStyle = with(density) {
        style.copy(fontSize = (style.fontSize.toPx() * fraction).toSp())
    }
    BoxWithConstraints(
        modifier = Modifier.fillMaxSize().padding(horizontal = 8.dp).clearAndSetSemantics { contentDescription = spoken },
        contentAlignment = Alignment.Center,
    ) {
        val sample = measurer.measure(text = time.map { if (it.isDigit()) '0' else it }.joinToString(""), style = style)
        val periodGap = 0.1f
        val extraWidth = if (trailingPeriod) {
            measurer.measure(period, periodStyle(style, clockTrailingPeriodScale)).size.width +
                with(density) { style.fontSize.toPx() * periodGap }
        } else 0f
        val reflection = if (appearance.forwardGlow && appearance.forwardGlowStrength > 0f) {
            2f * reflectionOffset(appearance.forwardGlowLength) + reflectionScale(appearance.forwardGlowLength)
        } else 1f
        val fit = with(density) {
            (maxWidth.toPx() / (sample.size.width + extraWidth).coerceAtLeast(1f))
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
            // DSEG uses fixed Latin digits and AM/PM. Mirror the surrounding
            // controls for RTL, while keeping this segmented readout ordered.
            CompositionLocalProvider(LocalLayoutDirection provides LayoutDirection.Ltr) {
                Row(modifier = orientation, verticalAlignment = Alignment.Top) {
                    Box {
                        val firstDigit = time.take(1)
                        if (firstDigit == "0") {
                            Text(firstDigit, style = fitted.copy(color = Color.Transparent), softWrap = false)
                        } else {
                            ClockGlyphs(firstDigit, fitted, appearance, outlines)
                        }
                        val digitWidth = with(density) { measurer.measure("0", fitted).size.width.toDp() }
                        Box(Modifier.matchParentSize(), contentAlignment = Alignment.CenterStart) {
                            Box(Modifier.width(digitWidth * 0.64f), contentAlignment = Alignment.Center) {
                                val labelStyle = periodStyle(fitted.copy(fontFamily = letters), 0.18f)
                                ClockGlyphs(period, labelStyle, appearance, outlines, smallGlyph = true)
                            }
                        }
                    }
                    ClockGlyphs(time.drop(1), fitted, appearance, outlines)
                }
            }
        } else {
            Row(modifier = orientation, verticalAlignment = Alignment.CenterVertically) {
                ClockGlyphs(time, fitted, appearance, outlines)
                if (trailingPeriod) {
                    Spacer(Modifier.width(with(density) { (fontSize.toPx() * periodGap).toDp() }))
                    ClockGlyphs(period, periodStyle(fitted, clockTrailingPeriodScale), appearance, outlines, smallGlyph = true)
                }
            }
        }
    }
}

// Black and white have equal contrast at sqrt(1.05 * 0.05) - 0.05.
private const val clockBlackWhiteContrastCrossover = 0.179129f

private fun clockContrastInk(background: Color): Color =
    if (background.luminance() > clockBlackWhiteContrastCrossover) Color.Black else Color.White

/** Paint independent layers so enabling glow never disables the drop shadow. */
@Composable
private fun ClockGlyphs(text: String, style: TextStyle, appearance: ClockAppearance, outlines: List<Color>, smallGlyph: Boolean = false) {
    val density = LocalDensity.current
    fun pixels(value: Float) = with(density) { value.dp.toPx() }
    val fontPixels = with(density) { style.fontSize.toPx() }
    val customWidth = if (appearance.stroke) clockGlyphStrokeWidth(pixels(appearance.strokeWidth * 2f), fontPixels, smallGlyph) else 0f
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
        outlines.forEachIndexed { index, color ->
            // Leave the protective bands outside the custom stroke. On a
            // gradient, either band can remain visible as the backdrop changes.
            val band = (fontPixels * 0.025f).coerceAtLeast(1f)
            val width = customWidth + band * 2f * (outlines.size - index)
            Text(text, style = style.copy(color = color, drawStyle = Stroke(width = width)), softWrap = false)
        }
        if (customWidth > 0f) {
            val stroke = Stroke(width = customWidth)
            Text(text, style = style.copy(color = clockColor(appearance.strokeColor), drawStyle = stroke), softWrap = false)
        }
        Text(text, style = style, softWrap = false)
    }
}
