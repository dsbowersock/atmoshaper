import { createHash } from "node:crypto"
import { readFileSync, writeFileSync } from "node:fs"
import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"

const SNAPSHOT = "CPython-v3.14.7-html.entities.html5"
const UPSTREAM = "https://html.spec.whatwg.org/entities.json"
const EXPECTED_ENTRIES = 2231
const EXPECTED_SHA256 = "99f7de5d06ab0bd778237f75a419bff42822336ed0fe41253e7942bc99ca7db5"
const outputPath = resolve(dirname(fileURLToPath(import.meta.url)), "cleanup-html-named-references.json")

function normalizedReferences(source) {
  const rows = Object.entries(source).map(([rawName, rawValue]) => {
    const name = rawName.startsWith("&") ? rawName.slice(1) : rawName
    const value = typeof rawValue === "string" ? rawValue : rawValue?.characters
    if (!name || typeof value !== "string") throw new Error("HTML_REFERENCE_SNAPSHOT_INVALID")
    return [name, value]
  })
  rows.sort(([left], [right]) => left < right ? -1 : left > right ? 1 : 0)
  return Object.fromEntries(rows)
}

function asciiJson(value) {
  return `${JSON.stringify(value).replace(/[^\x20-\x7e]/g, (character) => (
    `\\u${character.charCodeAt(0).toString(16).padStart(4, "0")}`
  ))}\n`
}

const sourceArgument = process.argv.indexOf("--source")
const sourcePath = sourceArgument >= 0 ? resolve(process.argv[sourceArgument + 1] ?? "") : outputPath
const serialized = asciiJson(normalizedReferences(JSON.parse(readFileSync(sourcePath, "utf8"))))
const entries = Object.keys(JSON.parse(serialized)).length
const sha256 = createHash("sha256").update(serialized).digest("hex")
if (entries !== EXPECTED_ENTRIES || sha256 !== EXPECTED_SHA256) {
  throw new Error(`HTML_REFERENCE_SNAPSHOT_DRIFT:${entries}:${sha256}`)
}
if (process.argv.includes("--write")) writeFileSync(outputPath, serialized, "utf8")
process.stdout.write(`${JSON.stringify({ entries, sha256, snapshot: SNAPSHOT, upstream: UPSTREAM })}\n`)
