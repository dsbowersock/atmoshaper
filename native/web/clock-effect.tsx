import { createRoot } from "react-dom/client"
import publicKeys from "@/native/offline-access-public-keys.json"
import { getBackgroundDefinition, userCanUseBackground } from "@/components/backgrounds/backgroundRegistry"
import { OFFLINE_ACCESS_DB, readProjectedOfflineBackgroundAccess } from "@/lib/offline-background-access"
import { readPackagedRecord } from "@/lib/native-readonly-indexed-db"
import { OfflineBackgroundSurface } from "./offline-backgrounds"

type EffectHost = Window & {
  AtmoShaperClockEffect?: { postMessage: (status: string) => void }
  atmoShowClockEffect?: (id: string, primary: string, secondary: string, motion: boolean) => Promise<void>
}

const host = window as EffectHost
const channel = host.AtmoShaperClockEffect
const root = document.getElementById("root")
const hexColor = /^#[a-f\d]{6}$/i

if (root && channel) {
  let started = false
  let failed = false
  const reportFailure = () => {
    if (failed) return
    failed = true
    channel.postMessage("failed")
  }
  const reportReady = () => {
    if (!failed && root.querySelector("[data-offline-background] > *")) channel.postMessage("ready")
    else reportFailure()
  }
  window.addEventListener("webglcontextcreationerror", reportFailure, true)
  window.addEventListener("webglcontextlost", reportFailure, true)
  host.atmoShowClockEffect = async (id, primary, secondary, motion) => {
    if (started) return
    started = true
    if (!/^[a-z0-9-]{1,100}$/.test(id) || !hexColor.test(primary) || !hexColor.test(secondary) || typeof motion !== "boolean") return reportFailure()
    const selected = getBackgroundDefinition(id)
    if (selected.id !== id || !selected.category.includes("clock") || !selected.component) return reportFailure()
    const read = () => readPackagedRecord(window.indexedDB, OFFLINE_ACCESS_DB, "access", "state")
    const projection = await readProjectedOfflineBackgroundAccess(read, publicKeys, new Set([id]))
    const access = {
      featureKeys: projection.status === "verified" && projection.paidThrough !== null
        && projection.clockValidAfter !== null && Date.now() >= projection.clockValidAfter
        && Date.now() < projection.paidThrough ? ["premium_backgrounds"] : [],
      ownedBackgroundIds: projection.ownedIds,
    }
    if (!userCanUseBackground(selected, access)) return reportFailure()
    createRoot(root).render(<OfflineBackgroundSurface selectedId={id} access={access}
      mainColor={primary} orbColor={secondary} motion={motion} onFailed={reportFailure} onReady={reportReady} />)
  }
}
