import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import { describe, it } from "node:test"

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8")
const expectedOneHourSessionLifetimeMilliseconds = 3_600_000

async function captureSignedInSessionCookieMaxAge({ transformSource } = {}) {
  const [originalSource, ts] = await Promise.all([
    read("tests/browser/signed-in-session-cookie.ts"),
    import("typescript"),
  ])
  const source = transformSource ? transformSource(originalSource) : originalSource
  const parsed = ts.createSourceFile(
    "signed-in-session-cookie.ts",
    source,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS,
  )
  const functionOwners = new Set(["signedInSessionToken", "installSignedInSessionCookie"])
  const owners = parsed.statements.filter((statement) => (
    ts.isVariableStatement(statement)
      ? statement.declarationList.declarations.some((declaration) => (
          declaration.name.getText(parsed) === "SIGNED_IN_BROWSER_SESSION_MAX_AGE_SECONDS"
        ))
      : ts.isFunctionDeclaration(statement) && functionOwners.has(statement.name?.text)
  ))
  assert.equal(
    owners.filter((statement) => ts.isFunctionDeclaration(statement)).length,
    functionOwners.size,
    "both signed-cookie function owners must compile",
  )
  const javascript = ts.transpileModule(
    owners.map((statement) => statement.getText(parsed)).join("\n").replace(/\bexport\s+/g, ""),
    { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } },
  ).outputText
  let encodeInput
  const { installSignedInSessionCookie } = Function(
    "encode",
    "process",
    `${javascript}\nreturn { installSignedInSessionCookie }`,
  )(
    async (input) => {
      encodeInput = input
      return "encoded-browser-qa-token"
    },
    { env: { AUTH_SECRET: "browser-qa-secret" } },
  )
  await installSignedInSessionCookie(
    { async addCookies() {} },
    "https://browser-qa.example.test",
    {
      id: "fixture-user",
      name: "Browser QA",
      email: "browser-qa@example.test",
      authSessionVersion: 0,
    },
  )
  assert.equal(typeof encodeInput?.maxAge, "number")
  return encodeInput.maxAge
}

async function compileSignedInUserFixtureOwners({
  fixedNowMilliseconds,
  transformSessionCookieSource,
  transformSource,
} = {}) {
  const [originalSource, ts, signedCookieMaxAgeSeconds] = await Promise.all([
    read("tests/browser/signed-in-user-fixture.ts"),
    import("typescript"),
    captureSignedInSessionCookieMaxAge({ transformSource: transformSessionCookieSource }),
  ])
  const source = transformSource ? transformSource(originalSource) : originalSource
  const parsed = ts.createSourceFile(
    "signed-in-user-fixture.ts",
    source,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS,
  )
  const canonicalLifetimeOwner = "SIGNED_IN_BROWSER_SESSION_MAX_AGE_SECONDS"
  const lifetimeImportBindings = parsed.statements.flatMap((statement) => {
    if (!ts.isImportDeclaration(statement) || !ts.isStringLiteral(statement.moduleSpecifier)) return []
    const namedBindings = statement.importClause?.namedBindings
    if (!namedBindings || !ts.isNamedImports(namedBindings)) return []
    return namedBindings.elements
      .map((element) => ({
        source: statement.moduleSpecifier.text,
        imported: element.propertyName?.text ?? element.name.text,
        local: element.name.text,
        clauseTypeOnly: statement.importClause?.isTypeOnly ?? false,
        specifierTypeOnly: element.isTypeOnly,
        unaliased: element.propertyName === undefined,
      }))
      .filter((binding) => binding.imported === canonicalLifetimeOwner || binding.local === canonicalLifetimeOwner)
  })
  assert.deepEqual(
    lifetimeImportBindings,
    [{
      source: "./signed-in-session-cookie",
      imported: canonicalLifetimeOwner,
      local: canonicalLifetimeOwner,
      clauseTypeOnly: false,
      specifierTypeOnly: false,
      unaliased: true,
    }],
    "signed-in user fixture must retain exactly one unaliased canonical signed-cookie lifetime import",
  )
  const localLifetimeOwners = parsed.statements.flatMap((statement) => (
    ts.isVariableStatement(statement)
      ? statement.declarationList.declarations.filter((declaration) => (
          declaration.name.getText(parsed) === canonicalLifetimeOwner
        ))
      : []
  ))
  assert.equal(
    localLifetimeOwners.length,
    0,
    "signed-in user fixture must not replace the canonical lifetime import with a local owner",
  )
  const variableOwners = new Set([
    "databaseFreeSessionIdentityByContext",
    "databaseFreeSessionRouteContexts",
    "anonymousAccountBootstrapSource",
  ])
  const functionOwners = new Set([
    "projectDatabaseFreeAccountBootstrap",
    "installDatabaseFreeSessionRoute",
  ])
  const owners = parsed.statements.filter((statement) => (
    ts.isVariableStatement(statement)
      ? statement.declarationList.declarations.some((declaration) => variableOwners.has(declaration.name.getText(parsed)))
      : ts.isFunctionDeclaration(statement) && functionOwners.has(statement.name?.text)
  ))
  assert.equal(owners.length, variableOwners.size + functionOwners.size, "all signed-in fixture owners must compile")
  const javascript = ts.transpileModule(
    owners.map((statement) => statement.getText(parsed)).join("\n"),
    { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } },
  ).outputText
  const compiled = Function(
    "SIGNED_IN_BROWSER_SESSION_MAX_AGE_SECONDS",
    "Date",
    `${javascript}\nreturn { projectDatabaseFreeAccountBootstrap, installDatabaseFreeSessionRoute }`,
  )(
    signedCookieMaxAgeSeconds,
    fixedNowMilliseconds === undefined
      ? Date
      : class FixedDate extends Date {
          static now() { return fixedNowMilliseconds }
        },
  )
  return { ...compiled, signedCookieMaxAgeSeconds }
}

