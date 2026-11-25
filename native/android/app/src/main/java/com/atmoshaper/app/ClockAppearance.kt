package com.atmoshaper.app

import android.annotation.SuppressLint
import android.content.Context
import android.net.Uri
import android.webkit.WebResourceRequest
import android.webkit.WebResourceResponse
import android.webkit.WebView
import androidx.webkit.WebViewAssetLoader
import androidx.webkit.WebViewClientCompat
import androidx.webkit.WebViewCompat
import androidx.webkit.WebViewFeature
import kotlinx.coroutines.suspendCancellableCoroutine
import kotlinx.coroutines.withTimeoutOrNull
import org.json.JSONArray
import org.json.JSONObject
import java.io.ByteArrayInputStream
import java.io.File
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
    Packaged("packaged-effect"),
    Neutral("neutral"),
}

internal enum class ClockGradientType(val key: String) { Linear("linear"), Radial("radial") }
internal enum class ClockGradientShape(val key: String) { Circle("circle"), Ellipse("ellipse") }
internal enum class ClockGradientExtent(val key: String) {
    ClosestSide("closest-side"), FarthestSide("farthest-side"),
    ClosestCorner("closest-corner"), FarthestCorner("farthest-corner"),
}

private val clockBackgroundIdPattern = Regex("[a-z0-9-]{1,128}")

/** The native settings editor and both appearance read paths share these bounds. */
internal object ClockEffectRange {
    val strength = 0f..1f
    val shadowDirection = 0f..360f
    val shadowDistance = 0f..32f
    val shadowFeather = 0f..32f
    val strokeWidth = 0f..3f
    val rotationRange = 2f..20f
    val rotationDuration = 10f..120f
    val forwardGlowLength = 0.5f..4f
    val forwardGlowBlur = 0f..64f
}

internal val clockHexColor = Regex("#[a-fA-F0-9]{6}")

internal data class ClockBackgroundStyle(
    val background: ClockBackground,
    val firstColor: String,
    val secondColor: String,
    val motion: Boolean,
    val gradientColors: List<String>,
    val gradientStops: List<Float>,
    val gradientAngle: Float,
    val gradientType: ClockGradientType,
    val gradientCenterX: Float,
    val gradientCenterY: Float,
    val gradientRadialShape: ClockGradientShape,
    val gradientRadialSize: ClockGradientExtent,
) {
    fun matches(id: String): Boolean = when (background) {
        ClockBackground.Neutral -> false
        ClockBackground.Packaged -> clockBackgroundIdPattern.matches(id) && ClockBackground.entries.none { it.key == id }
        else -> background.key == id
    }

    fun encode(json: JSONObject = JSONObject()): JSONObject = json
        .put("background", background.key)
        .put("firstColor", firstColor)
        .put("secondColor", secondColor)
        .put("motion", motion)
        .put("gradientColors", JSONArray(gradientColors))
        .put("gradientStops", JSONArray(gradientStops))
        .put("gradientAngle", gradientAngle.toDouble())
        .put("gradientType", gradientType.key)
        .put("gradientCenterX", gradientCenterX.toDouble())
        .put("gradientCenterY", gradientCenterY.toDouble())
        .put("gradientRadialShape", gradientRadialShape.key)
        .put("gradientRadialSize", gradientRadialSize.key)

    companion object {
        fun decode(json: JSONObject): ClockBackgroundStyle {
            fun <T> option(key: String, values: List<T>, fallback: T, keyOf: (T) -> String): T {
                if (!json.has(key)) return fallback
                val value = json.get(key)
                return values.first { keyOf(it) == value }
            }
            val colors = if (json.has("gradientColors")) json.getJSONArray("gradientColors") else null
            val stops = if (json.has("gradientStops")) json.getJSONArray("gradientStops") else null
            val gradientColors = colors?.let { values ->
                require(values.length() in 0..7)
                List(values.length()) { (values.get(it) as String).also { hex -> require(clockHexColor.matches(hex)) } }
            }.orEmpty()
            val gradientStops = stops?.let { values ->
                require(values.length() == gradientColors.size)
                List(values.length()) { (values.get(it) as Number).toFloat().also { stop -> require(stop in 0f..100f) } }
            }.orEmpty()
            require(gradientColors.size == gradientStops.size && gradientColors.size != 1)
            require(gradientStops.zipWithNext().all { (first, second) -> first <= second })
            return ClockBackgroundStyle(
                background = ClockBackground.entries.first { it.key == json.get("background") },
                firstColor = json.clockColor("firstColor"),
                secondColor = json.clockColor("secondColor"),
                motion = json.get("motion") as Boolean,
                gradientColors = gradientColors,
                gradientStops = gradientStops,
                gradientAngle = json.clockNumber("gradientAngle", 145f, 0f..360f),
                gradientType = option("gradientType", ClockGradientType.entries, ClockGradientType.Linear) { it.key },
                gradientCenterX = json.clockNumber("gradientCenterX", 50f, 0f..100f),
                gradientCenterY = json.clockNumber("gradientCenterY", 50f, 0f..100f),
                gradientRadialShape = option("gradientRadialShape", ClockGradientShape.entries, ClockGradientShape.Ellipse) { it.key },
                gradientRadialSize = option("gradientRadialSize", ClockGradientExtent.entries, ClockGradientExtent.FarthestCorner) { it.key },
            )
        }
    }
}

