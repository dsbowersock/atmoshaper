import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { createRequire } from "node:module"
import test from "node:test"

import nextConfig from "../next.config.mjs"

const require = createRequire(import.meta.url)
const picomatch = require("next/dist/compiled/picomatch")

test("station artwork function traces both Sharp Linux runtime packages", () => {
  const packageLock = JSON.parse(readFileSync(
    new URL("../package-lock.json", import.meta.url),
    "utf8",
  ))

  const routePattern = "/api/atmosphere/stations/*/artwork"
  assert.equal(
    picomatch(routePattern, { contains: true, dot: true })(
      "/api/atmosphere/stations/[stationId]/artwork",
    ),
    true,
  )
  assert.deepEqual(
    nextConfig.outputFileTracingIncludes?.[routePattern],
    [
      "./node_modules/@img/sharp-linux-x64/**/*",
      "./node_modules/@img/sharp-libvips-linux-x64/**/*",
    ],
  )
  assert.ok(packageLock.packages["node_modules/@img/sharp-linux-x64"])
  assert.ok(packageLock.packages["node_modules/@img/sharp-libvips-linux-x64"])
})
