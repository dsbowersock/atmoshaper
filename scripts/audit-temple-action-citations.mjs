/** Verify retained publisher bytes and six exact bindings without fetching replacements. */
import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"
import { createHash } from "node:crypto"
import { fileURLToPath, pathToFileURL } from "node:url"
import { REVIEWED_TEMPLE_ACTION_BINDINGS, TEMPLE_HANDS_ON_ANATOMY_SOURCE_METADATA, withReviewedTempleActionEvidence } from "../lib/anatomy-temple-action-provenance.js"

const sha = value => createHash("sha256").update(value).digest("hex")
const captureNames = ["catalog", "copyright", "spine-thorax-abdomen", "head-neck", "hip-thigh", "knee-lower-leg"]
const fixedLegacyLabelCorrections = [
  {promptId:"muscle_action:muscle-posterior-scalene", answer:"Rib Elevation at Cervical Spine", answerSha256:"5131b6f58f25fce26646efd88972e9f9adf6fb5be73a94479a4df808ab9ea2d2"},
  {promptId:"muscle_action:muscle-scalenes", answer:"Rib Elevation at Cervical Spine", answerSha256:"5131b6f58f25fce26646efd88972e9f9adf6fb5be73a94479a4df808ab9ea2d2"},
  {promptId:"muscle_action:muscle-scalenes", answer:"Cervical Lateral Flexion at Cervical Spine; Rib Elevation at Cervical Spine", answerSha256:"80f6c32e33adabf59bdbfc42a9880a5c2569bf64edce415ed680a9ae6ec4a986"},
]

/**
 * Recheck the manual comparison's exact retained text and current public owners.
 * Digests prove evidence identity, not semantic truth or third-party image rights.
 * The original 47/40 review remains dated history; only these six successors change.
 * @param {object} manifest Dated six-description evidence record.
 * @param {import("../lib/anatomy-foundation.ts").AnatomyFoundationSeed} seed Composed public seed.
 * @param {(artifact:object)=>Buffer} readArtifact Confined local public-evidence reader.
 */
