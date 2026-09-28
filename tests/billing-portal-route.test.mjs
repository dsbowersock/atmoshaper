import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import { describe, it } from "node:test"

import { BILLING_PORTAL_DESTINATIONS } from "../lib/billing-portal-destinations.js"
import { createCompiledModuleLoader } from "./helpers/compiled-module.mjs"
import { MEMBERSHIP_PRICING_IMPORT_PATTERN } from "./helpers/membership-pricing-import-guard.mjs"

const loadCompiledModule = createCompiledModuleLoader(import.meta.url)
const portalRouteSource = await readFile(
  new URL("../app/api/billing/portal/route.ts", import.meta.url),
  "utf8",
)

function portalRequest(destination, { rejectFormData = false } = {}) {
  return {
    formData: async () => {
      if (rejectFormData) {
        throw new TypeError("Malformed form body")
      }
      const formData = new FormData()
      if (destination) formData.set("destination", destination)
      return formData
    },
  }
}

/**
 * Loads the production route with deterministic account, subscription, and
 * Stripe doubles so each action can assert its exact Portal boundary.
 */
function portalPost({
  customer = {
    stripeCustomerId: "cus_supporter",
  },
  portalSession = {
    url: "https://billing.stripe.com/p/session/supporter",
  },
  session = {
    user: {
      id: "user_supporter",
    },
  },
  subscription = {
    stripeSubscriptionId: "sub_supporter",
    stripePriceId: "price_supporter_personal",
    status: "active",
  },
} = {}) {
  const calls = {
    customerQueries: [],
    portalInputs: [],
    subscriptionQueries: [],
  }
  const route = loadCompiledModule(
    portalRouteSource,
    "app/api/billing/portal/route.ts",
    {
      "next/server": {
        NextResponse: {
          redirect: (url, status) => ({ status, url }),
        },
      },
      "@/auth": {
        getCurrentSession: async () => session,
      },
      "@/lib/auth-env": {
        getSiteUrl: () => "https://massagelab.app",
      },
      "@/lib/billing-portal-destinations": {
        BILLING_PORTAL_DESTINATIONS,
      },
      "@/lib/prisma": {
        prisma: {
          membershipSubscription: {
            findFirst: async (query) => {
              calls.subscriptionQueries.push(query)
              if (
                subscription
                && Array.isArray(query?.where?.status?.in)
                && !query.where.status.in.includes(subscription.status)
              ) {
                return null
              }
              if (
                subscription
                && Array.isArray(query?.where?.status?.notIn)
                && query.where.status.notIn.includes(subscription.status)
              ) {
                return null
              }
              return subscription
            },
          },
          stripeCustomer: {
            findUnique: async (query) => {
              calls.customerQueries.push(query)
              return customer
            },
          },
        },
      },
      "@/lib/supporter-portal": {
        resolveSupporterPortalForPrice: (priceId) => {
          if (!priceId) return { supporterUse: null, configurationId: null }
          if (priceId === "price_supporter_personal") {
            return { supporterUse: "personal", configurationId: "bpc_personal" }
          }
          if (priceId === "price_supporter_business") {
            return { supporterUse: "business", configurationId: "bpc_business" }
          }
          throw new Error("The Supporter subscription Price is not configured.")
        },
      },
      "@/lib/stripe-billing": {
        createStripeCustomerPortalSession: async (input) => {
          calls.portalInputs.push(input)
          return portalSession
        },
      },
    },
  )

  return {
    calls,
    POST: route.POST,
  }
}

