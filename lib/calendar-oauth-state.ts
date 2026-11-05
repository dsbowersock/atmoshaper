import { createHmac, timingSafeEqual } from "node:crypto"

/** Bind Google's opaque state to the initiating app account without exposing its ID. */
export function signGoogleCalendarState(state: string, userId: string, secret: string) {
  return createHmac("sha256", secret)
    .update(JSON.stringify(["google-calendar-oauth-state-v1", userId, state]))
    .digest("hex")
}

/** Reject an old or malformed cookie and require the same account before exchanging a code. */
export function matchesGoogleCalendarState(state: string, cookie: string | undefined, userId: string, secret: string) {
  if (!cookie || cookie.length !== 64 || !/^[a-f0-9]+$/.test(cookie)) return false

  return timingSafeEqual(
    Buffer.from(cookie, "hex"),
    Buffer.from(signGoogleCalendarState(state, userId, secret), "hex"),
  )
}
