/** Verify exact publisher evidence and runtime bindings; never retrieve missing artifacts. */
import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"
import { createHash } from "node:crypto"
import { fileURLToPath, pathToFileURL } from "node:url"
import { REVIEWED_ACTION_BACKLOG_BINDINGS, isReviewedActionFigureCitation } from "../lib/anatomy-action-backlog-provenance.js"

const sha = bytes => createHash("sha256").update(bytes).digest("hex")
const decode = text => text.replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16))).replace(/&#([0-9]+);/g, (_, n) => String.fromCodePoint(Number(n))).replace(/&(lt|gt|quot|apos|amp);/g, (_, n) => ({lt:"<", gt:">", quot:'"', apos:"'", amp:"&"}[n]))
const plain = xml => decode(xml.replace(/<[^>]*>/g, "")).replace(/\s+/g, " ").trim()

/**
 * Verify that only the selected full comparisons became exact public citations.
 * Byte/text hashes bind the manually compared evidence; they cannot independently
 * establish semantic truth, clinical acceptance or rights for a new media asset.
 * @param {object} manifest Fixed integration manifest.
 * @param {object} review Retained complete 87-action comparison.
 * @param {import("../lib/anatomy-foundation.ts").AnatomyFoundationSeed} seed Actual bundled public seed.
 * @param {(artifact:object)=>Buffer} readArtifact Caller-confined public-file reader.
 */
export function auditActionBacklogEvidence(manifest, review, seed, readArtifact) {
  assert.equal(manifest.schemaVersion, 1)
  assert.equal(manifest.clinicalAcceptanceComplete, false)
  assert.equal(manifest.wholeMigrationComplete, false)
  assert.equal(manifest.automatedSemanticTruthClaim, false)
  assert.equal(review.clinicalAcceptanceComplete, false)
  assert.equal(review.wholeMigrationComplete, false)
  assert.equal(sha(JSON.stringify(review)), manifest.reviewInputCanonicalSha256, "Complete review input changed")
  assert.equal(review.publisherRevision, "b0058a743bdd2cc08196abaaa7d5469970c0d80c")
  assert.equal(review.rows.length, 87)
  const supported = review.rows.filter(row => row.status === "FULL_DESCRIPTION_SUPPORTED")
  assert.equal(supported.length, 47)
  assert.deepEqual(manifest.bindings, REVIEWED_ACTION_BACKLOG_BINDINGS)
  assert.deepEqual(manifest.remainingUnapproved, review.rows.filter(row => row.status !== "FULL_DESCRIPTION_SUPPORTED"))
  assert.equal(manifest.remainingUnapproved.length, 40)
  assert.deepEqual(new Set(manifest.bindings.map(row => row.id)), new Set(supported.map(row => row.actionId)))
  const files = new Map()
  assert.equal(review.publisherArtifacts.length, 18)
  for (const artifact of [...review.publisherArtifacts, manifest.derivedPageTextArtifact]) {
    assert.match(artifact.file, /^[a-zA-Z0-9._-]+$/)
    assert.ok(!files.has(artifact.file), "Duplicate evidence file")
    const bytes = readArtifact(artifact)
    assert.equal(bytes.length, artifact.bytes, `Artifact size mismatch: ${artifact.file}`)
    assert.equal(sha(bytes), artifact.sha256, `Artifact digest mismatch: ${artifact.file}`)
    files.set(artifact.file, bytes)
  }
  assert.ok(files.get("historical-license.txt").toString().startsWith("Attribution 4.0 International"))
  const collection = files.get("historical-collection.xml").toString()
  const pages = JSON.parse(files.get("selected-pdf-pages.json"))
  for (const [key, evidence] of Object.entries(review.resolvedEvidence)) {
    if (evidence.kind === "visually_compared_publisher_table_row") {
      assert.equal(sha(files.get(evidence.file)), evidence.fileSha256)
      assert.ok(evidence.rowLabel)
      assert.equal(evidence.automaticOcrOrSemanticApproval, false)
      const artifact = review.publisherArtifacts.find(row => row.file === evidence.file)
      assert.equal(evidence.url, artifact.url)
      const declaration = files.get(artifact.module + ".cnxml").toString()
      assert.ok(declaration.includes(`../../media/${evidence.file}`))
    } else if (evidence.kind === "book_question_answer_or_table_comparison") {
      assert.equal(sha(files.get(evidence.file)), evidence.fileSha256)
      for (const n of evidence.actualOneBasedPdfPages) assert.equal(sha(pages[n]), evidence.pageTextSha256[n], `PDF page text changed: ${n}`)
    } else {
      assert.ok(["para", "media", "table"].includes(evidence.kind))
      assert.ok(collection.includes(`document="${evidence.module}"`))
      assert.match(evidence.elementId, /^[a-zA-Z0-9_-]+$/)
      const xml = files.get(evidence.module + ".cnxml").toString()
      const matches = [...xml.matchAll(new RegExp(`<${evidence.kind}\\b[^>]*\\bid="${evidence.elementId}"[^>]*>[\\s\\S]*?</${evidence.kind}>`, "g"))]
      assert.equal(matches.length, 1, key)
      const match = matches[0]
      assert.equal(sha(match[0]), evidence.elementXmlSha256)
      assert.equal(xml.slice(0, match.index).split("\n").length, evidence.startLine)
      assert.equal(xml.slice(0, match.index + match[0].length).split("\n").length, evidence.endLine)
      let text
      if (evidence.kind === "table") {
        const rows = [...match[0].matchAll(/<row\b[^>]*>([\s\S]*?)<\/row>/g)]
        assert.ok(rows[evidence.rowOrdinalZeroBased])
        text = [...rows[evidence.rowOrdinalZeroBased][1].matchAll(/<entry\b[^>]*>([\s\S]*?)<\/entry>/g)].map(entry => plain(entry[1])).join(" | ")
      } else if (evidence.kind === "media") {
        text = decode(match[0].match(/\balt="([^"]*)"/)[1]).replace(/\s+/g, " ").trim()
      } else text = plain(match[0])
      assert.equal(sha(text), evidence.selectedTextSha256, key)
    }
  }
  const sourceRows = new Map(supported.map(row => [row.actionId, row]))
  const primaryBook = new Set(manifest.primarySourceSelection.appliedHumanAnatomyActions)
  assert.deepEqual(primaryBook, new Set(["action-biceps-femoris-knee-flexion", "action-semitendinosus-knee-flexion", "action-semimembranosus-knee-flexion"]))
  for (const binding of manifest.bindings) {
    const compared = sourceRows.get(binding.id)
    assert.equal(compared.description, binding.description)
    assert.equal(compared.descriptionSha256, binding.descriptionSha256)
    assert.equal(compared.currentSourceRef, binding.originalSourceRef)
    assert.ok(compared.evidenceRefs.includes(binding.primaryEvidenceRef))
    const evidence = review.resolvedEvidence[binding.primaryEvidenceRef]
    if (primaryBook.has(binding.id)) {
      assert.equal(binding.sourceRef, "applied-human-anatomy")
      assert.equal(binding.sourceLocator, "https://open.umn.edu/opentextbooks/formats/3154#page=165")
      assert.ok(evidence.actualOneBasedPdfPages.includes(59) && evidence.actualOneBasedPdfPages.includes(60) && evidence.actualOneBasedPdfPages.includes(165))
      assert.ok(pages[59].includes("superolateral border") && pages[60].includes("superomedial border"))
      assert.ok(pages[165].includes("knee flexion") && pages[165].includes("biceps femoris"))
    } else {
      assert.equal(binding.sourceRef, "openstax-anatomy-physiology")
      const expected = evidence.sourceLocator ?? evidence.url.replace("https://raw.githubusercontent.com/openstax/osbooks-anatomy-physiology/" + review.publisherRevision + "/", "https://github.com/openstax/osbooks-anatomy-physiology/blob/" + review.publisherRevision + "/")
      assert.equal(binding.sourceLocator, expected)
    }
    const action = seed.muscleActions.find(row => row.id === binding.id)
    assert.ok(action && action.muscle === binding.muscle && action.sourceRef === binding.sourceRef)
    assert.equal(sha(action.description), binding.descriptionSha256)
    const exact = seed.citations.find(row => row.id === binding.citationId)
    assert.ok(exact && exact.entityType === "muscle" && exact.entitySlug === binding.muscle && exact.factType === "action" && exact.factSlug === binding.id && exact.sourceRef === binding.sourceRef && exact.sourceLocator === binding.sourceLocator && exact.reviewStatus === "reviewed")
    assert.equal(exact.citationNote, binding.reviewNote)
    if (binding.primaryEvidenceKind === "publisher_table_image") assert.equal(isReviewedActionFigureCitation(exact), true)
    for (let index = 0; index < binding.sourcePointerIds.length; index++) {
      const pointer = seed.citations.find(row => row.id === binding.sourcePointerIds[index])
      assert.ok(pointer && pointer.entityType === "muscle_action" && pointer.entitySlug === binding.id && pointer.factType === "seed_source_reference" && pointer.factSlug === binding.sourcePointerFactSlugs[index] && pointer.sourceRef === binding.sourceRef && pointer.sourceLocator === binding.sourceLocator)
      if (binding.primaryEvidenceKind === "publisher_table_image") assert.equal(isReviewedActionFigureCitation(pointer), true)
    }
    const relation = seed.relationships.find(row => row.id === binding.relationshipId)
    assert.ok(relation && relation.sourceEntityType === "muscle_action" && relation.sourceEntitySlug === binding.id && relation.targetEntitySlug === "muscular-system" && relation.sourceRef === binding.sourceRef)
    for (const id of binding.legacyGroupCitationIds) assert.equal(seed.citations.find(row => row.id === id).reviewStatus, "needs_review")
  }
  for (const pending of manifest.remainingUnapproved) {
    const action = seed.muscleActions.find(row => row.id === pending.actionId)
    assert.ok(action && action.sourceRef === pending.currentSourceRef)
    assert.equal(sha(action.description), pending.descriptionSha256)
    assert.equal(seed.citations.some(row => row.factType === "action" && row.factSlug === action.id && row.reviewStatus === "reviewed"), false)
  }
  const sourceMap = new Map(seed.sources.map(source => [source.slug, source]))
  const unbound = seed.muscleActions.filter(action => ["open_reuse", "commercial_licensed"].includes(sourceMap.get(action.sourceRef)?.usageScope) && !seed.citations.some(row => row.entityType === "muscle" && row.entitySlug === action.muscle && row.factType === "action" && row.factSlug === action.id && row.sourceRef === action.sourceRef && row.reviewStatus === "reviewed"))
  assert.equal(unbound.length, 40)
  return {state:"EXACT_47_ACTIONS_AND_RETAINED_EVIDENCE_VERIFIED", reviewedActions:47, selectedMuscles:32, primaryFigureFacts:20, primaryBookFacts:3, publisherArtifacts:18, derivedPageTextArtifacts:1, exactEvidenceRefs:Object.keys(review.resolvedEvidence).length, remainingUnboundReusableActions:unbound.length, remainingAffectedMuscles:new Set(unbound.map(action => action.muscle)).size, clinicalAcceptanceComplete:false, wholeMigrationComplete:false, automatedSemanticTruthClaim:false, networkRequests:0}
}

/** Read only named public evidence under the three fixed retained roots; no fallback. */
export async function runActionBacklogAudit(args) {
  assert.equal(args.length, 2)
  assert.equal(args[0], "--artifact-root")
  const root = fs.realpathSync(args[1])
  const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
  const manifest = JSON.parse(fs.readFileSync(path.join(repo, "docs/source-evidence/muscle-action-backlog-integration-20261025.json")))
  const review = JSON.parse(fs.readFileSync(path.join(repo, "docs/source-evidence/muscle-action-backlog-review-20261025.json")))
  const directories = new Map(["public-evidence", "publisher-reference-tables", "../anatomy-muscle-action-citations-v1/public-evidence", "."].map(relative => [relative, fs.realpathSync(path.resolve(root, relative))]))
  const { ANATOMY_FOUNDATION_SEED } = await import(pathToFileURL(path.join(repo, "lib/anatomy-foundation.ts")))
  return auditActionBacklogEvidence(manifest, review, ANATOMY_FOUNDATION_SEED, artifact => {
    assert.ok(directories.has(artifact.retainedRoot))
    if (artifact.retainedRoot === ".") assert.equal(artifact.file, "selected-pdf-pages.json")
    const directory = directories.get(artifact.retainedRoot)
    const file = path.join(directory, artifact.file)
    assert.ok(file.startsWith(directory + path.sep))
    const info = fs.lstatSync(file)
    assert.ok(info.isFile() && !info.isSymbolicLink() && fs.realpathSync(file).startsWith(directory + path.sep))
    return fs.readFileSync(file)
  })
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  console.log(JSON.stringify(await runActionBacklogAudit(process.argv.slice(2))))
}
