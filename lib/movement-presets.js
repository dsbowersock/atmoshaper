// @ts-check
/** @typedef {import("./rom-movements.js").RomMovement} RomMovement */
/** @typedef {import("./rom-movements.js").RomPose} RomPose */

/** Digit groups keep a comprehensive catalog from becoming a long phone form.
 * Each joint/digit variant retains its own saved comparison identity. */
export const MOVEMENT_PARTS = Object.freeze({
  hand: [
    { id: "all", label: "Whole hand" }, { id: "thumb", label: "Thumb" },
    { id: "index", label: "Index finger" }, { id: "middle", label: "Middle finger" },
    { id: "ring", label: "Ring finger" }, { id: "pinky", label: "Little finger" },
  ],
  toes: [
    { id: "all", label: "All toes" }, { id: "great", label: "Big toe" },
    { id: "second", label: "Second toe" }, { id: "third", label: "Third toe" },
    { id: "fourth", label: "Fourth toe" }, { id: "little", label: "Little toe" },
  ],
})

/** @type {RomPose[]} A supported seated illustration separates hip rotation
 * from tibial rotation. This is a drawing setup, never a prescribed posture. */
const seated = [
  { bone: "thigh", plane: "x", radians: -1.45 },
  { bone: "calf", plane: "x", radians: 1.45 },
]

