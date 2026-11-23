import type { savePlannerPdf as browserSave } from "@/lib/planner-export"

type DocumentWindow = Window & { AtmoShaperDocuments?: { postMessage(value: string): void } }
let requestId = 0
/** PDF bytes cross one origin-bound, main-frame-only native port. Android asks
 * the user for a destination; this code cannot choose a path or upload a report. */
export const savePlannerPdf: typeof browserSave = async (bytes, filename) => {
  const port = (window as DocumentWindow).AtmoShaperDocuments
  if (!port) throw new Error("Document saving is unavailable.")
  if (bytes.length > 6 * 1024 * 1024) throw new Error("The report is too large.")
  const id = ++requestId
  let binary = ""
  for (let index = 0; index < bytes.length; index += 8192) binary += String.fromCharCode(...bytes.subarray(index, index + 8192))
  return new Promise<string>((resolve, reject) => {
    function complete(event: Event) {
      const detail = (event as CustomEvent).detail
      if (detail?.id !== id) return
      window.removeEventListener("atmoshaper:document-result", complete)
      if (detail.status === "saved") resolve("PDF saved. Review it before sharing.")
      else if (detail.status === "cancelled") resolve("Save cancelled. Your draft is unchanged.")
      else reject(new Error("The PDF could not be saved."))
    }
    window.addEventListener("atmoshaper:document-result", complete)
    try { port.postMessage(JSON.stringify({ type: "save-pdf", id, filename, data: btoa(binary) })) }
    catch (error) { window.removeEventListener("atmoshaper:document-result", complete); reject(error) }
  })
}

export function printPlannerReport() {
  (window as DocumentWindow).AtmoShaperDocuments?.postMessage(JSON.stringify({ type: "print" }))
}
