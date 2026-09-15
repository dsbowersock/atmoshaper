import { NextResponse } from "next/server"
import { PUBLIC_PRODUCT_IDENTITY } from "@/lib/public-product-identity"

export const dynamic = "force-dynamic"

export function GET() {
  if (process.env.MASSAGELAB_ENABLE_SENTRY_TEST_ROUTE !== "true") {
    return NextResponse.json({ error: "Sentry test route is disabled." }, { status: 404 })
  }

  throw new Error(`${PUBLIC_PRODUCT_IDENTITY.name} Sentry server test error`)
}
