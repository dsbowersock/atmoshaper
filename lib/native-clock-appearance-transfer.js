import { DEFAULT_CHIMER_SETTINGS } from "./chimer-timer.js"
import { NATIVE_CLOCK_DATABASE } from "./native-clock-storage.js"
import { OFFLINE_CORE_STORAGE_KEY } from "./offline-core.js"

const version = 1
const fonts = new Set(["digital", "mono", "sans", "serif"])
const formats = new Set(["12h", "24h"])
const backgrounds = new Set(["massage-lab-moving-gradient", "static-gradient", "solid-color"])
const isColor = value => typeof value === "string" && /^#[a-f\d]{6}$/i.test(value)
const has = (object, key) => Object.hasOwn(object, key)
const isRecord = value => value !== null && typeof value === "object" && !Array.isArray(value)

/** Project only deliberately supported, device-local display values. A corrupt
 * stored appearance is distinguishable from an absent record or absent field. */
function project(settings) {
  if (!isRecord(settings)) throw new Error("Invalid Clock appearance")
  function setting(key, isValid) {
    if (!has(settings, key)) return DEFAULT_CHIMER_SETTINGS[key]
    if (!isValid(settings[key])) throw new Error("Invalid Clock appearance")
    return settings[key]
  }
  const bool = value => typeof value === "boolean"
  const backgroundId = setting("backgroundId", value => typeof value === "string" && value.length <= 128)
  const palette = settings.backgroundVisualPreferences?.palette
  const custom = palette?.mode === "custom" || palette?.mode === "harmony"
  return {
    version,
    format: setting("timeFormat", value => formats.has(value)),
    seconds: setting("showCurrentTimeSeconds", bool),
    font: setting("clockFontFamily", value => fonts.has(value)),
    color: setting("clockModeFontColor", isColor),
    keepAwake: setting("keepTimerScreenAwake", bool),
    glow: setting("clockGlowEnabled", bool),
    glowColor: setting("clockGlowColor", isColor),
    shadow: setting("clockShadowEnabled", bool),
    background: backgrounds.has(backgroundId) ? backgroundId : "neutral",
    firstColor: custom && isColor(palette.primaryColor) ? palette.primaryColor : "#FF8C2A",
    secondColor: custom && isColor(palette.swatches?.[1]) ? palette.swatches[1] : "#4169E1",
    motion: setting("movingBackgroundEnabled", bool),
  }
}

function projectEarlier(record) {
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
  return project(settings)
}

/** Read one known IndexedDB key without creating or upgrading its database. */
export function readClockRecord(indexedDB, database, store, key) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(database)
    let absent = false
    request.onupgradeneeded = event => {
      absent = event.oldVersion === 0
      request.transaction.abort()
    }
    request.onblocked = () => reject(new Error("Clock storage is busy"))
    request.onerror = () => absent && request.error?.name === "AbortError"
      ? resolve(undefined) : reject(request.error)
    request.onsuccess = () => {
      const db = request.result
      try {
        const transaction = db.transaction(store, "readonly")
        const read = transaction.objectStore(store).get(key)
        transaction.oncomplete = () => resolve(read.result)
        transaction.onabort = () => reject(transaction.error)
        transaction.onerror = () => reject(transaction.error)
      } catch (error) {
        reject(error)
      } finally {
        db.close()
      }
    }
  })
}

/** Current shared-screen appearance takes priority. Only a confirmed absence
 * permits fallback. Timer, account, download and planner data never cross. */
export async function exportClockAppearance(indexedDB, localStorage) {
  const shared = await readClockRecord(indexedDB, NATIVE_CLOCK_DATABASE, "clock", "state")
  if (shared !== undefined) {
    if (!isRecord(shared) || shared.version !== version) throw new Error("Invalid shared Clock record")
    return project(shared.settings)
  }
  const earlier = await readClockRecord(indexedDB, OFFLINE_CORE_STORAGE_KEY, "state", "preferences")
  if (earlier !== undefined) return projectEarlier(earlier)
  const raw = localStorage.getItem(OFFLINE_CORE_STORAGE_KEY)
  if (raw === null) return project({})
  if (raw.length > 16384) throw new Error("Earlier Clock record is too large")
  return projectEarlier(JSON.parse(raw))
}
