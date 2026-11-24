import { exportClockAppearance } from "../../lib/native-clock-appearance-transfer.js"

// This dedicated packaged document has no screen, navigation or write API.
const channel = window.AtmoShaperClockAppearance
if (channel) {
  const publicBackgrounds = new Set(document.currentScript?.dataset.publicBackgrounds?.split(",") ?? [])
  Promise.resolve().then(() => exportClockAppearance(window.indexedDB, window.localStorage, publicBackgrounds)).then(
    appearance => channel.postMessage(JSON.stringify(appearance)),
    () => channel.postMessage("unavailable"),
  )
}
