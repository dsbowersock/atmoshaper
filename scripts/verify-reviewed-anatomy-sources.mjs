import { isReviewedActionFigureCitation } from "../lib/anatomy-action-backlog-provenance.js"
import { OFFERED_FOOT_SOURCE_BINDING as foot, POSNIK_FOOT_SOURCE_METADATA } from "../lib/anatomy-muscle-action-provenance.js"
/** Verify live source/summary bindings against retained public bytes; never fetch missing evidence. */
import assert from "node:assert/strict"
import { createHash } from "node:crypto"
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"

const hash = bytes => createHash("sha256").update(bytes).digest("hex")
const sourceKey = "openstax-anatomy-physiology"
const fixedArtifacts = ["historical-license.txt", "historical-readme.md", "historical-collection.xml"]

/** Hash the current authored fields, preserving the adapter's deterministic card order. */
export function reviewedAnatomyInputDigest(cards) {
  return hash(JSON.stringify(cards.map(card => ({ selector: `${card.category}:${card.entitySlug}`, name: card.name, summary: card.summary }))))
}

/**
 * Check actual runtime metadata, complete current summary coverage and retained
 * publisher identities/paragraphs. A successful hash comparison cannot grant
 * clinical acceptance, license supplemental articles or activate a release.
 * readArtifact receives only validated local names; no URL is executed or fetched.
 */
