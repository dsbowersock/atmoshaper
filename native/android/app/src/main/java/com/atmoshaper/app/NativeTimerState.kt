package com.atmoshaper.app

import android.content.Context
import androidx.core.util.AtomicFile
import org.json.JSONArray
import org.json.JSONObject
import java.io.File
import java.io.FileNotFoundException

internal const val TIMER_MINUTE_MS = 60_000L
private const val maxDurationMs = (23 * 60 + 59) * TIMER_MINUTE_MS
private const val maxTimestamp = 9_007_199_254_740_991L
private const val foregroundCueWindowMs = 1_250L

internal enum class TimerInterval(val key: String) {
    None("none"), Preset("preset"), Custom("custom"), Areas("areas"),
}

internal enum class TimerCue(val key: String, val sound: Boolean, val flash: Boolean, val vibration: Boolean) {
    Chime("chime", true, false, false),
    Flash("flash", false, true, false),
    ChimeFlash("both", true, true, false),
    Vibration("haptic", false, false, true),
    ChimeVibration("chime-haptic", true, false, true),
    FlashVibration("flash-haptic", false, true, true),
    All("all", true, true, true),
    Silent("silent", false, false, false),
}

internal data class TimerSetup(
    val hours: Int = 0,
    val minutes: Int = 0,
    val interval: TimerInterval = TimerInterval.Preset,
    val intervalMinutes: Int = 15,
    val areas: Int = 4,
    val cue: TimerCue = TimerCue.Chime,
    val volume: Double = 0.7,
    val vibrationMs: Int = 15,
    val keepAwake: Boolean = true,
    val showSeconds: Boolean = true,
) {
    init {
        require(hours in 0..23 && minutes in 0..59 && intervalMinutes in 1..240 && areas in 1..24)
        require(volume in 0.0..1.0 && vibrationMs in 10..30)
    }

    val durationMs get() = (hours * 60 + minutes) * TIMER_MINUTE_MS

    fun intervalMs(): Long? = when (interval) {
        TimerInterval.None -> null
        TimerInterval.Preset, TimerInterval.Custom -> intervalMinutes * TIMER_MINUTE_MS
        TimerInterval.Areas -> (durationMs / areas).coerceAtLeast(1_000)
    }

    fun encode(): JSONObject = JSONObject()
        .put("hours", hours).put("minutes", minutes)
        .put("interval", interval.key).put("intervalMinutes", intervalMinutes).put("areas", areas)
        .put("cue", cue.key).put("volume", volume).put("vibrationMs", vibrationMs)
        .put("keepAwake", keepAwake).put("showSeconds", showSeconds)

    companion object {
        fun decode(setup: JSONObject) = TimerSetup(
            setup.get("hours") as Int, setup.get("minutes") as Int,
            TimerInterval.entries.first { it.key == setup.get("interval") },
            setup.get("intervalMinutes") as Int, setup.get("areas") as Int,
            TimerCue.entries.first { it.key == setup.get("cue") },
            (setup.get("volume") as Number).toDouble(), setup.get("vibrationMs") as Int,
            setup.get("keepAwake") as Boolean, setup.get("showSeconds") as Boolean,
        )
    }
}

/** A null name identifies the last setup reused by earlier packaged builds. */
internal data class SavedTimerSetup(val name: String?, val setup: TimerSetup) {
    init { require(name == null || name.isNotBlank() && name.length <= 80) }
}

internal enum class TimerPhase(val key: String) {
    Ready("ready"), Running("running"), Paused("paused"), Complete("complete"),
}

internal enum class TimerSignal { Interval, Completion }
internal data class TimerAdvance(val snapshot: TimerSnapshot, val cue: TimerSignal? = null)

/** One durable session. A running cue position is a wall-clock timestamp.
 * A paused position is an offset from resume, just like paused remaining time. */
