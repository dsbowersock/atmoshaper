import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import { describe, it } from "node:test"
import { createRequire } from "node:module"
import { Client, Scope, SentrySpan, createTransport, getIntegrationsToSetup, makeSession, parseEnvelope, startInactiveSpan, startSpan, withScope } from "@sentry/core"
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

/** Uses a non-global installed SDK client and an in-memory transport without provider ingestion. */
function packetFixture(options = applicationOptions()) {
  const envelopes = []
  let transportConstructions = 0
  const client = new Client({
    ...options,
    environment: "synthetic-verification",
    release: "synthetic-source-proof",
    // Resolve the real policy integrations without installing global runtime handlers.
    integrations: getIntegrationsToSetup({ ...options, defaultIntegrations: [] }),
    stackParser: () => [],
    transport: (transportOptions) => {
      transportConstructions += 1
      // The installed SDK transport handles serialization, buffering and empty-envelope suppression.
      return createTransport(transportOptions, async (request) => {
        envelopes.push(parseEnvelope(request.body))
        return { statusCode: 200 }
      })
    },
  })
  client.init()
  return { client, envelopes, transportConstructions: () => transportConstructions }
}

/** Flattens captured in-memory SDK envelopes so assertions inspect every emitted data category without provider ingestion. */
function envelopeItems(envelopes) {
  return envelopes.flatMap(([, items]) => items)
}


/** Evaluates each real runtime entrypoint with an init recorder, preserving its shared policy and overrides. */
async function runtimeOptions(path) {
  const runtimeSource = await readFile(new URL(`../${path}`, import.meta.url), "utf8")
  const calls = []
  const runtimeModule = { exports: {} }
  const dependencies = {
    "@sentry/nextjs": { init: (options) => calls.push(options), captureRouterTransitionStart: () => {} },
    "./sentry.options": { getSentryOptions: () => applicationOptions() },
  }
  new Function("require", "exports", "module", compileCommonJsModule(runtimeSource, path))(
    (specifier) => {
      assert.ok(Object.hasOwn(dependencies, specifier), `Unexpected runtime dependency: ${specifier}`)
      return dependencies[specifier]
    }, runtimeModule.exports, runtimeModule,
  )
  assert.equal(calls.length, 1)
  return calls[0]
}

/** Runs the installed server SDK option merger with invented environment inputs, without its global initializer. */
async function serverSdkOptions(options, environment) {
  const sdkPath = new URL("../node_modules/@sentry/node-core/build/cjs/sdk/index.js", import.meta.url)
  const sdkSource = await readFile(sdkPath, "utf8")
  const sdkModule = { exports: {} }
  const sdkRequire = createRequire(sdkPath)
  // Expose only the internal pure merger; no loader/hooks/client are initialized.
  new Function("require", "exports", "module", "process", sdkSource + "\nexports.testOnlyGetClientOptions = getClientOptions")(
    sdkRequire, sdkModule.exports, sdkModule,
    Object.freeze({ env: Object.freeze({ ...environment }) }),
  )
  return sdkModule.exports.testOnlyGetClientOptions(options, () => [])
}

/** Exercises real active, child, manual and standalone span APIs inside a temporary client scope. */
function attemptSpans(client, incomingSampled) {
  const scope = new Scope()
  scope.setClient(client)
  scope.setPropagationContext({
    traceId: "0123456789abcdef0123456789abcdef",
    ...(incomingSampled ? { parentSpanId: "0123456789abcdef", sampled: true } : {}),
    sampleRand: 0.5,
  })
  const recording = []
  withScope(scope, () => {
    startSpan({ name: "invented-root", forceTransaction: true }, (span) => {
      recording.push(span.isRecording())
      startSpan({ name: "invented-child" }, (child) => recording.push(child.isRecording()))
    })
    const manual = startInactiveSpan({ name: "invented-manual", forceTransaction: true })
    recording.push(manual.isRecording())
    manual.end()
    startSpan({ name: "invented-standalone", experimental: { standalone: true } }, (span) => {
      recording.push(span.isRecording())
    })
  })
  return recording
}

/** Models already-sampled external instrumentation, including unnamed spans, through the installed envelope path. */
function endExternallySampledSpans(client) {
  const scope = new Scope()
  scope.setClient(client)
  withScope(scope, () => {
    for (const name of ["invented-external-span", "", undefined]) {
      for (const origin of ["manual", "", undefined, 42]) {
        // External instrumentation can omit or replace origin metadata as well as bypass sampling.
        const span = new SentrySpan({ name, sampled: true, isStandalone: true, attributes: { "sentry.origin": origin } })
        assert.equal(span.isRecording(), true)
        span.end()
      }
    }
  })
}

