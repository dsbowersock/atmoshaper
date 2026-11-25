package com.atmoshaper.app

import android.annotation.SuppressLint
import android.content.Context
import android.graphics.Bitmap
import android.net.Uri
import android.webkit.RenderProcessGoneDetail
import android.webkit.WebResourceError
import android.webkit.WebResourceRequest
import android.webkit.WebResourceResponse
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.webkit.WebViewAssetLoader
import androidx.webkit.WebViewCompat
import androidx.webkit.WebViewFeature
import org.json.JSONObject
import java.io.IOException

/** A fixed bundled audio document owned by the service. No Activity, visible
 * window, account bridge or incoming URL participates in this runtime. */
@SuppressLint("SetJavaScriptEnabled")
internal class NativeAudioEngine(
    context: Context,
    private val onMessage: (String) -> Unit,
) {
    private val view = WebView(context)
    private var closed = false

    init {
        val assets = WebViewAssetLoader.Builder()
            .addPathHandler("/assets/", WebViewAssetLoader.AssetsPathHandler(context)).build()
        view.settings.apply {
            javaScriptEnabled = true
            domStorageEnabled = true
            allowFileAccess = false
            allowContentAccess = false
            // Playback commands come from the native, focus-gated service.
            mediaPlaybackRequiresUserGesture = false
        }
        view.setRendererPriorityPolicy(WebView.RENDERER_PRIORITY_IMPORTANT, false)
        WebView.setWebContentsDebuggingEnabled(BuildConfig.DEBUG)
        view.webViewClient = object : WebViewClient() {
            override fun shouldInterceptRequest(webView: WebView, request: WebResourceRequest): WebResourceResponse {
                val uri = request.url
                if (request.method == "GET") {
                    if (uri.scheme == "https" && uri.host == ORIGIN_HOST && uri.port == -1 &&
                        uri.userInfo == null && uri.query == null && uri.fragment == null &&
                        (uri.toString() == ENTRY || (!request.isForMainFrame && isBundledScript(uri)))
                    ) {
                        assets.shouldInterceptRequest(uri)?.let { return it }
                    }
                    if (!request.isForMainFrame && MainActivity.isMedia(uri)) {
                        try {
                            return MainActivity.download(uri)
                        } catch (_: IOException) {
                            // Do not fall back to a WebView network request.
                        }
                    }
                }
                return WebResourceResponse("text/plain", "utf-8", 404, "Not Found", emptyMap(), null)
            }

            override fun shouldOverrideUrlLoading(webView: WebView, request: WebResourceRequest) = true

            override fun onPageStarted(webView: WebView, url: String, favicon: Bitmap?) {
                if (url != ENTRY) onMessage("unavailable")
            }

            override fun onReceivedError(webView: WebView, request: WebResourceRequest, error: WebResourceError) {
                if (request.isForMainFrame) onMessage("unavailable")
            }

            override fun onRenderProcessGone(webView: WebView, detail: RenderProcessGoneDetail): Boolean {
                onMessage("unavailable")
                close()
                return true
            }
        }
    }

    fun open() {
        if (!WebViewFeature.isFeatureSupported(WebViewFeature.WEB_MESSAGE_LISTENER)) {
            onMessage("unavailable")
            return
        }
        WebViewCompat.addWebMessageListener(view, "AtmoShaperAudioHost", setOf(ORIGIN)) { sender, message, origin, isMainFrame, _ ->
            if (!closed && isMainFrame && origin.toString() == ORIGIN && sender.url == ENTRY) {
                message.data?.let(onMessage)
            }
        }
        view.loadUrl(ENTRY)
    }

    fun play(id: String, token: Int, request: Int, savedOnly: Boolean) =
        command("play(${JSONObject.quote(id)}, $token, $request, $savedOnly)")

    fun stopStation(token: Int) = command("stopStation($token)")

    fun setPaused(paused: Boolean, token: Int) = command("setPaused($paused, $token)")

    fun playLayer(sound: NativeMixSound, layer: NativeMixLayer, token: Int) =
        command("playLayer(${JSONObject.quote(sound.id)}, ${JSONObject.quote(sound.kind)}, ${layer.volume}, $token, ${layer.request}, ${layer.savedOnly})")

    fun stopLayer(sound: NativeMixSound, layer: NativeMixLayer, token: Int) =
        command("stopLayer(${JSONObject.quote(sound.id)}, $token, ${layer.request})")

    fun setLayerVolume(sound: NativeMixSound, volume: Float, token: Int) =
        command("setLayerVolume(${JSONObject.quote(sound.id)}, $volume, $token)")

    fun close() {
        if (closed) return
        closed = true
        view.destroy()
    }

    private fun command(call: String) {
        if (!closed && view.url == ENTRY) view.evaluateJavascript("window.atmoNativeAudio?.$call", null)
    }

    private fun isBundledScript(uri: Uri): Boolean =
        uri.encodedPath == "/assets/core/native-audio-player.js" ||
            uri.encodedPath?.matches(BUNDLED_CHUNK) == true

    private companion object {
        const val ORIGIN_HOST = "appassets.androidplatform.net"
        const val ORIGIN = "https://$ORIGIN_HOST"
        const val ENTRY = "$ORIGIN/assets/core/native-audio-player.html"
        val BUNDLED_CHUNK = Regex("/assets/core/chunks/[A-Za-z0-9_.-]+\\.js")
    }
}
