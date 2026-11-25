import { exportClockAppearance } from "../../lib/native-clock-appearance-transfer.js"

// This dedicated packaged document has no screen, navigation or write API.
const channel = window.AtmoShaperClockAppearance
if (channel) {
  const publicBackgrounds = new Set(document.currentScript?.dataset.publicBackgrounds?.split(",") ?? [])
  const packagedBackgrounds = new Set(document.currentScript?.dataset.packagedBackgrounds?.split(",") ?? [])
  Promise.resolve().then(() => exportClockAppearance(window.indexedDB, window.localStorage, publicBackgrounds, packagedBackgrounds)).then(
    appearance => channel.postMessage(JSON.stringify(appearance)),
    () => channel.postMessage("unavailable"),
  )
}
