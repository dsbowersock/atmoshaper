"use client"

import { useSettings } from "@/components/providers/settings-provider"
import { MovingGradientSurface, type MovingGradientSurfaceProps } from "@/components/backgrounds/moving-gradient-surface"

/** Website adapter keeps the shared renderer on the existing motion preference. */
export function MovingBackground(props: Omit<MovingGradientSurfaceProps, "ambientMotionMode">) {
  const { settings } = useSettings()
  return <MovingGradientSurface {...props} ambientMotionMode={settings.ambientMotionMode} />
}