describe("installed Sentry SDK and application privacy policy", () => {

  it("observes both transaction and standalone envelopes when a zero-rate policy inherits a sampled parent", async () => {
    const { client, envelopes } = packetFixture({
      ...applicationOptions(),
      integrations: [], // Historical control excludes the final envelope guard.
      tracesSampleRate: 0,
      tracesSampler: undefined,
      ignoreSpans: [],
      beforeSendTransaction: privacyPolicy.sanitizeSentryTransaction,
    })
    try {
      assert.deepEqual(attemptSpans(client, true), [true, true, true, true])
      assert.equal(await client.flush(1_000), true)
      const types = envelopeItems(envelopes).map(([header]) => header.type)
      assert.ok(types.includes("transaction"))
      assert.ok(types.includes("span"))
    } finally {
      await client.close(1_000)
    }
  })

  for (const runtime of ["instrumentation-client.ts", "sentry.server.config.ts", "sentry.edge.config.ts"]) {
    for (const incomingSampled of [false, true]) {
      it(`keeps ${runtime} errors-only with ${incomingSampled ? "a sampled incoming parent" : "no incoming parent"}`, async () => {
        const options = await runtimeOptions(runtime)
        assert.equal(options.tracesSampleRate, 0)
        assert.equal(options.tracesSampler({}), false)
        assert.deepEqual(options.tracePropagationTargets, [])
        const { client, envelopes } = packetFixture(options)
        try {
          assert.deepEqual(attemptSpans(client, incomingSampled), [false, false, false, false])
          // An explicit transaction bypasses span creation and needs its own deny boundary.
          client.captureEvent({
            type: "transaction", transaction: "invented-direct-transaction",
            start_timestamp: 1, timestamp: 2,
            contexts: { trace: { trace_id: "0123456789abcdef0123456789abcdef", span_id: "0123456789abcdef" } },
            spans: [],
          })
          client.captureEvent({ level: "error", exception: { values: [{ type: "TypeError", value: "Cannot read properties of undefined" }] } })
          assert.equal(await client.flush(1_000), true)
          const items = envelopeItems(envelopes)
          assert.deepEqual(items.map(([header]) => header.type), ["event"])
          assert.equal(items[0][1].exception.values[0].type, "TypeError")
          assert.equal(items[0][1].release, "synthetic-source-proof")
        } finally {
          await client.close(1_000)
        }
      })
    }
  }

  it("demonstrates server environment fallback can emit standalone spans despite undefined shared sampling options", async () => {
    const resolved = await serverSdkOptions({
      ...applicationOptions(),
      integrations: [], // Historical control excludes the final envelope guard.
      tracesSampleRate: undefined,
      tracesSampler: undefined,
      ignoreSpans: [],
      release: "synthetic-source-proof",
      spotlight: false,
    }, { SENTRY_TRACES_SAMPLE_RATE: "1" })
    assert.equal(resolved.tracesSampleRate, 1)
    const { client, envelopes } = packetFixture(resolved)
    try {
      assert.deepEqual(attemptSpans(client, true), [true, true, true, true])
      assert.equal(await client.flush(1_000), true)
      assert.ok(envelopeItems(envelopes).some(([header]) => header.type === "span"))
    } finally {
      await client.close(1_000)
    }
  })

  for (const inheritedRate of ["0", "1"]) {
    for (const incomingSampled of [false, true]) {
      it("keeps resolved server options errors-only with inherited rate " + inheritedRate + " and " + (incomingSampled ? "sampled parent" : "no parent"), async () => {
        const resolved = await serverSdkOptions({
          ...await runtimeOptions("sentry.server.config.ts"),
          release: "synthetic-source-proof",
          spotlight: false,
        }, { SENTRY_TRACES_SAMPLE_RATE: inheritedRate })
        const { client, envelopes } = packetFixture(resolved)
        try {
          assert.deepEqual(attemptSpans(client, incomingSampled), [false, false, false, false])
          client.captureEvent({ level: "error", exception: { values: [{ type: "TypeError", value: "Cannot read properties of undefined" }] } })
          assert.equal(await client.flush(1_000), true)
          assert.deepEqual(envelopeItems(envelopes).map(([header]) => header.type), ["event"])
        } finally {
          await client.close(1_000)
        }
      })
    }
  }

  it("demonstrates external sampled spans can bypass a deny sampler without final span filters", async () => {
    const { client, envelopes } = packetFixture({ ...applicationOptions(), integrations: [], ignoreSpans: [] })
    try {
      endExternallySampledSpans(client)
      assert.equal(await client.flush(1_000), true)
      assert.deepEqual(envelopeItems(envelopes).map(([header]) => header.type), Array(12).fill("span"))
    } finally {
      await client.close(1_000)
    }
  })

  it("demonstrates span filters miss unnamed sampled spans without string origin metadata", async () => {
    // Control case deliberately excludes the application's final envelope integration.
    const { client, envelopes } = packetFixture({ ...applicationOptions(), integrations: [] })
    try {
      endExternallySampledSpans(client)
      assert.equal(await client.flush(1_000), true)
      assert.deepEqual(envelopeItems(envelopes).map(([header]) => header.type), Array(4).fill("span"))
    } finally {
      await client.close(1_000)
    }
  })

  for (const runtime of ["instrumentation-client.ts", "sentry.server.config.ts", "sentry.edge.config.ts"]) {
    it("keeps " + runtime + " errors-only when external instrumentation hands it sampled spans", async () => {
      const options = await runtimeOptions(runtime)
      const { client, envelopes } = packetFixture(options)
      try {
        endExternallySampledSpans(client)
        client.captureEvent({ level: "error", exception: { values: [{ type: "TypeError", value: "Cannot read properties of undefined" }] } })
        // Exercise the real report flush too: dropping spans must not create another collection category.
        client._flushOutcomes()
        assert.equal(await client.flush(1_000), true)
        assert.deepEqual(envelopeItems(envelopes).map(([header]) => header.type), ["event"])
        assert.equal(options.sendClientReports, false)
      } finally {
        await client.close(1_000)
      }
    })
  }

  it("demonstrates direct transaction envelopes bypass beforeSendTransaction", async () => {
    let hookCalls = 0
    const { client, envelopes } = packetFixture({
      ...applicationOptions(),
      integrations: [], // Control case excludes the final envelope allowlist.
      beforeSendTransaction: () => { hookCalls += 1; return null },
    })
    try {
      await client.sendEnvelope([{}, [[{ type: "transaction" }, { type: "transaction", transaction: "invented-direct-transaction", spans: [] }]]])
      assert.equal(await client.flush(1_000), true)
      assert.equal(hookCalls, 0)
      assert.deepEqual(envelopeItems(envelopes).map(([header]) => header.type), ["transaction"])
    } finally {
      await client.close(1_000)
    }
  })

  for (const runtime of ["instrumentation-client.ts", "sentry.server.config.ts", "sentry.edge.config.ts"]) {
    it("permits only error items from direct and mixed " + runtime + " envelopes", async () => {
      const { client, envelopes } = packetFixture(await runtimeOptions(runtime))
      try {
        const transactionItem = [{ type: "transaction" }, { type: "transaction", transaction: "invented-direct-transaction", spans: [] }]
        await client.sendEnvelope([{}, [transactionItem]])
        assert.equal(await client.flush(1_000), true)
        assert.deepEqual(envelopes, [], "direct transactions must not invoke the transport request executor")

        // The SDK mutates envelope item arrays, so every send needs fresh fixtures.
        const blockedItems = () => [
          [{ type: "transaction" }, { type: "transaction", transaction: "invented-direct-transaction", spans: [] }],
          [{ type: "span" }, { data: { privateValue: "invented-disallowed-content" } }],
          [{ type: "session" }, makeSession({ user: { id: "invented-session-owner", ip_address: "192.0.2.9" } }).toJSON()],
          [{ type: "log" }, { items: [{ body: "invented-disallowed-content" }] }],
          [{ type: "profile" }, { frames: [] }],
          [{ type: "attachment" }, new Uint8Array([1, 2, 3])],
          [{ type: "replay_event" }, { type: "replay_event" }],
          [{ type: "client_report" }, { discarded_events: [] }],
        ]
        // Session envelopes use a separate SDK pipeline rather than beforeSend.
        client.captureSession(makeSession({ user: { id: "invented-session-owner", ip_address: "192.0.2.9" } }))
        await client.sendEnvelope([{}, blockedItems()])
        assert.equal(await client.flush(1_000), true)
        assert.deepEqual(envelopes, [], "prohibited categories must not invoke a request")

        const event = { level: "error", release: "synthetic-source-proof", exception: { values: [{ type: "TypeError", value: "Synthetic error" }] } }
        const blockedTypes = ["transaction", "span", "session", "log", "profile", "attachment", "replay_event", "client_report"]
        const mixedItems = [...blockedItems(), [{ type: "event" }, event], ...blockedItems()]
        assert.deepEqual(mixedItems.map(([header]) => header.type), [...blockedTypes, "event", ...blockedTypes])
        await client.sendEnvelope([{}, mixedItems])
        assert.equal(await client.flush(1_000), true)
        assert.deepEqual(envelopeItems(envelopes), [[{ type: "event" }, event]])
        assert.doesNotMatch(JSON.stringify(envelopes), /invented-disallowed-content|invented-direct-transaction|invented-session-owner/)
      } finally {
        await client.close(1_000)
      }
    })
  }

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
    assert.ok(options.integrations([...browser, { name: "BrowserTracing" }]).every(({ name }) => name !== "BrowserTracing"))
    assert.ok(options.integrations(browser).some(({ name }) => name === "GlobalHandlers"))
    assert.ok(options.integrations(server).some(({ name }) => name === "OnUncaughtException"))
    assert.ok(options.integrations(server).some(({ name }) => name === "OnUnhandledRejection"))
  })

  it("demonstrates that session envelopes bypass the event sanitizer and can carry identity", async () => {
    let eventSanitizerCalls = 0
    const { client, envelopes } = packetFixture({
      ...applicationOptions(),
      integrations: [], // Control case demonstrates the SDK pipeline without the final allowlist.
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
