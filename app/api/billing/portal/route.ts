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
    // Prefer a current active/trialing subscription for every destination.
    // General management falls back to a degraded nonterminal subscription so
    // those customers can still manage payment, invoice, and cancellation data.
    const currentSubscription = await prisma.membershipSubscription.findFirst({
      where: {
        userId: session.user.id,
        stripeCustomerId: stripeCustomer.stripeCustomerId,
        status: { in: ["active", "trialing"] },
      },
      orderBy: PORTAL_SUBSCRIPTION_ORDER,
      select: {
        stripeSubscriptionId: true,
        stripePriceId: true,
      },
    })
    const subscription = currentSubscription
      ?? (destination === BILLING_PORTAL_DESTINATIONS.MANAGE
        ? await prisma.membershipSubscription.findFirst({
          where: {
            userId: session.user.id,
            stripeCustomerId: stripeCustomer.stripeCustomerId,
            status: {
              notIn: ["active", "trialing", "canceled", "incomplete_expired"],
            },
          },
          orderBy: PORTAL_SUBSCRIPTION_ORDER,
          select: {
            stripeSubscriptionId: true,
            stripePriceId: true,
          },
        })
        : null)

    if (
      destination === BILLING_PORTAL_DESTINATIONS.SUBSCRIPTION_UPDATE
      && !subscription?.stripeSubscriptionId
    ) {
      return accountRedirect("subscription-not-found")
    }

    const portal = resolveSupporterPortalForPrice(subscription?.stripePriceId)
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
