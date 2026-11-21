import assert from "node:assert/strict"
import { describe, it } from "node:test"
import { readFile, mkdir, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import path from "node:path"
import { spawnSync } from "node:child_process"
import { PDFDocument } from "pdf-lib"
import { createBusinessPlannerPdf, wrapPlannerPdfText } from "../lib/business-planner-pdf.js"
import { buildPlannerReport } from "../lib/business-planner-reports.js"
import { plannerReportSample } from "./fixtures/business-planner-report-sample.mjs"

const fontBytes = await readFile(new URL("../public/fonts/reports/NotoSans-Regular.ttf", import.meta.url))
const outputDir = process.env.PLANNER_REPORT_ARTIFACT_DIR ?? path.join(tmpdir(), "atmoshaper-planner-report-tests")

describe("Local planner PDF export", () => {
  it("wraps long words and paragraphs without dropping characters", () => {
    const font = { widthOfTextAtSize: (value) => [...value].length * 5 }
    const value = "A long reference " + "x".repeat(200) + "\nNext paragraph."
    const lines = wrapPlannerPdfText(value, font, 10, 100)
    assert.ok(lines.every((line) => line.length <= 20))
    assert.equal(lines.join("").replace(/\s/g, ""), value.replace(/\s/g, ""))
  })

  for (const kind of ["launch", "outline", "empty"]) it(`creates a complete paginated ${kind} report`, async () => {
    const { launch, sources } = plannerReportSample()
    const notes = { mission: "A welcoming practice for every client.", finances: Array.from({ length: 20 }, (_, index) => `Long review paragraph ${index + 1}. ` + "Record assumptions and discuss them with a licensed professional. ".repeat(12)).join("\n\n") }
    const report = buildPlannerReport(kind === "launch" ? "launch" : "outline", kind === "launch" ? launch : kind === "empty" ? {} : notes, kind === "empty" ? [] : sources, "2026-11-20T12:00:00Z")
    const bytes = await createBusinessPlannerPdf(report, fontBytes)
    assert.equal(Buffer.from(bytes).subarray(0, 5).toString(), "%PDF-")
    const document = await PDFDocument.load(bytes)
    assert.ok(document.getPageCount() >= 2)
    assert.equal(document.getTitle(), report.title)
    assert.ok(document.getPages().every((page) => page.getWidth() === 612 && page.getHeight() === 792))
    await mkdir(outputDir, { recursive: true })
    const target = path.join(outputDir, `planner-${kind}.pdf`)
    await writeFile(target, bytes)
    // Poppler is an optional local inspection tool, not a production dependency.
    const extracted = spawnSync("pdftotext", ["-layout", target, "-"], { encoding: "utf8" })
    if (!extracted.error) {
      assert.equal(extracted.status, 0, extracted.stderr)
      assert.match(extracted.stdout, /Purpose and limits/)
      assert.match(extracted.stdout, /not legal, financial, tax or accounting advice/)
      assert.match(extracted.stdout, /Professional review required/)
      if (kind !== "empty") assert.match(extracted.stdout, /Renée Müller/)
      if (kind === "launch") for (let index = 1; index <= 25; index += 1) assert.ok(extracted.stdout.includes(`EXAMPLE-ANSWER-${index}:`))
      if (kind === "outline") assert.match(extracted.stdout, /Long review paragraph 20/)
    }
  })

  it("fails visibly for unsupported glyphs rather than replacing user text", async () => {
    const report = buildPlannerReport("outline", { mission: "Original text 🧘" }, [])
    await assert.rejects(createBusinessPlannerPdf(report, fontBytes), /REPORT_UNSUPPORTED_TEXT/)
  })
})
