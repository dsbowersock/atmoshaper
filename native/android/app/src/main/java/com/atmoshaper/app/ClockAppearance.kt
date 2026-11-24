package com.atmoshaper.app

import android.annotation.SuppressLint
import android.content.Context
import android.net.Uri
import android.util.AtomicFile
import android.webkit.WebResourceRequest
import android.webkit.WebResourceResponse
import android.webkit.WebView
import androidx.webkit.WebViewAssetLoader
import androidx.webkit.WebViewClientCompat
import androidx.webkit.WebViewCompat
import androidx.webkit.WebViewFeature
import kotlinx.coroutines.suspendCancellableCoroutine
import kotlinx.coroutines.withTimeoutOrNull
import org.json.JSONObject
import java.io.ByteArrayInputStream
import java.io.File
import java.io.FileNotFoundException
import kotlin.coroutines.resume

internal enum class ClockTypeface(val key: String, val label: Int) {
    Digital("digital", R.string.clock_font_digital),
    Mono("mono", R.string.clock_font_mono),
    Sans("sans", R.string.clock_font_sans),
    Serif("serif", R.string.clock_font_serif),
}

internal enum class ClockBackground(val key: String) {
    LavaLamp("massage-lab-moving-gradient"),
    StaticGradient("static-gradient"),
    SolidColor("solid-color"),
    Neutral("neutral"),
}

internal data class ClockAppearance(
    val twentyFourHour: Boolean,
    val seconds: Boolean,
    val font: ClockTypeface,
    val color: String,
    val keepAwake: Boolean,
    val glow: Boolean,
    val glowColor: String,
    val shadow: Boolean,
    val background: ClockBackground,
    val firstColor: String,
    val secondColor: String,
    val motion: Boolean,
) {
    fun encode(): String = JSONObject()
        .put("version", 1)
        .put("format", if (twentyFourHour) "24h" else "12h")
        .put("seconds", seconds)
        .put("font", font.key)
        .put("color", color)
        .put("keepAwake", keepAwake)
        .put("glow", glow)
        .put("glowColor", glowColor)
        .put("shadow", shadow)
        .put("background", background.key)
        .put("firstColor", firstColor)
        .put("secondColor", secondColor)
        .put("motion", motion)
        .toString()

    companion object {
        private val hexColor = Regex("#[0-9a-fA-F]{6}")

        /** Validate the bounded payload both at the WebView boundary and on disk. */
        fun decode(value: String): ClockAppearance {
            require(value.length <= 2048)
            val json = JSONObject(value)
            require(json.get("version") == 1)
            val format = json.get("format")
            require(format == "12h" || format == "24h")
            fun color(key: String) = (json.get(key) as String).also { require(hexColor.matches(it)) }
            return ClockAppearance(
                twentyFourHour = format == "24h",
                seconds = json.get("seconds") as Boolean,
                font = ClockTypeface.entries.first { it.key == json.get("font") },
                color = color("color"),
                keepAwake = json.get("keepAwake") as Boolean,
                glow = json.get("glow") as Boolean,
                glowColor = color("glowColor"),
                shadow = json.get("shadow") as Boolean,
                background = ClockBackground.entries.first { it.key == json.get("background") },
                firstColor = color("firstColor"),
                secondColor = color("secondColor"),
                motion = json.get("motion") as Boolean,
            )
        }
    }
}

/** The atomic native copy is the import marker. Neither failed writes nor
 * unreadable files allow a second import to overwrite an existing copy. */
internal class ClockAppearanceFile(path: File) {
    private val file = AtomicFile(path)

    constructor(context: Context) : this(File(context.filesDir, "clock-appearance.json"))

    fun read(): ClockAppearance? = synchronized(lock) {
        try {
            ClockAppearance.decode(file.readFully().toString(Charsets.UTF_8))
        } catch (error: FileNotFoundException) {
            if (file.baseFile.exists()) throw error
            null
        }
    }

    fun importIfAbsent(appearance: ClockAppearance): ClockAppearance = synchronized(lock) {
        read() ?: save(appearance)
    }

    fun save(appearance: ClockAppearance): ClockAppearance = synchronized(lock) {
        val bytes = appearance.encode().toByteArray()
        val output = file.startWrite()
        try {
            output.write(bytes)
            output.fd.sync()
            file.finishWrite(output)
        } catch (error: Exception) {
            file.failWrite(output)
            throw error
        }
        check(read() == appearance) { "Clock appearance readback did not match" }
        appearance
    }

    private companion object {
        val lock = Any()
    }
}

private const val origin = "https://appassets.androidplatform.net"
private const val exportPage = "$origin/assets/core/clock-appearance-export.html"
private const val exportScript = "$origin/assets/core/clock-appearance-export.js"
private const val channel = "AtmoShaperClockAppearance"

/** Open only the packaged read-only exporter on the original WebView profile.
 * The temporary WebView has no visible surface, general bridge or network path. */
@SuppressLint("SetJavaScriptEnabled")
internal suspend fun readPackagedClockAppearance(context: Context): ClockAppearance? {
    if (!WebViewFeature.isFeatureSupported(WebViewFeature.WEB_MESSAGE_LISTENER)) return null
    val webView = WebView(context)
    try {
        return withTimeoutOrNull(6000) {
            suspendCancellableCoroutine { result ->
                fun finish(appearance: ClockAppearance?) {
                    if (result.isActive) result.resume(appearance)
                }

                val loader = WebViewAssetLoader.Builder()
                    .addPathHandler("/assets/", WebViewAssetLoader.AssetsPathHandler(context))
                    .build()
                webView.settings.javaScriptEnabled = true
                webView.settings.domStorageEnabled = true
                webView.settings.allowFileAccess = false
                webView.settings.allowContentAccess = false
                webView.webViewClient = object : WebViewClientCompat() {
                    override fun shouldOverrideUrlLoading(view: WebView, request: WebResourceRequest) = true

                    override fun shouldInterceptRequest(view: WebView, request: WebResourceRequest): WebResourceResponse {
                        val allowed = if (request.isForMainFrame) exportPage else exportScript
                        if (request.method == "GET" && request.url.toString() == allowed) {
                            loader.shouldInterceptRequest(request.url)?.let { return it }
                        }
                        return WebResourceResponse("text/plain", "utf-8", 403, "Forbidden", emptyMap(), ByteArrayInputStream(byteArrayOf()))
                    }

                    override fun onRenderProcessGone(view: WebView, detail: android.webkit.RenderProcessGoneDetail): Boolean {
                        finish(null)
                        return true
                    }
                }
                WebViewCompat.addWebMessageListener(webView, channel, setOf(origin)) { view, message, source, mainFrame, _ ->
                    if (mainFrame && source == Uri.parse(origin) && view.url == exportPage) {
                        finish(runCatching { ClockAppearance.decode(checkNotNull(message.data)) }.getOrNull())
                    }
                }
                webView.loadUrl(exportPage)
            }
        }
    } finally {
        webView.destroy()
    }
}
