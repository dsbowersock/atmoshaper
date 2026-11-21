// @ts-check
import { FEELING_FAMILIES } from "./wellness-reflection.js"

/** @typedef {{key:string,word:string,path:string[],color:string,level:1|2|3,start:number,end:number,inner:number,outer:number,parent?:string,children:string[]}} FeelingSegment */

/** Keep every parent and child in one angular hierarchy. Leaf counts determine
 * sector width so sibling words have equal space rather than overlapping labels.
 * Keys are presentation-only; recording still stores the existing plain words.
 * @returns {FeelingSegment[]} */
export function buildFeelingWheelSegments() {
  const total = FEELING_FAMILIES.reduce((sum, family) => sum + Object.values(family.groups).flat().length, 0)
  const unit = Math.PI * 2 / total
  let cursor = -Object.values(FEELING_FAMILIES[0].groups).flat().length * unit / 2
  /** @type {FeelingSegment[]} */
  const segments = []
  FEELING_FAMILIES.forEach((family, familyIndex) => {
    const familyKey = `family-${familyIndex}`, familyEnd = cursor + Object.values(family.groups).flat().length * unit
    const parent = { key: familyKey, word: family.word, path: [family.word], color: family.color, level: /** @type {1} */ (1), start: cursor, end: familyEnd, inner: 32, outer: 114, children: /** @type {string[]} */ ([]) }
    segments.push(parent)
    Object.entries(family.groups).forEach(([word, leaves], groupIndex) => {
      const key = `${familyKey}-group-${groupIndex}`, end = cursor + leaves.length * unit
      const group = { key, word, path: [family.word, word], color: family.color, level: /** @type {2} */ (2), start: cursor, end, inner: 114, outer: 208, parent: familyKey, children: /** @type {string[]} */ ([]) }
      parent.children.push(key); segments.push(group)
      leaves.forEach((leaf, index) => {
        const leafKey = `${key}-word-${index}`
        group.children.push(leafKey)
        segments.push({ key: leafKey, word: leaf, path: [...group.path, leaf], color: family.color, level: 3, start: cursor + index * unit, end: cursor + (index + 1) * unit, inner: 208, outer: 332, parent: key, children: [] })
      })
      cursor = end
    })
  })
  return segments
}

/** SVG annular sector; text is separate so input hits the same word-shaped
 * path. @param {FeelingSegment} segment */
export function feelingSectorPath(segment) {
  const point = (/** @type {number} */ angle, /** @type {number} */ radius) => `${Math.cos(angle) * radius},${Math.sin(angle) * radius}`
  const { start, end, inner, outer } = segment, large = end - start > Math.PI ? 1 : 0
  return `M${point(start, outer)}A${outer},${outer} 0 ${large} 1 ${point(end, outer)}L${point(end, inner)}A${inner},${inner} 0 ${large} 0 ${point(start, inner)}Z`
}

/** Shortest signed angular change, including the -pi/pi seam.
 * @param {number} before @param {number} after */
export function feelingAngleDelta(before, after) { return Math.atan2(Math.sin(after - before), Math.cos(after - before)) }

/** Fit the overview in both dimensions; reading view places the center near
 * the left edge so all three rings remain readable together on a phone.
 * Pinch offsets are local view state, never recorded in an entry.
 * @param {number} aspect @param {number} zoom @param {{x:number,y:number}} [pan] */
export function feelingWheelFrame(aspect, zoom, pan = { x: 0, y: 0 }) {
  const safeAspect = Math.max(0.3, Math.min(3, aspect)), scale = Math.max(1, Math.min(3.5, zoom))
  const width = 700 * Math.max(1, 1 / safeAspect) / scale, height = width * safeAspect
  const reading = Math.min(1, (scale - 1) / 0.6)
  return { x: -width / 2 + reading * width * 0.455 + pan.x, y: -height / 2 + pan.y, width, height }
}
