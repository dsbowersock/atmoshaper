import { Suspense } from "react"
import type { Metadata } from "next"
import { OfflineAccessApproval } from "./offline-access-approval"

export const metadata: Metadata = { title: "Verify offline background access", robots: { index: false, follow: false }, referrer: "no-referrer" }
export default function OfflineAccessPage() { return <Suspense fallback={<p>Loading offline access…</p>}><OfflineAccessApproval /></Suspense> }
