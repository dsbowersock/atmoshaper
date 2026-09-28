import { NextResponse } from "next/server"
import { getCurrentSession } from "@/auth"
import { getSiteUrl } from "@/lib/auth-env"
import { BILLING_PORTAL_DESTINATIONS } from "@/lib/billing-portal-destinations"
import { resolveSupporterPortalForPrice } from "@/lib/supporter-portal"
import { createStripeCustomerPortalSession } from "@/lib/stripe-billing"
import { prisma } from "@/lib/prisma"

export const runtime = "nodejs"

const PORTAL_SUBSCRIPTION_ORDER = [
  { currentPeriodEnd: { sort: "desc" as const, nulls: "last" as const } },
  { updatedAt: "desc" as const },
]

function accountRedirect(code: string) {
  return NextResponse.redirect(`${getSiteUrl()}/account?portal=${encodeURIComponent(code)}`, 303)
}

/**
 * Defaults malformed or unknown submissions to the non-destructive Portal
 * homepage. Only the exact first-party action requests Stripe's update flow.
 */
async function requestedPortalDestination(request: Request) {
  try {
    const formData = await request.formData()
    return formData.get("destination") === BILLING_PORTAL_DESTINATIONS.SUBSCRIPTION_UPDATE
      ? BILLING_PORTAL_DESTINATIONS.SUBSCRIPTION_UPDATE
      : BILLING_PORTAL_DESTINATIONS.MANAGE
  } catch {
    return BILLING_PORTAL_DESTINATIONS.MANAGE
  }
}

export async function POST(request: Request) {
  const session = await getCurrentSession()

  if (!session?.user?.id) {
    return NextResponse.redirect(`${getSiteUrl()}/login`, 303)
  }

  const stripeCustomer = await prisma.stripeCustomer.findUnique({
    where: { userId: session.user.id },
  })

  if (!stripeCustomer) {
    return accountRedirect("customer-not-found")
  }

  try {
    const destination = await requestedPortalDestination(request)
    // Portal configuration is customer-wide, so every nonterminal subscription
    // must resolve to the same buyer-use boundary before a session can open.
    const nonterminalSubscriptions = await prisma.membershipSubscription.findMany({
      where: {
        userId: session.user.id,
        stripeCustomerId: stripeCustomer.stripeCustomerId,
        status: { notIn: ["canceled", "incomplete_expired"] },
      },
      orderBy: PORTAL_SUBSCRIPTION_ORDER,
      select: {
        stripeSubscriptionId: true,
        stripePriceId: true,
        status: true,
      },
    })
    const currentSubscriptions = nonterminalSubscriptions.filter(
      ({ status }) => status === "active" || status === "trialing",
    )
    const subscription = currentSubscriptions[0]
      ?? (destination === BILLING_PORTAL_DESTINATIONS.MANAGE
        ? nonterminalSubscriptions[0]
        : null)

    if (
      destination === BILLING_PORTAL_DESTINATIONS.SUBSCRIPTION_UPDATE
      && !subscription?.stripeSubscriptionId
    ) {
      return accountRedirect("subscription-not-found")
    }

    if (nonterminalSubscriptions.some(({ stripePriceId }) => !stripePriceId?.trim())) {
      throw new Error("A nonterminal subscription is missing its Stripe Price identity.")
    }

    const resolvedPortals = nonterminalSubscriptions.map(
      ({ stripePriceId }) => resolveSupporterPortalForPrice(stripePriceId),
    )
    const portalKeys = new Set(resolvedPortals.map(({ supporterUse, configurationId }) => (
      `${supporterUse ?? "default"}:${configurationId ?? "default"}`
    )))
    if (portalKeys.size > 1) {
      throw new Error("The customer's nonterminal subscriptions require incompatible Portal configurations.")
    }
    const portal = resolvedPortals[0] ?? resolveSupporterPortalForPrice()
    const portalSession = await createStripeCustomerPortalSession({
      customerId: stripeCustomer.stripeCustomerId,
      returnUrl: `${getSiteUrl()}/account?tab=membership&portal=returned`,
      subscriptionId: destination === BILLING_PORTAL_DESTINATIONS.SUBSCRIPTION_UPDATE
        ? subscription?.stripeSubscriptionId
        : undefined,
      configurationId: portal.configurationId ?? undefined,
    })

    if (!portalSession.url) {
      throw new Error("Stripe did not return a Customer Portal URL.")
    }

    return NextResponse.redirect(portalSession.url, 303)
  } catch {
    return accountRedirect("error")
  }
}
