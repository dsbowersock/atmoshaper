import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import test from "node:test"
import * as setup from "../lib/onboarding-setup.js"
import * as preferences from "../lib/onboarding-preferences.js"
import * as legalGate from "../lib/legal-acceptance-gate.js"
import { createCompiledModuleLoader, createElement, findElement } from "./helpers/compiled-module.mjs"

const compile = createCompiledModuleLoader(import.meta.url)
const source = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8")
const routing = compile(await source("lib/onboarding-setup-service.ts"), "setup-service.ts", {
  "./account-preferences.js": { USER_PREFERENCES_VERSION: 1 },
  "./onboarding-preferences.js": preferences,
  "./onboarding-setup.js": setup,
})
const jsx = { jsx: createElement, jsxs: createElement }
const surfaces = { AppPageShell: "shell", AppSurface: "surface", AppInset: "inset" }
const documents = [{ key: "terms", version: "existing-version", label: "Terms", route: "/terms" }]
function redirect(destination) { throw Object.assign(new Error("redirect"), { destination }) }
const goesTo = (destination) => (error) => error.destination === destination

test("registration retains Login's legal-gate destination for both verification and OAuth", async () => {
  const page = compile(await source("app/register/page.tsx"), "register-page.tsx", {
    "react/jsx-runtime": jsx,
    "@/lib/auth-env": { hasGoogleAuthConfig: () => true },
    "@/lib/public-launch-controls": { getPublicLaunchControls: () => ({ registrationOpen: true }) },
    "@/components/ui/app-surface": surfaces,
    "./register-form": { RegisterForm: "register-form" },
    "@/lib/legal-acceptance-gate": legalGate,
  }).default
  const handoff = legalGate.buildRegistrationLegalProviderRedirectPath("/wellness?view=feelings#record")
  for (const [callbackUrl, expected] of [
    [handoff, "/wellness?view=feelings#record"],
    [[handoff, "/clock"], "/wellness?view=feelings#record"],
    ["/legal/accept?callbackUrl=%2Fwellness&callbackUrl=%2Fclock&ignored=1", "/wellness"],
    ["/legal/accept?callbackUrl=%2F%2Fevil.example", "/"],
    ["/legal/accept?callbackUrl=%2Fapi%2Faccount%2Fpreferences", "/"],
    ["/legal/accept?callbackUrl=%2Flegal%2Faccept%3FcallbackUrl%3D%252Fwellness", "/"],
    ["/legal/accept?callbackUrl=%E0%A4%A", "/"],
    [undefined, "/"],
  ]) {
    const tree = await page({ searchParams: Promise.resolve({ callbackUrl }) })
    const registration = findElement(tree, (node) => node.type === "register-form")
    assert.equal(registration.props.initialCallbackUrl, expected, JSON.stringify(callbackUrl))
    assert.equal(legalGate.buildRegistrationLegalProviderRedirectPath(registration.props.initialCallbackUrl), legalGate.buildRegistrationLegalAcceptancePath(expected))
  }
})

/** A fictional preference owner; all service writes must still target this owner. */
function fixture(settings = { onboardingSetup: setup.initialOnboardingSetup() }) {
  const events = []
  let stored = structuredClone(settings)
  const userPreference = {
    async findUnique({ where }) {
      assert.equal(where.userId, "fictional-owner")
      events.push("read")
      return { appSettings: structuredClone(stored) }
    },
    async upsert({ where, update }) {
      assert.equal(where.userId, "fictional-owner")
      events.push("write")
      stored = structuredClone(update.appSettings)
    },
  }
  const db = { userPreference, $queryRaw: async () => events.push("lock") }
  db.$transaction = async (work) => work(db)
  return { db, events, get settings() { return stored } }
}

test("welcome GET reads only, preserves the task, and redirects consumed/old accounts without another offer", async () => {
  let signedIn = true
  const owner = fixture()
  const page = compile(await source("app/onboarding/welcome/page.tsx"), "welcome-page.tsx", {
    "react/jsx-runtime": jsx, "next/navigation": { redirect },
    "@/lib/rsc-session": { getCurrentRscSession: async () => signedIn ? { user: { id: "fictional-owner" } } : null },
    "@/lib/prisma": { prisma: owner.db }, "@/lib/onboarding-setup": setup,
    "@/components/account/onboarding-invitation": { OnboardingInvitation: "invitation" },
  }).default
  const props = { searchParams: Promise.resolve({ returnTo: "/calendar?date=2030-01-02#events" }) }
  const tree = await page(props)
  assert.equal(tree.type, "invitation")
  assert.equal(tree.props.ownerKey, "fictional-owner")
  assert.equal(tree.props.returnTo, "/calendar?date=2030-01-02#events")
  assert.deepEqual(owner.events, ["read"], "GET/prefetch must never claim the invitation")
  await routing.claimOnboardingInvitation(owner.db, "fictional-owner")
  await assert.rejects(page(props), goesTo("/calendar?date=2030-01-02#events"))
  signedIn = false
  const readCount = owner.events.length
  await assert.rejects(page(props), goesTo(`/login?callbackUrl=${encodeURIComponent(setup.onboardingInvitationPath(tree.props.returnTo))}`))
  assert.equal(owner.events.length, readCount, "no signed-out preference lookup")
  signedIn = true
  owner.db.userPreference.findUnique = async () => { throw new Error("private provider detail") }
  await assert.rejects(page(props), goesTo("/calendar?date=2030-01-02#events"))
})