async function captureDatabaseFreeSession({
  fixedNowMilliseconds,
  requestUrl = "https://browser-qa.example.test/api/auth/session",
  transformSessionCookieSource,
  transformSource,
} = {}) {
  const { installDatabaseFreeSessionRoute, signedCookieMaxAgeSeconds } = await compileSignedInUserFixtureOwners({
    fixedNowMilliseconds,
    transformSessionCookieSource,
    transformSource,
  })
  const registeredRoutes = []
  const context = {
    async addInitScript() {},
    async route(pattern, handler) {
      registeredRoutes.push([pattern, handler])
    },
  }
  await installDatabaseFreeSessionRoute(context, "https://browser-qa.example.test", {
    user: {
      id: "fixture-user",
      name: "Browser QA",
      email: "browser-qa@example.test",
      authSessionVersion: 0,
    },
  })
  const sessionHandler = registeredRoutes.find(([pattern]) => pattern === "**/api/auth/session")?.[1]
  assert.equal(typeof sessionHandler, "function")
  const fulfillments = []
  let fallbacks = 0
  const handlerStartedAt = Date.now()
  await sessionHandler({
    request() {
      return { url: () => requestUrl }
    },
    async fallback() { fallbacks += 1 },
    async fulfill(value) { fulfillments.push(value) },
  })
  const handlerFinishedAt = Date.now()
  return {
    fallbacks,
    fulfillments,
    handlerStartedAt,
    handlerFinishedAt,
    session: fulfillments.length === 1 ? JSON.parse(fulfillments[0].body) : null,
    signedCookieMaxAgeSeconds,
  }
}

function assertAuthJsExpiryShape({ session }) {
  assert.equal(typeof session?.expires, "string")
  const expiry = Date.parse(session.expires)
  assert.equal(Number.isFinite(expiry), true)
  assert.equal(new Date(expiry).toISOString(), session.expires)
}

const fixedSessionNowMilliseconds = Date.UTC(2030, 0, 2, 3, 4, 5)
const canonicalLifetimeProbeSeconds = [17, 60, 3600, 7200]

/** Probes distinct lifetime regions so pointwise or offset consumer transforms cannot mimic propagation. */
async function assertCanonicalLifetimePropagatesExactly({ transformSource } = {}) {
  for (const lifetimeSeconds of canonicalLifetimeProbeSeconds) {
    const result = await captureDatabaseFreeSession({
      fixedNowMilliseconds: fixedSessionNowMilliseconds,
      transformSessionCookieSource(source) {
        const currentOwner = "export const SIGNED_IN_BROWSER_SESSION_MAX_AGE_SECONDS = 60 * 60"
        const mutatedOwner = `export const SIGNED_IN_BROWSER_SESSION_MAX_AGE_SECONDS = ${lifetimeSeconds}`
        const mutated = source.replace(currentOwner, mutatedOwner)
        assert.notEqual(mutated, source, "the canonical lifetime probe must alter its actual owner")
        return mutated
      },
      transformSource,
    })
    assert.equal(result.signedCookieMaxAgeSeconds, lifetimeSeconds)
    assert.equal(
      result.session?.expires,
      new Date(fixedSessionNowMilliseconds + lifetimeSeconds * 1000).toISOString(),
      "provider-free expiry must exactly propagate the canonical signed-cookie lifetime",
    )
  }
}