/** @type {RomMovement[]} */
export const ADDITIONAL_MOVEMENTS = [
  { id: "shoulder-horizontal-out", area: "shoulder", label: "Open your raised arm out to the side", name: "Shoulder horizontal abduction", cue: "With your arm raised in front of you, move it outward at shoulder level. Keep your trunk still and stay within a comfortable range.", plane: "y", radians: 1, mirror: true, startingPose: [{ bone: "upperarm", plane: "x", radians: -1.45 }] },
  { id: "shoulder-horizontal-in", area: "shoulder", label: "Bring your raised arm across your chest", name: "Shoulder horizontal adduction", cue: "With your arm raised out to the side, bring it forward and across your chest without turning your trunk.", plane: "y", radians: -2.2, mirror: true, startingPose: [{ bone: "upperarm", plane: "z", radians: 1.3, mirror: true }] },
  { id: "forearm-pronate", area: "elbow", label: "Turn your palm down", name: "Forearm pronation", cue: "With your elbow bent and upper arm still, turn your forearm so your palm faces down.", plane: "z", radians: 2.2, mirror: true, startingPose: [{ bone: "lowerarm", plane: "x", radians: -Math.PI / 2 }] },
  { id: "forearm-supinate", area: "elbow", label: "Turn your palm up", name: "Forearm supination", cue: "With your elbow bent and upper arm still, turn your forearm so your palm faces up.", plane: "z", radians: -2.2, mirror: true, startingPose: [{ bone: "lowerarm", plane: "x", radians: -Math.PI / 2 }, { bone: "lowerarm", plane: "z", radians: 2.2, mirror: true }] },
  { id: "hip-straight-lift", area: "hip", label: "Lift your leg with your knee straight", name: "Hip flexion (knee straight)", cue: "From a supported position, bring your thigh forward while keeping your knee comfortably straight, without locking it.", plane: "x", radians: -0.7, view: "side" },
  { id: "hip-in", area: "hip", label: "Bring your leg back toward the middle", name: "Hip adduction", cue: "From a supported position with your leg out to the side, bring it toward your other leg without leaning your trunk.", plane: "z", radians: -0.35, mirror: true, startingPose: [{ bone: "thigh", plane: "z", radians: 0.35, mirror: true }] },
  { id: "hip-cross", area: "hip", label: "Bring your leg across your body", name: "Hip cross-body adduction", cue: "From a supported position, move your leg slightly forward and across your body's middle. Follow any hip precautions you have been given.", plane: "z", radians: -0.22, mirror: true, startingPose: [{ bone: "thigh", plane: "x", radians: -0.25 }] },
  { id: "hip-rotate-in", area: "hip", label: "Turn your thigh inward", name: "Hip internal rotation (knee bent)", cue: "Sit with your thigh supported and knee bent. Keep your thigh in place as you gently move your foot outward. This turns the thigh inward at the hip.", plane: "z", radians: 0.35, mirror: true, startingPose: seated },
  { id: "hip-rotate-out", area: "hip", label: "Turn your thigh outward", name: "Hip external rotation (knee bent)", cue: "Sit with your thigh supported and knee bent. Keep your thigh in place as you gently move your foot inward. This turns the thigh outward at the hip.", plane: "z", radians: -0.35, mirror: true, startingPose: seated },
  { id: "knee-rotate-in", area: "knee", label: "Turn your lower leg inward with your knee bent", name: "Knee internal rotation (knee bent)", cue: "Sit with your thigh supported, knee bent and foot free to move. Keep your thigh still and gently turn the lower leg so your toes point inward. Do not force or twist a planted foot.", plane: "y", radians: -0.18, mirror: true, startingPose: seated },
  { id: "knee-rotate-out", area: "knee", label: "Turn your lower leg outward with your knee bent", name: "Knee external rotation (knee bent)", cue: "Sit with your thigh supported, knee bent and foot free to move. Keep your thigh still and gently turn the lower leg so your toes point outward. Do not force or twist a planted foot.", plane: "y", radians: 0.22, mirror: true, startingPose: seated },
  { id: "foot-invert", area: "ankle", label: "Turn the sole of your foot inward", name: "Foot inversion", cue: "With your lower leg supported and still, turn your sole toward the middle of your body.", plane: "z", radians: -0.25, mirror: true },
  { id: "foot-evert", area: "ankle", label: "Turn the sole of your foot outward", name: "Foot eversion", cue: "With your lower leg supported and still, turn your sole away from the middle of your body.", plane: "z", radians: 0.2, mirror: true },
  { id: "foot-pronate", area: "ankle", label: "Combine an outward sole turn with lifting the foot", name: "Foot pronation (combined movement)", cue: "In a supported, non-weight-bearing position, gently combine turning your sole outward, lifting the front of your foot and moving it outward. Pronation combines movements; it is not just eversion.", plane: "z", radians: 0.15, poses: [{ bone: "foot", plane: "z", radians: 0.15, mirror: true }, { bone: "foot", plane: "x", radians: -0.1 }, { bone: "foot", plane: "y", radians: 0.15, mirror: true }] },
  { id: "foot-supinate", area: "ankle", label: "Combine an inward sole turn with pointing the foot", name: "Foot supination (combined movement)", cue: "In a supported, non-weight-bearing position, gently combine turning your sole inward, pointing the front of your foot and moving it inward. Supination combines movements; it is not just inversion.", plane: "z", radians: -0.15, poses: [{ bone: "foot", plane: "z", radians: -0.15, mirror: true }, { bone: "foot", plane: "x", radians: 0.1 }, { bone: "foot", plane: "y", radians: -0.15, mirror: true }] },
  ...handMovements(), ...toeMovements(),
]

// A front camera foreshortens a raised forearm or thigh and hides the motion.
// These catalog defaults keep the moving segment visible; all views remain
// available through the same explicit controls and ordinary orbit interaction.
for (const movement of ADDITIONAL_MOVEMENTS) {
  if (movement.id.startsWith("forearm-")) movement.view = "side"
  else if (/^(shoulder-horizontal|hip-rotate|knee-rotate)/.test(movement.id) || movement.area === "hand" && movement.part !== "thumb" && movement.part !== "all") movement.view = "angled"
}

/** @returns {RomMovement[]} Named MCP/PIP/DIP variants prevent a knuckle
 * reading from being compared with a fingertip reading of the same finger. */
