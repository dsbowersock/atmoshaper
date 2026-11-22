import { createHmac, createPrivateKey, sign } from "node:crypto"
import { validateOfflineAccessClaims, OFFLINE_ACCESS_AUDIENCE } from "../offline-background-access.js"

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
