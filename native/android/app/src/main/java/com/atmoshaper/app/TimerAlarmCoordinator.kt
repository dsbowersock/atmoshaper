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

    fun open(now: Long): TimerSnapshot = synchronized(lock) {
        updateLocked { it.advance(now, foreground = false) }.snapshot
    }

    fun change(command: (TimerSnapshot) -> TimerAdvance): TimerAdvance = synchronized(lock) {
        updateLocked(command).also { deliverLocked(it) }
    }

    fun status(setup: TimerSetup): TimerAlertStatus = system.status(setup)

    fun restore() = synchronized(lock) {
        // Boot and special-access grant both advance silently. The timer
        // record is credential-protected and is available after user unlock.
        if (store.read() != null) open(System.currentTimeMillis())
    }

    fun alarm(session: String, at: Long, deadline: Long): Unit = synchronized(lock) {
        val current = store.read() ?: return
        if (current.sessionId != session || current.deadlineMs != deadline || current.nextAlarmAt != at) return
        val now = System.currentTimeMillis()
        if (now < at) {
            system.sync(current)
            return
        }

        val attached = foreground
        val backgroundAllowed = system.canDeliver(current.setup)
        val transition = updateLocked {
            val advanced = it.advance(now, foreground = attached != null || backgroundAllowed)
            // A genuine Android delivery may arrive late. A late completion
            // still alerts, while old intervals are skipped rather than replayed.
            if (advanced.snapshot.phase == TimerPhase.Complete && backgroundAllowed && advanced.cue == null) {
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
                    val currentPlayer = foreground
                    if (currentPlayer != null) currentPlayer(transition) else system.alert(transition)
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
        private val lock = Any()
        private val main = Handler(Looper.getMainLooper())
        private var revision = 0L
        @Volatile var foreground: ((TimerAdvance) -> Unit)? = null
        val backgroundChanges = MutableSharedFlow<Unit>(extraBufferCapacity = 1)
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
                    Intent.ACTION_BOOT_COMPLETED, AlarmManager.ACTION_SCHEDULE_EXACT_ALARM_PERMISSION_STATE_CHANGED -> timer.restore()
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
