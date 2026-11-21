// @ts-check

/** Fit camera-aligned swept bounds inside a perspective view. Depth is included
 * so near-side fingers/feet fit as well as the center plane. Inputs are authored
 * mesh positions, never recorded angles or a person's measurements.
 * @param {{min:number[], max:number[]}} bounds @param {number} verticalFovDegrees
 * @param {number} aspect */
export function fitBodyViewBounds(bounds, verticalFovDegrees, aspect) {
  if (![...bounds.min, ...bounds.max, verticalFovDegrees, aspect].every(Number.isFinite) || bounds.min.length !== 3 || bounds.max.length !== 3 || aspect <= 0 || verticalFovDegrees <= 0 || verticalFovDegrees >= 180 || bounds.min.some((value, index) => value > bounds.max[index])) return null
  const center = bounds.min.map((value, index) => (value + bounds.max[index]) / 2)
  const half = bounds.min.map((value, index) => (bounds.max[index] - value) / 2)
  const vertical = Math.tan(verticalFovDegrees * Math.PI / 360)
  const distance = (Math.max(half[0] / (vertical * aspect), half[1] / vertical) + half[2]) * 1.2 + 0.03
  return { center, distance }
}
