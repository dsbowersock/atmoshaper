/**
 * Use the segmented face's real advances; legacy em boxes can overlap Modern's
 * glyphs even when the complete clock fits. Keep other saved font choices at
 * their existing geometry/weight. The clock-only Digital face uses the real
 * bold font with normalized vertical metrics; other Digital consumers retain
 * their original face. CSS ch values update when the local font loads.
 * @param {"digital" | "mono" | "sans" | "serif"} fontFamily
 */
export function getChimerClockFontMetrics(fontFamily) {
  const digital = fontFamily === "digital"
  return {
    "--chimer-clock-digit-width": digital ? "1ch" : "0.54em",
    "--chimer-timer-colon-width": digital ? "auto" : "0.22em",
    "--chimer-clock-colon-width": digital ? "auto" : "0.34em",
    "--chimer-clock-font-weight": digital ? "700" : "inherit",
    "--chimer-clock-label-font-family": digital ? "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace" : "inherit",
    "--chimer-clock-meridiem-font-family": digital ? '"Digital Clock Labels", ui-monospace, monospace' : "inherit",
  }
}
