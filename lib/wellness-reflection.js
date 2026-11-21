// @ts-check

/** Original word-navigation data informed by the owner's supplied wheel images.
 * These are self-chosen words, not scores, diagnoses or a validated scale. */
/** @type {{word:string,color:string,groups:Record<string,string[]>}[]} */
export const FEELING_FAMILIES = [
  { word: "Happy", color: "#706019", groups: { Accepted: ["Respected", "Valued"], Content: ["Free", "Joyful"], Interested: ["Curious", "Inquisitive"], Optimistic: ["Hopeful", "Inspired"], Peaceful: ["Loving", "Thankful"], Playful: ["Amused", "Cheeky"], Powerful: ["Courageous", "Creative"], Proud: ["Confident", "Successful"], Trusting: ["Intimate", "Sensitive"] } },
  { word: "Neutral", color: "#48535f", groups: { Detached: ["Emotionless", "Uninterested"], Indifferent: ["Unconcerned", "Unfeeling"], Unmoved: ["Calm", "Unperturbed"] } },
  { word: "Sad", color: "#315677", groups: { Depressed: ["Empty", "Hopeless"], Despair: ["Grief", "Powerless"], Guilty: ["Ashamed", "Regretful"], Hurt: ["Disappointed", "Embarrassed"], Lonely: ["Abandoned", "Isolated"], Vulnerable: ["Fragile", "Victimized"] } },
  { word: "Surprised", color: "#80531f", groups: { Amazed: ["Astonished", "Awed"], Confused: ["Disillusioned", "Perplexed"], Excited: ["Eager", "Energetic"], Startled: ["Dismayed", "Shocked"] } },
  { word: "Angry", color: "#853c42", groups: { Aggressive: ["Hostile", "Provoked"], Bitter: ["Indignant", "Violated"], Critical: ["Dismissive", "Skeptical"], Distant: ["Numb", "Withdrawn"], Frustrated: ["Annoyed", "Infuriated"], Humiliated: ["Disrespected", "Ridiculed"], "Let down": ["Betrayed", "Resentful"], Mad: ["Furious", "Jealous"] } },
  { word: "Bad", color: "#70513c", groups: { Bored: ["Apathetic", "Disengaged"], Busy: ["Pressured", "Rushed"], Stressed: ["Out of control", "Overwhelmed"], Tired: ["Sleepy", "Unfocused"] } },
  { word: "Connected", color: "#266660", groups: { Appreciative: ["Grateful", "Treasured"], Belonging: ["Supported", "Welcomed"], Loved: ["Cherished", "Adored"], Seen: ["Recognized", "Acknowledged"], Understood: ["Validated", "Accepted"] } },
  { word: "Disgusted", color: "#355f4c", groups: { Awful: ["Detestable", "Nauseated"], Displeased: ["Appalled", "Revolted"], Disapproving: ["Contemptuous", "Judgmental"], Repelled: ["Hesitant", "Horrified"] } },
  { word: "Fearful", color: "#5c427e", groups: { Anxious: ["Uneasy", "Worried"], Insecure: ["Inadequate", "Inferior"], Rejected: ["Excluded", "Persecuted"], Scared: ["Frightened", "Helpless"], Threatened: ["Exposed", "Nervous"], Weak: ["Insignificant", "Worthless"] } },
]

export const ALL_FEELING_WORDS = [...new Set(FEELING_FAMILIES.flatMap((family) => [family.word, ...Object.keys(family.groups), ...Object.values(family.groups).flat()]))]
export const CONTEXT_PROMPTS = {
  work: ["Repeated reaching", "Repeated gripping", "Lifting or carrying", "Long periods sitting", "Long periods standing", "Bent or twisted posture", "Desk or screen setup", "Work surface height", "Breaks and recovery"],
  home: ["Favorite chair or couch", "Floor time with family", "Home desk or older chair", "Kitchen counter height", "Cooking or housework", "Phone or device position", "Sleeping or resting position", "Driving or commuting"],
  care: ["Movement or stretching", "Rest or a change of position", "Walking or exercise", "Heat or cold", "Self-massage", "Breathing or relaxation", "A routine suggested by my clinician", "Something else that helps me"],
}

/** @param {unknown} value @param {number} [limit] @param {number} [length] */
export function reflectionWords(value, limit = 16, length = 80) {
  return Array.isArray(value) ? [...new Set(value.filter((item) => typeof item === "string").map((item) => item.trim().slice(0, length)).filter(Boolean))].slice(0, limit) : []
}

/** Retain only the active category's bounded reflection fields. Never promote
 * hidden fields from a different category into a saved check-in.
 * @param {string} category @param {unknown} value */
export function normalizeContextCheckIn(category, value) {
  if (category !== "work_context" && category !== "home_care" || !value || typeof value !== "object" || Array.isArray(value)) return null
  const input = /** @type {Record<string,unknown>} */ (value)
  /** @type {Record<string,unknown>} */
  const result = {}
  for (const key of ["activity", "posture", "repetition", "surroundings", "noticed", ...(category === "home_care" ? ["careAction", "careEffect"] : [])]) {
    const text = typeof input[key] === "string" ? input[key].trim().slice(0, 400) : ""
    if (text) result[key] = text
  }
  const prompts = reflectionWords(input.prompts)
  if (prompts.length) result.prompts = prompts
  return Object.keys(result).length ? result : null
}
