import { REVIEWED_ACTION_BACKLOG_BINDINGS } from "../lib/anatomy-action-backlog-provenance.js"
/** Audit retained publisher bytes only; no retrieval, credentials or automatic clinical approval. */
import assert from "node:assert/strict"
import { createHash } from "node:crypto"
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"
import { REVIEWED_THIGH_ACTION_BINDINGS } from "../lib/anatomy-thigh-action-provenance.js"

const sha = bytes => createHash("sha256").update(bytes).digest("hex")
const decodeXml = text => text.replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCodePoint(parseInt(code, 16))).replace(/&#([0-9]+);/g, (_, code) => String.fromCodePoint(Number(code))).replace(/&(lt|gt|quot|apos|amp);/g, (_, name) => ({lt:"<", gt:">", quot:'"', apos:"'", amp:"&"}[name]))

/**
 * Check exact facts, immutable source elements and deliberately unresolved qualifiers.
 * Matching bytes substantiate provenance, not a clinical or whole-content verdict.
 * @param {object} manifest Fixed repository evidence manifest.
 * @param {import("../lib/anatomy-foundation.ts").AnatomyFoundationSeed} seed Current public seed.
 * @param {(file:string)=>Buffer} readArtifact Caller-confined retained-file reader.
 */
export function auditThighActionEvidence(manifest, seed, readArtifact) {
  assert.equal(manifest.schemaVersion, 1)
  assert.equal(manifest.clinicalAcceptanceComplete, false)
  assert.equal(manifest.wholeMigrationComplete, false)
  assert.equal(manifest.sourceRevision, "b0058a743bdd2cc08196abaaa7d5469970c0d80c")
  assert.equal(manifest.sourceRef, "openstax-anatomy-physiology")
  assert.deepEqual(manifest.bindings, REVIEWED_THIGH_ACTION_BINDINGS)
  assert.equal(manifest.bindings.length, 6)
  assert.equal(manifest.unresolved.length, 5)
  assert.ok(manifest.unresolved.every(row => row.status === "PARTIAL_QUALIFIER_UNRESOLVED"))
  assert.equal(manifest.sourceDiscrepancy.state, "PRESERVED_NOT_SILENTLY_REPAIRED")
  assert.deepEqual(manifest.sourceDiscrepancy.elementIds, ["fs-id2252429", "fs-id2026297"])
  assert.deepEqual(manifest.publisherArtifacts.map(row => row.file).sort(), ["historical-collection.xml", "historical-license.txt", "m46482.cnxml"])
  const files = new Map()
  for (const artifact of manifest.publisherArtifacts) {
    assert.match(artifact.file, /^[a-zA-Z0-9._-]+$/)
    const data = readArtifact(artifact.file)
    assert.equal(data.length, artifact.bytes, `Publisher artifact size: ${artifact.file}`)
    assert.equal(sha(data), artifact.sha256, `Publisher artifact digest: ${artifact.file}`)
    files.set(artifact.file, data)
  }
  assert.ok(files.get("historical-collection.xml").toString().includes('document="m46482"'))
  assert.ok(files.get("historical-license.txt").toString().startsWith("Attribution 4.0 International"))
  const xml = files.get("m46482.cnxml").toString()
  assert.equal(manifest.publisherElements.length, 4)
  for (const element of manifest.publisherElements) {
    assert.match(element.elementId, /^fs-id\d+$/)
    assert.ok(["para", "media"].includes(element.kind))
    const matches = [...xml.matchAll(new RegExp(`<${element.kind}\\b[^>]*\\bid="${element.elementId}"[^>]*>[\\s\\S]*?</${element.kind}>`, "g"))]
    assert.equal(matches.length, 1)
    const match = matches[0]
    assert.equal(sha(match[0]), element.xmlSha256)
    assert.equal(xml.slice(0, match.index).split("\n").length, element.startLine)
    assert.equal(xml.slice(0, match.index + match[0].length).split("\n").length, element.endLine)
    const raw = element.kind === "media" ? match[0].match(/\balt="([^"]*)"/)?.[1] : match[0].replace(/<[^>]*>/g, "")
    assert.equal(typeof raw, "string")
    assert.equal(sha(decodeXml(raw).replace(/\s+/g, " ").trim()), element.textSha256)
  }
  for (const binding of manifest.bindings) {
    const action = seed.muscleActions.find(row => row.id === binding.id)
    assert.ok(action)
    assert.equal(action.muscle, binding.muscle)
    assert.equal(sha(action.description), binding.descriptionSha256)
    assert.equal(action.sourceRef, binding.sourceRef)
    const exact = seed.citations.find(row => row.id === binding.citationId)
    assert.ok(exact)
    assert.equal(exact.entitySlug, binding.muscle)
    assert.equal(exact.factType, "action")
    assert.equal(exact.factSlug, binding.id)
    assert.equal(exact.sourceRef, action.sourceRef)
    assert.equal(exact.sourceLocator, binding.sourceLocator)
    assert.equal(exact.citationNote, binding.reviewNote)
    assert.equal(exact.reviewStatus, "reviewed")
  }
  for (const pending of manifest.unresolved) {
    const action = seed.muscleActions.find(row => row.id === pending.actionId)
    assert.ok(action)
    assert.equal(sha(action.description), pending.descriptionSha256)
    if (pending.laterExactEvidence) {
      const binding = REVIEWED_ACTION_BACKLOG_BINDINGS.find(row => row.id === pending.actionId)
      assert.ok(binding, "Only an independently reviewed exact binding can supersede a pending decision")
      assert.deepEqual(pending.laterExactEvidence, {id:binding.id, citationId:binding.citationId, sourceRef:binding.sourceRef, sourceLocator:binding.sourceLocator, descriptionSha256:binding.descriptionSha256, manifest:"muscle-action-backlog-integration-20261025.json"})
      assert.equal(action.sourceRef, binding.sourceRef)
      const exact = seed.citations.find(row => row.id === binding.citationId)
      assert.ok(exact && exact.factSlug === action.id && exact.entitySlug === action.muscle && exact.sourceRef === action.sourceRef && exact.sourceLocator === binding.sourceLocator && exact.reviewStatus === "reviewed")
    } else {
      assert.equal(action.sourceRef, pending.currentSourceRef)
      assert.equal(seed.citations.some(row => row.factType === "action" && row.factSlug === pending.actionId && row.reviewStatus === "reviewed"), false)
    }
  }
  const sources = new Map(seed.sources.map(source => [source.slug, source]))
  const unbound = seed.muscleActions.filter(action => ["open_reuse", "commercial_licensed"].includes(sources.get(action.sourceRef)?.usageScope) && !seed.citations.some(citation => citation.entityType === "muscle" && citation.entitySlug === action.muscle && citation.factType === "action" && citation.factSlug === action.id && citation.sourceRef === action.sourceRef && citation.reviewStatus === "reviewed"))
  return {state:"SIX_EXISTING_THIGH_ACTIONS_EXACTLY_SOURCED", reviewedActions:6, retainedArtifacts:files.size, sourceElements:manifest.publisherElements.length, unresolvedQualifiers:manifest.unresolved.filter(row => !row.laterExactEvidence).length, supersededQualifiers:manifest.unresolved.filter(row => row.laterExactEvidence).length, remainingUnboundReusableActions:unbound.length, remainingAffectedMuscles:new Set(unbound.map(action => action.muscle)).size, clinicalAcceptanceComplete:false, wholeMigrationComplete:false, networkRequests:0}
}

/** Read only ordinary files below the caller-selected retained evidence directory. */
export async function runThighActionAudit(args) {
  assert.deepEqual(args.slice(0, 1), ["--artifact-root"])
  assert.equal(args.length, 2)
  const root = fs.realpathSync(args[1])
  const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
  const manifest = JSON.parse(fs.readFileSync(path.join(repo, "docs/source-evidence/anatomy-thigh-action-review-20261025.json")))
  const { ANATOMY_FOUNDATION_SEED } = await import(pathToFileURL(path.join(repo, "lib/anatomy-foundation.ts")))
  return auditThighActionEvidence(manifest, ANATOMY_FOUNDATION_SEED, name => {
    const file = path.join(root, name)
    assert.ok(file.startsWith(root + path.sep))
    const info = fs.lstatSync(file)
    assert.ok(info.isFile() && !info.isSymbolicLink() && fs.realpathSync(file).startsWith(root + path.sep))
    return fs.readFileSync(file)
  })
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  console.log(JSON.stringify(await runThighActionAudit(process.argv.slice(2))))
}