export function auditTempleActionEvidence(manifest, seed, readArtifact) {
  assert.equal(manifest.schemaVersion, 1)
  assert.equal(manifest.state, "SIX_UNCHANGED_ACTION_DESCRIPTIONS_INDEPENDENTLY_SUPPORTED")
  assert.equal(manifest.baselineHead, "b5d061e788596f2a9cdaea831d8e39544b9572b3")
  for (const key of ["clinicalAcceptanceComplete", "wholeMigrationComplete", "automatedSemanticTruthClaim", "sourceTextOrMediaBundled", "componentLicenseInferred"]) assert.equal(manifest[key], false)
  assert.equal(manifest.sourceId, "source-temple-hands-on-anatomy-2024")
  assert.equal(manifest.sourceRef, "temple-hands-on-anatomy-2024")
  assert.deepEqual(manifest.sourceMetadata, TEMPLE_HANDS_ON_ANATOMY_SOURCE_METADATA)
  assert.deepEqual(manifest.bindings, REVIEWED_TEMPLE_ACTION_BINDINGS)
  assert.equal(manifest.bindings.length, 6)
  assert.equal(manifest.independentReviewSha256, "b9bbb9010fd5436fb82c93362fe48edb5e8c7b6e21ab27b7c12e489d2616be5f")
  assert.equal(manifest.historicalRemainingActions, 40)
  assert.equal(manifest.separatelySupportedSuccessors, 6)
  assert.equal(manifest.remainingHeldActions, 34)
  const legacy = manifest.baselineAnswerCorrectnessExceptions
  assert.deepEqual(legacy, {
    state:"EXACT_THREE_BASELINE_ANSWER_CORRECTNESS_EXCEPTIONS",
    baselineHead:"b5d061e788596f2a9cdaea831d8e39544b9572b3",
    baselineProjectionSha256:"898a23316a86edcc9161c73d4a164d98b553749d8b2a93428099b2c78cc244bc",
    evidence:{source:"Temple Hands-on Anatomy 2024, Chapter 5, Ribs, palpation paragraph", file:"spine-thorax-abdomen.body.txt", line:145, selectedTextSha256:"740c0a952c689b47dec4d3bf7698d4dc0db5213a2bb86f6cdc5fb755bd574fcb", wholeTextSha256:"ea3afe89f88849a736c867011dc6ebd2fa2efb6259b1167bf57a8916ffecf944", url:"https://temple.manifoldapp.org/read/hands-on-anatomy-c6538f97-bc62-44ae-96ff-0f1f97d6c977/section/8ff57319-f921-4deb-b896-585474a87763", license:"CC BY 4.0 unless otherwise noted", sourceProseOrFiguresImported:false},
    invalidPair:{movement:"rib-elevation", joint:"cervical-spine"},
    corrections:fixedLegacyLabelCorrections,
    previouslyAcceptedAnswersObserved:686,
    preservedCorrectAnswersRequired:683,
    incorrectOccurrencesRequiredRejected:3,
    anyOtherLossPermitted:false,
    sourceIdsOrTaxonomyChanged:false,
    published:false,
    rationale:"Rib elevation is not movement at a cervical-spine joint. The retained Temple Ribs paragraph identifies posterior articulation with thoracic vertebrae. Existing seed taxonomy stays; only the invalid labels and label composites containing that pair are rejected.",
  })
  // This validates source/action/pointer identities without changing caller input.
  withReviewedTempleActionEvidence(seed)
  assert.deepEqual(manifest.publisherArtifacts.map(row => row.file).sort(), captureNames.flatMap(name => [name+".html", name+".body.txt"]).sort())
  const files = new Map()
  for (const artifact of [...manifest.publisherArtifacts, manifest.breathingContextArtifact]) {
    assert.match(artifact.file, /^[a-zA-Z0-9._-]+$/)
    assert.ok(!files.has(artifact.file), "Duplicate evidence file")
    assert.equal(artifact.retainedRoot, artifact.file === "m46484.cnxml" ? "../anatomy-muscle-action-citations-v1/public-evidence" : ".")
    const bytes = readArtifact(artifact)
    assert.ok(Buffer.isBuffer(bytes))
    assert.equal(bytes.length, artifact.bytes, `Artifact size mismatch: ${artifact.file}`)
    assert.equal(sha(bytes), artifact.sha256, `Artifact digest mismatch: ${artifact.file}`)
    files.set(artifact.file, bytes.toString("utf8"))
  }
  const copyright = files.get("copyright.body.txt")
  assert.ok(copyright.includes("Copyright © 2024 by Jacqueline Phillips and Michael O’Hara"))
  assert.ok(copyright.includes("Creative Commons Attribution 4.0 International License unless otherwise noted"))
  assert.ok(copyright.includes("9781439921241 (ebook)"))
  assert.ok(files.get("catalog.body.txt").includes("10.34944/381c-cx44"))
  const ribs = files.get(legacy.evidence.file)
  assert.equal(sha(ribs), legacy.evidence.wholeTextSha256)
  assert.equal(sha(ribs.split(/\r?\n/)[legacy.evidence.line-1]), legacy.evidence.selectedTextSha256)
  for (const correction of legacy.corrections) assert.equal(sha(correction.answer), correction.answerSha256)
  const context = manifest.breathingContextArtifact
  assert.equal(context.file, "m46484.cnxml")
  assert.equal(context.elementId, "fs-id2080091")
  assert.equal(context.startLine, 284)
  const xml = files.get(context.file)
  const matches = [...xml.matchAll(/<para\b[^>]*\bid="fs-id2080091"[^>]*>[\s\S]*?<\/para>/g)]
  assert.equal(matches.length, 1)
  assert.equal(sha(matches[0][0]), context.elementXmlSha256)
  assert.equal(xml.slice(0, matches[0].index).split("\n").length, context.startLine)
  assert.ok(matches[0][0].includes("deep inhalation"))
  for (const binding of manifest.bindings) {
    const text = files.get(binding.evidenceFile)
    assert.equal(typeof text, "string")
    assert.equal(sha(text.split(/\r?\n/).slice(binding.startLine-1, binding.endLine).join("\n")), binding.selectedTextSha256)
    const artifact = manifest.publisherArtifacts.find(row => row.file === binding.evidenceFile)
    assert.equal(binding.sourceLocator, artifact.url)
    const action = seed.muscleActions.find(row => row.id === binding.id)
    assert.equal(action.sourceRef, binding.sourceRef)
    assert.equal(sha(action.description), binding.descriptionSha256)
    const exact = seed.citations.filter(row => row.id === binding.citationId)
    assert.equal(exact.length, 1)
    assert.ok(exact[0].entityType === "muscle" && exact[0].entitySlug === binding.muscle && exact[0].factType === "action" && exact[0].factSlug === binding.id && exact[0].sourceRef === binding.sourceRef && exact[0].sourceLocator === binding.sourceLocator && exact[0].reviewStatus === "reviewed")
    assert.equal(exact[0].citationNote, binding.reviewNote)
    if (binding.requiresBreathingContext) assert.ok(binding.reviewNote.includes(context.url))
    for (const id of binding.sourcePointerIds) {
      const pointer = seed.citations.find(row => row.id === id)
      assert.equal(pointer.sourceRef, binding.sourceRef)
      assert.equal(pointer.sourceLocator, binding.sourceLocator)
    }
    assert.equal(seed.relationships.find(row => row.id === binding.relationshipId).sourceRef, binding.sourceRef)
    for (const id of binding.legacyGroupCitationIds) assert.equal(seed.citations.find(row => row.id === id).reviewStatus, "needs_review")
  }
  return {state:"SIX_TEMPLE_ACTION_DESCRIPTIONS_AND_RETAINED_EVIDENCE_VERIFIED", reviewedDescriptions:6, publisherArtifacts:12, breathingContextArtifacts:1, historicalRemainingActions:40, separatelyReviewedSuccessorActions:6, remainingHeldActions:34, baselineCorrectnessExceptions:3, requiredRetainedBaselineAnswers:683, clinicalAcceptanceComplete:false, wholeMigrationComplete:false, automatedSemanticTruthClaim:false, networkRequests:0}
}

