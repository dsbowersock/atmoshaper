import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import { beforeEach, describe, it } from "node:test"
import { decideAuthSessionVersion } from "../lib/auth-session-version.ts"
import { createCompiledModuleLoader } from "./helpers/compiled-module.mjs"
import { createStrictLegalAcceptanceGateDouble } from "./helpers/legal-acceptance-gate-double.mjs"
import { queueAccountSecurityEmail } from "../lib/account-security-email-intents.ts"

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8")
const loadCompiledModule = createCompiledModuleLoader(import.meta.url)

const {
  legalRedirectInvocations,
  resetLegalRedirectInvocations,
  strictLegalAcceptanceGate,
} = createStrictLegalAcceptanceGateDouble()

describe("JWT session-version decisions", () => {
  it("adopts the current non-negative database version on sign-in", () => {
    assert.deepEqual(decideAuthSessionVersion({ currentVersion: 4, tokenVersion: undefined, isSignIn: true }), {
      accepted: true,
      version: 4,
    })
    assert.deepEqual(decideAuthSessionVersion({ currentVersion: 4, tokenVersion: "client-value", isSignIn: true }), {
      accepted: true,
      version: 4,
    })
  })

  it("accepts exact current versions and upgrades only legacy version-zero tokens", () => {
    assert.deepEqual(decideAuthSessionVersion({ currentVersion: 2, tokenVersion: 2, isSignIn: false }), {
      accepted: true,
      version: 2,
    })
    assert.deepEqual(decideAuthSessionVersion({ currentVersion: 0, tokenVersion: undefined, isSignIn: false }), {
      accepted: true,
      version: 0,
    })
  })

  it("rejects legacy, stale, newer, malformed, negative, and fractional versions", () => {
    for (const [label, currentVersion, tokenVersion] of [
      ["legacy after increment", 1, undefined],
      ["stale", 3, 2],
      ["newer", 2, 3],
      ["null", 0, null],
      ["string", 0, "0"],
      ["negative", 0, -1],
      ["fractional", 0, 0.5],
      ["unsafe integer", 0, Number.MAX_SAFE_INTEGER + 1],
    ]) {
      assert.deepEqual(
        decideAuthSessionVersion({ currentVersion, tokenVersion, isSignIn: false }),
        { accepted: false },
        label,
      )
    }
  })

  it("fails closed when the database version is not a non-negative safe integer", () => {
    for (const currentVersion of [undefined, null, "0", -1, 0.5, Number.MAX_SAFE_INTEGER + 1]) {
      assert.deepEqual(
        decideAuthSessionVersion({ currentVersion, tokenVersion: 0, isSignIn: true }),
        { accepted: false },
      )
    }
  })
})

