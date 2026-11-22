import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { OfflineCoreApp } from "./offline-core-app"
import { createOfflineCoreStorage } from "@/lib/offline-core-storage"

const root = document.getElementById("root")
if (!root) throw new Error("The offline app root is missing.")
const store = createOfflineCoreStorage()
void store.load().then(initial => createRoot(root).render(<StrictMode><OfflineCoreApp store={store} initial={initial} /></StrictMode>))