function handMovements() {
  /** @type {RomMovement[]} */
  const result = []
  const fingers = [{ id: "index", label: "Index" }, { id: "middle", label: "Middle" }, { id: "ring", label: "Ring" }, { id: "pinky", label: "Little" }]
  const curl = fingers.flatMap((finger) => [1, 2, 3].map((joint) => pose(`${finger.id}_0${joint}`, "x", -0.6)))
  const spread = fingers.filter((finger) => finger.id !== "middle").map((finger) => pose(`${finger.id}_01`, "z", finger.id === "index" ? 0.2 : finger.id === "ring" ? -0.12 : -0.25, true))
  const whole = [
    { id: "close", label: "Gently close your hand", name: "Hand finger flexion", cue: "Bend your fingers toward your palm without squeezing or forcing a fist.", start: [], end: curl },
    { id: "open", label: "Open your hand", name: "Hand finger extension", cue: "Start with your fingers gently bent, then open and straighten them without forcing them backward.", start: curl, end: reverse(curl) },
    { id: "spread", label: "Spread your fingers", name: "Hand finger abduction", cue: "Keep your hand still and gently move your fingers apart.", start: [], end: spread },
    { id: "together", label: "Bring your fingers together", name: "Hand finger adduction", cue: "Start with your fingers apart, then bring them back alongside one another.", start: spread, end: reverse(spread) },
  ]
  for (const item of whole) result.push({ id: `hand-${item.id}`, area: "hand", part: "all", label: item.label, name: item.name, cue: item.cue, plane: "x", radians: 0.6, startingPose: item.start, poses: item.end })
  for (const finger of fingers) {
    for (const joint of [{ n: 1, everyday: "base knuckle", technical: "MCP" }, { n: 2, everyday: "middle joint", technical: "PIP" }, { n: 3, everyday: "tip joint", technical: "DIP" }]) {
      for (const bend of [true, false]) {
        const bent = pose(`${finger.id}_0${joint.n}`, "x", -0.6)
        result.push({ id: `${finger.id}-${joint.technical.toLowerCase()}-${bend ? "bend" : "straighten"}`, area: "hand", part: finger.id, label: `${bend ? "Bend" : "Straighten"} the ${joint.everyday}`, name: `${finger.label} finger ${joint.technical} ${bend ? "flexion" : "extension"}`, cue: `${bend ? "Bend" : "Gently straighten"} your ${finger.label.toLowerCase()} finger at its ${joint.everyday}. Keep the rest of your hand comfortably supported.`, plane: "x", radians: bend ? -0.6 : 0.6, focusBone: `${finger.id}_0${joint.n}`, startingPose: bend ? [] : [bent], poses: bend ? [bent] : reverse([bent]) })
      }
    }
    const away = pose(`${finger.id}_01`, "z", ["index", "middle"].includes(finger.id) ? 0.2 : -0.2, true)
    for (const apart of [true, false]) result.push({ id: `${finger.id}-${apart ? "apart" : "together"}`, area: "hand", part: finger.id, label: apart ? "Move it away from the next finger" : "Bring it back alongside the next finger", name: `${finger.label} finger MCP ${apart ? "abduction" : "adduction"}`, cue: apart ? "With your palm supported, gently spread this finger away from its neighbor. For the middle finger, move toward the thumb side." : "Start with this finger slightly apart, then bring it back alongside its neighbor.", plane: "z", radians: 0.2, focusBone: `${finger.id}_01`, startingPose: apart ? [] : [away], poses: apart ? [away] : reverse([away]) })
  }
  const thumb = [
    { id: "base-bend", label: "Move your thumb across your palm", name: "Thumb CMC flexion", bone: "thumb_01", plane: "z", angle: -0.55, mirror: true },
    { id: "lift", label: "Lift your thumb away from your palm", name: "Thumb CMC palmar abduction", bone: "thumb_01", plane: "x", angle: -0.5 },
    { id: "knuckle-bend", label: "Bend your thumb knuckle", name: "Thumb MCP flexion", bone: "thumb_02", plane: "x", angle: -0.5 },
    { id: "tip-bend", label: "Bend the tip of your thumb", name: "Thumb IP flexion", bone: "thumb_03", plane: "x", angle: -0.6 },
  ]
  for (const item of thumb) {
    const bend = pose(item.bone, /** @type {RomPose["plane"]} */ (item.plane), item.angle, item.mirror)
    for (const forward of [true, false]) result.push({ id: `thumb-${item.id}-${forward ? "out" : "return"}`, area: "hand", part: "thumb", label: forward ? item.label : item.id === "base-bend" ? "Move your thumb back out beside your hand" : item.id === "lift" ? "Lower your thumb toward your palm" : item.id === "knuckle-bend" ? "Straighten your thumb knuckle" : "Straighten the tip of your thumb", name: forward ? item.name : item.name.replace("flexion", "extension").replace("abduction", "adduction"), cue: "Support your hand and gently move only the selected part of your thumb. Stay within a comfortable range.", plane: bend.plane, radians: item.angle, focusBone: item.bone, startingPose: forward ? [] : [bend], poses: forward ? [bend] : reverse([bend]) })
  }
  // Opposition is a coupled thumb movement; its two-axis pose is illustrative,
  // not evidence of contact precision or calibrated joint angles.
  const opposition = [pose("thumb_01", "z", -0.85, true), pose("thumb_01", "y", -0.5, true), pose("thumb_02", "x", -0.45)]
  for (const toward of [true, false]) result.push({ id: `thumb-${toward ? "opposition" : "reposition"}`, area: "hand", part: "thumb", label: toward ? "Bring your thumb toward your little finger" : "Move your thumb away from your little finger", name: `Thumb ${toward ? "opposition" : "reposition"}`, cue: toward ? "Gently bring your thumb across the palm toward your little finger, without forcing contact." : "Return your thumb from across your palm to a relaxed open position.", plane: "z", radians: -0.85, focusBone: "thumb_01", startingPose: toward ? [] : opposition, poses: toward ? opposition : reverse(opposition) })
  return result
}

