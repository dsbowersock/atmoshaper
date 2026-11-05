import { NextResponse } from "next/server"
import { getCurrentSession } from "@/auth"
import { generateRandomToken } from "@/lib/auth-security"
import { getGoogleCalendarSyncAccess } from "@/lib/calendar-sync-access"
import { getGoogleCalendarSyncConfig } from "@/lib/calendar-sync-env"
import { buildGoogleCalendarAuthUrl } from "@/lib/google-calendar-adapter"
import { getAuthSecret, getSiteUrl } from "@/lib/auth-env"
import { signGoogleCalendarState } from "@/lib/calendar-oauth-state"

export async function GET() {
  const baseUrl = getSiteUrl()
  const session = await getCurrentSession()
  if (!session?.user?.id) {
    return NextResponse.redirect(new URL("/login", baseUrl))
  }
  const access = await getGoogleCalendarSyncAccess(session.user.id)
  if (!access.allowed) {
    return NextResponse.redirect(new URL("/calendar/sync?google=access", baseUrl))
  }

  const config = getGoogleCalendarSyncConfig()
  const secret = getAuthSecret()
  if (!config || !secret) {
    return NextResponse.redirect(new URL("/calendar/sync?google=unconfigured", baseUrl))
  }

  const state = generateRandomToken()
  const response = NextResponse.redirect(buildGoogleCalendarAuthUrl({
    clientId: config.clientId,
    redirectUri: config.redirectUri,
    state,
  }))
  response.cookies.set("massagelab_google_calendar_state", signGoogleCalendarState(state, session.user.id, secret), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 10 * 60,
  })
  return response
}
