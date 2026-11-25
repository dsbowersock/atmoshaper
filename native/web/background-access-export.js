import publicKeys from "@/native/offline-access-public-keys.json"
import { OFFLINE_ACCESS_DB, readProjectedOfflineBackgroundAccess } from "../../lib/offline-background-access.js"
import { readPackagedRecord } from "../../lib/native-readonly-indexed-db.js"

// This fixed packaged entry exposes only the bounded projection. It has no
// authority to change the receipt, navigate, or probe other device storage.
const channel = window.AtmoShaperBackgroundAccess
if (channel) {
  const catalogIds = new Set(document.currentScript?.dataset.clockBackgrounds?.split(",") ?? [])
  const read = () => readPackagedRecord(window.indexedDB, OFFLINE_ACCESS_DB, "access", "state")
  void readProjectedOfflineBackgroundAccess(read, publicKeys, catalogIds)
    .then(access => channel.postMessage(JSON.stringify(access)))
}
