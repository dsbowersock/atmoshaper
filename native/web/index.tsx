import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { WebsiteApp } from "./website-app"
import { installPackagedFontFetch } from "./platform/assets"

const root = document.getElementById("root")
if (!root) throw new Error("The offline app root is missing.")
document.documentElement.dataset.nativeApp = "local"
installPackagedFontFetch()
createRoot(root).render(<StrictMode><WebsiteApp /></StrictMode>)
