import { DEFAULT_CHIMER_SETTINGS } from "./chimer-timer.js"
import { canCustomizeBackgroundColors, normalizeBackgroundPaletteState, resolveBackgroundRoleColors } from "./background-palette.js"
import { NATIVE_CLOCK_DATABASE } from "./native-clock-storage.js"
import { OFFLINE_CORE_STORAGE_KEY } from "./offline-core.js"
import { getStaticGradientBackgroundOptionsFromChimerSettings } from "./static-gradient-background.js"
import { backgroundPaletteRegistry } from "../components/backgrounds/backgroundPaletteRegistry.ts"

import { readPackagedRecord as readClockRecord } from "./native-readonly-indexed-db.js"
export { readPackagedRecord as readClockRecord } from "./native-readonly-indexed-db.js"

const version = 1
const fonts = new Set(["digital", "mono", "sans", "serif"])
const formats = new Set(["12h", "24h"])
const backgrounds = new Set(["massage-lab-moving-gradient", "static-gradient", "solid-color"])
const isColor = value => typeof value === "string" && /^#[a-f\d]{6}$/i.test(value)
const has = (object, key) => Object.hasOwn(object, key)
const isRecord = value => value !== null && typeof value === "object" && !Array.isArray(value)

/** Project only deliberately supported, device-local display values. A corrupt
 * stored appearance is distinguishable from an absent record or absent field. */
export function projectClockAppearance(settings, publicBackgrounds, packagedBackgrounds = new Set()) {
  if (!isRecord(settings)) throw new Error("Invalid Clock appearance")
  function setting(key, isValid) {
    if (!has(settings, key)) return DEFAULT_CHIMER_SETTINGS[key]
    if (!isValid(settings[key])) throw new Error("Invalid Clock appearance")
    return settings[key]
  }
  const bool = value => typeof value === "boolean"
  const number = (min, max) => value => Number.isFinite(value) && value >= min && value <= max
  const backgroundId = setting("backgroundId", value => typeof value === "string" && value.length <= 128)
  const gradient = getStaticGradientBackgroundOptionsFromChimerSettings(settings)
  const hasBackgroundAccess = publicBackgrounds.has(backgroundId)
  const compatible = hasBackgroundAccess && backgrounds.has(backgroundId)
  const packaged = packagedBackgrounds.has(backgroundId)
  const visual = settings.backgroundVisualPreferences
  // This is an appearance projection only. The renderer separately verifies
  // any packaged effect even when its original palette survives the import.
  const adapter = compatible || packaged ? backgroundPaletteRegistry[backgroundId] : null
  const palette = normalizeBackgroundPaletteState(visual?.palette)
  // Keep the selected renderer's own Harmony restrictions.
  const colors = adapter ? Object.values(resolveBackgroundRoleColors({
    palette,
    adapter,
    mapping: visual?.mappingsByBackground?.[backgroundId],
    canCustomize: canCustomizeBackgroundColors({ hasBackgroundAccess: compatible || packaged }) &&
      (adapter.supportsHarmony !== false || palette.mode !== "harmony"),
  })) : []
  return {
    version,
    format: setting("timeFormat", value => formats.has(value)),
    seconds: setting("showCurrentTimeSeconds", bool),
    font: setting("clockFontFamily", value => fonts.has(value)),
    color: setting("clockModeFontColor", isColor),
    keepAwake: setting("keepTimerScreenAwake", bool),
    glow: setting("clockGlowEnabled", bool),
    glowColor: setting("clockGlowColor", isColor),
    glowStrength: setting("clockGlowStrength", number(0, 1)),
    shadow: setting("clockShadowEnabled", bool),
    shadowColor: setting("clockShadowColor", isColor),
    shadowStrength: setting("clockShadowStrength", number(0, 1)),
    shadowDirection: setting("clockShadowDirection", number(0, 360)),
    shadowDistance: setting("clockShadowDistance", number(0, 32)),
    shadowFeather: setting("clockShadowFeather", number(0, 32)),
    stroke: setting("clockStrokeEnabled", bool),
    strokeColor: setting("clockStrokeColor", isColor),
    strokeWidth: setting("clockStrokeWidth", number(0, 3)),
    rotation: setting("clockRotationEnabled", bool),
    rotationRange: setting("clockRotationRange", number(2, 20)),
    rotationDuration: setting("clockRotationDuration", number(10, 120)),
    forwardGlow: setting("clockForwardGlowEnabled", bool),
    forwardGlowStrength: setting("clockForwardGlowStrength", number(0, 1)),
    forwardGlowLength: setting("clockForwardGlowLength", number(0.5, 4)),
    forwardGlowBlur: setting("clockForwardGlowBlur", number(0, 64)),
    // A saved ID is a preference only. Keep it even when no renderer or
    // verified access is available in the native Clock.
    rememberedBackgroundId: /^[a-z0-9-]{1,128}$/.test(backgroundId) ? backgroundId : "neutral",
    background: compatible ? backgroundId : packaged ? "packaged-effect" : "neutral",
    firstColor: colors[0] ?? "#000000",
    secondColor: colors[1] ?? colors[0] ?? "#000000",
    gradientColors: compatible && backgroundId === "static-gradient" ? colors.slice(0, gradient.colorCount) : [],
    gradientStops: compatible && backgroundId === "static-gradient" ? gradient.stopPositions.slice(0, gradient.colorCount) : [],
    gradientAngle: gradient.angle,
    gradientType: gradient.type,
    gradientCenterX: gradient.centerX,
    gradientCenterY: gradient.centerY,
    gradientRadialShape: gradient.radialShape,
    gradientRadialSize: gradient.radialSize,
    motion: setting("movingBackgroundEnabled", bool),
  }
}

