/** Audit/test-only historical comparison; this module never changes a seed, citation or runtime eligibility. */
import assert from "node:assert/strict"
import fs from "node:fs"
import { createHash } from "node:crypto"

const sha = text => createHash("sha256").update(text).digest("hex")
const revision = JSON.parse(fs.readFileSync(new URL("../docs/source-evidence/foot-lumbrical-directional-correction-20261028.json", import.meta.url)))
const exact = {
  actionId:"action-lumbricals-foot-toe-extension",
  historicalDescription:"Assists extension control of the toe phalanges through the plantar extensor expansion relationship.",
  historicalDescriptionSha256:"55df483441bd5a08e87e6d6b6841456f7b99ecbf90089b1a5e19ff11a2693bf6",
  currentDescription:"Assists extension control of the toe phalanges through the dorsal extensor expansion relationship.",
  currentDescriptionSha256:"9739a87862f05b5ba1ca6e91ec943b35f83af5b842184e1d65570d74eb986c0b",
}

/**
 * Resolve one fixed held-description successor for comparison with immutable dated evidence.
 * Every historical row must retain its own text/hash. The pinned complete metadata
 * rejects arbitrary IDs, texts, hashes, scope or bibliography even if internally consistent.
 * Other historical rows keep their exact descriptions; no runtime caller uses this resolver.
 */
export function resolveHeldActionDescription(historical, metadata = revision) {
  assert.ok(metadata && typeof metadata === "object" && !Array.isArray(metadata), "Held description revision metadata changed")
  assert.equal(sha(JSON.stringify(metadata)), "f1d0f90545dab340e32fc9eed32e59b74193fa642a9e0d82be3cb4452b6bca16", "Held description revision metadata changed")
  for (const [key, value] of Object.entries(exact)) assert.equal(metadata[key], value, "Held description revision identity changed")
  assert.equal(sha(metadata.historicalDescription), metadata.historicalDescriptionSha256)
  assert.equal(sha(metadata.currentDescription), metadata.currentDescriptionSha256)
  assert.equal(typeof historical?.actionId, "string", "Historical held identity changed")
  assert.equal(typeof historical.description, "string", "Historical held description changed")
  assert.equal(sha(historical.description), historical.descriptionSha256, "Historical held description changed")
  if (historical.actionId !== exact.actionId) return historical.description
  assert.equal(historical.description, exact.historicalDescription, "Historical held description changed")
  assert.equal(historical.descriptionSha256, exact.historicalDescriptionSha256, "Historical held description changed")
  return exact.currentDescription
}
