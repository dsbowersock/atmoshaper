package com.atmoshaper.app

import android.os.SystemClock
import androidx.annotation.StringRes
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.lifecycle.ViewModel

internal data class BreathPhase(
    @param:StringRes val label: Int,
    val seconds: Int,
    val scale: Float,
) {
    val durationMs: Long get() = seconds * 1_000L
}

internal enum class BreathingPattern(
    @param:StringRes val title: Int,
    @param:StringRes val description: Int,
    val phases: List<BreathPhase>,
) {
    // Keep phase lengths and orb endpoints aligned with lib/breathing-guide.js.
    Coherent(R.string.breathing_coherent, R.string.breathing_coherent_detail, listOf(
        BreathPhase(R.string.breathing_inhale, 5, 1.08f),
        BreathPhase(R.string.breathing_exhale, 5, 0.94f),
    )),
    Box(R.string.breathing_box, R.string.breathing_box_detail, listOf(
        BreathPhase(R.string.breathing_inhale, 4, 1.08f),
        BreathPhase(R.string.breathing_hold, 4, 1.08f),
        BreathPhase(R.string.breathing_exhale, 4, 0.94f),
        BreathPhase(R.string.breathing_hold, 4, 0.94f),
    )),
    Settle(R.string.breathing_settle, R.string.breathing_settle_detail, listOf(
        BreathPhase(R.string.breathing_inhale, 4, 1.08f),
        BreathPhase(R.string.breathing_hold, 7, 1.08f),
        BreathPhase(R.string.breathing_exhale, 8, 0.94f),
    ));

    val durationMs = phases.sumOf { it.durationMs }
}

internal enum class BreathingStatus { Ready, Running, Paused }

internal data class BreathingFrame(
    val phaseIndex: Int,
    val remainingSeconds: Int,
    val cycle: Long,
    val progress: Float,
    val scale: Float,
)

/** A tick-free session. Time while a running view is away counts toward the
 * exercise, while a paused session keeps its exact accumulated position. */
internal class BreathingSession private constructor(
    val pattern: BreathingPattern,
    private val elapsedBeforeStartMs: Long?,
    private val startedAtMs: Long?,
) {
    constructor(pattern: BreathingPattern = BreathingPattern.Coherent) : this(pattern, null, null)

    val status: BreathingStatus
        get() = when {
            startedAtMs != null -> BreathingStatus.Running
            elapsedBeforeStartMs != null -> BreathingStatus.Paused
            else -> BreathingStatus.Ready
        }

    private fun elapsed(nowMs: Long): Long =
        (elapsedBeforeStartMs ?: 0) + (startedAtMs?.let { (nowMs - it).coerceAtLeast(0) } ?: 0)

    fun toggle(nowMs: Long): BreathingSession =
        if (startedAtMs == null) BreathingSession(pattern, elapsedBeforeStartMs, nowMs)
        else BreathingSession(pattern, elapsed(nowMs), null)

    fun reset(pattern: BreathingPattern = this.pattern): BreathingSession = BreathingSession(pattern)

    /** Exact phase boundaries advance immediately, even after skipped frames. */
    fun frame(nowMs: Long): BreathingFrame {
        val elapsed = elapsed(nowMs)
        var within = elapsed % pattern.durationMs
        val cycle = elapsed / pattern.durationMs + 1
        val phases = pattern.phases
        for ((index, phase) in phases.withIndex()) {
            if (within < phase.durationMs) {
                val progress = within.toFloat() / phase.durationMs
                val previousScale = phases[if (index == 0) phases.lastIndex else index - 1].scale
                return BreathingFrame(
                    phaseIndex = index,
                    remainingSeconds = ((phase.durationMs - within + 999) / 1_000).toInt(),
                    cycle = cycle,
                    progress = progress,
                    scale = previousScale + (phase.scale - previousScale) * progress,
                )
            }
            within -= phase.durationMs
        }
        error("The breathing pattern must include a phase at this position")
    }
}

/** Home owns one exercise across screen navigation and Activity recreation.
 * It remains ephemeral and does not take ownership of app media or timers. */
internal class BreathingGuideViewModel : ViewModel() {
    var session by mutableStateOf(BreathingSession())
        private set

    fun toggle() {
        session = session.toggle(SystemClock.elapsedRealtime())
    }

    fun reset(pattern: BreathingPattern = session.pattern) {
        session = session.reset(pattern)
    }
}
