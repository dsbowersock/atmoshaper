import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { createRequire } from "node:module"
import { dirname, join } from "node:path"
import test from "node:test"
import { fileURLToPath } from "node:url"
import { runInNewContext } from "node:vm"

const require = createRequire(import.meta.url)
const { makeExternalHandler } = require("next/dist/build/handle-externals")
const { WEBPACK_LAYERS } = require("next/dist/lib/constants")
const json5 = require("next/dist/compiled/json5")
const defaults = json5.parse(readFileSync(
  require.resolve("next/dist/lib/server-external-packages.jsonc"), "utf8",
))
const root = fileURLToPath(new URL("../", import.meta.url))
const wsEntry = require.resolve("ws")
const bufferUtilSource = readFileSync(join(dirname(wsEntry), "lib/buffer-util.js"), "utf8")

/** Reuse the telemetry guard test's VM boundary; never import Sentry or ambient env. */
function loadConfig(environment = {}) {
  const source = readFileSync(new URL("../next.config.mjs", import.meta.url), "utf8")
  const start = source.indexOf("const migrationParityBuild =")
  assert.notEqual(start, -1)
  assert.equal((source.match(/export default withSentryConfig/g) ?? []).length, 1)
  const sandbox = {
    process: { env: Object.freeze({ ...environment }) },
    root,
    withSentryConfig: (config) => config,
    assertBrowserQaTelemetryEnvironment: () => {},
  }
  runInNewContext(source.slice(start).replace("export default withSentryConfig", "result = withSentryConfig"), sandbox, { timeout: 1000 })
  return sandbox.result
}

/** Exercise Next's server decision with resolution injected; no package is executed. */
function externalHandler(config) {
  const packages = defaults.concat(config.serverExternalPackages ?? [])
    .filter((name) => !config.transpilePackages?.includes(name))
  // Match installed Next's package-path boundary, including Windows paths.
  const pattern = new RegExp(`[/\\\\]node_modules[/\\\\](${packages.map((name) => name.replaceAll("/", "[/\\\\]")).join("|")})[/\\\\]`)
  return makeExternalHandler({
    config: { ...config, experimental: config.experimental ?? {} },
    optOutBundlingPackageRegex: pattern,
    transpiledPackages: config.transpilePackages,
    dir: root,
  })
}

test("canonical server config keeps ws on its native CommonJS owner", async () => {
  const nextConfig = loadConfig()
  assert.equal(nextConfig.transpilePackages?.includes("ws") ?? false, false)
  let resolutions = 0
  const getResolve = () => async (_context, request) => {
    assert.equal(request, "ws")
    resolutions += 1
    return [wsEntry, false]
  }
  const handler = externalHandler(nextConfig)
  for (const layer of [WEBPACK_LAYERS.reactServerComponents, WEBPACK_LAYERS.apiNode]) {
    assert.equal(await handler(root, "ws", "esm", layer, getResolve), "commonjs ws")
  }
  assert.ok(resolutions >= 4)

  // Deleting only this opt-out must restore RSC bundling, proving sensitivity.
  const withoutWs = externalHandler({
    ...nextConfig,
    serverExternalPackages: (nextConfig.serverExternalPackages ?? []).filter((name) => name !== "ws"),
  })
  assert.equal(await withoutWs(root, "ws", "esm", WEBPACK_LAYERS.reactServerComponents, getResolve), undefined)

  const qaHandler = externalHandler(loadConfig({ NEXT_PUBLIC_ATMOSHAPER_BROWSER_QA: "1" }))
  assert.equal(await qaHandler(root, "ws", "esm", WEBPACK_LAYERS.reactServerComponents, getResolve), "commonjs ws")
})

/** Load only the installed JS algorithm with a synthetic missing optional peer. */
function loadMaskingFallback(optionalPeerMissing) {
  const commonJsModule = { exports: {} }
  const imports = []
  runInNewContext(bufferUtilSource, {
    Buffer,
    module: commonJsModule,
    process: { env: {} },
    require(request) {
      imports.push(request)
      if (request === "./constants") return { EMPTY_BUFFER: Buffer.alloc(0) }
      assert.equal(request, "bufferutil")
      if (!optionalPeerMissing) return {}
      throw Object.assign(new Error("synthetic optional absence"), { code: "MODULE_NOT_FOUND" })
    },
  }, { timeout: 1000 })
  assert.deepEqual(imports, ["./constants", "bufferutil"])
  return commonJsModule.exports
}

test("default missing optional peer preserves ws masking fallback above its native threshold", () => {
  const { mask, unmask } = loadMaskingFallback(true)
  const input = Buffer.alloc(80, 71)
  const key = Buffer.from([1, 3, 5, 7])
  const output = Buffer.alloc(86, 0)
  const expected = Buffer.from(input.map((byte, index) => byte ^ key[index & 3]))
  mask(input, key, output, 6, input.length)
  assert.equal(output.subarray(6).equals(expected), true)
  assert.equal(output.subarray(0, 6).equals(Buffer.alloc(6)), true)
  unmask(output.subarray(6), key)
  assert.equal(output.subarray(6).equals(input), true)
  assert.equal(output.length, 86)

  // An ignored optional module is observably different from native absence.
  const ignored = loadMaskingFallback(false)
  assert.throws(() => ignored.mask(input, key, Buffer.alloc(80), 0, 80), { name: "TypeError" })
})
