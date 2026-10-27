import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { createRequire } from "node:module"
import { dirname, join } from "node:path"
import test from "node:test"
import { fileURLToPath } from "node:url"
import { runInNewContext } from "node:vm"

const require = createRequire(import.meta.url)
const { makeExternalHandler } = require("next/dist/build/handle-externals")
const { defaultConfig } = require("next/dist/server/config-shared")
const { WEBPACK_LAYERS } = require("next/dist/lib/constants")
const json5 = require("next/dist/compiled/json5")
const defaults = json5.parse(readFileSync(
  require.resolve("next/dist/lib/server-external-packages.jsonc"), "utf8",
))
const root = fileURLToPath(new URL("../", import.meta.url))
const wsEntry = require.resolve("ws")
const wsEsmEntry = join(dirname(wsEntry), require("ws/package.json").exports["."].import)
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
    // The raw VM config has not passed through Next's default normalization.
    config: { ...config, experimental: { ...defaultConfig.experimental, ...config.experimental } },
    optOutBundlingPackageRegex: pattern,
    transpiledPackages: config.transpilePackages,
    dir: root,
  })
}

test("canonical server config preserves native ws ESM and CommonJS ownership", async () => {
  const nextConfig = loadConfig()
  assert.equal(nextConfig.transpilePackages?.includes("ws") ?? false, false)
  const resolutions = []
  // Preserve ws's installed import/require split for both issuer and base checks.
  const getResolve = ({ dependencyType }) => {
    assert.ok(["esm", "commonjs"].includes(dependencyType))
    return async (context, request) => {
      assert.equal(context, root)
      assert.equal(request, "ws")
      resolutions.push(dependencyType)
      return dependencyType === "esm" ? [wsEsmEntry, true] : [wsEntry, false]
    }
  }
  const requests = [["esm", "module ws"], ["commonjs", "commonjs ws"]]
  for (const config of [nextConfig, loadConfig({ NEXT_PUBLIC_ATMOSHAPER_BROWSER_QA: "1" })]) {
    const handler = externalHandler(config)
    for (const layer of [WEBPACK_LAYERS.reactServerComponents, WEBPACK_LAYERS.apiNode]) {
      for (const [dependencyType, expected] of requests) {
        const start = resolutions.length
        assert.equal(await handler(root, "ws", dependencyType, layer, getResolve), expected)
        assert.deepEqual(resolutions.slice(start), [dependencyType, dependencyType])
      }
    }
  }

  // Deleting only this opt-out must restore RSC bundling, proving sensitivity.
  const withoutWs = externalHandler({
    ...nextConfig,
    serverExternalPackages: (nextConfig.serverExternalPackages ?? []).filter((name) => name !== "ws"),
  })
  for (const [dependencyType] of requests) {
    assert.equal(await withoutWs(root, "ws", dependencyType, WEBPACK_LAYERS.reactServerComponents, getResolve), undefined)
  }
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
