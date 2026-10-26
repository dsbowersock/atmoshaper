import assert from "node:assert/strict"
import { createHash } from "node:crypto"
import test from "node:test"
import { anatomySourceClaimDigest, verifyAnatomySourceEvidence } from "../scripts/verify-anatomy-source-provenance.mjs"

/** Invented files exercise rejection logic; the separate CLI validates actual publisher bytes. */
function fixture() {
  const revision = "a".repeat(40)
  const prefix = `https://raw.githubusercontent.com/openstax/osbooks-anatomy-physiology/${revision}/`
  const content = new Map([
    ["historical-license.txt", Buffer.from("Attribution 4.0 International\nInvented license fixture")],
    ["historical-readme.md", Buffer.from("Anatomy and Physiology 2e; Creative Commons Attribution License")],
    ["historical-collection.xml", Buffer.from('<md:title>Anatomy and Physiology 2e</md:title><md:uuid>4fd99458-6fdf-49bc-8688-a6dc17a1268d</md:uuid><md:license url="http://creativecommons.org/licenses/by/4.0/"/><module document="m46844"/>')],
    ["publisher-text/m46844.cnxml", Buffer.from("Invented preface fixture")],
  ])
  const artifact = (file, suffix) => ({ file, publicUrl: prefix + suffix, bytes: content.get(file).length, sha256: createHash("sha256").update(content.get(file)).digest("hex") })
  const cards = [{ category: "anatomy_concept", entitySlug: "invented-tissue", name: "Invented tissue", summary: "Invented claim for test isolation." }]
  const manifest = {
    schemaVersion: 1, sourceRef: "openstax-anatomy-physiology", title: "Anatomy and Physiology 2e", edition: "2e", collectionId: "4fd99458-6fdf-49bc-8688-a6dc17a1268d", publisherRevision: revision,
    license: "CC BY 4.0", licenseUrl: "https://creativecommons.org/licenses/by/4.0/", status: "edition_pinned_claim_review_pending", runtimeSourceRetargeted: false, claimReviewComplete: false, commercialClearance: false,
    artifacts: [artifact("historical-license.txt", "LICENSE"), artifact("historical-readme.md", "README.md"), artifact("historical-collection.xml", "collections/anatomy-and-physiology-2e.collection.xml")],
    modules: [{ module: "m46844", ...artifact("publisher-text/m46844.cnxml", "modules/m46844/index.cnxml") }],
    claimBindings: [{ selector: "anatomy_concept:invented-tissue", candidateModules: ["m46844"], reviewStatus: "needs_review" }], claimInputSha256: anatomySourceClaimDigest(cards),
  }
  return { manifest, cards, content, read: (name) => content.get(name) }
}

test("integrity proof preserves pending scientific and commercial gates", () => {
  const f = fixture(), r = verifyAnatomySourceEvidence(f.manifest, f.cards, f.read)
  assert.equal(r.artifactsMatched, 4)
  assert.equal(r.claimReviewComplete, false)
  assert.equal(r.commercialClearance, false)
})

test("a changed publisher byte fails even when the file still exists", () => {
  const f = fixture(); f.content.set("publisher-text/m46844.cnxml", Buffer.from("Invented PREFACE fixture"))
  assert.throws(() => verifyAnatomySourceEvidence(f.manifest, f.cards, f.read), /digest mismatch/)
})

test("a moving or different-revision URL cannot stand in for the pinned source", () => {
  const f = fixture(); f.manifest.modules[0].publicUrl = f.manifest.modules[0].publicUrl.replace(f.manifest.publisherRevision, "main")
  assert.throws(() => verifyAnatomySourceEvidence(f.manifest, f.cards, f.read), /Cross-revision/)
})

test("missing or newly changed authored claims require a new review", () => {
  const f = fixture(); f.cards[0].summary = "Changed authored claim."
  assert.throws(() => verifyAnatomySourceEvidence(f.manifest, f.cards, f.read), /claim text changed/)
  f.cards.push({ ...f.cards[0], entitySlug: "another-claim" })
  assert.throws(() => verifyAnatomySourceEvidence(f.manifest, f.cards, f.read), /coverage changed/)
})

test("duplicate bindings and unretained chapter selectors fail coverage", () => {
  const f = fixture(); f.manifest.claimBindings.push({ ...f.manifest.claimBindings[0] })
  assert.throws(() => verifyAnatomySourceEvidence(f.manifest, f.cards, f.read), /Duplicate claim binding/)
  f.manifest.claimBindings.pop(); f.manifest.claimBindings[0].candidateModules = ["m99999"]
  assert.throws(() => verifyAnatomySourceEvidence(f.manifest, f.cards, f.read), /unretained module/)
})

test("traversal and an automatic review upgrade are rejected", () => {
  const f = fixture(); f.manifest.modules[0].file = "../historical-license.txt"
  assert.throws(() => verifyAnatomySourceEvidence(f.manifest, f.cards, f.read), /traversal denied/)
  f.manifest.modules[0].file = "publisher-text/m46844.cnxml"; f.manifest.claimBindings[0].reviewStatus = "reviewed"
  assert.throws(() => verifyAnatomySourceEvidence(f.manifest, f.cards, f.read), /not scientific approval/)
})