describe("Customer Portal POST route", () => {
  it("keeps the cached display catalog outside Portal customer and subscription authority", () => {
    assert.doesNotMatch(portalRouteSource, MEMBERSHIP_PRICING_IMPORT_PATTERN)
  })

  it("opens the general billing-account Portal with the subscription's use-specific configuration", async () => {
    const { calls, POST } = portalPost()

    const response = await POST(portalRequest("manage"))

    assert.deepEqual(response, {
      status: 303,
      url: "https://billing.stripe.com/p/session/supporter",
    })
    assert.deepEqual(calls.customerQueries, [{
      where: { userId: "user_supporter" },
    }])
    assert.deepEqual(calls.subscriptionQueries, [{
      where: {
        userId: "user_supporter",
        stripeCustomerId: "cus_supporter",
        status: {
          notIn: ["canceled", "incomplete_expired"],
        },
      },
      orderBy: [
        { currentPeriodEnd: "desc" },
        { updatedAt: "desc" },
      ],
      select: {
        stripeSubscriptionId: true,
        stripePriceId: true,
      },
    }])
    assert.deepEqual(calls.portalInputs, [{
      customerId: "cus_supporter",
      returnUrl: "https://massagelab.app/account?tab=membership&portal=returned",
      subscriptionId: undefined,
      configurationId: "bpc_personal",
    }])
  })

  it("uses the business Portal for both management destinations", async () => {
    for (const destination of ["manage", "subscription-update"]) {
      const { calls, POST } = portalPost({
        subscription: {
          stripeSubscriptionId: "sub_supporter_business",
          stripePriceId: "price_supporter_business",
          status: "active",
        },
      })

      const response = await POST(portalRequest(destination))

      assert.equal(response.url, "https://billing.stripe.com/p/session/supporter")
      assert.equal(calls.portalInputs[0].configurationId, "bpc_business")
      assert.equal(
        calls.portalInputs[0].subscriptionId,
        destination === "subscription-update" ? "sub_supporter_business" : undefined,
      )
    }
  })

  it("keeps degraded nonterminal subscriptions on their use-specific general Portal", async () => {
    for (const status of ["past_due", "unpaid", "paused", "incomplete"]) {
      const { calls, POST } = portalPost({
        subscription: {
          stripeSubscriptionId: `sub_${status}`,
          stripePriceId: "price_supporter_personal",
          status,
        },
      })

      const response = await POST(portalRequest("manage"))

      assert.equal(response.url, "https://billing.stripe.com/p/session/supporter")
      assert.equal(calls.portalInputs[0].configurationId, "bpc_personal")
      assert.deepEqual(calls.subscriptionQueries[0].where.status, {
        notIn: ["canceled", "incomplete_expired"],
      })
    }
  })

  it("opens Stripe's direct price-selection flow for the current subscription", async () => {
    const { calls, POST } = portalPost()

    const response = await POST(portalRequest("subscription-update"))

    assert.deepEqual(response, {
      status: 303,
      url: "https://billing.stripe.com/p/session/supporter",
    })
    assert.deepEqual(calls.subscriptionQueries, [{
      where: {
        userId: "user_supporter",
        stripeCustomerId: "cus_supporter",
        status: {
          in: ["active", "trialing"],
        },
      },
      orderBy: [
        { currentPeriodEnd: "desc" },
        { updatedAt: "desc" },
      ],
      select: {
        stripeSubscriptionId: true,
        stripePriceId: true,
      },
    }])
    assert.deepEqual(calls.portalInputs, [{
      customerId: "cus_supporter",
      returnUrl: "https://massagelab.app/account?tab=membership&portal=returned",
      subscriptionId: "sub_supporter",
      configurationId: "bpc_personal",
    }])
  })

  it("fails closed before Stripe when no current subscription can be changed", async () => {
    for (const subscription of [
      null,
      {
        stripeSubscriptionId: "",
        status: "active",
      },
    ]) {
      const { calls, POST } = portalPost({ subscription })

      const response = await POST(portalRequest("subscription-update"))

      assert.deepEqual(response, {
        status: 303,
        url: "https://massagelab.app/account?portal=subscription-not-found",
      })
      assert.equal(calls.subscriptionQueries.length, 1)
      assert.deepEqual(calls.portalInputs, [])
    }
  })

  it("rejects incomplete and paused subscriptions from the focused change flow", async () => {
    for (const status of ["incomplete", "paused"]) {
      const { calls, POST } = portalPost({
        subscription: {
          stripeSubscriptionId: `sub_${status}`,
          status,
        },
      })

      const response = await POST(portalRequest("subscription-update"))

      assert.deepEqual(response, {
        status: 303,
        url: "https://massagelab.app/account?portal=subscription-not-found",
      })
      assert.equal(calls.subscriptionQueries.length, 1)
      assert.deepEqual(calls.portalInputs, [])
    }
  })

  it("defaults malformed or unknown form destinations to general management", async () => {
    for (const request of [
      portalRequest("unexpected"),
      portalRequest(null, { rejectFormData: true }),
    ]) {
      const { calls, POST } = portalPost()
      const response = await POST(request)

      assert.deepEqual(response, {
        status: 303,
        url: "https://billing.stripe.com/p/session/supporter",
      })
      assert.equal(calls.subscriptionQueries.length, 1)
      assert.equal(calls.portalInputs.length, 1)
      assert.equal(calls.portalInputs[0].subscriptionId, undefined)
      assert.equal(calls.portalInputs[0].configurationId, "bpc_personal")
    }
  })

  it("requires a signed-in account with a stored Stripe Customer", async () => {
    const anonymous = portalPost({ session: null })
    const anonymousResponse = await anonymous.POST(
      portalRequest("subscription-update"),
    )

    assert.deepEqual(anonymousResponse, {
      status: 303,
      url: "https://massagelab.app/login",
    })
    assert.deepEqual(anonymous.calls.customerQueries, [])
    assert.deepEqual(anonymous.calls.subscriptionQueries, [])
    assert.deepEqual(anonymous.calls.portalInputs, [])

    const withoutCustomer = portalPost({ customer: null })
    const withoutCustomerResponse = await withoutCustomer.POST(
      portalRequest("subscription-update"),
    )

    assert.deepEqual(withoutCustomerResponse, {
      status: 303,
      url: "https://massagelab.app/account?portal=customer-not-found",
    })
    assert.deepEqual(withoutCustomer.calls.subscriptionQueries, [])
    assert.deepEqual(withoutCustomer.calls.portalInputs, [])
  })
})
