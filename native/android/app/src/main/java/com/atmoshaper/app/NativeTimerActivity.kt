package com.atmoshaper.app

import android.os.Bundle
import android.view.WindowManager
import androidx.activity.ComponentActivity
import androidx.activity.addCallback
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.lifecycleScope
import androidx.lifecycle.repeatOnLifecycle
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.sync.withLock
import kotlinx.coroutines.withContext

/** Owns only foreground delivery. The persisted deadline stays authoritative
 * when the screen, activity or process goes away. */
class NativeTimerActivity : ComponentActivity() {
    private val store by lazy { NativeTimerFile(applicationContext) }
    private val sound by lazy { TimerCuePlayer(this) }
    private val mutation = Mutex()
    private var snapshot by mutableStateOf<TimerSnapshot?>(null)
    private var error by mutableStateOf<Int?>(null)
    private var busy by mutableStateOf(true)
    private var now by mutableStateOf(0L)
    private var flash by mutableStateOf(false)
    private var pendingSetup: TimerSetup? = null
    private var setupWriter: Job? = null

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        onBackPressedDispatcher.addCallback(this) { close() }
        setContent {
            HomeTheme {
                NativeTimerScreen(snapshot, now, busy, error, flash, ::close, ::retry, ::saveSetup, ::change)
            }
        }
        lifecycleScope.launch {
            repeatOnLifecycle(Lifecycle.State.RESUMED) {
                retryLoad()
                while (true) {
                    if (error == null) tick()
                    delay(125)
                }
            }
        }
    }

    private fun retry() {
        lifecycleScope.launch { retryLoad() }
    }

    private fun close() {
        lifecycleScope.launch {
            val existingError = error
            setupWriter?.join()
            // A user-initiated close waits for an in-flight control action
            // and surfaces a new save error before leaving. A cold transfer
            // that has not shown a timer can always be cancelled.
            if (snapshot == null) finish()
            else mutation.withLock { if (error == null || existingError != null) finish() }
        }
    }

    /** Conflate quick input changes. The latest valid setup survives Back
     * and Close, and an already started session always wins over a draft. */
    private fun saveSetup(choices: TimerSetup) {
        val current = snapshot ?: return
        if (current.phase != TimerPhase.Ready || error != null) return
        if (setupWriter?.isActive != true && current.setup == choices) return
        pendingSetup = choices
        if (setupWriter?.isActive == true) return
        setupWriter = lifecycleScope.launch {
            while (true) {
                val latest = pendingSetup ?: break
                pendingSetup = null
                try {
                    mutation.withLock {
                        showSnapshot(withContext(Dispatchers.IO) {
                            store.update { if (it.phase == TimerPhase.Ready) it.copy(setup = latest) else it }
                        })
                    }
                } catch (cancelled: CancellationException) {
                    throw cancelled
                } catch (_: Exception) {
                    error = R.string.timer_storage_write_error
                    pendingSetup = null
                }
            }
        }
    }

    /** Each resumed visit silently advances missed positions before it can
     * observe live foreground ticks. */
    private suspend fun retryLoad() = mutation.withLock {
        busy = true
        try {
            val existing = withContext(Dispatchers.IO) { store.read() }
            if (existing == null) {
                val transferred = checkNotNull(readPackagedExport(this, PackagedExport.Timer, TimerSnapshot::decode))
                withContext(Dispatchers.IO) { store.importIfAbsent(transferred) }
            }
            val openedAt = System.currentTimeMillis()
            now = openedAt
            showSnapshot(withContext(Dispatchers.IO) { store.update { it.advance(openedAt, false).snapshot } })
            error = null
        } catch (cancelled: CancellationException) {
            throw cancelled
        } catch (_: Exception) {
            error = R.string.timer_storage_read_error
        } finally {
            busy = false
        }
    }

    private fun change(command: (TimerSnapshot, Long) -> TimerSnapshot) {
        if (busy || error != null) return
        busy = true
        lifecycleScope.launch {
            try {
                mutation.withLock {
                    val changedAt = System.currentTimeMillis()
                    now = changedAt
                    showSnapshot(withContext(Dispatchers.IO) { store.update { command(it, changedAt) } })
                    sound.stop()
                    flash = false
                }
            } catch (cancelled: CancellationException) {
                throw cancelled
            } catch (_: Exception) {
                error = R.string.timer_storage_write_error
            } finally {
                busy = false
            }
        }
    }

    private suspend fun tick() = mutation.withLock {
        val previous = snapshot ?: return@withLock
        if (previous.phase != TimerPhase.Running) return@withLock
        val observedAt = System.currentTimeMillis()
        now = observedAt
        val next = previous.advance(observedAt, false)
        if (previous == next.snapshot) return@withLock
        try {
            var cue: TimerSignal? = null
            val foreground = hasWindowFocus()
            val current = withContext(Dispatchers.IO) {
                store.update {
                    val advanced = it.advance(observedAt, foreground)
                    cue = advanced.cue
                    advanced.snapshot
                }
            }
            // A failed save must never produce output. Commit the consumed
            // position first so recreation cannot deliver it a second time.
            showSnapshot(current)
            if (cue != null && hasWindowFocus()) {
                sound.play(current.setup)
                if (current.setup.cue.flash) {
                    flash = true
                    lifecycleScope.launch {
                        delay(600)
                        flash = false
                    }
                }
            }
        } catch (cancelled: CancellationException) {
            throw cancelled
        } catch (_: Exception) {
            error = R.string.timer_storage_write_error
        }
    }

    private fun showSnapshot(current: TimerSnapshot) {
        snapshot = current
        val flag = WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON
        if ((current.phase == TimerPhase.Running || current.phase == TimerPhase.Paused) && current.setup.keepAwake) window.addFlags(flag)
        else window.clearFlags(flag)
    }

    override fun onPause() {
        sound.stop()
        flash = false
        super.onPause()
    }
}
