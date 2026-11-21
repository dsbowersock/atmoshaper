// @ts-check
import { BODY_LOCATION_IDS } from "./body-surface-regions.js"

/** Original unsided values remain valid in existing records and the other
 * quick-log tools. Never infer laterality for an older unsided recording. */
export const BODY_REGION_OPTIONS = Object.freeze([
  "head", "neck", "shoulders", "chest", "abdomen", "upper back", "low back",
  "hips", "arms", "hands", "thighs", "knees", "calves", "ankles", "feet",
])

export const BODY_REGION_SELECTION_LIMIT = 16
export const BODY_REGION_GROUPS = ["Head and neck", "Torso", "Arms and hands", "Legs and feet"]

/** @typedef {{id:string,label:string,side:"Left"|"Right",group:string,bone:string,toward?:string,fraction?:number,offset:[number,number,number],radius?:number,facing:"front"|"back"|"both"}} BodyRegionAnchor */
/** @type {BodyRegionAnchor[]} Authored surface locations, not a tissue atlas.
 * The rig's +X is the person's left. Paired locations save distinct plain-text
 * values in the existing regions list; old broad values are never rewritten. */
export const BODY_REGION_ANCHORS = []
for (const side of /** @type {const} */ (["Left", "Right"])) {
  const sign = side === "Left" ? 1 : -1
  const suffix = side === "Left" ? "_l" : "_r"
  /** @param {string} name @param {string} group @param {string} bone
   * @param {[number,number,number]} offset @param {"front"|"back"|"both"} facing
   * @param {{toward?:string,fraction?:number,radius?:number}} [extra] */
  const add = (name, group, bone, offset, facing = "both", extra = {}) => {
    BODY_REGION_ANCHORS.push({ id: `${side.toLowerCase()} ${name}`, label: `${side} ${name}`, side, group, bone, offset, facing, ...extra })
  }
  add("side of head", "Head and neck", "head", [sign * 0.055, 0.065, 0], "both", { radius: 0.035 })
  add("face", "Head and neck", "head", [sign * 0.03, 0.015, 0.075], "front")
  add("side of neck", "Head and neck", "neck_01", [sign * 0.025, 0, 0], "both", { radius: 0.035 })
  add("shoulder", "Torso", `upperarm${suffix}`, [sign * 0.01, 0.025, 0], "both", { radius: 0.05 })
  add("chest", "Torso", "spine_03", [sign * 0.065, 0.15, 0.12], "front")
  add("side of ribs", "Torso", "spine_03", [sign * 0.13, 0.075, 0], "both", { radius: 0.025 })
  add("abdomen", "Torso", "spine_01", [sign * 0.05, 0.055, 0.12], "front")
  add("upper back", "Torso", "spine_03", [sign * 0.065, 0.15, -0.085], "back")
  add("low back", "Torso", "spine_01", [sign * 0.05, 0.045, -0.085], "back")
  add("hip", "Torso", `thigh${suffix}`, [sign * 0.02, 0, 0], "both", { radius: 0.065 })
  add("buttock", "Torso", `thigh${suffix}`, [sign * 0.015, -0.05, -0.085], "back")
  add("upper arm", "Arms and hands", `upperarm${suffix}`, [0, 0, 0], "both", { toward: `lowerarm${suffix}`, fraction: 0.5, radius: 0.045 })
  add("elbow", "Arms and hands", `lowerarm${suffix}`, [0, 0, 0], "both", { radius: 0.035 })
  add("forearm", "Arms and hands", `lowerarm${suffix}`, [0, 0, 0], "both", { toward: `hand${suffix}`, fraction: 0.5, radius: 0.035 })
  add("wrist", "Arms and hands", `hand${suffix}`, [0, 0, 0], "both", { radius: 0.025 })
  add("palm", "Arms and hands", `hand${suffix}`, [0, -0.015, 0.025], "front", { toward: `middle_01${suffix}`, fraction: 0.8 })
  add("back of hand", "Arms and hands", `hand${suffix}`, [0, -0.015, -0.025], "back", { toward: `middle_01${suffix}`, fraction: 0.8 })
  add("fingers", "Arms and hands", `middle_01${suffix}`, [0, -0.01, 0], "both", { toward: `middle_03${suffix}`, fraction: 0.6, radius: 0.02 })
  add("thigh", "Legs and feet", `thigh${suffix}`, [0, 0, 0], "both", { toward: `calf${suffix}`, fraction: 0.5, radius: 0.07 })
  add("knee", "Legs and feet", `calf${suffix}`, [0, 0, 0], "both", { radius: 0.055 })
  add("shin", "Legs and feet", `calf${suffix}`, [0, 0, 0.055], "front", { toward: `foot${suffix}`, fraction: 0.5 })
  add("calf", "Legs and feet", `calf${suffix}`, [0, 0, -0.055], "back", { toward: `foot${suffix}`, fraction: 0.5 })
  add("ankle", "Legs and feet", `foot${suffix}`, [0, 0, 0], "both", { radius: 0.03 })
  add("heel", "Legs and feet", `foot${suffix}`, [0, -0.015, -0.055], "back")
  add("top of foot", "Legs and feet", `foot${suffix}`, [0, 0.025, 0.025], "front", { toward: `ball${suffix}`, fraction: 0.6 })
  add("toes", "Legs and feet", `ball${suffix}`, [0, 0, 0.045], "both", { radius: 0.015 })
}

const regionIds = new Set([...BODY_REGION_OPTIONS, ...BODY_REGION_ANCHORS.map((item) => item.id), ...BODY_LOCATION_IDS])

/** Hide the far anatomical side in profile/orbit views, independent of which
 * side is selected. Facing is camera-relative so turning the body never swaps
 * Left/Right. Named buttons remain available for every region.
 * @param {BodyRegionAnchor} region @param {{x:number,z:number}} direction */
export function bodyRegionFacesCamera(region, direction) {
  if (direction.x > 0.35 && region.side === "Right" || direction.x < -0.35 && region.side === "Left") return false
  return region.facing === "both" || region.facing === "front" && direction.z > -0.15 || region.facing === "back" && direction.z < 0.15
}

/** Preserve legacy labels and order. The visible limit matches normalization,
 * preventing a form from accepting regions that the save would silently drop.
 * @param {string[]} selected @param {string} region */
export function toggleBodyRegion(selected, region) {
  if (!regionIds.has(region)) return selected
  if (selected.includes(region)) return selected.filter((value) => value !== region)
  return selected.length < BODY_REGION_SELECTION_LIMIT ? [...selected, region] : selected
}
