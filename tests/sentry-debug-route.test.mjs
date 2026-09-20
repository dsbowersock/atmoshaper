import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import test from "node:test"

import { compileCommonJsModule } from "./helpers/compiled-module.mjs"

const ENABLE_FLAG = "MASSAGELAB_ENABLE_SENTRY_TEST_ROUTE"
const EXPECTED_EVENT_MESSAGE = "MassageLab Sentry server test error"
const routeSource = await readFile(
  new URL("../app/api/debug/sentry/route.ts", import.meta.url),
  "utf8",
)

/**
 * Executes the real route with isolated process and network boundaries.
 * Any new import must be explicitly reviewed instead of falling through to Node.
 */
function loadRoute(flagValue) {
  const compiledSource = compileCommonJsModule(
    routeSource,
    "app/api/debug/sentry/route.ts",
  )
  const compiledModule = { exports: {} }
  const isolatedEnvironment = Object.freeze(
    flagValue === undefined ? {} : { [ENABLE_FLAG]: flagValue },
  )
  const isolatedProcess = Object.freeze({ env: isolatedEnvironment })
  const networkCalls = []
  const executeModule = new Function(
    "require",
    "exports",
    "module",
    "process",
    "fetch",
    compiledSource,
  )

  function requireDependency(specifier) {
    assert.equal(specifier, "next/server", `Unexpected debug-route import: ${specifier}`)
    return {
      NextResponse: {
        json(body, init = {}) {
          return { body, status: init.status ?? 200 }
        },
      },
    }
  }

  executeModule(
    requireDependency,
    compiledModule.exports,
    compiledModule,
    isolatedProcess,
    (...args) => {
      networkCalls.push(args)
      assert.fail("The Sentry debug route must not perform network requests")
    },
  )

  return { route: compiledModule.exports, networkCalls }
}

function globalFlagSnapshot() {
  return {
    present: Object.hasOwn(process.env, ENABLE_FLAG),
    value: process.env[ENABLE_FLAG],
  }
}

test("Sentry debug route stays disabled unless its compatibility flag is exactly true", () => {
  const globalBefore = globalFlagSnapshot()

  for (const flagValue of [undefined, "", "false", "TRUE", "1"]) {
    const { route, networkCalls } = loadRoute(flagValue)
    assert.deepEqual(route.GET(), {
      body: { error: "Sentry test route is disabled." },
      status: 404,
    })
    assert.deepEqual(networkCalls, [])
  }

  assert.deepEqual(globalFlagSnapshot(), globalBefore)
})

test("enabled Sentry debug route emits its stable operational event identity", () => {
  const globalBefore = globalFlagSnapshot()
  const publicNameVariant = "AtmoShaper Sentry server test error"
  const { route, networkCalls } = loadRoute("true")

  assert.throws(
    () => route.GET(),
    (error) => {
      assert.equal(error.message, EXPECTED_EVENT_MESSAGE)
      assert.notEqual(error.message, publicNameVariant)
      return true
    },
  )
  assert.deepEqual(networkCalls, [])
  assert.deepEqual(globalFlagSnapshot(), globalBefore)
})
