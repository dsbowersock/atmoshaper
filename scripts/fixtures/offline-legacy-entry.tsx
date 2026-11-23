// Compatibility harness for the earlier preview's storage/download regressions.
// The normal build cannot select this entry and does not ship its old interface.
import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { OfflineCoreApp } from "@/native/web/offline-core-app"
import { createOfflineCoreStorage } from "@/lib/offline-core-storage"
const root = document.getElementById("root")
if (!root) throw new Error("The compatibility root is missing.")
const store = createOfflineCoreStorage()
void store.load().then(initial => createRoot(root).render(<StrictMode><OfflineCoreApp store={store} initial={initial} /></StrictMode>))