internal data class TimerSnapshot(
    val setup: TimerSetup = TimerSetup(),
    val phase: TimerPhase = TimerPhase.Ready,
    val totalMs: Long = 0,
    val pausedMs: Long = 0,
    val deadlineMs: Long? = null,
    val intervalMs: Long? = null,
    val cueAtMs: Long? = null,
    val savedSetups: List<SavedTimerSetup> = emptyList(),
) {
    init {
        require(totalMs in 0..maxDurationMs && pausedMs in 0..totalMs)
        require(phase != TimerPhase.Ready || totalMs == 0L)
        require(phase != TimerPhase.Running || totalMs > 0)
        require(if (phase == TimerPhase.Running) deadlineMs != null && deadlineMs in 1..maxTimestamp else deadlineMs == null)
        require(if (phase == TimerPhase.Paused) pausedMs > 0 else pausedMs == 0L)
        require(intervalMs == null || (phase in activePhases && intervalMs in 1_000..maxDurationMs))
        require(cueAtMs == null || (intervalMs != null && cueAtMs in 1 until (deadlineMs ?: pausedMs)))
        require(savedSetups.size <= 13)
    }

    fun remainingAt(now: Long): Long =
        if (deadlineMs != null) (deadlineMs - now).coerceIn(0, totalMs) else pausedMs

    fun start(choices: TimerSetup, now: Long): TimerSnapshot {
        if (phase in activePhases || choices.durationMs == 0L) return this
        val duration = choices.durationMs
        val interval = choices.intervalMs()
        return TimerSnapshot(choices, TimerPhase.Running, duration, deadlineMs = now + duration,
            intervalMs = interval, cueAtMs = interval?.takeIf { it < duration }?.let { now + it },
            savedSetups = savedSetups)
    }

    fun pause(now: Long): TimerSnapshot {
        val current = advance(now, false).snapshot
        if (current.deadlineMs == null) return current
        val remaining = current.remainingAt(now)
        return current.copy(phase = TimerPhase.Paused, pausedMs = remaining, deadlineMs = null,
            cueAtMs = current.cueAtMs?.minus(now)?.takeIf { it < remaining })
    }

    fun resume(now: Long): TimerSnapshot = if (phase == TimerPhase.Paused) {
        copy(phase = TimerPhase.Running, pausedMs = 0, deadlineMs = now + pausedMs,
            cueAtMs = cueAtMs?.plus(now))
    } else this

    fun adjust(deltaMs: Long, now: Long): TimerSnapshot =
        setRemaining(remainingAt(now) + deltaMs, now)

    fun setRemaining(milliseconds: Long, now: Long): TimerSnapshot {
        val current = advance(now, false).snapshot
        if (current.phase !in activePhases) return current
        val remaining = milliseconds.coerceIn(0, maxDurationMs)
        if (remaining == 0L) return current.completed()
        val nextOffset = current.cueAtMs?.let { if (current.deadlineMs != null) it - now else it }
        return current.withRemaining(remaining, current.intervalMs, nextOffset, now)
    }

    fun setInterval(minutes: Int?, now: Long): TimerSnapshot {
        require(minutes == null || minutes in 1..240)
        val current = advance(now, false).snapshot
        if (current.phase !in activePhases) return current
        val interval = minutes?.times(TIMER_MINUTE_MS)
        val offset = interval?.takeIf { it < current.remainingAt(now) }
        return current.copy(intervalMs = interval, cueAtMs = offset?.let { if (current.deadlineMs == null) it else now + it })
    }

    private fun withRemaining(remaining: Long, interval: Long?, offset: Long?, now: Long): TimerSnapshot {
        val running = phase == TimerPhase.Running
        val next = (offset?.takeIf { it < remaining } ?: interval)?.takeIf { it < remaining }
        return copy(totalMs = maxOf(totalMs, remaining), pausedMs = if (running) 0 else remaining,
            deadlineMs = if (running) now + remaining else null, intervalMs = interval,
            cueAtMs = next?.let { if (running) now + it else it })
    }

    fun end() = TimerSnapshot(setup, savedSetups = savedSetups)

    private fun completed() = TimerSnapshot(setup, TimerPhase.Complete, totalMs, savedSetups = savedSetups)

    /** Reconcile from the deadline when reopened. A live foreground tick may
     * emit one fresh cue, after the caller commits the advanced snapshot. */
    fun advance(now: Long, foreground: Boolean): TimerAdvance {
        val deadline = deadlineMs ?: return TimerAdvance(this)
        if (now >= deadline) return TimerAdvance(completed(),
            TimerSignal.Completion.takeIf { foreground && now - deadline < foregroundCueWindowMs })
        val next = cueAtMs ?: return TimerAdvance(this)
        val interval = checkNotNull(intervalMs)
        if (now < next) return TimerAdvance(this)
        val elapsed = now - next
        val future = now + interval - elapsed % interval
        return TimerAdvance(copy(cueAtMs = future.takeIf { it < deadline }),
            TimerSignal.Interval.takeIf { foreground && elapsed < foregroundCueWindowMs })
    }

    fun encode(): String = JSONObject()
        .put("version", 1)
        .put("setup", setup.encode())
        .put("phase", phase.key).put("totalMs", totalMs).put("pausedMs", pausedMs)
        .put("deadlineMs", deadlineMs ?: JSONObject.NULL).put("intervalMs", intervalMs ?: JSONObject.NULL)
        .put("cueAtMs", cueAtMs ?: JSONObject.NULL)
        .put("savedSetups", JSONArray().apply {
            savedSetups.forEach { saved ->
                put(JSONObject().put("name", saved.name ?: JSONObject.NULL).put("setup", saved.setup.encode()))
            }
        }).toString()

    companion object {
        private val activePhases = setOf(TimerPhase.Running, TimerPhase.Paused)

        /** Reject partial or mistyped copies. Import and subsequent reads use
         * the same validation so an invalid copy never becomes a writable default. */
        fun decode(raw: String): TimerSnapshot {
            require(raw.length <= 16_384)
            val record = JSONObject(raw)
            require(record.get("version") == 1)
            fun JSONObject.long(name: String) = when (val value = get(name)) {
                is Int -> value.toLong()
                is Long -> value
                else -> error("Invalid timer number")
            }
            fun nullable(name: String) = if (record.get(name) == JSONObject.NULL) null else record.long(name)
            // Initial v9 development builds wrote this version before saved
            // templates were added. A missing list does not hide their timer.
            val setups = if (record.has("savedSetups")) record.getJSONArray("savedSetups") else JSONArray()
            require(setups.length() <= 13)
            val saved = List(setups.length()) { index ->
                val template = setups.getJSONObject(index)
                val name = template.get("name").let { if (it == JSONObject.NULL) null else it as String }
                SavedTimerSetup(name, TimerSetup.decode(template.getJSONObject("setup")))
            }
            return TimerSnapshot(
                TimerSetup.decode(record.getJSONObject("setup")),
                TimerPhase.entries.first { it.key == record.get("phase") },
                record.long("totalMs"), record.long("pausedMs"), nullable("deadlineMs"),
                nullable("intervalMs"), nullable("cueAtMs"), saved,
            )
        }
    }
}

