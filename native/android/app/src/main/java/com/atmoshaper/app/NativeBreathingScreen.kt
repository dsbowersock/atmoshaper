package com.atmoshaper.app

import android.animation.ValueAnimator
import android.database.ContentObserver
import android.os.Handler
import android.os.Looper
import android.os.SystemClock
import android.provider.Settings
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.BoxWithConstraints
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.WindowInsets
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.safeDrawing
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.layout.windowInsetsPadding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.selection.selectable
import androidx.compose.foundation.selection.selectableGroup
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.LongState
import androidx.compose.runtime.derivedStateOf
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableLongStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.semantics.LiveRegionMode
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.clearAndSetSemantics
import androidx.compose.ui.semantics.heading
import androidx.compose.ui.semantics.hideFromAccessibility
import androidx.compose.ui.semantics.liveRegion
import androidx.compose.ui.semantics.paneTitle
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.semantics.stateDescription
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.compose.LocalLifecycleOwner
import androidx.lifecycle.repeatOnLifecycle
import kotlinx.coroutines.delay

private val BreathGreen = Color(0xFF326249)
private val BreathPurple = Color(0xFF634383)

@Composable
internal fun NativeBreathingScreen(guide: BreathingGuideViewModel, onClose: () -> Unit) {
    val session = guide.session
    val title = stringResource(R.string.breathing_title)
    val motion = breathingMotionEnabled()
    val clock = breathingClock(session, motion)
    val activePhase by remember(session, clock) {
        derivedStateOf { if (session.status == BreathingStatus.Running) session.frame(clock.longValue).phaseIndex else -1 }
    }

    Surface(modifier = Modifier.fillMaxSize(), color = MaterialTheme.colorScheme.background) {
        Box(
            modifier = Modifier.fillMaxSize().windowInsetsPadding(WindowInsets.safeDrawing),
            contentAlignment = Alignment.TopCenter,
        ) {
            BoxWithConstraints(
                modifier = Modifier.widthIn(max = 560.dp).fillMaxSize().semantics { paneTitle = title }
                    .verticalScroll(rememberScrollState()).padding(horizontal = 16.dp, vertical = 8.dp),
            ) {
                // Give scaled labels room to wrap without shrinking the text or touch targets.
                val textWidth = maxWidth / LocalDensity.current.fontScale.coerceAtLeast(1f)
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        Text(
                            title, style = MaterialTheme.typography.headlineSmall,
                            modifier = Modifier.weight(1f).semantics { heading() },
                        )
                        TextButton(onClick = onClose, modifier = Modifier.heightIn(min = 48.dp)) {
                            Text(stringResource(R.string.breathing_close))
                        }
                    }
                    BreathingPatterns(session.pattern, stacked = textWidth < 215.dp, onSelect = guide::reset)
                    BreathingPacer(session, clock, motion)
                    BreathingActions(session.status, stacked = textWidth < 188.dp, onToggle = guide::toggle, onReset = { guide.reset() })
                    BreathingTimings(session.pattern, activePhase, columns = if (textWidth < 236.dp) 2 else 4)
                    Text(
                        stringResource(R.string.breathing_comfort),
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                        textAlign = TextAlign.Center,
                        modifier = Modifier.fillMaxWidth().padding(bottom = 8.dp),
                    )
                }
            }
        }
    }
}

@Composable
private fun BreathingPatterns(selected: BreathingPattern, stacked: Boolean, onSelect: (BreathingPattern) -> Unit) {
    val group = Modifier.fillMaxWidth().selectableGroup()
    if (stacked) {
        Column(group, verticalArrangement = Arrangement.spacedBy(6.dp)) {
            BreathingPattern.entries.forEach { pattern ->
                PatternControl(pattern, selected == pattern, horizontal = true, Modifier.fillMaxWidth(), onSelect)
            }
        }
    } else {
        Row(group, horizontalArrangement = Arrangement.spacedBy(6.dp)) {
            BreathingPattern.entries.forEach { pattern ->
                PatternControl(pattern, selected == pattern, horizontal = false, Modifier.weight(1f), onSelect)
            }
        }
    }
}

