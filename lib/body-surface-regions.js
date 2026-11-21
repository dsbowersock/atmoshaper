// @ts-check

/** Surface locations are illustrative, not tissue segmentation. Existing broad
 * labels keep their meaning; only an explicit new choice supplies a surface.
 * @typedef {[number,number,number]} Vec3
 * @typedef {{id:string,label:string,group:string,bone:string,toward?:string,fraction?:number,offset:Vec3,half:Vec3,generalId:string}} BodyPart
 * @typedef {{id:string,label:string,partId:string,bone:string,toward?:string,fraction?:number,offset:Vec3,normal:Vec3,radius:number,parentId?:string,detail:boolean,focusOnly?:boolean}} SurfaceLocation */

/** @type {BodyPart[]} */
export const BODY_PARTS = []
/** @type {SurfaceLocation[]} */
export const BODY_SURFACES = []
export const SURFACE_VIEW_DIRECTIONS = Object.freeze({
  front: [0, 0, 1], back: [0, 0, -1], left: [1, 0, 0], right: [-1, 0, 0],
  "front-left": [0.707, 0, 0.707], "front-right": [-0.707, 0, 0.707],
  "back-left": [0.707, 0, -0.707], "back-right": [-0.707, 0, -0.707],
  top: [0, 1, 0.025], bottom: [0, -1, 0.025],
})
export const SURFACE_VIEW_LABELS = Object.freeze({ front: "Front", back: "Back", left: "Left side", right: "Right side", "front-left": "Front-left diagonal", "front-right": "Front-right diagonal", "back-left": "Back-left diagonal", "back-right": "Back-right diagonal", top: "Top down", bottom: "Bottom up" })

/** @param {BodyPart} part @param {string} label @param {Vec3} normal
 * @param {number} radius @param {{offset?:Vec3,details?:[string,Vec3,string?][],bone?:string,focusOnly?:boolean}} [options] */
function surface(part, label, normal, radius, options = {}) {
  const offset = options.offset ?? part.offset
  const common = { partId: part.id, bone: options.bone ?? part.bone, toward: options.bone ? undefined : part.toward, fraction: options.bone ? undefined : part.fraction, normal, radius, focusOnly: options.focusOnly }
  const id = label.toLowerCase()
  BODY_SURFACES.push({ ...common, id, label, offset, detail: false })
  for (const [suffix, delta, detailBone] of options.details ?? [["upper area", [0, 0.035, 0]], ["middle area", [0, 0, 0]], ["lower area", [0, -0.035, 0]]]) {
    BODY_SURFACES.push({ ...common, ...(detailBone ? { bone: detailBone, toward: undefined, fraction: undefined } : {}), id: `${id}, ${suffix}`, label: `${label}, ${suffix}`, parentId: id, offset: /** @type {Vec3} */ (offset.map((value, index) => value + delta[index])), detail: true })
  }
}