export function verifyReviewedAnatomySourceEvidence(manifest, seed, cards, readArtifact) {
  assert.equal(manifest.schemaVersion, 2)
  assert.equal(manifest.state, "versioned_summary_sources_compared_runtime_pinned")
  assert.equal(manifest.sourceRef, sourceKey)
  assert.match(manifest.publisherRevision, /^[a-f0-9]{40}$/)
  assert.equal(manifest.title, "Anatomy and Physiology 2e")
  assert.equal(manifest.edition, "2e")
  assert.equal(manifest.license, "CC BY 4.0")
  assert.equal(manifest.licenseUrl, "https://creativecommons.org/licenses/by/4.0/")
  assert.equal(manifest.runtimeSourceRetargeted, true)
  assert.equal(manifest.summarySourceComparisonComplete, true)
  assert.equal(manifest.clinicalAcceptanceComplete, false, "Source integrity cannot grant clinical acceptance")
  assert.equal(manifest.commercialReleaseComplete, false, "Source integrity cannot activate commercial release")
  assert.equal(manifest.articleContentLicenseInferred, false, "The book cannot license supplemental articles")
  assert.equal(manifest.articleTextOrMediaBundled, false)
  // This later two-source description is not retroactively part of the frozen
  // 53-summary publisher comparison. Validate its exact identities before removal;
  // an unknown extra card/citation still fails the unchanged historical counts.
  const footCards = cards.filter(card => card.category === "muscle" && card.entitySlug === foot.muscle)
  assert.equal(footCards.length, 1, "Missing later offered-foot card")
  assert.equal(footCards[0].summary, foot.summary)
  const footCitations = seed.citations.filter(citation => foot.citationIds.includes(citation.id))
  assert.equal(footCitations.length, 4, "Later offered-foot citation cohort changed")
  const targets = [
    ["muscle", foot.muscle, "clinical_summary", undefined],
    ["muscle", foot.muscle, "action", foot.actionId],
    ["muscle", foot.muscle, "seed_source_reference", `muscle:${foot.muscle}`],
    ["muscle_action", foot.actionId, "seed_source_reference", `muscle_action:${foot.actionId}`],
  ]
  for (const [index, id] of foot.citationIds.entries()) {
    const matches = footCitations.filter(citation => citation.id === id)
    assert.equal(matches.length, 1, "Duplicate later offered-foot citation")
    const citation = matches[0]
    assert.deepEqual([citation.entityType, citation.entitySlug, citation.factType, citation.factSlug], targets[index])
    assert.equal(citation.slug, id)
    assert.equal(citation.sourceRef, sourceKey)
    assert.equal(citation.sourceLocator, foot.sourceLocator)
    assert.equal(citation.reviewStatus, "reviewed")
    assert.ok(citation.citationNote.includes(foot.supplementLocator), "Foot source contributions must stay separate")
  }
  const footSources = seed.sources.filter(source => source.slug === foot.supplementRef)
  assert.deepEqual(footSources, [{id:`source-${foot.supplementRef}`, slug:foot.supplementRef, ...POSNIK_FOOT_SOURCE_METADATA}])
  assert.equal(seed.citations.filter(citation => citation.sourceRef === foot.supplementRef).length, 2, "Unreviewed supplemental foot citation")
  for (const factType of ["clinical_summary", "action"]) {
    const id = `citation-lumbricals-foot-${factType === "action" ? "action" : "summary"}-posnik-2024`
    const supplemental = seed.citations.filter(citation => citation.id === id)
    assert.equal(supplemental.length, 1)
    assert.equal(supplemental[0].slug, id)
    assert.equal(supplemental[0].entityType, "muscle")
    assert.equal(supplemental[0].entitySlug, foot.muscle)
    assert.equal(supplemental[0].factType, factType)
    assert.equal(supplemental[0].factSlug, factType === "action" ? foot.actionId : undefined)
    assert.equal(supplemental[0].sourceRef, foot.supplementRef)
    assert.equal(supplemental[0].sourceLocator, foot.supplementLocator)
    assert.equal(supplemental[0].reviewStatus, "reviewed")
    assert.ok(supplemental[0].citationNote.includes(foot.sourceLocator))
  }
  cards = cards.filter(card => card !== footCards[0])
  const prefix = `https://github.com/openstax/osbooks-anatomy-physiology/blob/${manifest.publisherRevision}/`
  const rawPrefix = `https://raw.githubusercontent.com/openstax/osbooks-anatomy-physiology/${manifest.publisherRevision}/`
  assert.equal(manifest.collectionUrl, `${prefix}collections/anatomy-and-physiology-2e.collection.xml`)
  const sources = seed.sources.filter(source => source.slug === sourceKey)
  assert.equal(sources.length, 1)
  const source = sources[0]
  assert.equal(source.id, manifest.originalRuntimeSourceId)
  assert.equal(source.url, manifest.collectionUrl, "Pinned source URL does not match the live source")
  assert.equal(source.license, manifest.license)
  assert.equal(source.licenseUrl, manifest.licenseUrl)
  assert.equal(source.usageScope, "open_reuse")
  assert.ok(source.name.includes("2e") && source.attribution.includes(manifest.publisherRevision))
  assert.equal(cards.length, manifest.bindings.length, "Current summary coverage changed")
  assert.equal(reviewedAnatomyInputDigest(cards), manifest.claimInputSha256, "Current authored summary text changed")
  const selectors = new Set(cards.map(card => `${card.category}:${card.entitySlug}`))
  const bindings = new Map()
  const supplementByKey = new Map(manifest.supplementaryReferences.map(reference => [reference.key, reference]))
  for (const reference of supplementByKey.values()) {
    assert.equal(reference.articleTextOrMediaBundled, false)
    assert.equal(reference.articleLicenseInferredFromBook, false)
    assert.match(reference.url, /^https:\/\/pubmed\.ncbi\.nlm\.nih\.gov\/[0-9]+\/$/)
    assert.ok(reference.doi && reference.checkedScope)
  }
  const moduleById = new Map()
  for (const entry of manifest.modules) {
    assert.match(entry.module, /^m[0-9]+$/)
    assert.equal(entry.file, `publisher-text/${entry.module}.cnxml`)
    assert.equal(entry.publicUrl, `${rawPrefix}modules/${entry.module}/index.cnxml`)
    assert.ok(!moduleById.has(entry.module), "Duplicate publisher module")
    moduleById.set(entry.module, entry)
  }
  for (const binding of manifest.bindings) {
    assert.ok(selectors.has(binding.selector), "Missing current summary selector")
    assert.ok(!bindings.has(binding.selector), "Duplicate summary binding")
    assert.ok(["source_compared", "authored_grouping"].includes(binding.assessment))
    assert.ok(binding.locators.length && binding.reason)
    for (const locator of binding.locators) {
      assert.ok(moduleById.has(locator.module), "Summary references an unretained module")
      assert.match(locator.elementId, /^[A-Za-z0-9_.:-]+$/)
      assert.ok(Number.isInteger(locator.startLine) && locator.startLine > 0 && locator.endLine >= locator.startLine)
      assert.equal(locator.publicUrl, `${prefix}modules/${locator.module}/index.cnxml#L${locator.startLine}-L${locator.endLine}`, "Moving or unrelated paragraph URL")
      assert.match(locator.paragraphXmlSha256, /^[a-f0-9]{64}$/)
    }
    for (const key of binding.supplementaryReferences) assert.ok(supplementByKey.has(key))
    bindings.set(binding.selector, binding)
  }
  for (const card of cards) assert.equal(hash(card.summary), bindings.get(`${card.category}:${card.entitySlug}`).summarySha256)
  const citations = seed.citations.filter(citation => citation.sourceRef === sourceKey && !foot.citationIds.includes(citation.id))
  const counts = { clinical_summary: 0, entity_source_reference: 0, entity_term: 0, relationship: 0, action: 0, total: citations.length }
  for (const citation of citations) {
    assert.equal(citation.reviewStatus, "reviewed", "This slice preserves the existing source-linkage flags")
    // A figure is allowed only for its exact reviewed fact/pointer identity.
    // All other source locators retain the existing pinned-module/line contract.
    const exactFigure = isReviewedActionFigureCitation(citation)
    assert.ok(exactFigure || citation.sourceLocator.includes(`${prefix}modules/`), "Unpinned citation remains")
    assert.equal(citation.sourceLocator.includes("pages/1-introduction"), false)
    if (exactFigure) assert.equal(new URL(citation.sourceLocator).hash, "")
    else assert.match(new URL(citation.sourceLocator).hash, /^#L[0-9]+-L[0-9]+$/, "A citation must keep one directly clickable primary URL")
    if (citation.factType === "clinical_summary") {
      counts.clinical_summary++
      const binding = bindings.get(`${citation.entityType}:${citation.entitySlug}`)
      assert.ok(binding)
      const expected = [...binding.locators.map(locator => locator.publicUrl), ...binding.supplementaryReferences.map(key => supplementByKey.get(key).url)]
      assert.equal(citation.sourceLocator, expected[0], "Live summary locator differs from reviewed binding")
      for (const secondary of expected.slice(1)) assert.ok(citation.citationNote.includes(secondary), "Secondary reference omitted")
    } else if (citation.factType === "action") {
      // Exact action evidence is independently audited by audit:muscle-action-citations.
      // This audit retains complete summary and archived-URL coverage as it grows.
      counts.action++
    } else {
      assert.equal(citation.factType, "seed_source_reference")
      if (citation.factSlug.startsWith("entity_term:")) counts.entity_term++
      else if (citation.factSlug.startsWith("relationship:")) counts.relationship++
      else counts.entity_source_reference++
    }
  }
  assert.deepEqual(counts, manifest.expectedReferenceCounts)
  assert.deepEqual(manifest.artifacts.map(a => a.file).sort(), [...fixedArtifacts].sort())
  const suffixes = { "historical-license.txt": "LICENSE", "historical-readme.md": "README.md", "historical-collection.xml": "collections/anatomy-and-physiology-2e.collection.xml" }
  const contents = new Map()
  let bytesMatched = 0
  for (const artifact of [...manifest.artifacts, ...manifest.modules]) {
    if (suffixes[artifact.file]) assert.equal(artifact.publicUrl, rawPrefix + suffixes[artifact.file])
    assert.match(artifact.sha256, /^[a-f0-9]{64}$/)
    const bytes = readArtifact(artifact.file)
    assert.ok(Buffer.isBuffer(bytes))
    assert.equal(bytes.length, artifact.bytes, `Artifact size mismatch: ${artifact.file}`)
    assert.equal(hash(bytes), artifact.sha256, `Artifact digest mismatch: ${artifact.file}`)
    contents.set(artifact.file, bytes.toString("utf8"))
    bytesMatched += bytes.length
  }
  assert.ok(contents.get("historical-license.txt").startsWith("Attribution 4.0 International"))
  assert.ok(contents.get("historical-readme.md").includes("Creative Commons Attribution License"))
  const collection = contents.get("historical-collection.xml")
  assert.ok(collection.includes(`<md:title>${manifest.title}</md:title>`) && collection.includes(`<md:uuid>${manifest.collectionId}</md:uuid>`))
  assert.ok(collection.includes('url="http://creativecommons.org/licenses/by/4.0/"'))
  for (const entry of manifest.modules) assert.ok(collection.includes(`document="${entry.module}"`))
  let paragraphsMatched = 0
  for (const binding of manifest.bindings) for (const locator of binding.locators) {
    const text = contents.get(`publisher-text/${locator.module}.cnxml`)
    const starts = [...text.matchAll(new RegExp(`<para\\b[^>]*\\bid="${locator.elementId}"`, "g"))]
    assert.equal(starts.length, 1, "Paragraph identity mismatch")
    const start = starts[0].index, end = text.indexOf("</para>", start) + 7
    assert.ok(end > start)
    assert.equal(hash(text.slice(start, end)), locator.paragraphXmlSha256, "Paragraph digest mismatch")
    assert.equal(text.slice(0, start).split("\n").length, locator.startLine)
    assert.equal(text.slice(0, end).split("\n").length, locator.endLine)
    paragraphsMatched++
  }
  return { state: "LIVE_EDITION_AND_SUMMARY_BINDINGS_VERIFIED", runtimeSourceRetargeted: true, summaryCardsMatched: cards.length, citationCounts: counts, laterFootMetadata:{summaryCardsMatched:1, primaryCitationsMatched:4, supplementalCitationsMatched:2, publisherBytesAuditedByHistoricalManifest:false}, publisherArtifactsMatched: contents.size, publisherBytesMatched: bytesMatched, paragraphsMatched, clinicalAcceptanceComplete: false, commercialReleaseComplete: false, articleContentLicenseInferred: false, networkRequests: 0 }
}

/** Read a caller-selected local evidence directory; no credential or retrieval fallback exists. */
export async function runReviewedAnatomySourceAudit(args) {
  assert.equal(args.length, 2, "Use --artifact-root followed by retained public evidence")
  assert.equal(args[0], "--artifact-root")
  const repository = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
  const artifactRoot = fs.realpathSync(args[1])
  const manifest = JSON.parse(fs.readFileSync(path.join(repository, "docs/source-evidence/openstax-ap-2e-reviewed-summaries.json"), "utf8"))
  const { ANATOMY_FOUNDATION_SEED: seed } = await import(pathToFileURL(path.join(repository, "lib/anatomy-foundation.ts")).href)
  const { getAnatomyStudyCards } = await import(pathToFileURL(path.join(repository, "lib/anatomy-study.ts")).href)
  const cards = getAnatomyStudyCards().filter(card => card.sourceRefs.includes(sourceKey))
  const result = verifyReviewedAnatomySourceEvidence(manifest, seed, cards, name => {
    assert.ok(fixedArtifacts.includes(name) || /^publisher-text\/m[0-9]+\.cnxml$/.test(name))
    const file = path.resolve(artifactRoot, name)
    assert.ok(file.startsWith(artifactRoot + path.sep))
    const info = fs.lstatSync(file)
    assert.ok(info.isFile() && !info.isSymbolicLink())
    assert.ok(fs.realpathSync(file).startsWith(artifactRoot + path.sep))
    return fs.readFileSync(file)
  })
  console.log(JSON.stringify(result))
  return result
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await runReviewedAnatomySourceAudit(process.argv.slice(2))