describe("JWT session-version integration contract", () => {
  beforeEach(() => {
    resetLegalRedirectInvocations()
  })

  it("routes paused Google registration through the legal acceptance gate", async () => {
    const authSource = await read("auth.ts")
    let capturedConfig
    class CredentialsSignin extends Error {}
    const NextAuth = (config) => {
      capturedConfig = config
      return { handlers: {}, auth: async () => null, signIn() {}, signOut() {} }
    }
    NextAuth.CredentialsSignin = CredentialsSignin

    loadCompiledModule(authSource, "auth-legal-redirect.test.ts", {
      "next-auth": NextAuth,
      "next-auth/providers/credentials": (config) => config,
      "next-auth/providers/google": (config) => config,
      "next/headers": { cookies: async () => ({ get: () => undefined }) },
      "@auth/prisma-adapter": { PrismaAdapter: () => ({}) },
      "@/lib/prisma": { prisma: {} },
      "@/lib/auth-account-linking": { googleProfileEmail: () => "", isVerifiedGoogleProfile: () => true },
      "@/lib/auth-env": {
        getAuthSecret: () => "test-secret",
        getGoogleAuthConfig: () => null,
        getSiteUrl: () => "http://localhost:3000",
      },
      "@/lib/auth-method-proof": { verifyPasswordMethodProof: async () => ({ status: "INVALID" }) },
      "@/lib/auth-request": { authRequestNetworkIdentifier: () => "network" },
      "@/lib/auth-method-intents": {
        AUTH_METHOD_INTENT_COOKIE: "ml-auth-method-binding",
        parseAuthMethodIntentBinding: () => null,
        prepareGoogleAuthentication: async () => ({
          kind: "REGISTRATION_PAUSED",
          callbackPath: "/legal/accept?callbackUrl=%2Fwellness",
        }),
      },
      "@/lib/legal-acceptance-gate": strictLegalAcceptanceGate,
      "@/lib/legal-acceptance": { hasAcceptedCurrentDocuments: async () => true },
      "@/lib/legal-documents": { requiredLegalDocumentsForEvent: () => [] },
      "@/lib/auth-users": {
        ensureGoogleUserState: async () => {},
        ensureUserRole: async () => {},
        getUserAuthState: async () => null,
      },
      "@/lib/auth-session-version": { decideAuthSessionVersion },
      "@/lib/auth-security": { normalizeEmail: () => "" },
    })

    const redirect = await capturedConfig.callbacks.signIn({
      account: { provider: "google" },
      profile: {},
    })

    assert.equal(redirect, "/register?callbackUrl=%2Fregister%3FcallbackUrl%3D%252F")
    assert.deepEqual(legalRedirectInvocations, [["/legal/accept?callbackUrl=%2Fwellness"]])
  })

  it("fails ordinary sessions closed until current registration documents are accepted", async () => {
    const authSource = await read("auth.ts")
    const rawSession = { user: { id: "stale-v2-user", email: "person@example.test" } }
    const requiredDocuments = [
      { key: "terms", version: "current-terms" },
      { key: "privacy", version: "current-privacy" },
    ]
    const prisma = { legalAcceptance: {} }
    const acceptanceCalls = []
    let currentRawSession = rawSession
    let acceptanceResult = false
    let acceptanceError = null
    class CredentialsSignin extends Error {}
    const NextAuth = () => ({
      handlers: {},
      auth: async () => currentRawSession,
      signIn() {},
      signOut() {},
    })
    NextAuth.CredentialsSignin = CredentialsSignin

    const authModule = loadCompiledModule(authSource, "auth-registration-acceptance-session.test.ts", {
      "next-auth": NextAuth,
      "next-auth/providers/credentials": (config) => config,
      "next-auth/providers/google": (config) => config,
      "next/headers": { cookies: async () => ({ get: () => undefined }) },
      "@auth/prisma-adapter": { PrismaAdapter: () => ({}) },
      "@/lib/prisma": { prisma },
      "@/lib/auth-account-linking": { googleProfileEmail: () => "", isVerifiedGoogleProfile: () => true },
      "@/lib/auth-env": {
        getAuthSecret: () => "test-secret",
        getGoogleAuthConfig: () => null,
        getSiteUrl: () => "http://localhost:3000",
      },
      "@/lib/auth-method-proof": { verifyPasswordMethodProof: async () => ({ status: "INVALID" }) },
      "@/lib/auth-request": { authRequestNetworkIdentifier: () => "network" },
      "@/lib/auth-method-intents": {
        AUTH_METHOD_INTENT_COOKIE: "ml-auth-method-binding",
        parseAuthMethodIntentBinding: () => null,
        prepareGoogleAuthentication: async () => ({ kind: "REJECTED", recoveryPath: "/login?auth=google-retry" }),
      },
      "@/lib/legal-acceptance": {
        async hasAcceptedCurrentDocuments(input) {
          acceptanceCalls.push(input)
          if (acceptanceError) throw acceptanceError
          return acceptanceResult
        },
      },
      "@/lib/legal-acceptance-gate": strictLegalAcceptanceGate,
      "@/lib/legal-documents": {
        requiredLegalDocumentsForEvent: (event) => {
          assert.equal(event, "registration")
          return requiredDocuments
        },
      },
      "@/lib/auth-users": {
        ensureGoogleUserState: async () => {},
        ensureUserRole: async () => {},
        getUserAuthState: async () => null,
      },
      "@/lib/auth-session-version": { decideAuthSessionVersion },
      "@/lib/auth-security": { normalizeEmail: () => "" },
    })

    assert.equal(await authModule.getCurrentSession(), null)
    assert.deepEqual(acceptanceCalls, [{
      prismaClient: prisma,
      userId: "stale-v2-user",
      documents: requiredDocuments,
    }])
    assert.equal(await authModule.getRegistrationLegalAcceptanceSession(), rawSession)

    acceptanceResult = true
    assert.equal(await authModule.getCurrentSession(), rawSession)

    currentRawSession = null
    const callsBeforeAnonymous = acceptanceCalls.length
    assert.equal(await authModule.getCurrentSession(), null)
    assert.equal(acceptanceCalls.length, callsBeforeAnonymous)
    assert.equal(await authModule.getRegistrationLegalAcceptanceSession(), null)

    currentRawSession = rawSession
    acceptanceError = new Error("legal acceptance lookup unavailable")
    assert.equal(await authModule.getCurrentSession(), null)
  })

  it("filters the public Auth.js session response through current registration acceptance", async () => {
    const authSource = await read("auth.ts")
    const rawSession = { user: { id: "stale-v2-user", email: "person@example.test" }, expires: "2099-01-01" }
    const requiredDocuments = [{ key: "terms", version: "current" }, { key: "privacy", version: "current" }]
    const prisma = { legalAcceptance: {} }
    const acceptanceCalls = []
    const rawGetResponses = []
    const rawPostResponses = []
    let rawResponseBody = rawSession
    let acceptanceResult = false
    let acceptanceError = null
    const rawPost = async (request) => {
      const body = new URL(request.url).pathname === "/api/auth/session"
        ? rawResponseBody
        : { action: "raw-post" }
      const response = new Response(JSON.stringify(body), {
        status: 208,
        statusText: "Raw Auth POST Response",
        headers: {
          "content-length": "999",
          "content-type": "application/json",
          "set-cookie": "post-auth-cookie=preserved; Path=/; HttpOnly",
          "x-auth-owner": "raw-post",
        },
      })
      rawPostResponses.push(response)
      return response
    }
    const rawGet = async (request) => {
      const body = new URL(request.url).pathname === "/api/auth/session"
        ? rawResponseBody
        : { provider: "raw" }
      const response = new Response(JSON.stringify(body), {
        status: 207,
        statusText: "Raw Auth Response",
        headers: {
          "content-length": "999",
          "content-type": "application/json",
          "set-cookie": "auth-cookie=preserved; Path=/; HttpOnly",
          "x-auth-owner": "raw",
        },
      })
      rawGetResponses.push(response)
      return response
    }
    class CredentialsSignin extends Error {}
    const NextAuth = () => ({
      handlers: { GET: rawGet, POST: rawPost },
      auth: async () => rawSession,
      signIn() {},
      signOut() {},
    })
    NextAuth.CredentialsSignin = CredentialsSignin

    const authModule = loadCompiledModule(authSource, "auth-public-session-acceptance.test.ts", {
      "next-auth": NextAuth,
      "next-auth/providers/credentials": (config) => config,
      "next-auth/providers/google": (config) => config,
      "next/headers": { cookies: async () => ({ get: () => undefined }) },
      "@auth/prisma-adapter": { PrismaAdapter: () => ({}) },
      "@/lib/prisma": { prisma },
      "@/lib/auth-account-linking": { googleProfileEmail: () => "", isVerifiedGoogleProfile: () => true },
      "@/lib/auth-env": {
        getAuthSecret: () => "test-secret",
        getGoogleAuthConfig: () => null,
        getSiteUrl: () => "http://localhost:3000",
      },
      "@/lib/auth-method-proof": { verifyPasswordMethodProof: async () => ({ status: "INVALID" }) },
      "@/lib/auth-request": { authRequestNetworkIdentifier: () => "network" },
      "@/lib/auth-method-intents": {
        AUTH_METHOD_INTENT_COOKIE: "ml-auth-method-binding",
        parseAuthMethodIntentBinding: () => null,
        prepareGoogleAuthentication: async () => ({ kind: "REJECTED", recoveryPath: "/login?auth=google-retry" }),
      },
      "@/lib/legal-acceptance": {
        async hasAcceptedCurrentDocuments(input) {
          acceptanceCalls.push(input)
          if (acceptanceError) throw acceptanceError
          return acceptanceResult
        },
      },
      "@/lib/legal-acceptance-gate": strictLegalAcceptanceGate,
      "@/lib/legal-documents": {
        requiredLegalDocumentsForEvent: (event) => {
          assert.equal(event, "registration")
          return requiredDocuments
        },
      },
      "@/lib/auth-users": {
        ensureGoogleUserState: async () => {},
        ensureUserRole: async () => {},
        getUserAuthState: async () => null,
      },
      "@/lib/auth-session-version": { decideAuthSessionVersion },
      "@/lib/auth-security": { normalizeEmail: () => "" },
    })

    const staleResponse = await authModule.handlers.GET(new Request("https://massagelab.test/api/auth/session"))
    assert.deepEqual(await staleResponse.json(), null)
    assert.equal(staleResponse.status, 207)
    assert.equal(staleResponse.statusText, "Raw Auth Response")
    assert.equal(staleResponse.headers.get("set-cookie"), "auth-cookie=preserved; Path=/; HttpOnly")
    assert.equal(staleResponse.headers.get("x-auth-owner"), "raw")
    assert.equal(staleResponse.headers.get("content-length"), null)
    assert.deepEqual(acceptanceCalls, [{
      prismaClient: prisma,
      userId: "stale-v2-user",
      documents: requiredDocuments,
    }])

    acceptanceResult = true
    const acceptedResponse = await authModule.handlers.GET(new Request("https://massagelab.test/api/auth/session"))
    assert.equal(acceptedResponse, rawGetResponses.at(-1))
    assert.deepEqual(await acceptedResponse.json(), rawSession)

    const callsBeforeAnonymous = acceptanceCalls.length
    for (const anonymousBody of [null, { user: { email: "missing-id@example.test" } }]) {
      rawResponseBody = anonymousBody
      const anonymousResponse = await authModule.handlers.GET(new Request("https://massagelab.test/api/auth/session"))
      assert.deepEqual(await anonymousResponse.json(), null)
      assert.equal(anonymousResponse.headers.get("content-length"), null)
    }
    assert.equal(acceptanceCalls.length, callsBeforeAnonymous)

    rawResponseBody = rawSession
    acceptanceError = new Error("legal acceptance lookup unavailable")
    const failedLookupResponse = await authModule.handlers.GET(new Request("https://massagelab.test/api/auth/session"))
    assert.deepEqual(await failedLookupResponse.json(), null)

    acceptanceError = null
    rawResponseBody = Symbol("malformed session JSON")
    const malformedResponse = await authModule.handlers.GET(new Request("https://massagelab.test/api/auth/session"))
    assert.deepEqual(await malformedResponse.json(), null)

    const nonSessionResponse = await authModule.handlers.GET(new Request("https://massagelab.test/api/auth/providers"))
    assert.equal(nonSessionResponse, rawGetResponses.at(-1))
    assert.deepEqual(await nonSessionResponse.json(), { provider: "raw" })

    rawResponseBody = rawSession
    acceptanceResult = false
    const stalePostResponse = await authModule.handlers.POST(new Request("https://massagelab.test/api/auth/session", { method: "POST" }))
    assert.deepEqual(await stalePostResponse.json(), null)
    assert.equal(stalePostResponse.status, 208)
    assert.equal(stalePostResponse.statusText, "Raw Auth POST Response")
    assert.equal(stalePostResponse.headers.get("set-cookie"), "post-auth-cookie=preserved; Path=/; HttpOnly")
    assert.equal(stalePostResponse.headers.get("x-auth-owner"), "raw-post")
    assert.equal(stalePostResponse.headers.get("content-length"), null)

    acceptanceResult = true
    const acceptedPostResponse = await authModule.handlers.POST(new Request("https://massagelab.test/api/auth/session", { method: "POST" }))
    assert.equal(acceptedPostResponse, rawPostResponses.at(-1))
    assert.deepEqual(await acceptedPostResponse.json(), rawSession)

    const nonSessionPostResponse = await authModule.handlers.POST(new Request("https://massagelab.test/api/auth/callback/credentials", { method: "POST" }))
    assert.equal(nonSessionPostResponse, rawPostResponses.at(-1))
    assert.deepEqual(await nonSessionPostResponse.json(), { action: "raw-post" })
    assert.equal(await authModule.getRegistrationLegalAcceptanceSession(), rawSession)
  })

  it("rejects a pre-reset JWT version after reset consumption advances the account version", async () => {
    const [resetSource] = await Promise.all([
      read("lib/password-reset-confirmation.ts"),
    ])
    const database = createResetConsumptionDatabase()
    const { confirmPasswordReset } = loadCompiledModule(resetSource, "password-reset-confirmation.test.ts", {
      "./commerce/transactions.ts": {
        runCommerceTransaction: (prismaClient, callback) => prismaClient.$transaction(callback),
      },
      "./account-security-email-intents.ts": { queueAccountSecurityEmail },
      "./auth-security.js": { normalizeEmail: (value) => String(value ?? "").trim().toLowerCase() },
    })

    assert.deepEqual(await confirmPasswordReset({
      prismaClient: database,
      tokenHash: "active-reset-token",
      passwordHash: "new-password-hash",
      clock: () => new Date("2026-08-11T12:00:00.000Z"),
    }), { status: "UPDATED", emailIntentId: "intent-1" })
    assert.deepEqual(database.state.emailIntents.map(({ kind, recipientEmail }) => ({ kind, recipientEmail })), [{
      kind: "PASSWORD_RECOVERED",
      recipientEmail: "person@example.com",
    }])

    const decision = decideAuthSessionVersion({
      currentVersion: database.state.user.authSessionVersion,
      tokenVersion: 4,
      isSignIn: false,
    })

    assert.deepEqual(decision, { accepted: false })
  })

  it("completes reset state atomically without queuing a notice when the account email is null", async () => {
    const resetSource = await read("lib/password-reset-confirmation.ts")
    const database = createResetConsumptionDatabase({ email: null })
    const { confirmPasswordReset } = loadCompiledModule(resetSource, "password-reset-confirmation-null-email.test.ts", {
      "./commerce/transactions.ts": {
        runCommerceTransaction: (prismaClient, callback) => prismaClient.$transaction(callback),
      },
      "./account-security-email-intents.ts": { queueAccountSecurityEmail },
      "./auth-security.js": { normalizeEmail: (value) => String(value ?? "").trim().toLowerCase() },
    })

    assert.deepEqual(await confirmPasswordReset({
      prismaClient: database,
      tokenHash: "active-reset-token",
      passwordHash: "new-password-hash",
      clock: () => new Date("2026-08-11T12:00:00.000Z"),
    }), { status: "UPDATED" })
    assert.equal(database.state.passwordCredential.passwordHash, "new-password-hash")
    assert.equal(database.state.passwordResetTokens.every((token) => token.consumedAt instanceof Date), true)
    assert.equal(database.state.user.authSessionVersion, 5)
    assert.deepEqual(database.state.sessions, [])
    assert.deepEqual(database.state.emailIntents, [])
  })

  it("schedules reset-notice delivery only when confirmation returns an intent", async () => {
    const routeSource = await read("app/api/account/password-reset/confirm/route.ts")
    const scheduled = []
    const delivered = []
    const route = loadCompiledModule(routeSource, "password-reset-confirm-route.test.ts", {
      "next/server": {
        after: (callback) => scheduled.push(callback),
        NextResponse: { json: (body, init = {}) => ({ body, status: init.status ?? 200 }) },
      },
      "@/lib/account-security-email-intents": {
        deliverAccountSecurityEmailIntent: async ({ intentId }) => { delivered.push(intentId) },
      },
      "@/lib/auth-security": {
        hashPassword: async () => "new-password-hash",
        hashToken: () => "active-reset-token",
      },
      "@/lib/password-reset-confirmation": {
        isPasswordResetTokenEligible: async () => true,
        confirmPasswordReset: async () => ({ status: "UPDATED" }),
      },
      "@/lib/prisma": { prisma: {} },
    })

    const response = await route.POST(new Request("https://massagelab.test/api/account/password-reset/confirm", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ token: "raw-reset-token", password: "a-long-new-password" }),
    }))

    assert.equal(response.status, 200)
    assert.equal(scheduled.length, 0)
    assert.deepEqual(delivered, [])
  })

  it("keeps repeated security-email upserts idempotent in the reset transaction double", async () => {
    const database = createResetConsumptionDatabase()
    const input = {
      userId: "user-1",
      kind: "PASSWORD_RECOVERED",
      recipientEmail: "person@example.com",
      idempotencyKey: "password-recovered:reset-1",
    }
    const [first, replay] = await database.$transaction(async (tx) => [
      await queueAccountSecurityEmail(tx, input),
      await queueAccountSecurityEmail(tx, input),
    ])

    assert.deepEqual(first, replay)
    assert.equal(database.state.emailIntents.length, 1)
  })

  it("declares the additive schema, migration, and server-only JWT field", async () => {
    const [schema, migration, authTypes] = await Promise.all([
      read("prisma/schema.prisma"),
      read("prisma/migrations/20260808093000_admin_jwt_session_version/migration.sql"),
      read("types/next-auth.d.ts"),
    ])

    assert.match(schema, /authSessionVersion\s+Int\s+@default\(0\)/)
    assert.match(migration, /ALTER TABLE "User"[\s\S]*ADD COLUMN "authSessionVersion" INTEGER NOT NULL DEFAULT 0;/)
    assert.match(authTypes, /interface JWT \{[\s\S]*authSessionVersion\?: number/)
    assert.match(authTypes, /interface JWT \{[\s\S]*lastPasswordAuthenticatedAt\?: number/)
    assert.match(authTypes, /interface Session \{[\s\S]*lastPasswordAuthenticatedAt\?: number/)
    const sessionDeclarationMatch = authTypes.match(/interface Session \{[\s\S]*?^  \}/m)
    assert.ok(sessionDeclarationMatch, "Expected the Session interface declaration")
    const sessionDeclaration = sessionDeclarationMatch[0]
    assert.doesNotMatch(sessionDeclaration, /authSessionVersion/)
  })

  it("returns null without privilege fields when a normal database refresh rejects the JWT version", async () => {
    const [authSource, authUsersSource] = await Promise.all([
      read("auth.ts"),
      read("lib/auth-users.ts"),
    ])
    let capturedConfig
    const authStateCalls = []
    class CredentialsSignin extends Error {}
    const NextAuth = (config) => {
      capturedConfig = config
      return { handlers: {}, auth() {}, signIn() {}, signOut() {} }
    }
    NextAuth.CredentialsSignin = CredentialsSignin

    // Compile auth.ts with dependency doubles so callbacks.jwt is exercised
    // without loading real authentication providers or infrastructure.
    loadCompiledModule(authSource, "auth.test.ts", {
      "next-auth": NextAuth,
      "next-auth/providers/credentials": (config) => config,
      "next-auth/providers/google": (config) => config,
      "next/headers": { cookies: async () => ({ get: () => undefined }) },
      "@auth/prisma-adapter": { PrismaAdapter: () => ({}) },
      "@/lib/prisma": { prisma: {} },
      "@/lib/auth-account-linking": { googleProfileEmail: () => "", isVerifiedGoogleProfile: () => true },
      "@/lib/auth-env": {
        getAuthSecret: () => "test-secret",
        getGoogleAuthConfig: () => null,
        getSiteUrl: () => "http://localhost:3000",
      },
      "@/lib/auth-method-proof": { verifyPasswordMethodProof: async () => ({ status: "INVALID" }) },
      "@/lib/auth-request": { authRequestNetworkIdentifier: () => "network" },
      "@/lib/auth-method-intents": {
        AUTH_METHOD_INTENT_COOKIE: "ml-auth-method-binding",
        parseAuthMethodIntentBinding: () => null,
        prepareGoogleAuthentication: async () => ({ kind: "REJECTED", recoveryPath: "/login?auth=google-retry" }),
      },
      "@/lib/legal-acceptance-gate": strictLegalAcceptanceGate,
      "@/lib/legal-acceptance": { hasAcceptedCurrentDocuments: async () => true },
      "@/lib/legal-documents": { requiredLegalDocumentsForEvent: () => [] },
      "@/lib/auth-users": {
        ensureGoogleUserState: async () => {}, ensureUserRole: async () => {},
        async getUserAuthState(userId) {
          authStateCalls.push(userId)
          return {
            authSessionVersion: 2,
            role: "ADMIN",
            roles: ["ADMIN"],
            roleAssignments: [{ role: "ADMIN", status: "VERIFIED" }],
            capabilities: { canAdministerAccounts: true },
            emailVerified: true,
            twoFactorEnabled: true,
          }
        },
      },
      "@/lib/auth-session-version": { decideAuthSessionVersion },
      "@/lib/auth-security": {
        normalizeEmail: () => "",
      },
    })

    const token = { sub: "user-1", authSessionVersion: 1 }
    const result = await capturedConfig.callbacks.jwt({ token, user: undefined, account: undefined })

    assert.equal(result, null)
    assert.deepEqual(authStateCalls, ["user-1"])
    for (const field of ["role", "roles", "roleAssignments", "capabilities", "emailVerified", "twoFactorEnabled"]) {
      assert.equal(Object.hasOwn(token, field), false, field)
    }
    assert.match(authUsersSource, /select:\s*\{[\s\S]*authSessionVersion: true/)
    assert.match(authUsersSource, /return \{\s*authSessionVersion: user\?\.authSessionVersion,/)
    assert.doesNotMatch(authUsersSource, /authSessionVersion: user\?\.authSessionVersion\s*\?\?\s*0/)
    assert.match(authSource, /account\?\.provider === "credentials" && Number\.isFinite\(user\?\.passwordAuthenticatedAt\)/)
    assert.match(authSource, /token\.lastPasswordAuthenticatedAt = user\.passwordAuthenticatedAt/)
    assert.match(authSource, /session\.lastPasswordAuthenticatedAt = Number\.isFinite\(token\.lastPasswordAuthenticatedAt\)/)
    assert.deepEqual(legalRedirectInvocations, [])
  })

  it("mints and exposes password freshness only for a successful Credentials sign-in", async () => {
    const authSource = await read("auth.ts")
    let capturedConfig
    class CredentialsSignin extends Error {}
    const NextAuth = (config) => {
      capturedConfig = config
      return { handlers: {}, auth() {}, signIn() {}, signOut() {} }
    }
    NextAuth.CredentialsSignin = CredentialsSignin
    loadCompiledModule(authSource, "auth-password-freshness.test.ts", {
      "next-auth": NextAuth,
      "next-auth/providers/credentials": (config) => config,
      "next-auth/providers/google": (config) => config,
      "next/headers": { cookies: async () => ({ get: () => undefined }) },
      "@auth/prisma-adapter": { PrismaAdapter: () => ({}) },
      "@/lib/prisma": { prisma: {} },
      "@/lib/auth-account-linking": { googleProfileEmail: () => "", isVerifiedGoogleProfile: () => true },
      "@/lib/auth-env": { getAuthSecret: () => "test-secret", getGoogleAuthConfig: () => null, getSiteUrl: () => "http://localhost:3000" },
      "@/lib/auth-method-proof": { verifyPasswordMethodProof: async () => ({ status: "INVALID" }) },
      "@/lib/auth-request": { authRequestNetworkIdentifier: () => "network" },
      "@/lib/auth-method-intents": {
        AUTH_METHOD_INTENT_COOKIE: "ml-auth-method-binding",
        parseAuthMethodIntentBinding: () => null,
        prepareGoogleAuthentication: async () => ({ kind: "REJECTED", recoveryPath: "/login?auth=google-retry" }),
      },
      "@/lib/legal-acceptance-gate": strictLegalAcceptanceGate,
      "@/lib/legal-acceptance": { hasAcceptedCurrentDocuments: async () => true },
      "@/lib/legal-documents": { requiredLegalDocumentsForEvent: () => [] },
      "@/lib/auth-users": {
        ensureGoogleUserState: async () => {}, ensureUserRole: async () => {},
        getUserAuthState: async () => ({
          authSessionVersion: 0, role: "USER", roles: ["USER"],
          roleAssignments: [{ role: "USER", status: "VERIFIED" }], capabilities: {},
          emailVerified: true, twoFactorEnabled: false,
        }),
      },
      "@/lib/auth-session-version": { decideAuthSessionVersion },
      "@/lib/auth-security": { normalizeEmail: (value) => String(value ?? "") },
    })

    const passwordAuthenticatedAt = Date.parse("2026-08-28T12:00:00.000Z")
    const credentialToken = await capturedConfig.callbacks.jwt({
      token: {},
      user: { id: "user-1", passwordAuthenticatedAt },
      account: { provider: "credentials" },
    })
    assert.equal(credentialToken.lastPasswordAuthenticatedAt, passwordAuthenticatedAt)
    const session = await capturedConfig.callbacks.session({ session: { user: {} }, token: credentialToken })
    assert.equal(session.lastPasswordAuthenticatedAt, passwordAuthenticatedAt)

    const googleToken = await capturedConfig.callbacks.jwt({
      token: { lastPasswordAuthenticatedAt: passwordAuthenticatedAt },
      user: { id: "user-1" },
      account: { provider: "google" },
    })
    assert.equal(Object.hasOwn(googleToken, "lastPasswordAuthenticatedAt"), false)
    assert.deepEqual(legalRedirectInvocations, [])
  })

  it("Credentials authorization loads the normalized proof owner by ID instead of raw email equality", async () => {
    const authSource = await read("auth.ts")
    let capturedConfig
    const userLookups = []
    class CredentialsSignin extends Error {}
    const NextAuth = (config) => {
      capturedConfig = config
      return { handlers: {}, auth() {}, signIn() {}, signOut() {} }
    }
    NextAuth.CredentialsSignin = CredentialsSignin
    const prisma = {
      user: {
        async findUnique({ where }) {
          userLookups.push(structuredClone(where))
          if (where.id !== "user-1") return null
          return { id: "user-1", email: " Person@Example.com ", name: "Person", image: null }
        },
      },
    }
    loadCompiledModule(authSource, "auth-credentials-normalized-owner.test.ts", {
      "next-auth": NextAuth,
      "next-auth/providers/credentials": (config) => config,
      "next-auth/providers/google": (config) => config,
      "next/headers": { cookies: async () => ({ get: () => undefined }) },
      "@auth/prisma-adapter": { PrismaAdapter: () => ({}) },
      "@/lib/prisma": { prisma },
      "@/lib/auth-account-linking": { googleProfileEmail: () => "", isVerifiedGoogleProfile: () => true },
      "@/lib/auth-env": { getAuthSecret: () => "test-secret", getGoogleAuthConfig: () => null, getSiteUrl: () => "http://localhost:3000" },
      "@/lib/auth-method-proof": {
        verifyPasswordMethodProof: async () => ({
          status: "VERIFIED",
          userId: "user-1",
          backupCodeConsumed: false,
          authSessionVersion: 0,
        }),
      },
      "@/lib/auth-request": { authRequestNetworkIdentifier: () => "network" },
      "@/lib/auth-method-intents": {
        AUTH_METHOD_INTENT_COOKIE: "ml-auth-method-binding",
        parseAuthMethodIntentBinding: () => null,
        prepareGoogleAuthentication: async () => ({ kind: "REJECTED", recoveryPath: "/login?auth=google-retry" }),
      },
      "@/lib/legal-acceptance-gate": strictLegalAcceptanceGate,
      "@/lib/legal-acceptance": { hasAcceptedCurrentDocuments: async () => true },
      "@/lib/legal-documents": { requiredLegalDocumentsForEvent: () => [] },
      "@/lib/auth-users": {
        ensureGoogleUserState: async () => {}, ensureUserRole: async () => {},
        getUserAuthState: async () => ({
          authSessionVersion: 0, role: "USER", roles: ["USER"],
          roleAssignments: [{ role: "USER", status: "VERIFIED" }], capabilities: {},
          emailVerified: true, twoFactorEnabled: false,
        }),
      },
      "@/lib/auth-session-version": { decideAuthSessionVersion },
      "@/lib/auth-security": { normalizeEmail: (value) => String(value ?? "").trim().toLowerCase() },
    })

    const credentialsProvider = capturedConfig.providers[0]
    const authorized = await credentialsProvider.authorize(
      { email: "person@example.com", password: "valid-password", twoFactorCode: "" },
      new Request("https://massagelab.test/api/auth/callback/credentials"),
    )
    assert.equal(authorized.id, "user-1")
    assert.equal(authorized.email, " Person@Example.com ")
    assert.deepEqual(userLookups, [{ id: "user-1" }])
    assert.deepEqual(legalRedirectInvocations, [])
  })
})

/**
 * Provides the smallest successful-reset transaction double needed to connect
 * reset consumption to JWT invalidation without duplicating race coverage.
 */
function createResetConsumptionDatabase({ email = "person@example.com" } = {}) {
  const state = {
    user: { id: "user-1", email, authSessionVersion: 4 },
    passwordCredential: { userId: "user-1", passwordHash: "old-password-hash" },
    passwordResetTokens: [{
      id: "reset-1",
      userId: "user-1",
      tokenHash: "active-reset-token",
      expiresAt: new Date("2026-08-11T12:00:00.001Z"),
      consumedAt: null,
    }],
    sessions: [{ id: "session-1", userId: "user-1" }],
    emailIntents: [],
  }

  return {
    state,
    async $transaction(callback) {
      return callback({
        passwordResetToken: {
          async findUnique({ where }) {
            const token = state.passwordResetTokens.find((candidate) => candidate.tokenHash === where.tokenHash)
            return token ? { id: token.id, userId: token.userId } : null
          },
          async updateMany({ where, data }) {
            const matchingTokens = state.passwordResetTokens.filter((token) => (
              token.userId === where.userId
              && (!where.id || token.id === where.id)
              && (!Object.hasOwn(where, "consumedAt") || token.consumedAt === where.consumedAt)
              && (!where.expiresAt || token.expiresAt > where.expiresAt.gt)
            ))
            for (const token of matchingTokens) token.consumedAt = data.consumedAt
            return { count: matchingTokens.length }
          },
        },
        passwordCredential: {
          async upsert({ create, update }) {
            state.passwordCredential = {
              ...state.passwordCredential,
              passwordHash: state.passwordCredential ? update.passwordHash : create.passwordHash,
            }
            return state.passwordCredential
          },
        },
        user: {
          async update({ data }) {
            state.user.authSessionVersion += data.authSessionVersion.increment
            return state.user
          },
        },
        session: {
          async deleteMany({ where }) {
            const previousCount = state.sessions.length
            state.sessions = state.sessions.filter((session) => session.userId !== where.userId)
            return { count: previousCount - state.sessions.length }
          },
        },
        accountSecurityEmailIntent: {
          async upsert({ where, create }) {
            const existing = state.emailIntents.find((intent) => intent.idempotencyKey === where.idempotencyKey)
            if (existing) return { id: existing.id }
            const intent = { id: `intent-${state.emailIntents.length + 1}`, ...create }
            state.emailIntents.push(intent)
            return { id: intent.id }
          },
        },
      })
    },
  }
}
