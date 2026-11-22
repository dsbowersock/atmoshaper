import styles from "./running-timer.module.css"

/** Reuse the unused part of the digital 12-hour tens cell for AM/PM. Reserve
 * both hour cells so a 9-to-10 transition never shifts the minute digits. Other
 * font choices and localized day-period labels retain their trailing layout. */
export function CurrentTimeDisplay({ currentTime, isPrimary, fontFamily }: {
  currentTime: { time: string, meridiem: string },
  isPrimary: boolean,
  fontFamily: "digital" | "mono" | "sans" | "serif",
}) {
  const [hour = "", minute = "", second = ""] = currentTime.time.split(":")
  const inset = fontFamily === "digital" && /^[AP]M$/i.test(currentTime.meridiem)
    && /^(?:0?[1-9]|1[0-2])$/.test(hour) && Boolean(minute)
  const digits = (value: string, hideLeadingZero = false) => value.padStart(2, "0").split("").map((digit, index) => (
    <span key={index} className={styles.currentTimeDigit}
      style={hideLeadingZero && index === 0 && digit === "0" ? { visibility: "hidden" } : undefined}>
      {digit}
    </span>
  ))
  const label = currentTime.meridiem ? <span className={styles.currentTimeMeridiem}>{currentTime.meridiem}</span> : null

  return <span className={isPrimary ? styles.currentTimeStack : styles.currentTimeInline}>
    <span className={styles.currentTimeRow} data-clock-label-placement={inset ? "leading" : "trailing"}>
      {minute ? <>
        <span className={`${styles.timeUnit} ${styles.currentTimeUnit}`}>{digits(hour, inset)}</span>
        <span className={`${styles.colon} ${styles.clockColon}`}>:</span>
        <span className={`${styles.timeUnit} ${styles.currentTimeUnit}`}>{digits(minute)}</span>
        {second ? <>
          <span className={`${styles.colon} ${styles.clockColon}`}>:</span>
          <span className={`${styles.timeUnit} ${styles.currentTimeUnit}`}>{digits(second)}</span>
        </> : null}
      </> : <span className={styles.currentTimeValue}>{currentTime.time}</span>}
      {inset ? <span className={styles.currentTimeLeadingMeridiem}>{label}</span> : label}
    </span>
  </span>
}
