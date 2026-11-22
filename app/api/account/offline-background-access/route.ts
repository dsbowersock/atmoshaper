import { getCurrentSession } from "@/auth"
import { prisma } from "@/lib/prisma"
import { getUserEntitlementState } from "@/lib/membership"
import { createOfflineBackgroundAccessHandler } from "@/lib/server/offline-background-receipt"
import { backgroundRegistry } from "@/components/backgrounds/backgroundRegistry"

export const runtime = "nodejs"

/** Same-origin explicit approval. Query only this session owner's fresh access;
 * never accept a user ID, plan, expiry or owned background from the browser. */
export const POST = createOfflineBackgroundAccessHandler({
  async getUserId() { return (await getCurrentSession())?.user?.id ?? null },
  async loadAccess(userId) {
    // One repeatable-read snapshot, scoped to the authenticated owner. No
    // purchase, preference, membership or ownership row is written.
    return prisma.$transaction(async tx => {
      const [entitlements, ownership] = await Promise.all([
        getUserEntitlementState(tx, userId),
        tx.backgroundOwnership.findMany({ where: { userId, status: "ACTIVE" }, select: { backgroundKey: true } }),
      ])
      const enabled = new Set<string>(backgroundRegistry.filter(item => item.enabled).map(item => item.id))
      return { featureAccess: entitlements.featureAccess, owned: ownership.map(item => item.backgroundKey).filter(id => enabled.has(id)) }
    }, { isolationLevel: "RepeatableRead" })
  },
})
