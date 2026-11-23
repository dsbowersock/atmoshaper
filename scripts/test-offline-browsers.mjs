import { spawnSync } from "node:child_process"
import { fileURLToPath } from "node:url"

/** Named real-media acceptance opts into the two small public downloads. The
 * ordinary wildcard suite remains network-free and skips that one live test. */
const mode = process.argv[2] ?? "all"
if (!["all", "media"].includes(mode)) throw new Error("Unknown offline browser acceptance mode.")
const tests = mode === "media" ? ["tests/offline-media-browser.test.mjs"] : ["tests/offline-core-browser.test.mjs", "tests/offline-media-browser.test.mjs", "tests/offline-background-browser.test.mjs"]
const result = spawnSync(process.execPath, ["--test", "--test-concurrency=2", ...tests], {
  cwd: fileURLToPath(new URL("..", import.meta.url)),
  env: { ...process.env, ATMOSHAPER_OFFLINE_REAL_MEDIA_TEST: "1" }, stdio: "inherit", windowsHide: true,
})
if (result.error) throw result.error
process.exit(result.status ?? 1)
