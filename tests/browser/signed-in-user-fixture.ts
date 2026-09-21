import type { BrowserContext } from "@playwright/test"

import { prisma } from "@/lib/prisma"
import {
  type BrowserUserFixtureIdentity,
  createBrowserUserFixtureIdentity,
  createBrowserUserFixtureRecord,
  removeBrowserUserFixtureRecord,
} from "../../lib/auth/browser-user-fixture"
import { isBrowserQaDatabaseTargetAuthorized } from "../../scripts/assert-browser-qa-database-target.mjs"
import { installSignedInSessionCookie } from "./signed-in-session-cookie"

const databaseFreeSessionIdentityByContext = new WeakMap<BrowserContext, BrowserUserFixtureIdentity>()
const databaseFreeSessionRouteContexts = new WeakSet<BrowserContext>()
const anonymousAccountBootstrapSource = '\\"initialBootstrap\\":{\\"ownerKey\\":null,\\"syncEnabled\\":false,\\"preferenceStatus\\":\\"anonymous\\"'

/** Projects only the serialized account bootstrap owned by the shared root layout. */
function projectDatabaseFreeAccountBootstrap(body: string, identity: BrowserUserFixtureIdentity) {
  const signedInAccountBootstrapSource = `\\"initialBootstrap\\":{\\"ownerKey\\":\\"${identity.user.id}\\",\\"syncEnabled\\":true,\\"preferenceStatus\\":\\"failed\\"`
  const occurrences = body.split(anonymousAccountBootstrapSource).length - 1
  if (occurrences !== 1) {
    throw new Error("Database-free signed-in fixture requires exactly one anonymous account bootstrap.")
  }
  return body.replace(anonymousAccountBootstrapSource, signedInAccountBootstrapSource)
}

/** Owns context-lifetime client-session and server-bootstrap routes with mutable fixture ownership. */
async function installDatabaseFreeSessionRoute(
  context: BrowserContext,
  baseURL: string,
  identity: BrowserUserFixtureIdentity,
) {
  databaseFreeSessionIdentityByContext.set(context, identity)
  if (databaseFreeSessionRouteContexts.has(context)) return

  // Playwright cannot route requests served by a registered worker. Keep this
  // database-free context on the routed network path for its full lifetime.
  await context.addInitScript(() => {
    if (!("serviceWorker" in navigator)) return
    Object.defineProperty(navigator.serviceWorker, "register", {
      configurable: true,
      value: () => Promise.reject(new Error("Service workers are disabled for routed Browser QA fixtures.")),
    })
  })
  databaseFreeSessionRouteContexts.add(context)

  await context.route("**/api/auth/session", async (route) => {
    const currentIdentity = databaseFreeSessionIdentityByContext.get(context)
    if (!currentIdentity) {
      await route.fallback()
      return
    }
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        user: {
          ...currentIdentity.user,
          emailVerified: true,
        },
      }),
    })
  })

  const baseOrigin = new URL(baseURL).origin
  await context.route("**/*", async (route) => {
    const request = route.request()
    if (request.resourceType() !== "document" || new URL(request.url()).origin !== baseOrigin) {
      await route.fallback()
      return
    }

    const response = await route.fetch()
    const contentType = response.headers()["content-type"]?.toLowerCase() ?? ""
    if (!contentType.includes("text/html")) {
      await route.fulfill({ response })
      return
    }

    const currentIdentity = databaseFreeSessionIdentityByContext.get(context)
    if (!currentIdentity) {
      await route.fulfill({ response })
      return
    }
    const body = await response.text()
    await route.fulfill({
      response,
      body: projectDatabaseFreeAccountBootstrap(body, currentIdentity),
    })
  })
}

/**
 * Installs a project/owner-qualified signed-in identity. Authorized connected
 * runs persist the matching User; database-free runs retain the existing JWT
 * fallback without opening Prisma or mutating an unapproved target.
 */
export async function installSignedInUserFixture(input: {
  context: BrowserContext
  baseURL: string
  projectName: string
  owner: string
}) {
  const identity = createBrowserUserFixtureIdentity(input.projectName, input.owner)
  if (isBrowserQaDatabaseTargetAuthorized(process.env)) {
    await removeBrowserUserFixtureRecord({ prismaClient: prisma, identity })
    const user = await createBrowserUserFixtureRecord({ prismaClient: prisma, identity })
    try {
      await installSignedInSessionCookie(input.context, input.baseURL, {
        ...user,
        name: user.name ?? identity.user.name,
        email: user.email ?? identity.user.email,
      })
    } catch (error) {
      await removeBrowserUserFixtureRecord({ prismaClient: prisma, identity })
      throw error
    }
    return identity
  }
  await installSignedInSessionCookie(input.context, input.baseURL, identity.user)
  await installDatabaseFreeSessionRoute(input.context, input.baseURL, identity)
  return identity
}

/** Cleanup is a no-op unless the same complete disposable-target gate passes. */
export async function removeSignedInUserFixture(projectName: string, owner: string) {
  if (!isBrowserQaDatabaseTargetAuthorized(process.env)) return
  const identity = createBrowserUserFixtureIdentity(projectName, owner)
  await removeBrowserUserFixtureRecord({ prismaClient: prisma, identity })
}