for (const side of ["Left", "Right"]) {
  const sign = side === "Left" ? 1 : -1, suffix = side === "Left" ? "_l" : "_r"
  /** @param {string} name @param {string} group @param {string} bone @param {Vec3} half
   * @param {{toward?:string,fraction?:number,offset?:Vec3,generalId?:string}} [options] */
  const part = (name, group, bone, half, options = {}) => {
    const label = `${side} ${name}`
    const value = { id: label.toLowerCase(), label, group, bone, half, offset: options.offset ?? [0, 0, 0], generalId: options.generalId ?? label.toLowerCase(), ...options }
    BODY_PARTS.push(/** @type {BodyPart} */ (value)); return /** @type {BodyPart} */ (value)
  }
  /** @param {BodyPart} bodyPart @param {number} radius @param {string[]} [detailNames] */
  const fourSides = (bodyPart, radius, detailNames = ["upper area", "middle area", "lower area"]) => {
    const details = /** @type {[string,Vec3][]} */ (detailNames.map((label, index) => [label, [0, (1 - index) * Math.min(0.075, bodyPart.half[1] * 0.45), 0]]))
    surface(bodyPart, `${side} front ${bodyPart.label.slice(side.length + 1)}`, [0, 0, 1], radius, { details })
    surface(bodyPart, `${side} back ${bodyPart.label.slice(side.length + 1)}`, [0, 0, -1], radius, { details })
    surface(bodyPart, `${side} inner ${bodyPart.label.slice(side.length + 1)}`, /** @type {Vec3} */ ([-sign, 0, 0]), radius, { details })
    surface(bodyPart, `${side} outer ${bodyPart.label.slice(side.length + 1)}`, /** @type {Vec3} */ ([sign, 0, 0]), radius, { details })
  }
  const torso = part("upper torso", "Torso", "spine_03", [0.12, 0.15, 0.15], { offset: [sign * 0.07, 0.14, 0] })
  surface(torso, `${side} chest`, [0, 0, 1], 0.12)
  surface(torso, `${side} upper back`, [0, 0, -1], 0.09)
  surface(torso, `${side} side of ribs`, /** @type {Vec3} */ ([sign, 0, 0]), 0.08)
  const waist = part("lower torso", "Torso", "spine_01", [0.12, 0.13, 0.15], { offset: [sign * 0.055, 0.04, 0] })
  surface(waist, `${side} abdomen`, [0, 0, 1], 0.12)
  surface(waist, `${side} low back`, [0, 0, -1], 0.09)
  surface(waist, `${side} waist`, /** @type {Vec3} */ ([sign, 0, 0]), 0.085)
  const hip = part("hip", "Torso", `thigh${suffix}`, [0.12, 0.13, 0.13], { offset: [0, -0.025, 0] })
  fourSides(hip, 0.085)
  const shoulder = part("shoulder", "Torso", `upperarm${suffix}`, [0.13, 0.11, 0.12])
  fourSides(shoulder, 0.065)
  surface(shoulder, `${side} top of shoulder`, [0, 1, 0], 0.045, { details: [["toward neck", [-sign * 0.035, 0, 0]], ["middle area", [0, 0, 0]], ["toward arm", [sign * 0.035, 0, 0]]] })
  fourSides(part("upper arm", "Arms and hands", `upperarm${suffix}`, [0.10, 0.16, 0.10], { toward: `lowerarm${suffix}`, fraction: 0.5 }), 0.045, ["near shoulder", "middle area", "near elbow"])
  fourSides(part("elbow", "Arms and hands", `lowerarm${suffix}`, [0.085, 0.09, 0.085]), 0.04)
  fourSides(part("forearm", "Arms and hands", `lowerarm${suffix}`, [0.095, 0.16, 0.09], { toward: `hand${suffix}`, fraction: 0.5 }), 0.04, ["near elbow", "middle area", "near wrist"])
  fourSides(part("wrist", "Arms and hands", `hand${suffix}`, [0.075, 0.08, 0.075]), 0.028)
  const hand = part("hand", "Arms and hands", `hand${suffix}`, [0.09, 0.13, 0.065], { toward: `middle_01${suffix}`, fraction: 0.7 })
  const handDetails = /** @type {[string,Vec3][]} */ ([["near wrist", [0, 0.04, 0]], ["middle area", [0, 0, 0]], ["near fingers", [0, -0.04, 0]]])
  surface(hand, `${side} palm`, [0, 0, 1], 0.025, { details: handDetails })
  surface(hand, `${side} back of hand`, [0, 0, -1], 0.025, { details: handDetails })
  surface(hand, `${side} thumb side of hand`, /** @type {Vec3} */ ([sign, 0, 0]), 0.04, { details: handDetails })
  surface(hand, `${side} little-finger side of hand`, /** @type {Vec3} */ ([-sign, 0, 0]), 0.04, { details: handDetails })
  for (const [finger, bone] of [["thumb", "thumb_02"], ["index finger", "index_02"], ["middle finger", "middle_02"], ["ring finger", "ring_02"], ["little finger", "pinky_02"]]) {
    // Digits follow their actual phalange bones; the thumb does not share a
    // vertical axis with the fingers in this neutral hand pose.
    for (const [face, normal] of /** @type {[string,Vec3][]} */ ([["front", [0, 0, 1]], ["back", [0, 0, -1]]])) surface(hand, `${side} ${face} ${finger}`, normal, 0.012, { bone: `${bone}${suffix}`, offset: [0, 0, 0], focusOnly: true, details: [["base", [0, 0, 0], `${bone.replace("02", "01")}${suffix}`], ["middle", [0, 0, 0], `${bone}${suffix}`], ["tip", [0, 0, 0], `${bone.replace("02", "03")}${suffix}`]] })
  }
  fourSides(part("thigh", "Legs and feet", `thigh${suffix}`, [0.12, 0.25, 0.12], { toward: `calf${suffix}`, fraction: 0.5 }), 0.075, ["near hip", "middle area", "near knee"])
  fourSides(part("knee", "Legs and feet", `calf${suffix}`, [0.09, 0.11, 0.095]), 0.06)
  const leg = part("lower leg", "Legs and feet", `calf${suffix}`, [0.09, 0.24, 0.09], { toward: `foot${suffix}`, fraction: 0.5 })
  const legDetails = /** @type {[string,Vec3][]} */ ([["near knee", [0, 0.075, 0]], ["middle area", [0, 0, 0]], ["near ankle", [0, -0.075, 0]]])
  surface(leg, `${side} shin`, [0, 0, 1], 0.06, { details: legDetails })
  surface(leg, `${side} calf`, [0, 0, -1], 0.06, { details: legDetails })
  surface(leg, `${side} inner lower leg`, /** @type {Vec3} */ ([-sign, 0, 0]), 0.06, { details: legDetails })
  surface(leg, `${side} outer lower leg`, /** @type {Vec3} */ ([sign, 0, 0]), 0.06, { details: legDetails })
  fourSides(part("ankle", "Legs and feet", `foot${suffix}`, [0.07, 0.08, 0.085]), 0.035)
  const foot = part("foot", "Legs and feet", `foot${suffix}`, [0.085, 0.075, 0.17], { toward: `ball${suffix}`, fraction: 0.45 })
  const footDetails = /** @type {[string,Vec3][]} */ ([["heel", [0, 0, -0.055]], ["middle / arch", [0, 0, 0.01]], ["ball", [0, 0, 0.07]]])
  surface(foot, `${side} top of foot`, [0, 1, 0], 0.035, { details: footDetails })
  surface(foot, `${side} sole of foot`, [0, -1, 0], 0.035, { details: footDetails })
  surface(foot, `${side} inner foot / arch`, /** @type {Vec3} */ ([-sign, 0, 0]), 0.05, { details: footDetails })
  surface(foot, `${side} outer foot`, /** @type {Vec3} */ ([sign, 0, 0]), 0.05, { details: footDetails })
  surface(foot, `${side} toes`, [0, 1, 0], 0.025, { offset: [0, -0.015, 0.10], details: [["big-toe side", [-sign * 0.02, 0, 0]], ["middle toes", [0, 0, 0]], ["little-toe side", [sign * 0.02, 0, 0]]] })
}
for (const name of ["Head", "Neck"]) {
  const part = /** @type {BodyPart} */ ({ id: name.toLowerCase(), label: name, group: "Head and neck", bone: name === "Head" ? "head" : "neck_01", offset: name === "Head" ? [0, 0.055, 0] : [0, 0, 0], half: name === "Head" ? [0.13, 0.14, 0.13] : [0.095, 0.085, 0.09], generalId: name.toLowerCase() })
  BODY_PARTS.push(part)
  surface(part, name === "Head" ? "Face" : "Front of neck", [0, 0, 1], name === "Head" ? 0.085 : 0.05)
  surface(part, `Back of ${name.toLowerCase()}`, [0, 0, -1], name === "Head" ? 0.085 : 0.05)
  surface(part, `Left side of ${name.toLowerCase()}`, [1, 0, 0], name === "Head" ? 0.075 : 0.04)
  surface(part, `Right side of ${name.toLowerCase()}`, [-1, 0, 0], name === "Head" ? 0.075 : 0.04)
  if (name === "Head") {
    surface(part, "Top of head", [0, 1, 0], 0.06, { details: [["front area", [0, 0, 0.035]], ["crown", [0, 0, 0]], ["back area", [0, 0, -0.035]]] })
    surface(part, "Under chin", [0, -1, 0], 0.06, { offset: [0, -0.025, 0.045] })
  }
}