function projectEarlier(record, publicBackgrounds, packagedBackgrounds) {
  if (!isRecord(record) || record.version !== version) throw new Error("Invalid earlier Clock record")
  const fields = {
    timeFormat: "timeFormat", showSeconds: "showCurrentTimeSeconds",
    backgroundId: "backgroundId", motion: "movingBackgroundEnabled",
  }
  const settings = Object.fromEntries(Object.entries(fields)
    .filter(([key]) => has(record, key)).map(([key, target]) => [target, record[key]]))
  for (const color of ["mainColor", "orbColor"]) {
    if (has(record, color) && !isColor(record[color])) throw new Error("Invalid earlier Clock color")
  }
  settings.backgroundVisualPreferences = { palette: {
    mode: "custom", primaryColor: record.mainColor, swatches: [record.mainColor, record.orbColor],
  } }
  if (record.backgroundId === "static-gradient") settings.staticGradientColorCount = 2
  return projectClockAppearance(settings, publicBackgrounds, packagedBackgrounds)
}

/** Current shared-screen appearance takes priority. The static public access
 * projection comes from the packaged document, never from either user store. */
export async function exportClockAppearance(indexedDB, localStorage, publicBackgrounds, packagedBackgrounds = new Set()) {
  const visualizer = await readClockRecord(indexedDB, NATIVE_CLOCK_DATABASE, "clock", "visualizer-settings")
  const shared = visualizer ?? await readClockRecord(indexedDB, NATIVE_CLOCK_DATABASE, "clock", "state")
  if (shared !== undefined) {
    if (!isRecord(shared) || shared.version !== version) throw new Error("Invalid shared Clock record")
    return projectClockAppearance(shared.settings, publicBackgrounds, packagedBackgrounds)
  }
  const earlier = await readClockRecord(indexedDB, OFFLINE_CORE_STORAGE_KEY, "state", "preferences")
  if (earlier !== undefined) return projectEarlier(earlier, publicBackgrounds, packagedBackgrounds)
  const raw = localStorage.getItem(OFFLINE_CORE_STORAGE_KEY)
  if (raw === null) return projectClockAppearance({}, publicBackgrounds)
  if (raw.length > 16384) throw new Error("Earlier Clock record is too large")
  return projectEarlier(JSON.parse(raw), publicBackgrounds, packagedBackgrounds)
}