const anonymousAccountBootstrap = '\\"initialBootstrap\\":{\\"ownerKey\\":null,\\"syncEnabled\\":false,\\"preferenceStatus\\":\\"anonymous\\"'

it("leaves same-origin HTML without an account bootstrap unchanged", async () => {
  const { projectDatabaseFreeAccountBootstrap } = await compileSignedInUserFixtureOwners()
  const body = "<!doctype html><html><body>global error</body></html>"
  assert.equal(projectDatabaseFreeAccountBootstrap(body, { user: { id: "fixture-user" } }), body)
})

it("projects exactly one anonymous account bootstrap to the fixture owner", async () => {
  const { projectDatabaseFreeAccountBootstrap } = await compileSignedInUserFixtureOwners()
  const body = `prefix:${anonymousAccountBootstrap}:suffix`
  assert.equal(
    projectDatabaseFreeAccountBootstrap(body, { user: { id: "fixture-user" } }),
    'prefix:\\"initialBootstrap\\":{\\"ownerKey\\":\\"fixture-user\\",\\"syncEnabled\\":true,\\"preferenceStatus\\":\\"failed\\":suffix',
  )
})

it("rejects duplicate anonymous account bootstrap markers", async () => {
  const { projectDatabaseFreeAccountBootstrap } = await compileSignedInUserFixtureOwners()
  const body = `${anonymousAccountBootstrap}:${anonymousAccountBootstrap}`
  assert.throws(
    () => projectDatabaseFreeAccountBootstrap(body, { user: { id: "fixture-user" } }),
    /exactly one anonymous account bootstrap/i,
  )
})

it("fulfills same-origin provider-free sessions with an Auth.js-compatible one-hour expiry", async () => {
  const result = await captureDatabaseFreeSession()
  assert.equal(result.fallbacks, 0)
  assert.equal(result.fulfillments.length, 1)
  assertAuthJsExpiryShape(result)
})

it("proves the unmodified one-hour expiry against the deterministic clock", async () => {
  const result = await captureDatabaseFreeSession({
    fixedNowMilliseconds: fixedSessionNowMilliseconds,
  })
  assert.equal(
    result.session?.expires,
    new Date(fixedSessionNowMilliseconds + expectedOneHourSessionLifetimeMilliseconds).toISOString(),
  )
})

it("keeps canonical ISO expiry valid when the outer wall clock rolls backward", async () => {
  const result = await captureDatabaseFreeSession()
  const expiry = Date.parse(result.session?.expires)
  const rollbackResult = {
    ...result,
    handlerStartedAt: expiry - expectedOneHourSessionLifetimeMilliseconds,
    handlerFinishedAt: expiry - expectedOneHourSessionLifetimeMilliseconds - 1,
  }
  assert.ok(rollbackResult.handlerFinishedAt < rollbackResult.handlerStartedAt)
  assertAuthJsExpiryShape(rollbackResult)
})

it("propagates a canonical signed-cookie lifetime mutation to provider-free expiry", async () => {
  const result = await captureDatabaseFreeSession({
    fixedNowMilliseconds: fixedSessionNowMilliseconds,
    transformSessionCookieSource(source) {
      const currentOwner = source.includes("export const SIGNED_IN_BROWSER_SESSION_MAX_AGE_SECONDS")
        ? "export const SIGNED_IN_BROWSER_SESSION_MAX_AGE_SECONDS = 60 * 60"
        : "maxAge: 60 * 60"
      const mutatedOwner = currentOwner.startsWith("export const")
        ? "export const SIGNED_IN_BROWSER_SESSION_MAX_AGE_SECONDS = 60"
        : "maxAge: 60"
      const mutated = source.replace(currentOwner, mutatedOwner)
      assert.notEqual(mutated, source, "the canonical signed-cookie lifetime mutation must alter its actual owner")
      return mutated
    },
  })
  assert.equal(result.signedCookieMaxAgeSeconds, 60)
  assert.equal(
    result.session?.expires,
    new Date(fixedSessionNowMilliseconds + result.signedCookieMaxAgeSeconds * 1000).toISOString(),
  )
})

