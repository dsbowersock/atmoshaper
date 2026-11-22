import type { Prisma, PrismaClient } from "@prisma/client"
import { USER_PREFERENCES_VERSION } from "./account-preferences.js"
import { buildOnboardingPreference, objectRecord } from "./onboarding-preferences.js"
import { buildOnboardingDraft, onboardingDraftRevision, onboardingInvitationKind, onboardingInvitationPath, shouldOfferOnboarding, setupCallbackTarget } from "./onboarding-setup.js"

type SetupDatabase = Pick<PrismaClient, "$transaction" | "userPreference">
export type SetupChoice = "started" | "skipped"

/** Read-only post-auth routing. Preference outages must not block legal sign-in. */
export async function postSignInSetupDestination(
  database: Pick<SetupDatabase, "userPreference">, userId: string, callbackUrl: string,
) {
  const destination = setupCallbackTarget(callbackUrl)
  const pathname = decodeURIComponent(new URL(destination, "https://atmoshaper.invalid").pathname).toLowerCase()
  if (pathname === "/onboarding") return destination
  try {
    const preference = await database.userPreference.findUnique({ where: { userId }, select: { appSettings: true } })
    return shouldOfferOnboarding(preference?.appSettings) ? onboardingInvitationPath(destination) : destination
  } catch { return destination }
}

/** Consume an invitation before displaying it. Owner row locking makes parallel
 * tabs claim at most once, without a write during GET or speculative prefetch. */
export async function claimOnboardingInvitation(database: SetupDatabase, userId: string) {
  return database.$transaction(async (tx) => {
    await lockOwner(tx, userId)
    const preference = await tx.userPreference.findUnique({ where: { userId }, select: { appSettings: true } })
    const kind = onboardingInvitationKind(preference?.appSettings)
    if (!kind) return null
    await writeSetup(tx, userId, objectRecord(preference?.appSettings), kind === "resume" ? "resume_offered" : "offered")
    return kind
  })
}

/** A late/double click cannot reopen or replace an already made decision. */
export async function chooseOnboardingSetup(database: SetupDatabase, userId: string, choice: SetupChoice, kind: "new" | "resume" = "new") {
  return database.$transaction(async (tx) => {
    await lockOwner(tx, userId)
    const preference = await tx.userPreference.findUnique({ where: { userId }, select: { appSettings: true } })
    const settings = objectRecord(preference?.appSettings)
    const setup = objectRecord(settings.onboardingSetup)
    const canChoose = kind === "new"
      ? setup.phase === "offered" || onboardingInvitationKind(settings) === "new"
      : setup.phase === "resume_offered" || onboardingInvitationKind(settings) === "resume"
    if (!canChoose) {
      return ["started", "resumed", "resume_offered"].includes(String(setup.phase)) ? "started" : "skipped"
    }
    const isResume = setup.phase === "resume_offered" || onboardingInvitationKind(settings) === "resume"
    await writeSetup(tx, userId, settings, choice === "started" && isResume ? "resumed" : choice)
    return choice
  })
}

async function lockOwner(tx: Prisma.TransactionClient, userId: string) {
  await tx.$queryRaw`SELECT id FROM "User" WHERE id = ${userId} FOR UPDATE`
}

/** Merge only the server-owned lifecycle while retaining every other setting. */
async function writeSetup(
  tx: Prisma.TransactionClient, userId: string, settings: Record<string, unknown>, phase: "offered" | "resume_offered" | "resumed" | SetupChoice,
) {
  const appSettings = {
    ...settings, onboardingSetup: { ...objectRecord(settings.onboardingSetup), version: 1, phase },
  } as Prisma.InputJsonObject
  await writeSettings(tx, userId, appSettings)
}

/** Drafts and final answers share the same revision/owner lock. Completing a
 * form advances that revision and removes its draft, rejecting late saves. */
export async function saveOnboardingProgress(
  database: SetupDatabase, userId: string, expectedRevision: number, input: FormData, complete = false,
) {
  if (!Number.isSafeInteger(expectedRevision) || expectedRevision < 0 || expectedRevision >= Number.MAX_SAFE_INTEGER) return { ok: false as const }
  return database.$transaction(async (tx) => {
    await lockOwner(tx, userId)
    const preference = await tx.userPreference.findUnique({ where: { userId }, select: { appSettings: true } })
    const settings = objectRecord(preference?.appSettings)
    if (onboardingDraftRevision(settings) !== expectedRevision) return { ok: false as const, conflict: true }
    const revision = expectedRevision + 1
    const setup = objectRecord(settings.onboardingSetup)
    const next: Record<string, unknown> = { ...settings }
    if (complete) {
      next.onboarding = buildOnboardingPreference(input)
      delete next.onboardingDraft
    } else {
      next.onboardingDraft = buildOnboardingDraft(input)
    }
    // A late autosave may finish after a continuation offer or its decline.
    // Preserve that consumed/declined state instead of enabling reminders again.
    const phase = ["resumed", "resume_offered", "skipped"].includes(String(setup.phase)) ? setup.phase : "started"
    next.onboardingSetup = { version: 1, phase: complete ? "completed" : phase, draftRevision: revision }
    await writeSettings(tx, userId, next as Prisma.InputJsonObject)
    return { ok: true as const, revision }
  })
}

async function writeSettings(tx: Prisma.TransactionClient, userId: string, appSettings: Prisma.InputJsonObject) {
  await tx.userPreference.upsert({
    where: { userId },
    create: { userId, version: USER_PREFERENCES_VERSION, appSettings },
    update: { appSettings },
  })
}
