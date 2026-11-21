// @ts-check
/** Display-only organization. Durable category tokens and recording meanings
 * remain unchanged when a tool moves between Mind, Body and Context. */
export const WELLNESS_CATEGORY_LABELS = Object.freeze({ body_sensation: "Body check-in", emotion: "Feelings", rom: "Range of motion", sleep: "Sleep", activity: "Activity", exercise: "Exercise", work_context: "Work context", home_care: "Home care", incident: "Incident" })
export const WELLNESS_CATEGORY_GROUPS = Object.freeze({ body_sensation: "body", emotion: "mind", rom: "body", sleep: "mind", activity: "body", exercise: "body", work_context: "context", home_care: "context", incident: "body" })

/** @param {{category:string,metadata?:Record<string,unknown>}} entry */
export function wellnessRecordingLabel(entry) {
  if (entry.category === "rom" && entry.metadata?.recordingKind === "comfort") return "Movement comfort"
  if (entry.category === "rom" && entry.metadata?.recordingKind === "both") return "Movement & range"
  return WELLNESS_CATEGORY_LABELS[/** @type {keyof typeof WELLNESS_CATEGORY_LABELS} */(entry.category)] ?? "Wellness recording"
}
