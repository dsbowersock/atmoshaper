package com.atmoshaper.app

import android.content.Context
import org.json.JSONArray

internal data class ClockBackgroundChoice(
    val id: String,
    val label: String,
    val defaults: ClockAppearance?,
) {
    val canApply: Boolean get() = defaults != null
}

/** Reads public, build-time metadata derived from the canonical registry's
 * guest decision. Device appearance files and remembered IDs convey no access.
 */
internal fun loadClockBackgrounds(context: Context): List<ClockBackgroundChoice> =
    context.assets.open("core/clock-backgrounds.json").bufferedReader().use { reader ->
        val catalog = JSONArray(reader.readText())
        List(catalog.length()) { index ->
            val entry = catalog.getJSONObject(index)
            val id = entry.getString("id")
            val defaults = if (entry.getBoolean("guestAccess") && !entry.isNull("defaults")) {
                ClockAppearance.decodePackaged(entry.getJSONObject("defaults").toString()).also {
                    require(it.background != ClockBackground.Neutral && it.background.key == id)
                    require(it.rememberedBackgroundId == id)
                }
            } else null
            ClockBackgroundChoice(id, entry.getString("label"), defaults)
        }.also { choices ->
            require(choices.isNotEmpty() && choices.map { it.id }.distinct().size == choices.size)
        }
    }

internal val ClockAppearance.selectedBackgroundId: String
    get() = rememberedBackgroundId ?: background.key

internal val ClockAppearance.needsBackgroundRecovery: Boolean
    get() = rememberedBackgroundId == null && background == ClockBackground.Neutral

/** Preserve unrelated Clock preferences when applying or recovering a style. */
internal fun ClockAppearance.withBackground(source: ClockBackgroundStyle, rememberedId: String?): ClockAppearance = copy(
    background = source.background,
    rememberedBackgroundId = rememberedId,
    firstColor = source.firstColor,
    secondColor = source.secondColor,
    motion = source.motion,
    gradientColors = source.gradientColors,
    gradientStops = source.gradientStops,
    gradientAngle = source.gradientAngle,
    gradientType = source.gradientType,
    gradientCenterX = source.gradientCenterX,
    gradientCenterY = source.gradientCenterY,
    gradientRadialShape = source.gradientRadialShape,
    gradientRadialSize = source.gradientRadialSize,
)
