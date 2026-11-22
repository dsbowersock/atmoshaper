// @ts-check
import { safePostLegalAcceptanceCallback } from "./legal-acceptance-gate.js"
import { buildOnboardingPreference, objectRecord } from "./onboarding-preferences.js"

export const ONBOARDING_INVITATION_ROUTE = "/onboarding/welcome"

/** A new account alone receives this server-owned, non-clinical lifecycle. */
export function initialOnboardingSetup() {
  return { version: 1, phase: "pending" }
}

/** Starting setup opts into one later continuation offer. A declined offer or
 * a previously shown continuation never causes an automatic reminder.
 * @param {unknown} settings
 * @returns {"new" | "resume" | null} */
export function onboardingInvitationKind(settings) {
  const value = objectRecord(settings)
  const setup = objectRecord(value.onboardingSetup)
  if (setup.version !== 1) return null
  if (setup.phase === "pending" && typeof objectRecord(value.onboarding).completedAt !== "string") return "new"
  if (setup.phase === "started" && objectRecord(value.onboardingDraft).version === 1) return "resume"
  return null
}

/** @param {unknown} settings */
export function shouldOfferOnboarding(settings) {
  return onboardingInvitationKind(settings) !== null
}

/** Monotonic draft revisions prevent older tabs or in-flight autosaves from
 * overwriting newer answers or reopening a completed setup.
 * @param {unknown} settings */
export function onboardingDraftRevision(settings) {
  const revision = objectRecord(objectRecord(settings).onboardingSetup).draftRevision
  return typeof revision === "number" && Number.isSafeInteger(revision) && revision >= 0 ? revision : 0
}

/** Reuse the constrained, non-clinical answer schema without applying answers
 * or claiming completion until the user explicitly finishes.
 * @param {FormData} input */
export function buildOnboardingDraft(input) {
  const answers = Object.fromEntries(Object.entries(buildOnboardingPreference(input)).filter(([key]) => key !== "completedAt"))
  return { version: 1, answers }
}

/** Preserve app-local destinations without allowing a setup/acceptance loop.
 * @param {unknown} value */
export function onboardingReturnTo(value) {
  const path = safePostLegalAcceptanceCallback(value, "/")
  const pathname = decodeURIComponent(new URL(path, "https://atmoshaper.invalid").pathname).toLowerCase()
  return pathname === "/onboarding" || pathname.startsWith("/onboarding/") ? "/" : path
}

/** @param {unknown} returnTo */
export function onboardingInvitationPath(returnTo) {
  return `${ONBOARDING_INVITATION_ROUTE}?${new URLSearchParams({ returnTo: onboardingReturnTo(returnTo) })}`
}

/** @param {unknown} returnTo */
export function guidedOnboardingPath(returnTo) {
  return `/onboarding?${new URLSearchParams({ returnTo: onboardingReturnTo(returnTo) })}`
}

/** Login may already carry our invitation as its explicit destination. Unwrap
 * that one layer so re-authentication retains the original task without loops.
 * @param {string} callback */
export function setupCallbackTarget(callback) {
  const safeCallback = safePostLegalAcceptanceCallback(callback, "/")
  const parsed = new URL(safeCallback, "https://atmoshaper.invalid")
  return decodeURIComponent(parsed.pathname).toLowerCase() === ONBOARDING_INVITATION_ROUTE
    ? onboardingReturnTo(parsed.searchParams.get("returnTo")) : safeCallback
}
