// @ts-check
import { ADDITIONAL_MOVEMENTS } from "./movement-presets.js"
export { MOVEMENT_PARTS } from "./movement-presets.js"

/** Plain-language choices are independent from the rig and from saved ROM
 * strings. Technical names remain the timeline comparison labels. Demo angles
 * are drawing parameters, never normal ranges or values to record. */
export const ROM_AREAS = Object.freeze([
  { id: "neck", label: "Neck", bone: "neck_01", paired: false },
  { id: "shoulder", label: "Shoulder", bone: "upperarm", paired: true },
  { id: "elbow", label: "Elbow / forearm", bone: "lowerarm", paired: true },
  { id: "wrist", label: "Wrist", bone: "hand", paired: true },
  { id: "hand", label: "Hand / fingers", bone: "middle_01", paired: true },
  { id: "back", label: "Back / trunk", bone: "spine_01", paired: false },
  { id: "hip", label: "Hip", bone: "thigh", paired: true },
  { id: "knee", label: "Knee", bone: "calf", paired: true },
  { id: "ankle", label: "Ankle", bone: "foot", paired: true },
  { id: "toes", label: "Toes", bone: "ball", paired: true },
])

/** @typedef {{bone:string, plane:"x"|"y"|"z", radians:number, mirror?:boolean}} RomPose */
/** @typedef {{id:string, area:string, label:string, name:string, cue:string, plane:"x"|"y"|"z", radians:number, mirror?:boolean, setup?:"elbow-bent"|"knee-bent"|"bent-start", view?:"side"|"front"|"angled", part?:string, focusBone?:string, startingPose?:RomPose[], poses?:RomPose[], demo?:boolean}} RomMovement */
/** @type {readonly RomMovement[]} */
export const ROM_MOVEMENTS = Object.freeze([
  { id: "neck-turn", area: "neck", label: "Turn your head", name: "Cervical rotation", cue: "Turn to look to one side while your shoulders stay facing forward.", plane: "y", radians: 0.65, mirror: true },
  { id: "neck-down", area: "neck", label: "Look down", name: "Cervical flexion", cue: "Bring your chin toward your chest without bending your whole body.", plane: "x", radians: 0.35, view: "side" },
  { id: "neck-up", area: "neck", label: "Look up", name: "Cervical extension", cue: "Gently tip your head back to look upward.", plane: "x", radians: -0.25, view: "side" },
  { id: "neck-tilt", area: "neck", label: "Tilt your head sideways", name: "Cervical lateral flexion", cue: "Bring an ear toward the same-side shoulder without lifting that shoulder.", plane: "z", radians: -0.3, mirror: true },
  { id: "shoulder-forward", area: "shoulder", label: "Raise your arm forward", name: "Shoulder flexion", cue: "Raise the arm in front of you with your elbow comfortably straight.", plane: "x", radians: -1.25, view: "side" },
  { id: "shoulder-back", area: "shoulder", label: "Move your arm backward", name: "Shoulder extension", cue: "Move the arm behind you without leaning your chest forward.", plane: "x", radians: 0.35, view: "side" },
  { id: "shoulder-out", area: "shoulder", label: "Raise your arm out to the side", name: "Shoulder abduction", cue: "Raise the arm away from your body to the side.", plane: "z", radians: 1.2, mirror: true },
  { id: "shoulder-rotate-out", area: "shoulder", label: "Turn your forearm outward", name: "Shoulder external rotation", cue: "Keep your upper arm by your side and elbow bent. Turn your forearm away from your belly.", plane: "y", radians: 0.6, mirror: true, setup: "elbow-bent" },
  { id: "shoulder-rotate-in", area: "shoulder", label: "Turn your forearm inward", name: "Shoulder internal rotation", cue: "Keep your upper arm by your side and elbow bent. Turn your forearm toward your belly.", plane: "y", radians: -0.45, mirror: true, setup: "elbow-bent" },
  { id: "elbow-bend", area: "elbow", label: "Bend your elbow", name: "Elbow flexion", cue: "Bring your hand toward your shoulder while your upper arm stays by your side.", plane: "x", radians: -1.3, view: "side" },
  { id: "elbow-straighten", area: "elbow", label: "Straighten your elbow", name: "Elbow extension", cue: "Start with your elbow bent, then gently straighten it.", plane: "x", radians: 1.3, setup: "bent-start", view: "side" },
  { id: "wrist-bend", area: "wrist", label: "Bend your palm toward your forearm", name: "Wrist flexion", cue: "Keep your forearm still and bend at the wrist toward the palm side.", plane: "x", radians: -0.55, view: "side" },
  { id: "wrist-back", area: "wrist", label: "Bend the back of your hand back", name: "Wrist extension", cue: "Keep your forearm still and bend at the wrist toward the back of your hand.", plane: "x", radians: 0.55, view: "side" },
  { id: "wrist-thumb", area: "wrist", label: "Move your hand toward the thumb side", name: "Wrist radial deviation", cue: "Move your hand sideways toward your thumb without turning your forearm.", plane: "z", radians: 0.25, mirror: true },
  { id: "wrist-little", area: "wrist", label: "Move your hand toward the little-finger side", name: "Wrist ulnar deviation", cue: "Move your hand sideways toward your little finger without turning your forearm.", plane: "z", radians: -0.35, mirror: true },
  { id: "back-forward", area: "back", label: "Bend your trunk forward", name: "Trunk flexion", cue: "Bend your upper body forward in the way your clinician has shown you.", plane: "x", radians: 0.3, view: "side" },
  { id: "back-backward", area: "back", label: "Bend your trunk backward", name: "Trunk extension", cue: "Gently lean your upper body backward without forcing the movement.", plane: "x", radians: -0.15, view: "side" },
  { id: "back-side", area: "back", label: "Bend your trunk sideways", name: "Trunk lateral flexion", cue: "Bend your upper body to one side without turning your chest.", plane: "z", radians: -0.25, mirror: true },
  { id: "back-turn", area: "back", label: "Turn your trunk", name: "Trunk rotation", cue: "Turn your upper body to one side while keeping your pelvis facing forward.", plane: "y", radians: 0.35, mirror: true },
  { id: "hip-lift", area: "hip", label: "Lift your knee forward", name: "Hip flexion", cue: "Bring the thigh forward with your knee bent. Use a stable supported position.", plane: "x", radians: -0.8, setup: "knee-bent", view: "side" },
  { id: "hip-back", area: "hip", label: "Move your leg backward", name: "Hip extension", cue: "Move the thigh behind you without arching your low back. Use support for balance.", plane: "x", radians: 0.2, view: "side" },
  { id: "hip-side", area: "hip", label: "Move your leg out to the side", name: "Hip abduction", cue: "Move your leg away from your body to the side. Use a stable supported position.", plane: "z", radians: 0.4, mirror: true },
  { id: "knee-bend", area: "knee", label: "Bend your knee", name: "Knee flexion", cue: "Bring your heel toward the back of your thigh in a supported position.", plane: "x", radians: 1.2, view: "side" },
  { id: "knee-straighten", area: "knee", label: "Straighten your knee", name: "Knee extension", cue: "Start with your knee bent, then gently straighten it in a supported position.", plane: "x", radians: -1.2, setup: "bent-start", view: "side" },
  { id: "ankle-up", area: "ankle", label: "Bring your toes toward your shin", name: "Ankle dorsiflexion", cue: "Keep your lower leg still and bring the front of your foot up toward your shin.", plane: "x", radians: -0.2, view: "side" },
  { id: "ankle-down", area: "ankle", label: "Point your toes away", name: "Ankle plantarflexion", cue: "Keep your lower leg still and point the front of your foot away from your shin.", plane: "x", radians: 0.45, view: "side" },
  ...ADDITIONAL_MOVEMENTS,
])

/** @param {string} area @param {string} side */
export function romBoneName(area, side) {
  const item = ROM_AREAS.find((candidate) => candidate.id === area)
  return item ? item.bone + (item.paired ? side === "Right" ? "_r" : "_l" : "") : null
}

/** Invalid/missing readings must not become a plausible zero measurement.
 * @param {string} start @param {string} end */
export function parseRomAngles(start, end) {
  if (!start.trim() || !end.trim()) return null
  const values = [Number(start), Number(end)]
  return values.every((value) => Number.isFinite(value) && Math.abs(value) <= 360)
    ? { baselineAngle: Math.round(values[0] * 10) / 10, endAngle: Math.round(values[1] * 10) / 10 } : null
}

/** Bind a phone baseline to exactly what was selected when it was captured.
 * @param {string} movement @param {string} side @param {string} axis */
export function romMeasurementContext(movement, side, axis) { return JSON.stringify([movement, side, axis]) }
