import assert from "node:assert/strict"
import { readFile, readdir } from "node:fs/promises"
import { describe, it } from "node:test"
import { createCompiledModuleLoader } from "./helpers/compiled-module.mjs"
import { runtimeRouteExports, unsupportedRouteExports } from "./helpers/route-exports.mjs"

const loadCompiledModule = createCompiledModuleLoader(import.meta.url)
const relocated = [
  {
    "route": "app/api/account/email-verification/request/route.ts",
    "handler": "app/api/account/email-verification/request/handlers.ts",
    "verbs": [
      "POST"
    ],
    "metadata": []
  },
  {
    "route": "app/api/account/password-reset/request/route.ts",
    "handler": "app/api/account/password-reset/request/handlers.ts",
    "verbs": [
      "POST"
    ],
    "metadata": []
  },
  {
    "route": "app/api/account/security/backup-codes/route.ts",
    "handler": "app/api/account/security/backup-codes/handlers.ts",
    "verbs": [
      "POST"
    ],
    "metadata": []
  },
  {
    "route": "app/api/account/security/google/link/confirm/route.ts",
    "handler": "app/api/account/security/google/link/confirm/handlers.ts",
    "verbs": [
      "POST"
    ],
    "metadata": []
  },
  {
    "route": "app/api/account/security/google/unlink/route.ts",
    "handler": "app/api/account/security/google/unlink/handlers.ts",
    "verbs": [
      "POST"
    ],
    "metadata": []
  },
  {
    "route": "app/api/account/security/password/disable/route.ts",
    "handler": "app/api/account/security/password/disable/handlers.ts",
    "verbs": [
      "POST"
    ],
    "metadata": []
  },
  {
    "route": "app/api/account/security/password/route.ts",
    "handler": "app/api/account/security/password/handlers.ts",
    "verbs": [
      "POST"
    ],
    "metadata": []
  },
  {
    "route": "app/api/account/security/totp/disable/route.ts",
    "handler": "app/api/account/security/totp/disable/handlers.ts",
    "verbs": [
      "POST"
    ],
    "metadata": []
  },
  {
    "route": "app/api/account/security/totp/enable/route.ts",
    "handler": "app/api/account/security/totp/enable/handlers.ts",
    "verbs": [
      "POST"
    ],
    "metadata": []
  },
  {
    "route": "app/api/account/security/totp/setup/route.ts",
    "handler": "app/api/account/security/totp/setup/handlers.ts",
    "verbs": [
      "POST"
    ],
    "metadata": []
  },
  {
    "route": "app/api/auth/google/intent/route.ts",
    "handler": "app/api/auth/google/intent/handlers.ts",
    "verbs": [
      "POST"
    ],
    "metadata": []
  },
  {
    "route": "app/api/background-commerce/cart/route.ts",
    "handler": "app/api/background-commerce/cart/handlers.ts",
    "verbs": [
      "GET",
      "POST",
      "DELETE"
    ],
    "metadata": [
      {
        "name": "runtime",
        "value": "nodejs"
      }
    ]
  },
  {
    "route": "app/api/background-commerce/checkout/cancel/route.ts",
    "handler": "app/api/background-commerce/checkout/cancel/handlers.ts",
    "verbs": [
      "POST"
    ],
    "metadata": [
      {
        "name": "runtime",
        "value": "nodejs"
      }
    ]
  },
  {
    "route": "app/api/background-commerce/checkout/route.ts",
    "handler": "app/api/background-commerce/checkout/handlers.ts",
    "verbs": [
      "POST"
    ],
    "metadata": [
      {
        "name": "runtime",
        "value": "nodejs"
      }
    ]
  },
  {
    "route": "app/api/background-commerce/credits/redeem/route.ts",
    "handler": "app/api/background-commerce/credits/redeem/handlers.ts",
    "verbs": [
      "POST"
    ],
    "metadata": [
      {
        "name": "runtime",
        "value": "nodejs"
      }
    ]
  },
  {
    "route": "app/api/background-commerce/state/route.ts",
    "handler": "app/api/background-commerce/state/handlers.ts",
    "verbs": [
      "GET"
    ],
    "metadata": [
      {
        "name": "runtime",
        "value": "nodejs"
      }
    ]
  }
]

/** Enumerates real route entries without following dependency/cache directories or executing application modules. */
async function routeFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true })
  const results = await Promise.all(entries.map((entry) => entry.isDirectory()
    ? routeFiles(new URL(`${entry.name}/`, directory))
    : entry.name === "route.ts" ? [new URL(entry.name, directory)] : []))
  return results.flat()
}

describe("Next route entry export boundary", () => {
  it("rejects invented helpers, renamed exports, defaults and unresolved runtime export-stars", () => {
    assert.deepEqual(unsupportedRouteExports("export function POST() {}\nexport function factory() {}"), ["factory"])
    assert.deepEqual(unsupportedRouteExports('const value = 1; export { value as helper }'), ["helper"])
    assert.deepEqual(unsupportedRouteExports("export default function handler() {}"), ["default"])
    assert.deepEqual(unsupportedRouteExports('export * from "./handlers"'), ["*"])
    assert.deepEqual(unsupportedRouteExports("export const { helper } = { helper: 1 }"), ["helper"])
  })

  it("permits erased type exports and supported method/config exports", () => {
    const source = 'export type State = {}; export interface Result {}\nexport type * from "./types"; export { type State as Alias }; export const runtime = "nodejs"; export { handler as POST } from "./handlers"'
    assert.deepEqual(runtimeRouteExports(source), ["POST", "runtime"])
    assert.deepEqual(unsupportedRouteExports(source), [])
  })

  it("keeps every application route within Next's supported runtime export contract", async () => {
    const files = await routeFiles(new URL("../app/", import.meta.url))
    assert.ok(files.length > relocated.length)
    for (const file of files) {
      const source = await readFile(file, "utf8")
      assert.deepEqual(unsupportedRouteExports(source, file.pathname), [], file.pathname)
    }
  })

  for (const fixture of relocated) {
    it(`preserves HTTP bindings and literal metadata for ${fixture.route}`, async () => {
      const source = await readFile(new URL(`../${fixture.route}`, import.meta.url), "utf8")
      const handlers = Object.fromEntries(fixture.verbs.map((method) => [method, () => method]))
      const entry = loadCompiledModule(source, fixture.route, { "./handlers": handlers })
      assert.deepEqual(Object.keys(entry).sort(), [...fixture.verbs, ...fixture.metadata.map(({ name }) => name)].sort())
      for (const method of fixture.verbs) assert.equal(entry[method], handlers[method])
      for (const { name, value } of fixture.metadata) assert.equal(entry[name], value)
    })
  }
})
