/** Browser exports stay local; the Android build swaps only this platform port. */
export async function savePlannerPdf(bytes: Uint8Array, filename: string): Promise<string> {
  const url = URL.createObjectURL(new Blob([new Uint8Array(bytes)], { type: "application/pdf" }))
  const link = document.createElement("a")
  link.href = url
  link.download = filename
  link.click()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
  return "PDF download prepared. Review it before sharing."
}

export function printPlannerReport() { window.print() }
