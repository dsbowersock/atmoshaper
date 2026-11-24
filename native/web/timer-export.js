import { exportTimerSnapshot } from "../../lib/native-timer-transfer.js"

// The hidden Android transfer page has no API for writing to the WebView.
const channel = window.AtmoShaperTimerTransfer
if (channel) {
  Promise.resolve().then(() => exportTimerSnapshot(window.indexedDB, window.localStorage)).then(
    snapshot => channel.postMessage(JSON.stringify(snapshot)),
    () => channel.postMessage("unavailable"),
  )
}
