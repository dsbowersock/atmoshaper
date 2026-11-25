package com.atmoshaper.app

import android.annotation.SuppressLint
import android.content.Context
import android.net.Uri
import android.view.MotionEvent
import android.view.View
import android.webkit.RenderProcessGoneDetail
import android.webkit.WebResourceRequest
import android.webkit.WebResourceResponse
import android.webkit.WebView
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.key
import androidx.compose.runtime.rememberUpdatedState
import androidx.compose.ui.Modifier
import androidx.compose.ui.viewinterop.AndroidView
import androidx.webkit.WebViewAssetLoader
import androidx.webkit.WebViewClientCompat
import androidx.webkit.WebViewCompat
import androidx.webkit.WebViewFeature
import kotlinx.coroutines.delay
import org.json.JSONObject
import java.io.ByteArrayInputStream

internal enum class ClockEffectStatus { Starting, Ready, Failed }

private const val effectOrigin = "https://appassets.androidplatform.net"
private const val effectBase = "$effectOrigin/assets/core/"
private const val effectPage = "${effectBase}clock-effect.html"
private const val effectChannel = "AtmoShaperClockEffect"

/** A packaged effect is a decorative, disposable surface. Its bridge returns
 * readiness only and its web content cannot navigate or intercept Clock input. */
@Composable
internal fun PackagedClockEffect(
    id: String,
    style: ClockBackgroundStyle,
    status: ClockEffectStatus,
    onStatus: (ClockEffectStatus) -> Unit,
) {
    val report = rememberUpdatedState(onStatus)
    LaunchedEffect(id, style, status) {
        if (status == ClockEffectStatus.Starting) {
            delay(8_000L)
            report.value(ClockEffectStatus.Failed)
        }
    }
    if (status == ClockEffectStatus.Failed) return
    key(id, style) {
        AndroidView(
            factory = { context -> newClockEffectView(context, id, style) { report.value(it) } },
            modifier = Modifier.fillMaxSize(),
            onRelease = { view ->
                if (WebViewFeature.isFeatureSupported(WebViewFeature.WEB_MESSAGE_LISTENER)) {
                    WebViewCompat.removeWebMessageListener(view, effectChannel)
                }
                view.destroy()
            },
            update = {},
        )
    }
}

private class DecorativeClockWebView(context: Context) : WebView(context) {
    var released = false
        private set

    @SuppressLint("ClickableViewAccessibility") // Clock supplies the complete accessible UI.
    override fun onTouchEvent(event: MotionEvent): Boolean = false

    override fun destroy() {
        released = true
        super.destroy()
    }
}

@SuppressLint("SetJavaScriptEnabled")
private fun newClockEffectView(
    context: Context,
    id: String,
    style: ClockBackgroundStyle,
    onStatus: (ClockEffectStatus) -> Unit,
): WebView {
    val view = DecorativeClockWebView(context)
    fun report(status: ClockEffectStatus) {
        if (!view.released) onStatus(status)
    }
    view.importantForAccessibility = View.IMPORTANT_FOR_ACCESSIBILITY_NO_HIDE_DESCENDANTS
    view.isFocusable = false
    view.isLongClickable = false
    view.setBackgroundColor(android.graphics.Color.TRANSPARENT)
    if (!WebViewFeature.isFeatureSupported(WebViewFeature.WEB_MESSAGE_LISTENER)) {
        view.post { report(ClockEffectStatus.Failed) }
        return view
    }
    val loader = WebViewAssetLoader.Builder()
        .addPathHandler("/assets/", WebViewAssetLoader.AssetsPathHandler(context))
        .build()
    view.settings.apply {
        javaScriptEnabled = true
        domStorageEnabled = true
        allowFileAccess = false
        allowContentAccess = false
        blockNetworkLoads = true
    }
    val chunk = Regex("chunks/[a-zA-Z0-9_.~-]+\\.js")
    val textures = setOf("textures/earth-blue-marble.jpg", "textures/earth-topology.png")
    view.webViewClient = object : WebViewClientCompat() {
        override fun shouldOverrideUrlLoading(view: WebView, request: WebResourceRequest) = true

        override fun shouldInterceptRequest(view: WebView, request: WebResourceRequest): WebResourceResponse {
            val address = request.url.toString()
            val relative = address.removePrefix(effectBase)
            val allowed = if (request.isForMainFrame) address == effectPage else address.startsWith(effectBase) &&
                (relative == "clock-effect.js" || relative == "app.css" || relative in textures || chunk.matches(relative))
            if (allowed && request.method == "GET") {
                loader.shouldInterceptRequest(request.url)?.let { return it }
            }
            return WebResourceResponse("text/plain", "utf-8", 403, "Forbidden", emptyMap(), ByteArrayInputStream(byteArrayOf()))
        }

        override fun onPageFinished(view: WebView, url: String) {
            if (url != effectPage || view.url != effectPage) return
            val arguments = listOf(id, style.firstColor, style.secondColor).joinToString(",") { JSONObject.quote(it) }
            view.evaluateJavascript("window.atmoShowClockEffect?.($arguments,${style.motion})", null)
        }

        override fun onRenderProcessGone(view: WebView, detail: RenderProcessGoneDetail): Boolean {
            report(ClockEffectStatus.Failed)
            return true
        }
    }
    WebViewCompat.addWebMessageListener(view, effectChannel, setOf(effectOrigin)) { originView, message, source, mainFrame, _ ->
        if (mainFrame && source == Uri.parse(effectOrigin) && originView.url == effectPage) {
            when (message.data) {
                "ready" -> report(ClockEffectStatus.Ready)
                "failed" -> report(ClockEffectStatus.Failed)
            }
        }
    }
    view.loadUrl(effectPage)
    return view
}
