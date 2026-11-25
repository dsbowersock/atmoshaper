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
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.platform.LocalContext
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.LifecycleEventObserver
import androidx.lifecycle.compose.LocalLifecycleOwner
import androidx.lifecycle.repeatOnLifecycle
import kotlinx.coroutines.delay

/** Honor the user's setting and the platform's effective animator state for custom canvases. */
@Composable
internal fun systemMotionEnabled(): Boolean {
    val resolver = LocalContext.current.contentResolver
    val lifecycle = LocalLifecycleOwner.current.lifecycle
    val setting = Settings.Global.ANIMATOR_DURATION_SCALE
    fun readSetting() = Settings.Global.getFloat(resolver, setting, 1f) > 0f

    var settingEnabled by remember(resolver) { mutableStateOf(readSetting()) }
    var effectiveEnabled by remember { mutableStateOf(ValueAnimator.areAnimatorsEnabled()) }
    DisposableEffect(resolver, lifecycle) {
        val handler = Handler(Looper.getMainLooper())
        val refreshEffective = Runnable { effectiveEnabled = ValueAnimator.areAnimatorsEnabled() }
        val refresh = Runnable {
            settingEnabled = readSetting()
            refreshEffective.run()
        }
        val observer = object : ContentObserver(handler) {
            override fun onChange(selfChange: Boolean) {
                refresh.run()
            }
        }
        // The setting and the effective scale can arrive in either order.
        val stopObservingScale = if (Build.VERSION.SDK_INT >= 33) observeEffectiveScale(handler, refreshEffective) else null
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
            handler.removeCallbacks(refreshEffective)
        }
    }
    if (Build.VERSION.SDK_INT < 33 && settingEnabled) {
        // Older Android has no scale listener. WindowManager can update the
        // cached process scale after the Settings observer has already fired.
        LaunchedEffect(lifecycle) {
            lifecycle.repeatOnLifecycle(Lifecycle.State.RESUMED) {
                while (true) {
                    effectiveEnabled = ValueAnimator.areAnimatorsEnabled()
                    delay(500L)
                }
            }
        }
    }
    return settingEnabled && effectiveEnabled
}

@RequiresApi(33)
private fun observeEffectiveScale(handler: Handler, refresh: Runnable): () -> Unit {
    val listener = ValueAnimator.DurationScaleChangeListener { handler.post(refresh) }
    ValueAnimator.registerDurationScaleChangeListener(listener)
    return { ValueAnimator.unregisterDurationScaleChangeListener(listener) }
}
