import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import { buildRepositoryInventory, loadJson, stableJson } from "./core.mjs"

try {
  const scriptDirectory = dirname(fileURLToPath(import.meta.url))
  const root = resolve(scriptDirectory, "../..")
  const policy = loadJson(resolve(scriptDirectory, "policy.json"))
  const report = buildRepositoryInventory(root, policy)
  console.log(`${JSON.stringify(stableJson(report), null, 2)}\n`)
} catch {
  console.error(JSON.stringify(stableJson({
    schemaVersion: 1,
    error: { code: "REPOSITORY_INVENTORY_FAILED" },
  }), null, 2))
  process.exitCode = 1
}
