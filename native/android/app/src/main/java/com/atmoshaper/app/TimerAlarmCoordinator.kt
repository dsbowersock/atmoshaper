package com.atmoshaper.app

import android.app.AlarmManager
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.os.Handler
import android.os.Looper
import android.util.Log
import kotlinx.coroutines.flow.MutableSharedFlow
import java.util.UUID
import java.util.concurrent.Executors

/** Serializes OS callbacks and screen edits through the same durable timer.
 * The stored state wins over any alarm or notification action already queued. */
internal class TimerAlarmCoordinator(context: Context) {
    private val store = NativeTimerFile(context)
    private val system = TimerAlarmSystem(context)

    /**
     * Reopening can deliver a fresh completion in the foreground. During
     * window attachment, leave that opportunity and any permitted OS delivery
     * intact. Once neither is available, recover the overdue timer silently.
     */
    fun open(now: Long): TimerSnapshot = observe(now, liveTick = false)

    fun tick(now: Long): TimerSnapshot = observe(now, liveTick = true)

    private fun observe(now: Long, liveTick: Boolean): TimerSnapshot = synchronized(lock) {
        val current = store.read() ?: TimerSnapshot()
        val attached = foreground != null
        val live = current.advance(now, foreground = attached)
        val completed = current.phase == TimerPhase.Running && live.snapshot.phase == TimerPhase.Complete
        if (completed && live.cue == null) {
            if (awaitsForeground(current, now) || awaitsAlarm(current, now)) return current
        }
        val transition = if (liveTick || live.cue == TimerSignal.Completion) live else TimerAdvance(live.snapshot)
        if (liveTick && transition.snapshot == current) return current
        updateLocked { transition }.also { deliverLocked(it) }.snapshot
    }

    fun change(command: (TimerSnapshot) -> TimerAdvance): TimerAdvance = synchronized(lock) {
        updateLocked(command).also { deliverLocked(it) }
    }

    fun status(setup: TimerSetup): TimerAlertStatus = system.status(setup)

    private fun awaitsForeground(current: TimerSnapshot, now: Long): Boolean =
        foreground == null && openingWindow != null &&
            current.advance(now, foreground = true).cue == TimerSignal.Completion

    // An occurrence token can outlive the OS alarm. Anchor the maximum wait
    // to the stored session deadline so reopening cannot restart the grace.
    private fun awaitsAlarm(current: TimerSnapshot, now: Long): Boolean =
        now - checkNotNull(current.deadlineMs) < backgroundCompletionGraceMs &&
            system.canDeliver(current.setup) && system.pendingOccurrence(current) != null

    fun restoreAfterBoot(now: Long = System.currentTimeMillis()) = synchronized(lock) {
        // A reboot lost delivery of past occurrences. The credential-protected
        // record is available after unlock and can recover future alarms.
        if (store.read() != null) updateLocked { it.advance(now, foreground = false) }
    }

    fun refreshSchedule(now: Long = System.currentTimeMillis()): Unit = synchronized(lock) {
        // An exact-alarm permission grant reschedules future occurrences.
        // Keep a queued completion, and don't invent an alarm for missed work.
        val current = store.read() ?: return
        val deadline = current.deadlineMs
        if (deadline != null && now >= deadline) {
            if (!awaitsForeground(current, now) && !awaitsAlarm(current, now)) {
                updateLocked { it.advance(now, foreground = false) }
            }
        } else {
            system.sync(current, current)
        }
    }

    fun alarm(session: String, at: Long, deadline: Long, now: Long = System.currentTimeMillis()): Unit = synchronized(lock) {
        val current = store.read() ?: return
        if (current.sessionId != session || current.deadlineMs != deadline || current.nextAlarmAt != at) return
        if (now < at) {
            system.sync(current)
            return
        }

        val attached = foreground != null
        val backgroundAllowed = system.canDeliver(current.setup)
        // A callback can beat onWindowFocusChanged after onResume. Give the
        // foreground tick its ordinary freshness window when OS alerts are off.
        if (!backgroundAllowed && awaitsForeground(current, now)) return
        val transition = updateLocked {
            val advanced = it.advance(now, foreground = attached || backgroundAllowed)
            // A genuine Android delivery may arrive late. A late completion
            // still alerts, while old intervals are skipped rather than replayed.
            if (advanced.snapshot.phase == TimerPhase.Complete && backgroundAllowed && advanced.cue == null &&
                now - deadline < backgroundCompletionGraceMs) {
                TimerAdvance(advanced.snapshot.copy(missedCompletion = false), TimerSignal.Completion)
            } else advanced
        }
        deliverLocked(transition)
        backgroundChanges.tryEmit(Unit)
    }

