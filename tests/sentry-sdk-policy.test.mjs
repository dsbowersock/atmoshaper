import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import { describe, it } from "node:test"
import { Client, makeSession } from "@sentry/core"
import { getDefaultIntegrations as browserDefaults } from "@sentry/browser"
import { getDefaultIntegrations as nodeDefaults } from "@sentry/node"
import { getDefaultIntegrations as edgeDefaults } from "@sentry/vercel-edge"
import * as collectionPolicy from "../lib/sentry-options.js"
import * as privacyPolicy from "../lib/sentry-privacy.js"
import { compileCommonJsModule } from "./helpers/compiled-module.mjs"

const optionsSource = await readFile(new URL("../sentry.options.ts", import.meta.url), "utf8")
const SYNTHETIC_DSN = "https://0123456789abcdef0123456789abcdef@example.invalid/1"

/** Evaluates actual application options with isolated DSN input and real privacy helpers. */
function applicationOptions(environment = { NEXT_PUBLIC_SENTRY_DSN: SYNTHETIC_DSN }) {
  const compiledModule = { exports: {} }
  const requireDependency = (specifier) => {
    if (specifier === "./lib/sentry-options") return collectionPolicy
    if (specifier === "./lib/sentry-privacy") return privacyPolicy
    assert.fail(`Unexpected options dependency: ${specifier}`)
  }
  new Function("require", "exports", "module", "process", compileCommonJsModule(optionsSource, "sentry.options.ts"))(
    requireDependency, compiledModule.exports, compiledModule,
    Object.freeze({ env: Object.freeze({ ...environment }) }),
  )
  return compiledModule.exports.getSentryOptions()
}

/** Uses the installed SDK with an in-memory-only transport; no provider or SDK globals are initialized. */
function packetFixture(options = applicationOptions()) {
  const envelopes = []
  let transportConstructions = 0
  const client = new Client({
    ...options,
    environment: "synthetic-verification",
    release: "synthetic-source-proof",
    integrations: [],
    stackParser: () => [],
    transport: () => {
      transportConstructions += 1
      return {
        send: async (envelope) => { envelopes.push(envelope); return { statusCode: 200 } },
        flush: async () => true,
      }
    },
  })
  client.init()
  return { client, envelopes, transportConstructions: () => transportConstructions }
}

function envelopeItems(envelopes) {
  return envelopes.flatMap(([, items]) => items)
}

describe("installed Sentry SDK and application privacy policy", () => {
  it("removes actual browser and process sessions while retaining runtime error handlers", () => {
    const options = applicationOptions()
    const browser = browserDefaults({})
    const server = nodeDefaults({})
    const edge = edgeDefaults({})
    assert.ok(browser.some(({ name }) => name === "BrowserSession"))
    assert.ok(server.some(({ name }) => name === "ProcessSession"))

    for (const defaults of [browser, server, edge]) {
      assert.ok(options.integrations(defaults).every(({ name }) => !/session/i.test(name)))
    }
    assert.ok(options.integrations(browser).some(({ name }) => name === "GlobalHandlers"))
    assert.ok(options.integrations(server).some(({ name }) => name === "OnUncaughtException"))
    assert.ok(options.integrations(server).some(({ name }) => name === "OnUnhandledRejection"))
  })

  it("demonstrates that session envelopes bypass the event sanitizer and can carry identity", async () => {
    let eventSanitizerCalls = 0
    const { client, envelopes } = packetFixture({
      ...applicationOptions(),
      beforeSend: (event) => { eventSanitizerCalls += 1; return privacyPolicy.sanitizeSentryEvent(event) },
    })
    try {
      client.captureSession(makeSession({
        user: { id: "invented-private-session-owner", ip_address: "192.0.2.9" },
      }))
      assert.equal(await client.flush(1_000), true)
      const items = envelopeItems(envelopes)
      assert.equal(items.length, 1)
      assert.equal(items[0][0].type, "session")
      const packet = items[0][1]
      assert.match(packet.sid, /^[a-f0-9]{32}$/)
      assert.equal(packet.did, "invented-private-session-owner")
      assert.equal(packet.attrs.ip_address, "192.0.2.9")
      assert.equal(eventSanitizerCalls, 0)
    } finally {
      await client.close(1_000)
    }
  })

  it("delivers a release-linked operational error through the actual sanitizer without private fields", async () => {
    const { client, envelopes } = packetFixture()
    try {
      client.captureEvent({
        level: "error",
        exception: { values: [{
          type: "TypeError", value: "Cannot read properties of undefined",
          stacktrace: { frames: [{ filename: "app:///runtime.js", function: "render", lineno: 12 }] },
        }] },
        request: { url: "https://example.invalid/notes/soap?token=invented-private-secret", headers: { cookie: "invented-cookie" } },
        user: { id: "invented-private-owner", email: "invented@example.invalid" },
        extra: { localVault: "invented-clinical-content" },
        breadcrumbs: [{ category: "navigation", message: "invented-navigation-history" }],
      })
      assert.equal(await client.flush(1_000), true)
      const items = envelopeItems(envelopes)
      assert.deepEqual(items.map(([header]) => header.type), ["event"])
      const packet = items[0][1]
      assert.equal(packet.release, "synthetic-source-proof")
      assert.equal(packet.environment, "synthetic-verification")
      assert.equal(packet.exception.values[0].type, "TypeError")
      assert.equal(packet.exception.values[0].stacktrace.frames[0].function, "render")
      assert.deepEqual(packet.user, { ip_address: null })
      assert.deepEqual(packet.request, { url: "/notes/[local-first]" })
      assert.deepEqual(packet.breadcrumbs, [])
      assert.doesNotMatch(JSON.stringify(packet), /invented-private|invented-cookie|invented@example|invented-clinical|invented-navigation/)
    } finally {
      await client.close(1_000)
    }
  })

  it("keeps collection disabled and does not construct a transport without an application DSN", async () => {
    const { client, envelopes, transportConstructions } = packetFixture(applicationOptions({}))
    try {
      assert.equal(client.getOptions().enabled, false)
      client.captureEvent({ message: "invented-disabled-event" })
      await client.flush(1_000)
      assert.equal(transportConstructions(), 0)
      assert.deepEqual(envelopes, [])
    } finally {
      await client.close(1_000)
    }
  })
})
