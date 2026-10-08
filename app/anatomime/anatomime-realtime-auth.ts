import { fetchJsonWithTimeout } from "../../lib/client-fetch.ts"
import { ANATOMIME_REALTIME_SETUP_TIMEOUT_MS } from "./anatomime-polling"

type RealtimeAuthCompletion = (error: unknown, tokenRequest?: unknown) => void

/**
 * Uses the setup TokenRequest once, then obtains a fresh joined-player grant for
 * every SDK renewal. Room credentials stay in headers and never become SDK
 * capability input. The owning effect cancels late grants on leave or teardown;
 * each renewal also bounds transport and JSON consumption with its own deadline.
 */
export function createAnatomimeRealtimeAuthCallback({
  code,
  playerId,
  playerToken,
  initialTokenRequest,
  signal,
}: {
  code: string
  playerId: string
  playerToken: string
  initialTokenRequest: unknown
  signal: AbortSignal
}) {
  let setupTokenRequest = initialTokenRequest

  /** Completes one SDK authorization using the setup grant or a bounded fresh room grant; SDK parameters never widen player authority. */
  return function authenticate(_tokenParams: unknown, callback: RealtimeAuthCompletion) {
    if (signal.aborted) {
      callback("Realtime authentication cancelled.")
      return
    }
    if (setupTokenRequest !== undefined) {
      const tokenRequest = setupTokenRequest
      setupTokenRequest = undefined
      callback(null, tokenRequest)
      return
    }

    void fetchJsonWithTimeout(
      `/api/anatomime/sessions/${encodeURIComponent(code)}/realtime-token`,
      {
        method: "POST",
        headers: {
          "x-anatomime-player-id": playerId,
          "x-anatomime-player-token": playerToken,
        },
        signal,
      },
      ANATOMIME_REALTIME_SETUP_TIMEOUT_MS,
    ).then(({ response, json }) => {
      if (signal.aborted || !response.ok || !json) {
        callback("Realtime authentication unavailable.")
        return
      }
      callback(null, json)
    }, () => {
      // Do not expose response bodies, player credentials or transport details.
      callback("Realtime authentication unavailable.")
    })
  }
}