/** Read ordinary named files under the retained public roots; never retrieve missing evidence. */
export async function runTempleActionAudit(args) {
  assert.deepEqual(args.slice(0, 1), ["--artifact-root"])
  assert.equal(args.length, 2)
  const root = fs.realpathSync(args[1])
  const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
  const manifest = JSON.parse(fs.readFileSync(path.join(repo, "docs/source-evidence/temple-hands-on-anatomy-actions-20261028.json")))
  for (const [file, expected] of [[manifest.historicalBacklogManifest, manifest.historicalBacklogManifestSha256], ["muscle-action-backlog-review-20261025.json", manifest.historicalReviewSha256]]) {
    assert.ok(["muscle-action-backlog-integration-20261025.json", "muscle-action-backlog-review-20261025.json"].includes(file))
    assert.equal(sha(fs.readFileSync(path.join(repo, "docs/source-evidence", file))), expected, "Historical review changed")
  }
  const directories = new Map([".", "../anatomy-muscle-action-citations-v1/public-evidence"].map(relative => [relative, fs.realpathSync(path.resolve(root, relative))]))
  const { ANATOMY_FOUNDATION_SEED } = await import(pathToFileURL(path.join(repo, "lib/anatomy-foundation.ts")))
  return auditTempleActionEvidence(manifest, ANATOMY_FOUNDATION_SEED, artifact => {
    assert.ok(directories.has(artifact.retainedRoot))
    const directory = directories.get(artifact.retainedRoot)
    const file = path.join(directory, artifact.file)
    assert.ok(file.startsWith(directory + path.sep))
    const info = fs.lstatSync(file)
    assert.ok(info.isFile() && !info.isSymbolicLink() && fs.realpathSync(file).startsWith(directory + path.sep))
    return fs.readFileSync(file)
  })
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) console.log(JSON.stringify(await runTempleActionAudit(process.argv.slice(2))))
