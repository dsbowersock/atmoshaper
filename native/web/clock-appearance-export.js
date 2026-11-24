import { exportClockAppearance } from "../../lib/native-clock-appearance-transfer.js"

// This dedicated packaged document has no screen, navigation or write API.
const channel = window.AtmoShaperClockAppearance
if (channel) {
  Promise.resolve().then(() => exportClockAppearance(window.indexedDB, window.localStorage)).then(
    appearance => channel.postMessage(JSON.stringify(appearance)),
    () => channel.postMessage("unavailable"),
  )
}