/** Import and all running-state mutations share one verified atomic file.
 * A partial first write can retry without replacing a committed snapshot. */
internal class NativeTimerFile(path: File) {
    private val file = AtomicFile(path)

    constructor(context: Context) : this(File(context.filesDir, "native-timer.json"))

    fun read(): TimerSnapshot? = synchronized(lock) {
        try {
            TimerSnapshot.decode(file.readFully().toString(Charsets.UTF_8))
        } catch (error: FileNotFoundException) {
            if (file.baseFile.exists()) throw error
            null
        }
    }

    fun importIfAbsent(value: TimerSnapshot): TimerSnapshot = synchronized(lock) { read() ?: commit(value) }

    fun update(change: (TimerSnapshot) -> TimerSnapshot): TimerSnapshot = synchronized(lock) {
        val prior = checkNotNull(read())
        val next = change(prior)
        if (prior == next) prior else commit(next)
    }

    private fun commit(value: TimerSnapshot): TimerSnapshot {
        val output = file.startWrite()
        try {
            output.write(value.encode().toByteArray())
            output.fd.sync()
            file.finishWrite(output)
        } catch (error: Exception) {
            file.failWrite(output)
            throw error
        }
        check(read() == value) { "Timer readback did not match" }
        return value
    }

    private companion object {
        val lock = Any()
    }
}