@Composable
private fun PatternControl(
    pattern: BreathingPattern,
    selected: Boolean,
    horizontal: Boolean,
    modifier: Modifier,
    onSelect: (BreathingPattern) -> Unit,
) {
    val shape = RoundedCornerShape(14.dp)
    val control = modifier.heightIn(min = 48.dp).clip(shape).background(if (selected) BreathGreen else BreathPurple)
        .selectable(selected, role = Role.RadioButton, onClick = { onSelect(pattern) })
        .padding(horizontal = 8.dp, vertical = 6.dp)
    val title = stringResource(pattern.title)
    val description = stringResource(pattern.description)
    if (horizontal) {
        Row(control, verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            Text(title, color = Color.White, style = MaterialTheme.typography.labelLarge, modifier = Modifier.weight(1f))
            Text(description, color = Color.White, style = MaterialTheme.typography.bodySmall)
        }
    } else {
        Column(control, horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.Center) {
            Text(title, color = Color.White, style = MaterialTheme.typography.labelLarge, textAlign = TextAlign.Center)
            Text(description, color = Color.White, style = MaterialTheme.typography.bodySmall, textAlign = TextAlign.Center)
        }
    }
}

/** Refresh only the visible guide. The session itself has no scheduled work
 * and reconstructs the current phase from the same monotonic clock on return. */
@Composable
private fun breathingClock(session: BreathingSession, motion: Boolean): LongState {
    val clock = remember(session) { mutableLongStateOf(SystemClock.elapsedRealtime()) }
    val lifecycle = LocalLifecycleOwner.current.lifecycle
    LaunchedEffect(session, lifecycle, motion) {
        if (session.status != BreathingStatus.Running) return@LaunchedEffect
        lifecycle.repeatOnLifecycle(Lifecycle.State.RESUMED) {
            while (true) {
                clock.longValue = SystemClock.elapsedRealtime()
                delay(if (motion) 32L else 100L)
            }
        }
    }
    return clock
}

/** Android's Remove animations setting can change while this screen is visible. */
@Composable
private fun breathingMotionEnabled(): Boolean {
    val resolver = LocalContext.current.contentResolver
    var enabled by remember { mutableStateOf(ValueAnimator.areAnimatorsEnabled()) }
    DisposableEffect(resolver) {
        val observer = object : ContentObserver(Handler(Looper.getMainLooper())) {
            override fun onChange(selfChange: Boolean) {
                enabled = ValueAnimator.areAnimatorsEnabled()
            }
        }
        resolver.registerContentObserver(Settings.Global.getUriFor(Settings.Global.ANIMATOR_DURATION_SCALE), false, observer)
        onDispose { resolver.unregisterContentObserver(observer) }
    }
    return enabled
}