it("rejects a 120-second consumer floor across exact canonical lifetime probes", async () => {
  await assert.rejects(assertCanonicalLifetimePropagatesExactly({
    transformSource(source) {
      const canonicalLifetimeUse = "SIGNED_IN_BROWSER_SESSION_MAX_AGE_SECONDS * 1000"
      const clampedLifetimeUse = "Math.max(SIGNED_IN_BROWSER_SESSION_MAX_AGE_SECONDS, 120) * 1000"
      const mutated = source.replace(canonicalLifetimeUse, clampedLifetimeUse)
      assert.notEqual(mutated, source, "the consumer clamp mutation must alter its actual lifetime expression")
      return mutated
    },
  }), /exactly propagate the canonical signed-cookie lifetime/i)
})

for (const [mutationName, mutateConsumerLifetime] of [
  [
    "a nonlinear lifetime cap",
    (source) => {
      const canonicalLifetimeUse = "SIGNED_IN_BROWSER_SESSION_MAX_AGE_SECONDS * 1000"
      const nonlinearLifetimeUse = "Math.min(SIGNED_IN_BROWSER_SESSION_MAX_AGE_SECONDS * 1000, 3_600_000)"
      const mutated = source.replace(canonicalLifetimeUse, nonlinearLifetimeUse)
      assert.notEqual(mutated, source, "the nonlinear consumer mutation must alter its actual lifetime expression")
      return mutated
    },
  ],
  [
    "an offset lifetime",
    (source) => {
      const canonicalLifetimeUse = "SIGNED_IN_BROWSER_SESSION_MAX_AGE_SECONDS * 1000"
      const offsetLifetimeUse = "SIGNED_IN_BROWSER_SESSION_MAX_AGE_SECONDS * 1000 + 5"
      const mutated = source.replace(canonicalLifetimeUse, offsetLifetimeUse)
      assert.notEqual(mutated, source, "the offset consumer mutation must alter its actual lifetime expression")
      return mutated
    },
  ],
]) {
  it(`rejects ${mutationName} across exact canonical lifetime probes`, async () => {
    await assertCanonicalLifetimePropagatesExactly()
    await assert.rejects(
      assertCanonicalLifetimePropagatesExactly({ transformSource: mutateConsumerLifetime }),
      /exactly propagate the canonical signed-cookie lifetime/i,
    )
  })
}

it("rejects a local lifetime owner that replaces the canonical signed-cookie import", async () => {
  await assert.rejects(
    captureDatabaseFreeSession({
      transformSource(source) {
        const canonicalImport = [
          "import {",
          "  SIGNED_IN_BROWSER_SESSION_MAX_AGE_SECONDS,",
          "  installSignedInSessionCookie,",
          '} from "./signed-in-session-cookie"',
        ].join("\n")
        const localOwner = [
          'import { installSignedInSessionCookie } from "./signed-in-session-cookie"',
          "const SIGNED_IN_BROWSER_SESSION_MAX_AGE_SECONDS = 60 * 60",
        ].join("\n")
        const mutated = source.replace(canonicalImport, localOwner)
        assert.notEqual(mutated, source, "the consumer lifetime-owner mutation must alter its actual import")
        return mutated
      },
    }),
    /canonical signed-cookie lifetime import/i,
  )
})

it("rejects a whole-clause type-only canonical lifetime import", async () => {
  await assert.rejects(
    captureDatabaseFreeSession({
      transformSource(source) {
        const canonicalImport = [
          "import {",
          "  SIGNED_IN_BROWSER_SESSION_MAX_AGE_SECONDS,",
          "  installSignedInSessionCookie,",
          '} from "./signed-in-session-cookie"',
        ].join("\n")
        const typeOnlyImport = [
          'import type { SIGNED_IN_BROWSER_SESSION_MAX_AGE_SECONDS } from "./signed-in-session-cookie"',
          'import { installSignedInSessionCookie } from "./signed-in-session-cookie"',
        ].join("\n")
        const mutated = source.replace(canonicalImport, typeOnlyImport)
        assert.notEqual(mutated, source, "the whole-clause type-only mutation must alter the actual import")
        return mutated
      },
    }),
    /canonical signed-cookie lifetime import/i,
  )
})

