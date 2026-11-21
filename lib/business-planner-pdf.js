// @ts-check
import { PDFDocument, StandardFonts, rgb } from "pdf-lib"
import fontkit from "@pdf-lib/fontkit"

const WIDTH = 612
const HEIGHT = 792
const MARGIN = 48
const BOTTOM = 58
const INK = rgb(0.12, 0.16, 0.21)
const MUTED = rgb(0.31, 0.35, 0.4)

/** Wraps by measured glyph widths, including long unbroken words. Newlines are
 * retained; no words or unsupported characters are silently discarded.
 * @param {string} text @param {import("pdf-lib").PDFFont} font @param {number} size @param {number} width */
export function wrapPlannerPdfText(text, font, size, width) {
  const lines = []
  for (const paragraph of text.replace(/\r\n?/g, "\n").split("\n")) {
    let line = ""
    for (const word of paragraph.split(/\s+/).filter(Boolean)) {
      const candidate = line ? `${line} ${word}` : word
      if (font.widthOfTextAtSize(candidate, size) <= width) { line = candidate; continue }
      if (line) { lines.push(line); line = "" }
      for (const character of word) {
        if (line && font.widthOfTextAtSize(line + character, size) > width) { lines.push(line); line = "" }
        line += character
      }
    }
    lines.push(line)
  }
  return lines
}

/** Creates a local, searchable Letter-size report from the same data as the
 * preview. It accepts self-hosted font bytes, makes no network requests and
 * returns bytes only after every page and footer is complete.
 * @param {import("./business-planner-reports.js").PlannerReport} report
 * @param {Uint8Array | ArrayBuffer} fontBytes
 */
export async function createBusinessPlannerPdf(report, fontBytes) {
  const allText = [report.title, report.practiceName, report.preparedBy, report.contact, report.notice,
    ...report.sections.flatMap((section) => [section.title, ...section.paragraphs, ...section.rows.flatMap((row) => [row.label, row.value])])].join("\n")
  if (allText.length > 250000) throw new Error("REPORT_TOO_LONG")
  const pdf = await PDFDocument.create()
  pdf.registerFontkit(fontkit)
  const font = await pdf.embedFont(fontBytes, { subset: true })
  const supported = new Set(font.getCharacterSet())
  if ([...allText].some((character) => !"\n\r\t".includes(character) && !supported.has(character.codePointAt(0) ?? 0))) throw new Error("REPORT_UNSUPPORTED_TEXT")
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold)
  pdf.setTitle(report.title)
  pdf.setSubject("Informational working draft for professional and lender discussion")
  pdf.setCreator("AtmoShaper")
  pdf.setCreationDate(new Date(report.generatedAt))
  let page = pdf.addPage([WIDTH, HEIGHT])
  let y = HEIGHT - 70

  function header() {
    page.drawText("AtmoShaper | Business planning", { x: MARGIN, y: HEIGHT - 34, size: 9, font: bold, color: MUTED })
    page.drawLine({ start: { x: MARGIN, y: HEIGHT - 43 }, end: { x: WIDTH - MARGIN, y: HEIGHT - 43 }, thickness: 0.6, color: rgb(0.8, 0.82, 0.84) })
  }
  header()
  /** @param {number} height */
  function ensure(height) {
    if (y - height >= BOTTOM) return
    page = pdf.addPage([WIDTH, HEIGHT])
    y = HEIGHT - 70
    header()
  }
  /** @param {string} value @param {number} [size] @param {import("pdf-lib").Color} [color] @param {boolean} [heading] */
  function paragraph(value, size = 10.5, color = INK, heading = false) {
    const face = heading ? bold : font
    const lines = wrapPlannerPdfText(value, face, size, WIDTH - 2 * MARGIN)
    const leading = size * 1.45
    for (const line of lines) {
      ensure(leading)
      if (line) page.drawText(line, { x: MARGIN, y, font: face, size, color })
      y -= leading
    }
    y -= 5
  }
  paragraph(report.title, 22, INK, true)
  paragraph(report.practiceName, 16)
  if (report.preparedBy.trim()) paragraph(`Prepared by: ${report.preparedBy}`)
  if (report.contact.trim()) paragraph(`Business contact: ${report.contact}`)
  paragraph(`Generated: ${new Date(report.generatedAt).toLocaleString("en-US")}`, 9, MUTED)
  paragraph("Purpose and limits", 11, INK, true)
  paragraph(report.notice, 9.5, MUTED)
  y -= 10
  for (const section of report.sections) {
    ensure(130)
    paragraph(section.title, 14, INK, true)
    for (const value of section.paragraphs) paragraph(value)
    for (const row of section.rows) {
      // Keep the label with the first answer lines; long answers may continue
      // on the next page without clipping or an oversized unbreakable table.
      const labelHeight = wrapPlannerPdfText(row.label, font, 10.5, WIDTH - 2 * MARGIN).length * 15.3
      ensure(Math.min(150, labelHeight + 35))
      paragraph(row.label, 10.5, rgb(0.15, 0.24, 0.32))
      paragraph(row.value || "Not provided.", 10.5, MUTED)
      y -= 6
    }
    y -= 10
  }
  const pages = pdf.getPages()
  pages.forEach((reportPage, index) => {
    reportPage.drawLine({ start: { x: MARGIN, y: 43 }, end: { x: WIDTH - MARGIN, y: 43 }, thickness: 0.5, color: rgb(0.8, 0.82, 0.84) })
    reportPage.drawText(`Informational working draft | Professional review required | ${index + 1} of ${pages.length}`, { x: MARGIN, y: 29, size: 8, font, color: MUTED })
  })
  return pdf.save()
}
