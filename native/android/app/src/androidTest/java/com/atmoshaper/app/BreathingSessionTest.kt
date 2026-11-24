package com.atmoshaper.app

import androidx.test.ext.junit.runners.AndroidJUnit4
import org.junit.Assert.assertEquals
import org.junit.Test
import org.junit.runner.RunWith

@RunWith(AndroidJUnit4::class)
class BreathingSessionTest {
    @Test
    fun theThreePatternsKeepTheirPublishedBoundariesAndRepeat() {
        checkCycle(BreathingPattern.Coherent, listOf(5, 5), listOf(R.string.breathing_inhale, R.string.breathing_exhale))
        checkCycle(BreathingPattern.Box, listOf(4, 4, 4, 4), listOf(
            R.string.breathing_inhale, R.string.breathing_hold, R.string.breathing_exhale, R.string.breathing_hold,
        ))
        checkCycle(BreathingPattern.Settle, listOf(4, 7, 8), listOf(
            R.string.breathing_inhale, R.string.breathing_hold, R.string.breathing_exhale,
        ))
    }

    @Test
    fun pausingFreezesElapsedTimeAndResumingKeepsTheRemainder() {
        val running = BreathingSession().toggle(10_000)
        val paused = running.toggle(11_750)
        assertEquals(BreathingStatus.Paused, paused.status)
        assertEquals(BreathingStatus.Paused, running.toggle(10_000).status)
        assertEquals(running.frame(11_750), paused.frame(50_000))
        val resumed = paused.toggle(50_000)
        assertEquals(0, resumed.frame(53_249).phaseIndex)
        assertEquals(1, resumed.frame(53_250).phaseIndex)
    }

    @Test
    fun aRunningSessionSkipsMissedUpdatesAndPatternSelectionResetsIt() {
        val running = BreathingSession(BreathingPattern.Settle).toggle(1_000)
        val afterAbsence = running.frame(980_000)
        assertEquals(52L, afterAbsence.cycle)
        assertEquals(1, afterAbsence.phaseIndex)
        assertEquals(1, afterAbsence.remainingSeconds)

        val newPattern = running.reset(BreathingPattern.Box)
        assertEquals(BreathingStatus.Ready, newPattern.status)
        assertEquals(BreathingPattern.Box, newPattern.pattern)
        assertEquals(0, newPattern.frame(1_000_000).phaseIndex)
        assertEquals(4, newPattern.frame(1_000_000).remainingSeconds)
        assertEquals(1L, newPattern.frame(1_000_000).cycle)
    }

    private fun checkCycle(pattern: BreathingPattern, lengths: List<Int>, labels: List<Int>) {
        val startedAt = 11_200L
        val session = BreathingSession(pattern).toggle(startedAt)
        var phaseStart = startedAt
        for ((index, length) in lengths.withIndex()) {
            val beginning = session.frame(phaseStart)
            assertEquals(labels[index], pattern.phases[beginning.phaseIndex].label)
            assertEquals(index, beginning.phaseIndex)
            assertEquals(length, beginning.remainingSeconds)
            val lastMillisecond = session.frame(phaseStart + length * 1_000L - 1L)
            assertEquals(index, lastMillisecond.phaseIndex)
            assertEquals(1, lastMillisecond.remainingSeconds)
            phaseStart += length * 1_000L
        }
        assertEquals(0, session.frame(phaseStart).phaseIndex)
        assertEquals(2L, session.frame(phaseStart).cycle)
    }
}
