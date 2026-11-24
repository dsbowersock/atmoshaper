package com.atmoshaper.app

import android.os.Bundle
import android.view.WindowManager
import androidx.activity.ComponentActivity
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

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent {
            HomeTheme {
                NativeTimerScreen(snapshot, now, busy, error, flash, ::finish, ::retry, ::change)
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
            show(withContext(Dispatchers.IO) { store.update { it.advance(openedAt, false).snapshot } })
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
                    show(withContext(Dispatchers.IO) { store.update { command(it, changedAt) } })
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
            show(current)
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

    private fun show(current: TimerSnapshot) {
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