/** @returns {RomMovement[]} The asset has a collective forefoot bone only.
 * Individual toes and spreading remain recordable, with honest written cues. */
function toeMovements() {
  /** @type {RomMovement[]} */
  const result = []
  for (const part of MOVEMENT_PARTS.toes) {
    for (const down of [true, false]) result.push({ id: `toes-${part.id}-${down ? "curl" : "lift"}`, area: "toes", part: part.id, label: down ? "Curl downward at the toe base" : "Lift upward at the toe base", name: `${part.label} MTP ${down ? "flexion" : "extension"}`, cue: `Support your foot and keep your ankle still. Gently ${down ? "curl" : "lift"} ${part.id === "all" ? "your toes" : `your ${part.label.toLowerCase()}`} at the base where ${part.id === "all" ? "they meet" : "it meets"} the foot.`, plane: "x", radians: down ? 0.45 : -0.3, demo: part.id === "all", view: "side" })
    if (part.id !== "all") for (const down of [true, false]) result.push({ id: `toes-${part.id}-tip-${down ? "bend" : "straighten"}`, area: "toes", part: part.id, label: down ? "Bend the smaller toe joint(s)" : "Straighten the smaller toe joint(s)", name: `${part.label} IP ${down ? "flexion" : "extension"}`, cue: `Support your foot and gently ${down ? "bend" : "straighten"} the smaller joint${part.id === "great" ? "" : "s"} of your ${part.label.toLowerCase()}, keeping the ankle still.`, plane: "x", radians: down ? 0.4 : -0.4, demo: false })
  }
  for (const apart of [true, false]) result.push({ id: `toes-${apart ? "spread" : "together"}`, area: "toes", part: "all", label: apart ? "Spread your toes" : "Bring your toes together", name: `Toe ${apart ? "abduction" : "adduction"}`, cue: apart ? "With your foot supported, gently try to separate your toes without rolling the ankle." : "From a gently spread position, bring your toes back toward one another without curling them.", plane: "z", radians: 0.2, demo: false })
  return result
}

/** @param {string} bone @param {RomPose["plane"]} plane @param {number} radians @param {boolean} [mirror] @returns {RomPose} */
function pose(bone, plane, radians, mirror = false) { return { bone, plane, radians, mirror } }
/** @param {RomPose[]} poses @returns {RomPose[]} */
function reverse(poses) { return [...poses].reverse().map((item) => ({ ...item, radians: -item.radians })) }