private fun JSONObject.clockColor(key: String, default: String? = null): String =
    ((if (has(key)) get(key) else checkNotNull(default)) as String).also { require(clockHexColor.matches(it)) }

private fun JSONObject.clockNumber(key: String, default: Float, range: ClosedFloatingPointRange<Float>): Float =
    (if (has(key)) (get(key) as Number).toFloat() else default).also { require(it in range) }

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
    val glowStrength: Float = 0.72f,
    val shadowColor: String = "#000000",
    val shadowStrength: Float = 0.42f,
    val shadowDirection: Float = 45f,
    val shadowDistance: Float = 10f,
    val shadowFeather: Float = 8f,
    val stroke: Boolean = false,
    val strokeColor: String = "#050505",
    val strokeWidth: Float = 1f,
    val rotation: Boolean = false,
    val rotationRange: Float = 10f,
    val rotationDuration: Float = 40f,
    val forwardGlow: Boolean = false,
    val forwardGlowStrength: Float = 1f,
    val forwardGlowLength: Float = 1f,
    val forwardGlowBlur: Float = 28f,
    val gradientColors: List<String> = emptyList(),
    val gradientStops: List<Float> = emptyList(),
    val gradientAngle: Float = 145f,
    val rememberedBackgroundId: String? = null,
    val gradientType: ClockGradientType = ClockGradientType.Linear,
    val gradientCenterX: Float = 50f,
    val gradientCenterY: Float = 50f,
    val gradientRadialShape: ClockGradientShape = ClockGradientShape.Ellipse,
    val gradientRadialSize: ClockGradientExtent = ClockGradientExtent.FarthestCorner,
    val savedBackgroundStyles: Map<String, ClockBackgroundStyle> = emptyMap(),
) {
    val backgroundStyle: ClockBackgroundStyle
        get() = ClockBackgroundStyle(
            background, firstColor, secondColor, motion, gradientColors, gradientStops, gradientAngle,
            gradientType, gradientCenterX, gradientCenterY, gradientRadialShape, gradientRadialSize,
        )

    /** Keep the active style in the v1 fields and store only inactive native styles alongside it. */
    fun encode(): String = backgroundStyle.encode(JSONObject()
        .put("version", 1)
        .put("format", if (twentyFourHour) "24h" else "12h")
        .put("seconds", seconds)
        .put("font", font.key)
        .put("color", color)
        .put("keepAwake", keepAwake)
        .put("glow", glow)
        .put("glowColor", glowColor)
        .put("glowStrength", glowStrength.toDouble())
        .put("shadow", shadow)
        .put("shadowColor", shadowColor)
        .put("shadowStrength", shadowStrength.toDouble())
        .put("shadowDirection", shadowDirection.toDouble())
        .put("shadowDistance", shadowDistance.toDouble())
        .put("shadowFeather", shadowFeather.toDouble())
        .put("stroke", stroke)
        .put("strokeColor", strokeColor)
        .put("strokeWidth", strokeWidth.toDouble())
        .put("rotation", rotation)
        .put("rotationRange", rotationRange.toDouble())
        .put("rotationDuration", rotationDuration.toDouble())
        .put("forwardGlow", forwardGlow)
        .put("forwardGlowStrength", forwardGlowStrength.toDouble())
        .put("forwardGlowLength", forwardGlowLength.toDouble())
        .put("forwardGlowBlur", forwardGlowBlur.toDouble())
        .put("rememberedBackgroundId", rememberedBackgroundId))
        .apply {
            if (savedBackgroundStyles.isNotEmpty()) {
                val styles = JSONObject()
                savedBackgroundStyles.forEach { (id, style) -> styles.put(id, style.encode()) }
                put("savedBackgroundStyles", styles)
            }
        }.toString()

    companion object {
        val readOnly = ClockAppearance(false, false, ClockTypeface.Digital, "#FFFFFF",
            false, false, "#FF7A1A", false, ClockBackground.Neutral, "#000000", "#000000", false)

        /** Native-only profiles may extend the original bounded transfer payload on disk. */
        fun decode(value: String): ClockAppearance = decode(value, allowSavedStyles = true)

        fun decodePackaged(value: String): ClockAppearance = decode(value, allowSavedStyles = false)

        private fun decode(value: String, allowSavedStyles: Boolean): ClockAppearance {
            require(value.length <= if (allowSavedStyles) 65_536 else 2048)
            val json = JSONObject(value)
            require(json.get("version") == 1)
            val format = json.get("format")
            require(format == "12h" || format == "24h")
            fun color(key: String, default: String? = null) = json.clockColor(key, default)
            fun number(key: String, default: Float, range: ClosedFloatingPointRange<Float>) =
                json.clockNumber(key, default, range)
            val style = ClockBackgroundStyle.decode(json)
            val rememberedId = if (json.has("rememberedBackgroundId")) {
                (json.get("rememberedBackgroundId") as String).also { require(clockBackgroundIdPattern.matches(it)) }
            } else null
            if (style.background == ClockBackground.Packaged) require(rememberedId != null && style.matches(rememberedId))
            val savedStyles = if (json.has("savedBackgroundStyles")) {
                require(allowSavedStyles)
                val styles = json.getJSONObject("savedBackgroundStyles")
                require(styles.length() <= 128)
                styles.keys().asSequence().associateWith { id ->
                    ClockBackgroundStyle.decode(styles.getJSONObject(id)).also {
                        require(it.matches(id))
                        require(id != (rememberedId ?: style.background.key))
                    }
                }
            } else emptyMap()
            return ClockAppearance(
                twentyFourHour = format == "24h",
                seconds = json.get("seconds") as Boolean,
                font = ClockTypeface.entries.first { it.key == json.get("font") },
                color = color("color"),
                keepAwake = json.get("keepAwake") as Boolean,
                glow = json.get("glow") as Boolean,
                glowColor = color("glowColor"),
                shadow = json.get("shadow") as Boolean,
                background = style.background,
                firstColor = style.firstColor,
                secondColor = style.secondColor,
                motion = style.motion,
                glowStrength = number("glowStrength", 0.72f, ClockEffectRange.strength),
                shadowColor = color("shadowColor", "#000000"),
                shadowStrength = number("shadowStrength", 0.42f, ClockEffectRange.strength),
                shadowDirection = number("shadowDirection", 45f, ClockEffectRange.shadowDirection),
                shadowDistance = number("shadowDistance", 10f, ClockEffectRange.shadowDistance),
                shadowFeather = number("shadowFeather", 8f, ClockEffectRange.shadowFeather),
                stroke = if (json.has("stroke")) json.get("stroke") as Boolean else false,
                strokeColor = color("strokeColor", "#050505"),
                strokeWidth = number("strokeWidth", 1f, ClockEffectRange.strokeWidth),
                rotation = if (json.has("rotation")) json.get("rotation") as Boolean else false,
                rotationRange = number("rotationRange", 10f, ClockEffectRange.rotationRange),
                rotationDuration = number("rotationDuration", 40f, ClockEffectRange.rotationDuration),
                forwardGlow = if (json.has("forwardGlow")) json.get("forwardGlow") as Boolean else false,
                forwardGlowStrength = number("forwardGlowStrength", 1f, ClockEffectRange.strength),
                forwardGlowLength = number("forwardGlowLength", 1f, ClockEffectRange.forwardGlowLength),
                forwardGlowBlur = number("forwardGlowBlur", 28f, ClockEffectRange.forwardGlowBlur),
                gradientColors = style.gradientColors,
                gradientStops = style.gradientStops,
                gradientAngle = style.gradientAngle,
                rememberedBackgroundId = rememberedId,
                gradientType = style.gradientType,
                gradientCenterX = style.gradientCenterX,
                gradientCenterY = style.gradientCenterY,
                gradientRadialShape = style.gradientRadialShape,
                gradientRadialSize = style.gradientRadialSize,
                savedBackgroundStyles = savedStyles,
            )
        }
    }
}

