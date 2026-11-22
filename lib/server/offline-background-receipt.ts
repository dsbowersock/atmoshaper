import { createHmac, createPrivateKey, sign } from "node:crypto"
import { validateOfflineAccessClaims, offlinePremiumUntil, OFFLINE_ACCESS_AUDIENCE } from "../offline-background-access.js"

/** A separate authority for background capabilities, never the session secret.
 * Deployment must bind the matching public key into the Android bundle. */
export function signOfflineBackgroundReceipt(input: {
  device: string; challenge: string; userId: string; premiumUntil: number | null; owned: string[]; now?: number
}, environment = process.env) {
  if (environment.ATMOSHAPER_OFFLINE_ACCESS_ENABLED !== "true"
    || !environment.ATMOSHAPER_OFFLINE_ACCESS_PRIVATE_KEY || !/^[a-z0-9-]{1,64}$/.test(environment.ATMOSHAPER_OFFLINE_ACCESS_KEY_ID ?? "")) throw new Error("Offline access verification is not enabled yet.")
  const key = createPrivateKey(environment.ATMOSHAPER_OFFLINE_ACCESS_PRIVATE_KEY)
  if (key.asymmetricKeyType !== "ec" || key.asymmetricKeyDetails?.namedCurve !== "prime256v1") throw new Error("Offline access signing configuration is invalid.")
  const claims = validateOfflineAccessClaims({ version: 1, aud: OFFLINE_ACCESS_AUDIENCE,
    device: input.device, challenge: input.challenge,
    account: createHmac("sha256", environment.ATMOSHAPER_OFFLINE_ACCESS_PRIVATE_KEY).update("offline-background-account:" + input.userId).digest("base64url"),
    issuedAt: input.now ?? Date.now(), premiumUntil: input.premiumUntil, owned: input.owned })
  const header = Buffer.from(JSON.stringify({ alg: "ES256", typ: "atmoshaper-offline-access", kid: environment.ATMOSHAPER_OFFLINE_ACCESS_KEY_ID })).toString("base64url")
  const payload = Buffer.from(JSON.stringify(claims)).toString("base64url")
  const message = header + "." + payload
  return message + "." + sign("sha256", Buffer.from(message), { key, dsaEncoding: "ieee-p1363" }).toString("base64url")
}

type AccessSnapshot = { featureAccess: Array<{featureKey:string;sources:Array<{source:string;expiresAt:string|null}>}>; owned:string[] }

/** Same-origin, session-owner-only issuer. The browser supplies only install
 * and challenge nonces; financial state always comes from a fresh server read. */
export function createOfflineBackgroundAccessHandler(dependencies: {
  getUserId(): Promise<string | null>
  loadAccess(userId: string): Promise<AccessSnapshot>
  environment?: NodeJS.ProcessEnv
}) {
  const headers = { "Cache-Control": "private, no-store", "Referrer-Policy": "no-referrer" }
  const reply = (value: unknown, status = 200) => Response.json(value, { status, headers })
  return async (request: Request) => {
    if (request.method !== "POST") return reply({ error: "Use an explicit approval request." }, 405)
    if (request.headers.get("origin") !== new URL(request.url).origin) return reply({ error: "Invalid request origin." }, 403)
    const userId = await dependencies.getUserId()
    if (!userId) return reply({ error: "Sign in to verify offline access." }, 401)
    let input: unknown
    try {
      // Bound actual bytes, not a caller-controlled Content-Length claim.
      const reader = request.body?.getReader()
      if (!reader) throw new Error()
      const chunks: Uint8Array[] = []; let size = 0
      try {
        for (;;) { const part = await reader.read(); if (part.done) break; size += part.value.byteLength; if (size > 1024) throw new Error(); chunks.push(part.value) }
      } catch (error) { await reader.cancel(); throw error }
      const body = new Uint8Array(size); let offset = 0
      for (const chunk of chunks) { body.set(chunk, offset); offset += chunk.byteLength }
      input = JSON.parse(new TextDecoder().decode(body))
    } catch { return reply({ error: "Invalid access request." }, 400) }
    const { device, challenge } = (input ?? {}) as { device?: unknown; challenge?: unknown }
    if (typeof device !== "string" || typeof challenge !== "string" || !/^[A-Za-z0-9_-]{43}$/.test(device) || !/^[A-Za-z0-9_-]{43}$/.test(challenge)) return reply({ error: "Invalid access request." }, 400)
    try {
      const environment = dependencies.environment ?? process.env
      if (environment.ATMOSHAPER_OFFLINE_ACCESS_ENABLED !== "true" || !environment.ATMOSHAPER_OFFLINE_ACCESS_PRIVATE_KEY || !environment.ATMOSHAPER_OFFLINE_ACCESS_KEY_ID) throw new Error()
      const snapshot = await dependencies.loadAccess(userId)
      const now = Date.now()
      const receipt = signOfflineBackgroundReceipt({ device, challenge, userId, premiumUntil: offlinePremiumUntil(snapshot.featureAccess, now), owned: snapshot.owned, now }, environment)
      return reply({ receipt })
    } catch { return reply({ error: "Access could not be verified. Your existing offline receipt is unchanged. Try again when verification is available." }, 503) }
  }
}
