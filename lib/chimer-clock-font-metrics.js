/**
 * Use the segmented face's real advances; legacy em boxes can overlap Modern's
 * glyphs even when the complete clock fits. Keep other saved font choices at
 * their existing geometry. CSS ch values update when the local font loads.
 * @param {"digital" | "mono" | "sans" | "serif"} fontFamily
 */
export function getChimerClockFontMetrics(fontFamily) {
  const digital = fontFamily === "digital"
  return {
    "--chimer-clock-digit-width": digital ? "1ch" : "0.54em",
    "--chimer-timer-colon-width": digital ? "auto" : "0.22em",
    "--chimer-clock-colon-width": digital ? "auto" : "0.34em",
  }
}