/** The atomic native copy is the import marker. AndroidX stages even the
 * first write on older Android releases. A damaged final copy blocks import. */
internal class ClockAppearanceFile(path: File) {
    private val file = VerifiedAtomicFile(path, ClockAppearance::encode, ClockAppearance::decode)

    constructor(context: Context) : this(File(context.filesDir, "clock-appearance.json"))

    fun read(): ClockAppearance? = synchronized(lock) { file.read() }

    fun importIfAbsent(appearance: ClockAppearance): ClockAppearance = synchronized(lock) {
        file.read() ?: file.write(appearance)
    }

    /** Previous Clock builds collapsed unsupported choices to neutral. Recover
     * that background only, and keep newer native font/time/effect changes. */
    fun recoverBackgroundIfUnrecorded(appearance: ClockAppearance): ClockAppearance = synchronized(lock) {
        val current = checkNotNull(file.read())
        val incomingId = appearance.rememberedBackgroundId
        val recoverPackaged = current.background == ClockBackground.Neutral && current.rememberedBackgroundId == incomingId &&
            appearance.background == ClockBackground.Packaged
        if ((current.needsBackgroundRecovery || recoverPackaged) && incomingId != null) {
            file.write(current.withBackground(appearance.backgroundStyle, appearance.rememberedBackgroundId))
        } else current
    }