@Composable
private fun BreathingPacer(session: BreathingSession, clock: LongState, motion: Boolean) {
    val frame by remember(session, clock) {
        derivedStateOf {
            val frame = session.frame(clock.longValue)
            Triple(frame.phaseIndex, frame.remainingSeconds, frame.cycle)
        }
    }
    val (phaseIndex, remainingSeconds, cycle) = frame
    val phaseLabel = stringResource(
        when (session.status) {
            BreathingStatus.Ready -> R.string.breathing_ready
            BreathingStatus.Paused -> R.string.breathing_paused
            BreathingStatus.Running -> session.pattern.phases[phaseIndex].label
        },
    )
    val face = MaterialTheme.colorScheme.surface
    val ring = if (isSystemInDarkTheme()) Color(0xFF8ACDA8) else BreathGreen
    Box(Modifier.fillMaxWidth().heightIn(min = 152.dp), contentAlignment = Alignment.Center) {
        Canvas(Modifier.size(152.dp)) {
            val animated = if (motion && session.status != BreathingStatus.Ready) session.frame(clock.longValue) else null
            val radius = size.minDimension * 0.44f * (animated?.scale ?: 1f)
            val stroke = Stroke(4.dp.toPx())
            drawCircle(face, radius)
            drawCircle(ring.copy(alpha = 0.35f), radius, style = stroke)
            if (animated != null) {
                drawArc(
                    ring, startAngle = -90f, sweepAngle = animated.progress * 360f, useCenter = false,
                    topLeft = center - Offset(radius, radius), size = Size(radius * 2, radius * 2), style = stroke,
                )
            }
        }
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            Text(phaseLabel, style = MaterialTheme.typography.titleMedium, modifier = Modifier.semantics {
                liveRegion = LiveRegionMode.Polite
            })
            // Only phase changes are announced. Reading every second would
            // compete with both the phase cue and a user's other audio.
            Text(
                stringResource(R.string.breathing_countdown, remainingSeconds),
                style = MaterialTheme.typography.headlineMedium,
                modifier = Modifier.clearAndSetSemantics { hideFromAccessibility() },
            )
            Text(
                stringResource(R.string.breathing_cycle, cycle), style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
        }
    }
}

@Composable
private fun BreathingActions(status: BreathingStatus, stacked: Boolean, onToggle: () -> Unit, onReset: () -> Unit) {
    val toggleLabel = stringResource(
        when (status) {
            BreathingStatus.Ready -> R.string.breathing_start
            BreathingStatus.Running -> R.string.breathing_pause
            BreathingStatus.Paused -> R.string.breathing_resume
        },
    )
    if (stacked) {
        Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
            BreathingAction(toggleLabel, BreathGreen, onToggle, Modifier.fillMaxWidth())
            BreathingAction(stringResource(R.string.breathing_reset), BreathPurple, onReset, Modifier.fillMaxWidth())
        }
    } else {
        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            BreathingAction(toggleLabel, BreathGreen, onToggle, Modifier.weight(2f))
            BreathingAction(stringResource(R.string.breathing_reset), BreathPurple, onReset, Modifier.weight(1f))
        }
    }
}

@Composable
private fun BreathingAction(label: String, color: Color, onClick: () -> Unit, modifier: Modifier) {
    Button(
        onClick = onClick, modifier = modifier.heightIn(min = 48.dp), shape = RoundedCornerShape(14.dp),
        colors = ButtonDefaults.buttonColors(containerColor = color, contentColor = Color.White),
        contentPadding = PaddingValues(horizontal = 8.dp, vertical = 8.dp),
    ) {
        Text(label, textAlign = TextAlign.Center)
    }
}

@Composable
private fun BreathingTimings(pattern: BreathingPattern, activePhase: Int, columns: Int) {
    val active = stringResource(R.string.breathing_current_phase)
    Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
        for (indices in pattern.phases.indices.chunked(columns)) {
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                for (index in indices) {
                    val phase = pattern.phases[index]
                    val current = activePhase == index
                    val shape = RoundedCornerShape(8.dp)
                    val indicator = if (current) {
                        Modifier.background(BreathGreen, shape).semantics { stateDescription = active }
                    } else {
                        Modifier.background(MaterialTheme.colorScheme.surface, shape)
                    }
                    Text(
                        stringResource(R.string.breathing_timing, stringResource(phase.label), phase.seconds),
                        modifier = Modifier.weight(1f).then(indicator).padding(5.dp),
                        style = MaterialTheme.typography.bodySmall,
                        textAlign = TextAlign.Center,
                        color = if (current) Color.White else MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                }
                // Keep a short final row aligned with earlier rows.
                repeat(if (indices.first() == 0) 0 else columns - indices.size) { Spacer(Modifier.weight(1f)) }
            }
        }
    }
}