it("rejects an inline type-only canonical lifetime import", async () => {
  await assert.rejects(
    captureDatabaseFreeSession({
      transformSource(source) {
        const canonicalImport = [
          "import {",
          "  SIGNED_IN_BROWSER_SESSION_MAX_AGE_SECONDS,",
          "  installSignedInSessionCookie,",
          '} from "./signed-in-session-cookie"',
        ].join("\n")
        const inlineTypeOnlyImport = [
          "import {",
          "  type SIGNED_IN_BROWSER_SESSION_MAX_AGE_SECONDS,",
          "  installSignedInSessionCookie,",
          '} from "./signed-in-session-cookie"',
        ].join("\n")
        const mutated = source.replace(canonicalImport, inlineTypeOnlyImport)
        assert.notEqual(mutated, source, "the inline type-only mutation must alter the actual import")
        return mutated
      },
    }),
    /canonical signed-cookie lifetime import/i,
  )
})

it("falls back instead of fulfilling a foreign-origin session request", async () => {
  const result = await captureDatabaseFreeSession({
    requestUrl: "https://foreign.example.test/api/auth/session",
  })
  assert.equal(result.fallbacks, 1)
  assert.equal(result.fulfillments.length, 0)
})

describe("Task 4A browser harness contracts", () => {
  it("scopes identity and interaction messages without first-or-last ambiguity", async () => {
    const [identity, interaction] = await Promise.all([
      read("tests/browser/identity-method-safety.spec.ts"),
      read("tests/browser/interaction-feedback.spec.ts"),
    ])
    assert.equal(identity.includes("hasText: /^Your sign-in methods changed\\. Sign in again to continue\\.$/"), true)
    assert.equal(identity.includes("hasText: /^Password sign-in is now enabled\\.$/"), true)
    assert.equal(identity.includes("hasText: /^This confirmation expired or belongs to another session\\. Start again with Google sign-in\\.$/"), true)
    assert.doesNotMatch(identity, /getByRole\("status"\)\.toContainText\(\/(?:sign-in methods changed|enabled\|saved)/)

    const matchingLinkStart = identity.indexOf('test("matching Google email becomes the same MassageLab account only after real Credentials sign-in"')
    const matchingLinkEnd = identity.indexOf('\n  test("method controls keep a last sign-in method', matchingLinkStart)
    assert.ok(matchingLinkStart >= 0 && matchingLinkEnd > matchingLinkStart)
    const matchingLinkJourney = identity.slice(matchingLinkStart, matchingLinkEnd)
    assert.doesNotMatch(matchingLinkJourney, /Linked\\\. Redirecting to account security/)
    const actionLockIndex = matchingLinkJourney.indexOf("await confirm.dblclick()")
    const destinationIndex = matchingLinkJourney.indexOf('await expect(page).toHaveURL("/account?tab=security")')
    const headingIndex = matchingLinkJourney.indexOf('page.getByRole("heading", { name: "Sign-in methods" })')
    const googleMethodIndex = matchingLinkJourney.indexOf('page.getByText("Google", { exact: true }).locator("..")')
    const linkedStateIndex = matchingLinkJourney.indexOf('googleMethod.getByText("Linked", { exact: true })')
    assert.ok(actionLockIndex >= 0 && destinationIndex > actionLockIndex)
    assert.ok(headingIndex > destinationIndex && googleMethodIndex > headingIndex && linkedStateIndex > googleMethodIndex)

    assert.match(interaction, /interactionFixtureProject\(testInfo\.project\.name\)/)
    assert.match(interaction, /getByText\("Profile saved", \{ exact: true \}\)/)
    assert.match(interaction, /getByText\("Your account profile was saved\.", \{ exact: true \}\)/)
    assert.ok(interaction.split("hasText: /^Something went wrong\\. Please try again\\.$/").length - 1 >= 3)
    assert.doesNotMatch(interaction, /getByRole\("alert"\)\.toContainText\("Something went wrong/)
  })

  it("owns the delayed membership portal form through the return-status region", async () => {
    const membership = await read("tests/browser/membership-return-status.spec.ts")
    assert.match(membership, /const returnStatus = page\.locator\('\[data-membership-return-status="portal"\]'\)/)
    assert.match(membership, /await expect\(returnStatus\)\.toContainText\(\/needs billing attention\/i\)/)
    assert.match(membership, /const form = returnStatus\.locator\('form\[action="\/api\/billing\/portal"\]'\)/)
    assert.doesNotMatch(membership, /const form = page\.locator\('form\[action="\/api\/billing\/portal"\]'\)/)
  })

  it("scopes the self-remediation notice to the one visible Security region", async () => {
    const adminOperations = await read("tests/browser/admin-user-operations.spec.ts")
    const journeyStart = adminOperations.indexOf('test("Admin Security is self-read-only and 2FA reset requires the target confirmation email"')
    assert.ok(journeyStart >= 0)
    const journey = adminOperations.slice(journeyStart)
    const regionIndex = journey.indexOf('const securityRegion = page.getByRole("region", { name: "Security", exact: true, includeHidden: false }).filter({ visible: true })')
    const regionCountIndex = journey.indexOf("await expect(securityRegion).toHaveCount(1)")
    const noticeIndex = journey.indexOf('const selfRemediationNotice = securityRegion.getByText("You cannot perform security remediation on your own account from this console.", { exact: true }).filter({ visible: true })')
    const noticeCountIndex = journey.indexOf("await expect(selfRemediationNotice).toHaveCount(1)")
    const noticeVisibleIndex = journey.indexOf("await expect(selfRemediationNotice).toBeVisible()")
    const zeroButtonIndex = journey.indexOf('await expect(page.getByRole("button", { name: "Send password reset" })).toHaveCount(0)')
    assert.ok(regionIndex >= 0 && regionCountIndex > regionIndex)
    assert.ok(noticeIndex > regionCountIndex && noticeCountIndex > noticeIndex)
    assert.ok(noticeVisibleIndex > noticeCountIndex && zeroButtonIndex > noticeVisibleIndex)
    assert.doesNotMatch(journey, /page\.getByText\(\/cannot perform security remediation/)
  })

  it("routes every ordinary signed-in direct-cookie family through the bounded User fixture", async () => {
    const [publicRoutes, commerce, visualizer, carousel, cookieFixture] = await Promise.all([
      read("tests/browser/public-routes.spec.ts"),
      read("tests/browser/background-commerce.spec.ts"),
      read("tests/browser/music-visualizer.spec.ts"),
      read("tests/browser/background-carousel-preview.spec.ts"),
      read("tests/browser/signed-in-user-fixture.ts"),
    ])
    for (const source of [publicRoutes, commerce, visualizer, carousel]) {
      assert.match(source, /installSignedInUserFixture/)
      assert.match(source, /removeSignedInUserFixture/)
      assert.doesNotMatch(source, /installSignedInSessionCookie/)
    }
    assert.match(cookieFixture, /isBrowserQaDatabaseTargetAuthorized\(process\.env\)/)
    assert.match(cookieFixture, /createBrowserUserFixtureRecord/)
    assert.match(cookieFixture, /removeBrowserUserFixtureRecord/)
    assert.match(cookieFixture, /database-free runs retain the existing JWT/)
    assert.match(cookieFixture, /new WeakMap<BrowserContext, BrowserUserFixtureIdentity>\(\)/)
    assert.match(cookieFixture, /new WeakSet<BrowserContext>\(\)/)
    assert.match(cookieFixture, /context\.route\("\*\*\/api\/auth\/session"/)
    assert.match(cookieFixture, /databaseFreeSessionIdentityByContext\.get\(context\)/)
    assert.match(cookieFixture, /databaseFreeSessionIdentityByContext\.set\(context, identity\)/)
    assert.match(cookieFixture, /request\.resourceType\(\) !== "document"/)
    assert.match(cookieFixture, /const response = await route\.fetch\(\)/)
    assert.match(cookieFixture, /anonymousAccountBootstrapSource/)
    assert.match(cookieFixture, /body\.replace\(anonymousAccountBootstrapSource, signedInAccountBootstrapSource\)/)
    assert.match(cookieFixture, /await context\.addInitScript\(/)
    assert.match(cookieFixture, /navigator\.serviceWorker[\s\S]*"register"/)
  })
})

it("admin Security assertions require their accessible owner and reject hidden or misplaced evidence", async (t) => {
  const [{ chromium, expect: browserExpect }, ts, { runInNewContext }] = await Promise.all([
    import("@playwright/test"), import("typescript"), import("node:vm"),
  ])
  const source = await read("tests/browser/admin-user-operations.spec.ts")
  const owner = await read("app/admin/users/[userId]/page.tsx")
  assert.match(owner, /<section aria-labelledby=\{`\$\{section\}-heading`\}/)
  assert.match(owner, /<dt[^>]*>\{label\}<\/dt>/)
  assert.match(owner, /<dd data-detail-value=""[^>]*>\{value\}<\/dd>/)
  const parsed = ts.createSourceFile("admin-user-operations.spec.ts", source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS)
  const journeys = new Map()
  const visit = (node) => {
    if (ts.isCallExpression(node) && node.expression.getText(parsed) === "test"
      && ts.isStringLiteral(node.arguments[0]) && ts.isArrowFunction(node.arguments[1])) {
      const body = node.arguments[1].body
      const attempt = body.statements?.find(ts.isTryStatement)
      if (attempt) journeys.set(node.arguments[0].text, [...attempt.tryBlock.statements])
    }
    ts.forEachChild(node, visit)
  }
  visit(parsed)
  const revocation = journeys.get("Admin confirms sign-in token revocation and the target JWT is rejected on refresh")
  const reset = journeys.get("Admin Security is self-read-only and 2FA reset requires the target confirmation email")
  assert.ok(revocation && reset, "both Security journeys must retain their original assertion blocks")
  const declarationIndex = (statements, name) => statements.findIndex((statement) => ts.isVariableStatement(statement)
    && statement.declarationList.declarations.some((declaration) => declaration.name.getText(parsed) === name))
  const snippet = (statements) => statements.map((statement) => statement.getText(parsed)).join("\n")
  const compatibilityStart = declarationIndex(revocation, "securityRegion")
  const compatibilityEnd = declarationIndex(revocation, "revokeCard")
  const selfStart = declarationIndex(reset, "securityRegion")
  const cardIndex = declarationIndex(reset, "twoFactorCard")
  const targetNavigation = reset.findIndex((statement, index) => index > selfStart
    && statement.getText(parsed).startsWith("await page.goto("))
  assert.ok(compatibilityStart >= 0 && compatibilityEnd > compatibilityStart)
  assert.ok(selfStart >= 0 && targetNavigation > selfStart && cardIndex > targetNavigation)
  const compatibilitySource = snippet(revocation.slice(compatibilityStart, compatibilityEnd))
  const selfSource = snippet(reset.slice(selfStart, targetNavigation))
  const targetOwnerSource = snippet(reset.slice(targetNavigation + 1, cardIndex))
  assert.equal(targetOwnerSource, "await expect(securityRegion).toHaveCount(1)\nawait expect(securityRegion).toBeVisible()")
  const resetAssertions = reset.slice(cardIndex + 1).filter((statement) => {
    const text = statement.getText(parsed)
    return text.startsWith("await expect(twoFactorCard.getByRole(\"status\")")
      || text.startsWith("await expect(securityRegion.locator('[data-detail-key=\"Two-factor authentication\"]')")
  })
  assert.equal(resetAssertions.length, 2, "success feedback and the projected state must both remain asserted")
  const targetSource = snippet([reset[cardIndex], ...resetAssertions])
  assert.match(targetSource, /\.toBeVisible\(\{\s*timeout: 30_000,/)
  assert.match(targetSource, /\.toHaveText\("No"\)/)
  assert.match(compatibilitySource, /\.toHaveText\("Compatibility Session rows"\)/)
  assert.match(compatibilitySource, /hasText: \/not a count of active JWT sessions or users signed out\/i/)
  assert.match(selfSource, /await expect\(page\.getByRole\("button", \{ name: "Send password reset" \}\)\)\.toHaveCount\(0\)/)
  for (const statements of [revocation, reset]) {
    const declaration = statements[declarationIndex(statements, "securityRegion")]
    assert.match(declaration.getText(parsed), /getByRole\("region", \{ name: "Security", exact: true, includeHidden: false \}\)\.filter\(\{ visible: true \}\)/)
  }
  // Execute the actual Browser-QA statements; only fixture failure budgets are shortened.
  const fixtureExpect = (locator) => new Proxy(browserExpect(locator), {
    get(assertions, matcher) {
      assert.ok(["toBeVisible", "toHaveCount", "toHaveText"].includes(matcher), `unexpected matcher ${String(matcher)}`)
      return (...args) => matcher === "toBeVisible"
        ? assertions[matcher]({ ...args[0], timeout: 150 })
        : assertions[matcher](args[0], { ...args[1], timeout: 150 })
    },
  })
  const compile = (body) => {
    assert.doesNotMatch(body, /\.first\(|\.nth\(/)
    const sandbox = { expect: fixtureExpect }
    runInNewContext(ts.transpileModule(`async function check(page, transition) { ${body} }`, {
      compilerOptions: { target: ts.ScriptTarget.ES2022 },
    }).outputText, sandbox)
    return sandbox.check
  }
  const compatibilityRun = compile(compatibilitySource)
  const selfRun = compile(selfSource)
  const resetRun = compile(`${reset[selfStart].getText(parsed)}\n${targetOwnerSource}\n${targetSource}`)
  const transitionRun = compile(`${selfSource}\nawait transition()\n${targetOwnerSource}\n${targetSource}`)
  const notice = "You cannot perform security remediation on your own account from this console."
  const success = "Two-factor authentication was reset and existing sign-in tokens were invalidated."
  const compatibility = '<div data-detail-key="Compatibility Session rows"><dt>Compatibility Session rows</dt><dd data-detail-value>1 (adapter evidence only; not a count of active JWT sessions or users signed out)</dd></div>'
  const state = (value) => `<div data-detail-key="Two-factor authentication"><dt>Two-factor authentication</dt><dd data-detail-value>${value}</dd></div>`
  const card = (status = `<p role="status">${success}</p>`) => `<article><h4>Reset two-factor authentication</h4>${status}</article>`
  const remediation = (content) => `<section aria-label="Security remediation"><h3>Security remediation</h3>${content}</section>`
  const security = (content) => `<section aria-label="Security"><h2>Security</h2>${content}</section>`
  const selfBody = `<p>${notice}</p>${remediation("")}`
  const targetBody = `<dl>${compatibility}${state("No")}</dl>${remediation(card())}`
  const browser = await chromium.launch()
  let requests = 0
  const check = async (run, html, failure = false, nextHtml) => {
    const context = await browser.newContext({ serviceWorkers: "block" })
    try {
      await context.route("**/*", async (route) => { requests += 1; await route.abort() })
      const page = await context.newPage()
      await page.setContent(html)
      const result = run(page, async () => page.setContent(nextHtml))
      if (failure) await assert.rejects(result, /expect\(locator\)|strict mode violation/)
      else await result
    } finally {
      await context.close()
    }
  }
  try {
    for (const [name, run, body] of [
      ["compatibility row", compatibilityRun, targetBody],
      ["self remediation", selfRun, selfBody],
      ["reset feedback and state", resetRun, targetBody],
    ]) {
      await t.test(name, async (t) => {
        const valid = security(body)
        for (const [caseName, html, failure] of [
          ["exact accessible owner with nested remediation", valid],
          ["hidden clone", valid + `<div hidden>${valid}</div>`],
          ["display-none clone", valid + `<div style="display:none">${valid}</div>`],
          ["aria-hidden clone", valid + `<div aria-hidden="true">${valid}</div>`],
          ["duplicate accessible owners", valid + valid, true],
          ["missing owner", remediation(body), true],
          ["hidden-only owner", `<div hidden>${valid}</div>`, true],
          ["evidence belongs to another owner", security("") + remediation(body), true],
        ]) await t.test(caseName, () => check(run, html, failure))
      })
    }
    await t.test("compatibility text outside its detail row cannot supply the disclaimer", () => check(compatibilityRun,
      security(targetBody.replace("not a count of active JWT sessions or users signed out", "no disclaimer")
        + "<p>not a count of active JWT sessions or users signed out</p>"), true))
    await t.test("compatibility term must retain its exact label", () => check(compatibilityRun,
      security(targetBody.replace("<dt>Compatibility Session rows</dt>", "<dt>Compatibility Session rows changed</dt>")), true))
    await t.test("visible Yes cannot be replaced by hidden No", () => check(resetRun,
      security(`<dl>${state("Yes")}<div hidden>${state("No")}</div></dl>${remediation(card())}`), true))
    await t.test("an aria-hidden No cannot replace the visible Yes", () => check(resetRun,
      security(`<dl>${state("Yes")}<div aria-hidden="true">${state("No")}</div></dl>${remediation(card())}`), true))
    await t.test("feedback outside the action card cannot prove reset success", () => check(resetRun,
      security(`<dl>${state("No")}</dl>${remediation(card(""))}<p role="status">${success}</p>`), true))
    await t.test("hidden feedback inside the action card cannot prove visible success", () => check(resetRun,
      security(`<dl>${state("No")}</dl>${remediation(card(`<p role="status" hidden>${success}</p>`))}`), true))
    await t.test("the global self reset-button prohibition remains stronger than local ownership", () => check(selfRun,
      security(selfBody) + "<button>Send password reset</button>", true))
    await t.test("the same Security locator re-resolves after the self-to-target transition", () => check(transitionRun,
      security(selfBody), false, security(targetBody)))
    await t.test("duplicate owners appearing after navigation are still rejected", () => check(transitionRun,
      security(selfBody), true, security(targetBody) + security(targetBody)))
  } finally {
    await browser.close()
    assert.equal(requests, 0, "Security assertion fixtures must remain completely offline")
  }
})