test("setup invitation stays behind the existing legal gate, including its explicit acceptance action", async () => {
  const owner = fixture()
  let accepted = false
  const legal = {
    hasAcceptedCurrentDocuments: async () => accepted,
    acceptedDocumentIdsFromInput: (values) => values,
    missingRequiredLegalDocuments: ({ acceptedDocumentIds }) => acceptedDocumentIds.includes("terms:existing-version") ? [] : documents,
    legalHeadersMetadata: () => ({}),
    recordLegalAcceptances: async () => { owner.events.push("legal-recorded"); accepted = true },
  }
  const dependencies = {
    "next/navigation": { redirect }, "next/headers": { headers: async () => new Headers() },
    "@/auth": { getRegistrationLegalAcceptanceSession: async () => ({ user: { id: "fictional-owner" } }) },
    "@/lib/legal-acceptance": legal, "@/lib/legal-acceptance-gate": legalGate,
    "@/lib/legal-documents": { requiredLegalDocumentsForEvent: () => documents, legalDocumentAcceptanceId: () => "terms:existing-version" },
    "@/lib/prisma": { prisma: owner.db }, "@/lib/onboarding-setup-service": routing,
  }
  const action = compile(await source("app/legal/accept/actions.ts"), "legal-actions.ts", dependencies).acceptRegistrationLegalDocumentsAction
  const page = compile(await source("app/legal/accept/page.tsx"), "legal-page.tsx", {
    ...dependencies, "react/jsx-runtime": jsx, "next/link": { default: "a" }, "lucide-react": { ShieldCheck: "icon" },
    "@/lib/seo": { createNoindexPageMetadata: (value) => value }, "./actions": { acceptRegistrationLegalDocumentsAction: action },
    "@/components/ui/app-surface": surfaces, "@/components/ui/button": { Button: "button" },
  }).default
  const tree = await page({ searchParams: Promise.resolve({ callbackUrl: "/calendar" }) })
  assert.ok(findElement(tree, (node) => node.type === "form"))
  assert.deepEqual(owner.events, [], "no setup routing before consent")
  const form = new FormData()
  form.set("callbackUrl", "/calendar")
  await assert.rejects(action(form), goesTo("/legal/accept?callbackUrl=%2Fcalendar&legal=registration-required"))
  assert.deepEqual(owner.events, [])
  form.set("acceptedLegalDocuments", "terms:existing-version")
  await assert.rejects(action(form), goesTo("/onboarding/welcome?returnTo=%2Fcalendar"))
  assert.deepEqual(owner.events, ["legal-recorded", "read"])
  await routing.claimOnboardingInvitation(owner.db, "fictional-owner")
  await routing.chooseOnboardingSetup(owner.db, "fictional-owner", "skipped")
  await assert.rejects(page({ searchParams: Promise.resolve({ callbackUrl: "/calendar" }) }), goesTo("/calendar"))
  await assert.rejects(page({ searchParams: Promise.resolve({ callbackUrl: "/onboarding" }) }), goesTo("/onboarding"))
})