    fun end(session: String): Unit = synchronized(lock) {
        val current = store.read() ?: return
        if (current.sessionId != session) return
        updateLocked { TimerAdvance(it.end()) }
        backgroundChanges.tryEmit(Unit)
    }

    private fun deliverLocked(transition: TimerAdvance) {
        if (transition.cue == null) return
        if (foreground == null) {
            system.alert(transition)
            return
        }
        val deliveredAtRevision = revision
        main.post {
            synchronized(lock) {
                // A pause, adjustment or End can beat a queued UI cue.
                if (revision == deliveredAtRevision) {
                    if (foreground?.invoke(transition) != true) system.alert(transition)
                }
            }
        }
    }

    private fun updateLocked(command: (TimerSnapshot) -> TimerAdvance): TimerAdvance {
        lateinit var transition: TimerAdvance
        lateinit var previous: TimerSnapshot
        val current = store.update {
            previous = it
            transition = command(it)
            val next = transition.snapshot
            if ((next.phase == TimerPhase.Running || next.phase == TimerPhase.Paused) && next.sessionId == null) {
                next.copy(sessionId = UUID.randomUUID().toString())
            } else next
        }
        if (current != previous) revision++
        system.sync(current, previous)
        return TimerAdvance(current, transition.cue)
    }

    companion object {
        internal const val backgroundCompletionGraceMs = 30_000L
        private val lock = Any()
        private val main = Handler(Looper.getMainLooper())
        private var revision = 0L
        private var foreground: ((TimerAdvance) -> Boolean)? = null
        private var openingWindow: ((TimerAdvance) -> Boolean)? = null
        val backgroundChanges = MutableSharedFlow<Unit>(extraBufferCapacity = 1)

        fun beginWindowOpen(cue: (TimerAdvance) -> Boolean) = synchronized(lock) { openingWindow = cue }

        fun attachWindow(cue: (TimerAdvance) -> Boolean) = synchronized(lock) {
            foreground = cue
            if (openingWindow === cue) openingWindow = null
        }

        fun loseWindowFocus(cue: (TimerAdvance) -> Boolean) = synchronized(lock) {
            if (foreground === cue) foreground = null
        }

        fun closeWindow(cue: (TimerAdvance) -> Boolean) = synchronized(lock) {
            if (foreground === cue) foreground = null
            if (openingWindow === cue) openingWindow = null
        }
    }
}

internal val TimerSnapshot.nextAlarmAt: Long?
    get() = (cuePosition as? TimerCuePosition.Deadline)?.milliseconds ?: deadlineMs

/** Handles only explicit app PendingIntents and platform recovery broadcasts. */
class NativeTimerAlarmReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        val delivery = goAsync()
        worker.execute {
            try {
                val timer = TimerAlarmCoordinator(context.applicationContext)
                when (intent.action) {
                    Intent.ACTION_BOOT_COMPLETED -> timer.restoreAfterBoot()
                    AlarmManager.ACTION_SCHEDULE_EXACT_ALARM_PERMISSION_STATE_CHANGED -> timer.refreshSchedule()
                    TimerAlarmSystem.fireAction -> {
                        val session = intent.getStringExtra("session") ?: return@execute
                        timer.alarm(session, intent.getLongExtra("at", -1), intent.getLongExtra("deadline", -1))
                    }
                    TimerAlarmSystem.endAction -> {
                        val session = intent.getStringExtra("session") ?: return@execute
                        timer.end(session)
                    }
                }
            } catch (failure: Exception) {
                // Keep a damaged snapshot available for the screen's recovery UI.
                Log.w("NativeTimerAlarm", "Could not reconcile the saved timer (${failure.javaClass.simpleName})")
            } finally {
                delivery.finish()
            }
        }
    }

    private companion object {
        val worker = Executors.newSingleThreadExecutor()
    }
}
