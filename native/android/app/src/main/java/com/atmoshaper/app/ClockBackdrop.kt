package com.atmoshaper.app

import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.tween
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.drawscope.DrawScope
import androidx.compose.ui.graphics.drawscope.withTransform
import kotlin.math.PI
import kotlin.math.abs
import kotlin.math.cos
import kotlin.math.hypot
import kotlin.math.sin
import kotlin.math.sqrt

@Composable
internal fun ClockBackdrop(appearance: ClockAppearance) {
    val first = clockColor(appearance.firstColor)
    val second = clockColor(appearance.secondColor)
    val position = if (appearance.background == ClockBackground.LavaLamp && appearance.motion && systemMotionEnabled()) {
        val animation = rememberInfiniteTransition(label = "Lava Lamp")
        animation.animateFloat(-1f, 1f, infiniteRepeatable(tween(28000), RepeatMode.Reverse), label = "Orb drift")
    } else {
        null
    }
    Canvas(Modifier.fillMaxSize()) {
        when (appearance.background) {
            ClockBackground.Neutral, ClockBackground.Packaged -> Unit
            ClockBackground.SolidColor -> drawRect(first)
            ClockBackground.StaticGradient -> drawStaticGradient(appearance)
            ClockBackground.LavaLamp -> drawLavaLamp(first, second, position?.value ?: 0f)
        }
    }
}

/** Retain the web fallback's four softly layered color fields on a dark base.
 * A calm frame keeps the authored colors visible when motion is disabled. */
private fun DrawScope.drawLavaLamp(primary: Color, secondary: Color, drift: Float) {
    drawRect(clockChromeColor)
    fun orb(color: Color, alpha: Float, x: Float, y: Float, radius: Float) {
        drawRect(Brush.radialGradient(
            0f to color.copy(alpha = alpha),
            0.47f to color.copy(alpha = alpha * 0.55f),
            1f to color.copy(alpha = 0f),
            center = Offset(size.width * x, size.height * y),
            radius = size.maxDimension * radius,
        ))
    }
    orb(secondary, 0.28f, 0.22f - 0.06f * drift, 0.82f + 0.03f * drift, 0.36f)
    orb(primary, 0.32f, 0.68f + 0.08f * drift, 0.78f - 0.04f * drift, 0.38f)
    orb(secondary, 0.39f, 0.78f - 0.06f * drift, 0.18f + 0.05f * drift, 0.37f)
    orb(primary, 0.43f, 0.18f + 0.05f * drift, 0.22f - 0.05f * drift, 0.35f)
}

/** CSS linear gradients project the viewport onto the gradient axis. Radial
 * gradients draw in normalized ellipse space to retain the authored CSS stops. */
private fun DrawScope.drawStaticGradient(appearance: ClockAppearance) {
    val colors = appearance.gradientColors.ifEmpty { listOf(appearance.firstColor, appearance.secondColor) }
    val stops = appearance.gradientStops.ifEmpty { listOf(0f, 100f) }
    val colorStops = stops.zip(colors) { stop, color -> (stop / 100f) to clockColor(color) }.toTypedArray()
    if (appearance.gradientType == ClockGradientType.Linear) {
        val angle = appearance.gradientAngle * (PI / 180)
        val dx = sin(angle).toFloat()
        val dy = -cos(angle).toFloat()
        val reach = (abs(dx) * size.width + abs(dy) * size.height) / 2f
        val offset = Offset(dx * reach, dy * reach)
        val center = Offset(size.width / 2f, size.height / 2f)
        drawRect(Brush.linearGradient(*colorStops, start = center - offset, end = center + offset))
        return
    }
    val center = Offset(size.width * appearance.gradientCenterX / 100f, size.height * appearance.gradientCenterY / 100f)
    val radii = radialGradientRadii(size, center, appearance.gradientRadialShape, appearance.gradientRadialSize)
    if (radii.width == 0f || radii.height == 0f) {
        drawRect(clockColor(colors.last()))
        return
    }
    val rectangle = Size(size.width / radii.width, size.height / radii.height)
    val corner = Offset(-center.x / radii.width, -center.y / radii.height)
    withTransform({
        translate(center.x, center.y)
        scale(radii.width, radii.height, pivot = Offset.Zero)
    }) {
        drawRect(Brush.radialGradient(*colorStops, center = Offset.Zero, radius = 1f), topLeft = corner, size = rectangle)
    }
}

private fun radialGradientRadii(
    bounds: Size,
    center: Offset,
    shape: ClockGradientShape,
    extent: ClockGradientExtent,
): Size {
    val closest = extent == ClockGradientExtent.ClosestSide || extent == ClockGradientExtent.ClosestCorner
    val corner = extent == ClockGradientExtent.ClosestCorner || extent == ClockGradientExtent.FarthestCorner
    val width = if (closest) minOf(center.x, bounds.width - center.x) else maxOf(center.x, bounds.width - center.x)
    val height = if (closest) minOf(center.y, bounds.height - center.y) else maxOf(center.y, bounds.height - center.y)
    if (shape == ClockGradientShape.Circle) {
        val radius = when {
            corner -> hypot(width, height)
            closest -> minOf(width, height)
            else -> maxOf(width, height)
        }
        return Size(radius, radius)
    }
    // A corner-ended ellipse uses the side-ended ellipse ratio, scaled until
    // the chosen corner's normalized diagonal reaches the ending stop.
    val stretch = if (corner) sqrt(2f) else 1f
    return Size(width * stretch, height * stretch)
}