test("finishing guided setup merges preferences and preserves the original task; manual reopening still saves", async () => {
  const owner = fixture({ onboardingSetup: { version: 1, phase: "started" }, themeMode: "dark", planner: { untouched: true } })
  let signedIn = true
  const save = compile(await source("app/onboarding/actions.ts"), "onboarding-actions.ts", {
    "next/navigation": { redirect }, "@/auth": { getCurrentSession: async () => signedIn ? { user: { id: "fictional-owner" } } : null },
    "@/lib/onboarding-setup-service": routing,
    "@/lib/account-surface-data": { clearAccountSurfaceDataCache: () => {} },
    "@/lib/onboarding-preferences": preferences, "@/lib/onboarding-setup": setup, "@/lib/prisma": { prisma: owner.db },
  }).saveOnboardingAction
  const form = new FormData()
  form.set("primaryRole", "public_wellness")
  form.set("returnTo", "/calendar?date=2030-01-02#events")
  assert.deepEqual(await save("fictional-owner", setup.onboardingDraftRevision(owner.settings), form), { ok: true, redirectTo: "/calendar?date=2030-01-02#events" })
  assert.deepEqual(owner.events, ["lock", "read", "write"])
  assert.equal(owner.settings.onboardingSetup.phase, "completed")
  assert.equal(owner.settings.themeMode, "dark")
  assert.deepEqual(owner.settings.planner, { untouched: true })
  assert.ok(owner.settings.onboarding.completedAt)
  assert.equal(await routing.postSignInSetupDestination(owner.db, "fictional-owner", "/"), "/")
  form.delete("returnTo")
  assert.deepEqual(await save("fictional-owner", setup.onboardingDraftRevision(owner.settings), form), { ok: true, redirectTo: preferences.getOnboardingRecommendedPath("public_wellness") })
  form.set("returnTo", "//untrusted.example")
  assert.deepEqual(await save("fictional-owner", setup.onboardingDraftRevision(owner.settings), form), { ok: true, redirectTo: "/" })
  signedIn = false
  form.set("returnTo", "/calendar")
  const count = owner.events.length
  assert.deepEqual(await save("fictional-owner", setup.onboardingDraftRevision(owner.settings), form), { ok: false })
  assert.equal(owner.events.length, count)
})

test("draft actions reject changed account owners and the guided page restores saved answers", async () => {
  const owner = fixture({
    onboarding: { primaryRole: "public_wellness" },
    onboardingSetup: { version: 1, phase: "skipped", draftRevision: 4 },
    onboardingDraft: { version: 1, answers: { primaryRole: "therapist", jurisdiction: "OH", useCases: ["manage_practice"], homeShortcuts: ["chimer"] } },
  })
  let actor = "another-owner"
  const actions = compile(await source("app/onboarding/actions.ts"), "draft-actions.ts", {
    "next/navigation": { redirect }, "@/auth": { getCurrentSession: async () => ({ user: { id: actor } }) },
    "@/lib/account-surface-data": { clearAccountSurfaceDataCache: () => {} },
    "@/lib/onboarding-preferences": preferences, "@/lib/onboarding-setup": setup,
    "@/lib/prisma": { prisma: owner.db }, "@/lib/onboarding-setup-service": routing,
  })
  assert.deepEqual(await actions.saveOnboardingDraftAction("fictional-owner", 4, new FormData()), { ok: false })
  assert.deepEqual(await actions.saveOnboardingAction("fictional-owner", 4, new FormData()), { ok: false })
  assert.deepEqual(owner.events, [])
  actor = "fictional-owner"
  const page = compile(await source("app/onboarding/page.tsx"), "guided-page.tsx", {
    "react/jsx-runtime": jsx, "next/link": { default: "a" }, "next/navigation": { redirect },
    "lucide-react": Object.fromEntries(["ArrowRight", "BadgeCheck", "Gamepad2", "LayoutDashboard", "MapPinned"].map((name) => [name, "icon"])),
    "@/lib/rsc-session": { getCurrentRscSession: async () => ({ user: { id: actor } }) },
    "@/lib/onboarding-preferences": preferences, "@/lib/prisma": { prisma: owner.db },
    "@/lib/utils": { cn: (...values) => values.join(" ") }, "@/lib/onboarding-setup": setup,
    "@/lib/public-product-identity": { PUBLIC_PRODUCT_IDENTITY: { name: "AtmoShaper" } },
    "@/components/account/onboarding-draft-form": { OnboardingDraftForm: "draft-form" },
    "@/components/home/home-shortcut-editor": { HomeShortcutEditor: "shortcut-editor" },
    "@/components/ui/app-surface": surfaces, "@/components/ui/button": { Button: "button" },
    "@/components/ui/input": { Input: "input" }, "@/components/ui/label": { Label: "label" },
  }).default
  const tree = await page({ searchParams: Promise.resolve({}) })
  assert.equal(findElement(tree, (node) => node.type === "draft-form").props.initialRevision, 4)
  assert.equal(findElement(tree, (node) => node.type === "input" && node.props.name === "jurisdiction").props.defaultValue, "OH")
  assert.equal(findElement(tree, (node) => node.type === "input" && node.props.value === "therapist").props.defaultChecked, true)
  assert.deepEqual(findElement(tree, (node) => node.type === "shortcut-editor").props.defaultSelection, ["chimer"])
  assert.equal(owner.settings.onboardingSetup.phase, "skipped", "reading a draft cannot enable reminders")
})
