/** Verify retained publisher bytes and current claim coverage without approving facts or rights. */
import assert from "node:assert/strict"
import { createHash } from "node:crypto"
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"

const sha256 = (value) => createHash("sha256").update(value).digest("hex")
const fixedArtifacts = ["historical-license.txt", "historical-readme.md", "historical-collection.xml"]
const title = "Anatomy and Physiology 2e"
const collectionId = "4fd99458-6fdf-49bc-8688-a6dc17a1268d"

/** Hash authored claim inputs separately from the external chapter candidates. */
export function anatomySourceClaimDigest(cards) {
  return sha256(JSON.stringify(cards.map((card) => ({
    selector: `${card.category}:${card.entitySlug}`,
    name: card.name,
    summary: card.summary,
  }))))
}

/**
 * Check the immutable edition, every retained artifact, and the exact current card set.
 * A candidate chapter locator never upgrades a fact's scientific or commercial review.
 * readArtifact receives only fixed names or validated module paths, never arbitrary URLs.
 */
export function verifyAnatomySourceEvidence(manifest, cards, readArtifact) {
  assert.equal(manifest.schemaVersion, 1, "Unsupported source-evidence schema")
  assert.equal(manifest.sourceRef, "openstax-anatomy-physiology", "Wrong source identity")
  assert.equal(manifest.title, title, "Wrong edition title")
  assert.equal(manifest.edition, "2e", "Edition must be explicit")
  assert.equal(manifest.collectionId, collectionId, "Wrong collection identity")
  assert.match(manifest.publisherRevision, /^[a-f0-9]{40}$/, "Immutable publisher revision required")
  assert.equal(manifest.license, "CC BY 4.0", "This packet covers the historical CC BY edition")
  assert.equal(manifest.licenseUrl, "https://creativecommons.org/licenses/by/4.0/")
  assert.equal(manifest.status, "edition_pinned_claim_review_pending")
  assert.equal(manifest.runtimeSourceRetargeted, false, "Evidence must not imply runtime retargeting")
  assert.equal(manifest.claimReviewComplete, false, "Archive integrity is not claim acceptance")
  assert.equal(manifest.commercialClearance, false, "Archive integrity is not commercial clearance")
  assert.deepEqual(manifest.artifacts.map((a) => a.file).sort(), [...fixedArtifacts].sort())

  const prefix = `https://raw.githubusercontent.com/openstax/osbooks-anatomy-physiology/${manifest.publisherRevision}/`
  const suffixes = { "historical-license.txt": "LICENSE", "historical-readme.md": "README.md", "historical-collection.xml": "collections/anatomy-and-physiology-2e.collection.xml" }
  const modules = new Map()
  for (const sourceModule of manifest.modules) {
    assert.match(sourceModule.module, /^m[0-9]+$/, "Fixed publisher module ID required")
    assert.equal(sourceModule.file, `publisher-text/${sourceModule.module}.cnxml`, "Module traversal denied")
    assert.equal(sourceModule.publicUrl, `${prefix}modules/${sourceModule.module}/index.cnxml`, "Cross-revision or external URL denied")
    assert.ok(!modules.has(sourceModule.module), "Duplicate publisher module")
    modules.set(sourceModule.module, sourceModule)
  }
  assert.ok(modules.has("m46844"), "Publisher preface is part of edition evidence")
  const contents = new Map()
  let totalBytes = 0
  for (const artifact of [...manifest.artifacts, ...manifest.modules]) {
    if (suffixes[artifact.file]) assert.equal(artifact.publicUrl, prefix + suffixes[artifact.file], "Fixed publisher artifact URL required")
    assert.match(artifact.sha256, /^[a-f0-9]{64}$/, "SHA-256 pin required")
    const bytes = readArtifact(artifact.file)
    assert.ok(Buffer.isBuffer(bytes), "Artifact reader must return retained bytes")
    assert.equal(bytes.length, artifact.bytes, `Artifact size mismatch: ${artifact.file}`)
    assert.equal(sha256(bytes), artifact.sha256, `Artifact digest mismatch: ${artifact.file}`)
    contents.set(artifact.file, bytes.toString("utf8"))
    totalBytes += bytes.length
  }
  assert.ok(contents.get("historical-license.txt").startsWith("Attribution 4.0 International"), "License identity mismatch")
  assert.ok(contents.get("historical-readme.md").includes("Creative Commons Attribution License"), "Work-specific license declaration required")
  const collection = contents.get("historical-collection.xml")
  assert.ok(collection.includes(`<md:title>${title}</md:title>`), "Collection title mismatch")
  assert.ok(collection.includes(`<md:uuid>${collectionId}</md:uuid>`), "Collection UUID mismatch")
  assert.ok(collection.includes('url="http://creativecommons.org/licenses/by/4.0/"'), "Collection does not identify CC BY 4.0")
  for (const sourceModuleId of modules.keys()) assert.ok(collection.includes(`document="${sourceModuleId}"`), "Module not in pinned book")

  const selectors = cards.map((c) => `${c.category}:${c.entitySlug}`)
  assert.equal(new Set(selectors).size, selectors.length, "Duplicate current source-card identity")
  assert.equal(new Set(manifest.claimBindings.map((r) => r.selector)).size, manifest.claimBindings.length, "Duplicate claim binding")
  assert.deepEqual(manifest.claimBindings.map((r) => r.selector).sort(), [...selectors].sort(), "Current source-card coverage changed")
  assert.equal(anatomySourceClaimDigest(cards), manifest.claimInputSha256, "Authored claim text changed; re-review required")
  for (const binding of manifest.claimBindings) {
    assert.equal(binding.reviewStatus, "needs_review", "Chapter candidate is not scientific approval")
    assert.ok(binding.candidateModules.length > 0, "Claim needs a candidate locator")
    for (const sourceModuleId of binding.candidateModules) assert.ok(modules.has(sourceModuleId), "Claim references an unretained module")
  }
  return {
    state: "EDITION_ARTIFACT_INTEGRITY_AND_CLAIM_COVERAGE_VERIFIED",
    publisherRevision: manifest.publisherRevision,
    artifactsMatched: contents.size,
    retainedTextModules: modules.size,
    retainedBytes: totalBytes,
    currentClaimCardsMatched: cards.length,
    claimReviewComplete: false,
    commercialClearance: false,
    runtimeSourceRetargeted: false,
    networkRequests: 0,
  }
}

