import { getCurrentSession } from "@/auth"
import { prisma } from "@/lib/prisma"
import { getUserEntitlementState } from "@/lib/membership"
import { offlinePremiumUntil } from "@/lib/offline-background-access"
import { signOfflineBackgroundReceipt } from "@/lib/server/offline-background-receipt"
import { backgroundRegistry } from "@/components/backgrounds/backgroundRegistry"

export const runtime = "nodejs"
const headers = { "Cache-Control": "private, no-store", "Referrer-Policy": "no-referrer" }

/** Same-origin explicit approval. Query only this session owner's fresh access;
 * never accept a user ID, plan, expiry or owned background from the browser. */
export async function POST(request: Request) {
  if (request.headers.get("origin") !== new URL(request.url).origin) return Response.json({ error: "Invalid request origin." }, { status: 403, headers })
  const session = await getCurrentSession()
  if (!session?.user?.id) return Response.json({ error: "Sign in to verify offline access." }, { status: 401, headers })
  if (Number(request.headers.get("content-length")) > 1024) return Response.json({ error: "Invalid access request." }, { status: 400, headers })
  let input: unknown
  try { const body = await request.text(); if (body.length > 1024) throw new Error(); input = JSON.parse(body) } catch { return Response.json({ error: "Invalid access request." }, { status: 400, headers }) }
  const { device, challenge } = (input ?? {}) as { device?: unknown; challenge?: unknown }
  if (typeof device !== "string" || typeof challenge !== "string" || !/^[A-Za-z0-9_-]{43}$/.test(device) || !/^[A-Za-z0-9_-]{43}$/.test(challenge)) return Response.json({ error: "Invalid access request." }, { status: 400, headers })
  try {
    // A repeatable-read snapshot binds paid feature provenance and ownership to
    // the same authoritative view; no purchase or preference row is written.
    const receipt = await prisma.$transaction(async tx => {
      const now = Date.now()
      const [entitlements, ownership] = await Promise.all([
        getUserEntitlementState(tx, session.user.id),
        tx.backgroundOwnership.findMany({ where: { userId: session.user.id, status: "ACTIVE" }, select: { backgroundKey: true } }),
      ])
      const enabled = new Set(backgroundRegistry.filter(item => item.enabled).map(item => item.id))
      return signOfflineBackgroundReceipt({ device, challenge, userId: session.user.id,
        premiumUntil: offlinePremiumUntil(entitlements.featureAccess, now),
        owned: ownership.map(item => item.backgroundKey).filter(id => enabled.has(id as never)), now })
    }, { isolationLevel: "RepeatableRead" })
    return Response.json({ receipt }, { headers })
  } catch { return Response.json({ error: "Access could not be verified. Your existing offline receipt is unchanged. Try again when verification is available." }, { status: 503, headers }) }
}
