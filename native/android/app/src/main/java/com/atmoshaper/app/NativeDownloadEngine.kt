package com.atmoshaper.app

import android.annotation.SuppressLint
import android.content.Context
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

/** Storage-only document on the legacy app-assets origin. It shares the existing
 * local database with Previous Tools and playback, without exposing bytes or a
 * generic app command bridge to Compose. */
@SuppressLint("SetJavaScriptEnabled")
internal class NativeDownloadEngine(
    private val context: Context,
    private val onReport: (String) -> Unit,
    private val unavailable: () -> Unit,
) {
    private val view = WebView(context)
    private var closed = false

    fun open() {
        val assets = WebViewAssetLoader.Builder()
            .addPathHandler("/assets/", WebViewAssetLoader.AssetsPathHandler(context)).build()
        view.settings.apply {
            javaScriptEnabled = true
            domStorageEnabled = true
            allowFileAccess = false
            allowContentAccess = false
        }
        view.webViewClient = object : WebViewClient() {
            override fun shouldInterceptRequest(webView: WebView, request: WebResourceRequest): WebResourceResponse {
                if (request.method == "GET") {
                    val uri = request.url
                    if (uri.toString() == ENTRY || (!request.isForMainFrame && uri.toString() == SCRIPT)) {
                        assets.shouldInterceptRequest(uri)?.let { return it }
                    }
                    if (!request.isForMainFrame && MainActivity.isMedia(uri)) {
                        try { return MainActivity.download(uri) } catch (_: IOException) { /* Fail closed. */ }
                    }
                }
                return WebResourceResponse("text/plain", "utf-8", 404, "Not Found", emptyMap(), null)
            }

            override fun shouldOverrideUrlLoading(webView: WebView, request: WebResourceRequest) = true

            override fun onReceivedError(webView: WebView, request: WebResourceRequest, error: WebResourceError) {
                if (request.isForMainFrame) unavailable()
            }

            override fun onRenderProcessGone(webView: WebView, detail: RenderProcessGoneDetail): Boolean {
                close()
                unavailable()
                return true
            }
        }
        WebView.setWebContentsDebuggingEnabled(BuildConfig.DEBUG)
        if (WebViewFeature.isFeatureSupported(WebViewFeature.WEB_MESSAGE_LISTENER)) {
            WebViewCompat.addWebMessageListener(view, "AtmoShaperDownloadsHost", setOf(ORIGIN)) { sender, message, origin, isMainFrame, _ ->
                if (!closed && isMainFrame && origin.toString() == ORIGIN && sender.url == ENTRY) {
                    message.data?.takeIf { it.length <= 32_768 }?.let(onReport)
                }
            }
            view.loadUrl(ENTRY)
        } else {
            unavailable()
        }
    }

    fun status(id: String, request: Int) = command("status(${JSONObject.quote(id)}, $request)")
    fun download(id: String, request: Int) = command("download(${JSONObject.quote(id)}, $request)")
    fun cancel() = command("cancel()")

    fun close() {
        if (closed) return
        closed = true
        view.destroy()
    }

    private fun command(call: String) {
        if (!closed && view.url == ENTRY) view.evaluateJavascript("window.atmoNativeAudioDownloads?.$call", null)
    }

    private companion object {
        const val ORIGIN = "https://appassets.androidplatform.net"
        const val ENTRY = "$ORIGIN/assets/core/native-audio-downloads.html"
        const val SCRIPT = "$ORIGIN/assets/core/native-audio-downloads.js"
    }
}
