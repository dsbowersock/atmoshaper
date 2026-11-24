package com.atmoshaper.app

import android.database.ContentObserver
import android.os.Handler
import android.os.Looper
import android.provider.Settings
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.platform.LocalContext

/** Read Android's Remove animations setting directly for decorative motion in custom canvases. */
@Composable
internal fun systemMotionEnabled(): Boolean {
    val resolver = LocalContext.current.contentResolver
    val setting = Settings.Global.ANIMATOR_DURATION_SCALE
    fun readSetting() = Settings.Global.getFloat(resolver, setting, 1f) > 0f

    var enabled by remember(resolver) { mutableStateOf(readSetting()) }
    DisposableEffect(resolver) {
        val observer = object : ContentObserver(Handler(Looper.getMainLooper())) {
            override fun onChange(selfChange: Boolean) {
                enabled = readSetting()
            }
        }
        resolver.registerContentObserver(Settings.Global.getUriFor(setting), false, observer)
        enabled = readSetting()
        onDispose { resolver.unregisterContentObserver(observer) }
    }
    return enabled
}
