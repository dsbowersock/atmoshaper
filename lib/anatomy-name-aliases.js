/** Broader lookup labels are retained in seed search, but are not equivalent names. */
const broaderSearchLabels = new Map([
  ["anatomy_structure:blood", new Set(["fluid connective tissue"])],
  ["anatomy_concept:blood", new Set(["fluid connective tissue"])],
  ["anatomy_structure:colon", new Set(["large bowel"])],
])

/**
 * Decide whether a retained search term can label this entity as an equivalent name.
 * The reviewed exclusions are entity-specific: blood is one fluid connective
 * tissue, and colon is part of the large bowel. Keep raw terms/IDs for lookup
 * compatibility while excluding these broader labels from public aliases and
 * every prompt that derives accepted name answers from those aliases.
 *
 * @param {string} entityType The existing foundation entity category.
 * @param {string} entitySlug The stable entity selector, not its display label.
 * @param {string} alias A candidate term, normalized only for this comparison.
 * @returns {boolean} False only for a reviewed broader label on its exact entity.
 */
export function isEquivalentAnatomyNameAlias(entityType, entitySlug, alias) {
  const normalized = alias.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim()
  return !broaderSearchLabels.get(`${entityType}:${entitySlug}`)?.has(normalized)
}
