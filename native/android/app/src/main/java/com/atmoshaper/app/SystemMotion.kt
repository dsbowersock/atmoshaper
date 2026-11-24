package com.atmoshaper.app

import android.animation.ValueAnimator
import android.database.ContentObserver
import android.os.Build
import android.os.Handler
import android.os.Looper
import android.provider.Settings
import androidx.annotation.RequiresApi
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.platform.LocalContext
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.LifecycleEventObserver
import androidx.lifecycle.compose.LocalLifecycleOwner

/** Honor the user's setting and the platform's effective animator state for custom canvases. */
@Composable
internal fun systemMotionEnabled(): Boolean {
    val resolver = LocalContext.current.contentResolver
    val lifecycle = LocalLifecycleOwner.current.lifecycle
    val setting = Settings.Global.ANIMATOR_DURATION_SCALE
    fun readEnabled() = Settings.Global.getFloat(resolver, setting, 1f) > 0f && ValueAnimator.areAnimatorsEnabled()

    var enabled by remember(resolver) { mutableStateOf(readEnabled()) }
    DisposableEffect(resolver, lifecycle) {
        val handler = Handler(Looper.getMainLooper())
        val refresh = Runnable { enabled = readEnabled() }
        val observer = object : ContentObserver(handler) {
            override fun onChange(selfChange: Boolean) {
                refresh.run()
            }
        }
        // The setting and the effective scale can arrive in either order.
        val stopObservingScale = if (Build.VERSION.SDK_INT >= 33) observeEffectiveScale(handler, refresh) else null
        val resumeObserver = LifecycleEventObserver { _, event ->
            if (event == Lifecycle.Event.ON_RESUME) refresh.run()
        }
        resolver.registerContentObserver(Settings.Global.getUriFor(setting), false, observer)
        lifecycle.addObserver(resumeObserver)
        refresh.run()
        onDispose {
            stopObservingScale?.invoke()
            resolver.unregisterContentObserver(observer)
            lifecycle.removeObserver(resumeObserver)
            handler.removeCallbacks(refresh)
        }
    }
    return enabled
}

@RequiresApi(33)
private fun observeEffectiveScale(handler: Handler, refresh: Runnable): () -> Unit {
    val listener = ValueAnimator.DurationScaleChangeListener { handler.post(refresh) }
    ValueAnimator.registerDurationScaleChangeListener(listener)
    return { ValueAnimator.unregisterDurationScaleChangeListener(listener) }
}
