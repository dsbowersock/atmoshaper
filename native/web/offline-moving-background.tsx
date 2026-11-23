import { createContext, useContext, type ComponentProps } from "react"
import { MovingGradientSurface } from "@/components/backgrounds/moving-gradient-surface"

/** Standalone adapter: the native origin never imports website account settings. */
export const OfflineReducedMotion = createContext(false)
export function MovingBackground(props: ComponentProps<typeof MovingGradientSurface>) {
  const reduce = useContext(OfflineReducedMotion)
  return <MovingGradientSurface {...props} ambientMotionMode={reduce ? "reduced" : "system"} />
}
