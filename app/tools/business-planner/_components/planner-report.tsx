"use client"

import Link from "next/link"
import { useCallback, useEffect, useMemo, useState } from "react"
import { Download, Printer, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { buildPlannerReport, PLANNER_REPORT_SOURCES, PLANNER_SOURCE_STATUS_LABELS, readPlannerReportSources } from "@/lib/business-planner-reports"
import { PlannerSection } from "./business-tool-fields"
import styles from "./business-planner.module.css"
import { savePlannerPdf, printPlannerReport } from "@/lib/planner-export"

type PlannerSources = ReturnType<typeof readPlannerReportSources>
type Report = ReturnType<typeof buildPlannerReport>

/** Source facts are already report content; they never replace authored notes. */
export function SavedPlannerContext({ rows }: { rows: { label: string; value: string }[] }) {
  if (!rows.length) return null
  return <details className={styles.savedContext}>
    <summary>Saved information already included ({rows.length} items)</summary>
    <p>Reused from the tools shown below. No need to type these facts again.</p>
    <dl>{rows.map((row, index) => <div key={index}><dt>{row.label}</dt><dd>{row.value}</dd></div>)}</dl>
  </details>
}

/** Reads saved local tools without changing them. Navigation remounts, explicit
 * refresh, tab focus and cross-tab storage events all refresh source context. */
export function usePlannerReportSources() {
  const [sources, setSources] = useState<PlannerSources>([])
  const [ready, setReady] = useState(false)
  const refresh = useCallback(() => {
    setSources(readPlannerReportSources({ getItem: (key) => window.localStorage.getItem(key) }))
    setReady(true)
  }, [])
  useEffect(() => {
    refresh()
    window.addEventListener("focus", refresh)
    window.addEventListener("storage", refresh)
    return () => { window.removeEventListener("focus", refresh); window.removeEventListener("storage", refresh) }
  }, [refresh])
  return { sources, ready, refresh }
}

/** One semantic preview is also the browser-print document. No hidden form
 * controls or unrelated site navigation appear in the printed report. */
export function PlannerReportDocument({ report }: { report: Report }) {
  return <article className={styles.reportDocument} data-planner-report>
    <header>
      <p className={styles.reportBrand}>AtmoShaper · Informational working draft</p>
      <h2>{report.title}</h2><p className={styles.reportPractice}>{report.practiceName}</p>
      {report.preparedBy ? <p>Prepared by: {report.preparedBy}</p> : null}
      {report.contact ? <p>Business contact: {report.contact}</p> : null}
      <p>Generated: {new Date(report.generatedAt).toLocaleString("en-US")}</p>
      <div className={styles.reportNotice}><h3>Purpose and limits</h3><p>{report.notice}</p></div>
    </header>
    {report.sections.map((section, index) => <section key={`${section.title}-${index}`}>
      <h3>{section.title}</h3>
      {section.paragraphs.map((paragraph, paragraphIndex) => <p key={paragraphIndex}>{paragraph}</p>)}
      <dl>{section.rows.map((row, rowIndex) => <div key={rowIndex}><dt>{row.label}</dt><dd>{row.value}</dd></div>)}</dl>
    </section>)}
  </article>
}

/** Exports an immutable in-memory snapshot after review. PDF code is lazy and
 * font bytes come only from this origin; report contents are never uploaded. */
export function PlannerReportReview({ kind, draft, sources, ready, refresh }: {
  kind: "launch" | "outline"; draft: unknown; sources: PlannerSources; ready: boolean; refresh: () => void
}) {
  const [included, setIncluded] = useState(() => PLANNER_REPORT_SOURCES.map((source) => source.id))
  const [exportState, setExportState] = useState<"idle" | "working">("idle")
  const [message, setMessage] = useState("")
  const usableSources = sources.filter((source) => kind !== "launch" || source.id !== "checklist")
  const report = useMemo(() => buildPlannerReport(kind, draft, sources.filter((source) => included.includes(source.id) && (kind !== "launch" || source.id !== "checklist"))), [draft, included, kind, sources])

  async function downloadPdf() {
    if (!ready || exportState === "working") return
    const snapshot = report
    setExportState("working")
    setMessage("")
    try {
      const [{ createBusinessPlannerPdf }, response] = await Promise.all([
        import("@/lib/business-planner-pdf"), fetch("/fonts/reports/NotoSans-Regular.ttf"),
      ])
      if (!response.ok) throw new Error("REPORT_FONT_UNAVAILABLE")
      const bytes = await createBusinessPlannerPdf(snapshot, await response.arrayBuffer())
      setMessage(await savePlannerPdf(new Uint8Array(bytes), `atmoshaper-${snapshot.kind}-working-draft-${snapshot.generatedAt.slice(0, 10)}.pdf`))
    } catch (error) {
      setMessage(error instanceof Error && error.message === "REPORT_UNSUPPORTED_TEXT"
        ? "Some characters are not supported by the download font. Use Print / save PDF to preserve the original text. Your draft is unchanged."
        : "The PDF could not be prepared. Your draft is unchanged. Try again or use Print / save PDF.")
    } finally { setExportState("idle") }
  }

  return <div className={styles.reportReview}>
    <PlannerSection title="Review your report" description="Check the included facts, assumptions and missing information before downloading or sharing this working draft.">
      <p className="text-xs leading-relaxed text-muted-foreground">Reuse drafts saved in this browser. Open a tool once to make its current draft available here. Inclusion choices affect this report; they do not edit the source tools.</p>
      <div className={styles.reportSources}>
        {usableSources.map((source) => <div key={source.id}>
          <Checkbox id={`report-source-${source.id}`} checked={included.includes(source.id)} onCheckedChange={(checked) => setIncluded((current) => checked === true ? [...current, source.id] : current.filter((id) => id !== source.id))} />
          <Label htmlFor={`report-source-${source.id}`}>{source.label} <span>({PLANNER_SOURCE_STATUS_LABELS[source.status]})</span></Label>
          <Link href={source.href}>Open tool</Link>
        </div>)}
      </div>
      <div className={styles.formActions}>
        <Button type="button" variant="glow" onClick={refresh}><RefreshCw aria-hidden="true" />Refresh saved tools</Button>
        <Button type="button" variant="ctaBlue" disabled={!ready || exportState === "working"} onClick={downloadPdf}><Download aria-hidden="true" />{exportState === "working" ? "Preparing PDF…" : "Download PDF report"}</Button>
        <Button type="button" variant="glow" disabled={!ready || exportState === "working"} onClick={printPlannerReport}><Printer aria-hidden="true" />Print / save PDF</Button>
      </div>
      {message ? <p role="status" className="text-sm">{message}</p> : null}
      {!ready ? <p role="status">Loading saved planner information…</p> : null}
    </PlannerSection>
    {ready ? <PlannerReportDocument report={report} /> : null}
  </div>
}