/** CLI reads a caller-selected public evidence directory; it never retrieves missing files. */
async function main(args) {
  assert.equal(args.length, 2, "Use --artifact-root followed by the retained public evidence directory")
  assert.equal(args[0], "--artifact-root")
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
  const artifactRoot = fs.realpathSync(args[1])
  const manifest = JSON.parse(fs.readFileSync(path.join(root, "docs/source-evidence/openstax-ap-2e-cc-by-2026-03.json"), "utf8"))
  const { getAnatomyStudyCards } = await import(pathToFileURL(path.join(root, "lib/anatomy-study.ts")).href)
  const cards = getAnatomyStudyCards().filter((card) => card.sourceRefs.includes(manifest.sourceRef))
  const result = verifyAnatomySourceEvidence(manifest, cards, (name) => {
    const file = path.resolve(artifactRoot, name)
    assert.ok(file.startsWith(artifactRoot + path.sep), "Artifact path must remain inside evidence root")
    assert.ok(fs.lstatSync(file).isFile() && !fs.lstatSync(file).isSymbolicLink(), "Regular retained artifact required")
    assert.ok(fs.realpathSync(file).startsWith(artifactRoot + path.sep), "Artifact link escapes evidence root")
    return fs.readFileSync(file)
  })
  console.log(JSON.stringify(result))
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await main(process.argv.slice(2))
}