import type { PrismaClient } from "@prisma/client"

import { isBrowserQaDatabaseTargetAuthorized } from "../../scripts/assert-browser-qa-database-target.mjs"
import { requiredLegalDocumentsForEvent } from "../legal-documents.js"

type QaEnvironment = Record<string, string | undefined>
type FixtureCreateClient = Pick<PrismaClient, "user">
type FixtureCleanupClient = Pick<PrismaClient, "$transaction">

export type BrowserUserFixtureIdentity = {
  projectName: string
  owner: string
  user: {
    id: string
    name: string
    email: string
    authSessionVersion: number
  }
}

const SAFE_NAME = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

/** Creates one exact project-and-owner-qualified synthetic account identity. */
export function createBrowserUserFixtureIdentity(
  projectName: string,
  owner: string,
): BrowserUserFixtureIdentity {
  if (!SAFE_NAME.test(projectName) || !SAFE_NAME.test(owner)) {
    throw new Error("Browser user fixture requires safe project and owner names.")
  }
  const fixtureKey = `${projectName}--${owner}`
  const id = `browser-user-${fixtureKey}`
  const email = `${fixtureKey}@browser-user.massagelab.example.test`
  if (id.length > 191 || email.length > 320) {
    throw new Error("Browser user fixture identity exceeds persisted field limits.")
  }
  return {
    projectName,
    owner,
    user: {
      id,
      name: `Browser User ${projectName} ${owner}`,
      email,
      authSessionVersion: 0,
    },
  }
}

/** Refuses every fixture mutation unless the complete disposable-target gate passes. */
export function requireBrowserUserFixtureAuthorization(environment: QaEnvironment = process.env) {
  if (!isBrowserQaDatabaseTargetAuthorized(environment)) {
    throw new Error("Browser user fixture requires the approved disposable browser-QA database target.")
  }
}

/** Atomically creates the exact verified User and current registration acceptances needed by Browser QA. */
export async function createBrowserUserFixtureRecord(input: {
  prismaClient: FixtureCreateClient
  identity: BrowserUserFixtureIdentity
  environment?: QaEnvironment
}) {
  requireBrowserUserFixtureAuthorization(input.environment)
  assertBrowserUserFixtureIdentity(input.identity)
  return input.prismaClient.user.create({
    data: {
      ...input.identity.user,
      emailVerified: new Date("2026-09-07T00:00:00.000Z"),
      legalAcceptances: {
        create: requiredLegalDocumentsForEvent("registration").map((document) => ({
          documentKey: document.key,
          documentVersion: document.version,
        })),
      },
    },
    select: {
      id: true,
      name: true,
      email: true,
      authSessionVersion: true,
    },
  })
}

/** Verifies ownership, then atomically deletes the fixture's restricted legal rows and exact User record. */
export async function removeBrowserUserFixtureRecord(input: {
  prismaClient: FixtureCleanupClient
  identity: BrowserUserFixtureIdentity
  environment?: QaEnvironment
}) {
  requireBrowserUserFixtureAuthorization(input.environment)
  assertBrowserUserFixtureIdentity(input.identity)
  await input.prismaClient.$transaction(async (transaction) => {
    const existing = await transaction.user.findUnique({
      where: { id: input.identity.user.id },
      select: { email: true },
    })
    if (!existing) return
    if (existing.email !== input.identity.user.email) {
      throw new Error("Browser user fixture ownership mismatch.")
    }

    await transaction.legalAcceptance.deleteMany({
      where: { userId: input.identity.user.id },
    })
    const removed = await transaction.user.deleteMany({
      where: {
        id: input.identity.user.id,
        email: input.identity.user.email,
      },
    })
    if (removed.count !== 1) {
      throw new Error("Browser user fixture cleanup did not remove exactly one owned user.")
    }
  })
}

function assertBrowserUserFixtureIdentity(identity: BrowserUserFixtureIdentity) {
  const expected = createBrowserUserFixtureIdentity(identity.projectName, identity.owner)
  if (identity.user.id !== expected.user.id
    || identity.user.name !== expected.user.name
    || identity.user.email !== expected.user.email
    || identity.user.authSessionVersion !== 0) {
    throw new Error("Browser user fixture refuses a non-owned identity.")
  }
}