export const BODY_LOCATION_IDS = new Set([...BODY_PARTS.map((part) => part.generalId), ...BODY_SURFACES.map((location) => location.id)])

/** Anatomical surface normals, not camera names, determine visibility. A
 * focused part may expose its inner side while the other side stays clipped.
 * @param {SurfaceLocation} location @param {{x:number,y:number,z:number}} direction */
export function bodySurfaceFacesCamera(location, direction) {
  return location.normal[0] * direction.x + location.normal[1] * direction.y + location.normal[2] * direction.z > 0.18
}

/** Refinement replaces only a selected broad parent in this draft. Unrelated
 * surfaces, opposite sides and unrecognized historical labels are retained.
 * @param {string[]} selected @param {string} id @param {number} [limit] */
export function toggleBodySurface(selected, id, limit = 16) {
  if (selected.includes(id)) return selected.filter((value) => value !== id)
  if (!BODY_LOCATION_IDS.has(id)) return selected
  const location = BODY_SURFACES.find((item) => item.id === id)
  const part = BODY_PARTS.find((item) => item.id === location?.partId || item.generalId === id)
  const next = selected.filter((value) => value !== part?.generalId && value !== location?.parentId && !(id === part?.generalId && BODY_SURFACES.some((item) => item.id === value && item.partId === part.id)) && !(location && !location.detail && BODY_SURFACES.some((item) => item.id === value && item.parentId === location.id)))
  return next.length < limit ? [...next, id] : selected
}

/** @param {number[]} normal */
export function bodyViewForNormal(normal) {
  if (normal[1] > 0.5) return "top"
  if (normal[1] < -0.5) return "bottom"
  if (normal[0] > 0.5) return "left"
  if (normal[0] < -0.5) return "right"
  return normal[2] < 0 ? "back" : "front"
}
