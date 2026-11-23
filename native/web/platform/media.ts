import { createAtmosphereMediaCarrier as createCarrier } from "@/lib/atmosphere/media-playback-carrier"
import { createAtmosphereMediaSessionController as createController } from "@/lib/atmosphere/media-session-controller"

/** Native notifications use packaged public artwork/carrier assets. No account
 * or generated image endpoint is required to publish the local audio session. */
export const createAtmosphereMediaCarrier: typeof createCarrier = options => createCarrier({
  ...options, sourceUrl:new URL("./public/audio/atmosphere/media-session-carrier.mp3",document.baseURI).href,
})
export const createAtmosphereMediaSessionController: typeof createController = options => createController({
  ...options, artworkUrl:()=>new URL("./public/icons/icon-512.png",document.baseURI).href,
})