    /** Settings drafts can outlive a view. Merge only their time and text preferences. */
    fun saveSettings(draft: ClockAppearance): ClockAppearance = synchronized(lock) {
        val current = checkNotNull(file.read())
        file.write(draft.withBackground(current.backgroundStyle, current.rememberedBackgroundId)
            .copy(savedBackgroundStyles = current.savedBackgroundStyles))
    }

    /** Commit the selection and inactive styles together so a switch cannot lose the old style. */
    fun saveBackground(id: String, style: ClockBackgroundStyle): ClockAppearance = synchronized(lock) {
        require(style.matches(id))
        val current = checkNotNull(file.read())
        val previousId = current.selectedBackgroundId
        val savedStyles = current.savedBackgroundStyles - id
        val keepPrevious = previousId != id && current.backgroundStyle.matches(previousId)
        file.write(current.withBackground(style, id).copy(
            savedBackgroundStyles = if (keepPrevious) savedStyles + (previousId to current.backgroundStyle) else savedStyles,
        ))
    }

    fun save(appearance: ClockAppearance): ClockAppearance = synchronized(lock) { file.write(appearance) }

    private companion object {
        val lock = Any()
    }
}

private const val origin = "https://appassets.androidplatform.net"
internal enum class PackagedExport(val asset: String, val channel: String) {
    Clock("clock-appearance-export", "AtmoShaperClockAppearance"),
    BackgroundAccess("background-access-export", "AtmoShaperBackgroundAccess"),
    Timer("timer-export", "AtmoShaperTimerTransfer"),
}

internal suspend fun readPackagedClockAppearance(context: Context): ClockAppearance? =
    readPackagedExport(context, PackagedExport.Clock, ClockAppearance::decodePackaged)

/** Open only the packaged read-only exporter on the original WebView profile.
 * The temporary WebView has no visible surface, general bridge or network path. */
@SuppressLint("SetJavaScriptEnabled")
internal suspend fun <T> readPackagedExport(context: Context, export: PackagedExport, decode: (String) -> T): T? {
    if (!WebViewFeature.isFeatureSupported(WebViewFeature.WEB_MESSAGE_LISTENER)) return null
    val exportPage = "$origin/assets/core/${export.asset}.html"
    val exportScript = "$origin/assets/core/${export.asset}.js"
    val webView = WebView(context)
    try {
        return withTimeoutOrNull(6000) {
            suspendCancellableCoroutine { result ->
                fun finish(value: T?) {
                    if (result.isActive) result.resume(value)
                }

                val loader = WebViewAssetLoader.Builder()
                    .addPathHandler("/assets/", WebViewAssetLoader.AssetsPathHandler(context))
                    .build()
                webView.settings.javaScriptEnabled = true
                webView.settings.domStorageEnabled = true
                webView.settings.allowFileAccess = false
                webView.settings.allowContentAccess = false
                webView.settings.blockNetworkLoads = true
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
                WebViewCompat.addWebMessageListener(webView, export.channel, setOf(origin)) { view, message, source, mainFrame, _ ->
                    if (mainFrame && source == Uri.parse(origin) && view.url == exportPage) {
                        finish(runCatching { decode(checkNotNull(message.data)) }.getOrNull())
                    }
                }
                webView.loadUrl(exportPage)
            }
        }
    } finally {
        webView.destroy()
    }
}
