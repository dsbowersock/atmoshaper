import { generativeFmPieceImporters } from "./atmosphere/generative-fm-piece-loader.js"
import { listAtmosphereStations } from "./atmosphere/stations.js"

/** The audio-only player supports the shared Generative.fm adapter with Opus
 * sources. Keep entries for other engines visible with explicit availability.
 * @param {ReturnType<typeof listAtmosphereStations>[number]} station
 */
export function hasNativeStationPlayer(station) {
  const runtime = station.runtime
  return station.enabled && station.sourceType === "generative-fm-piece" &&
    Object.hasOwn(generativeFmPieceImporters, runtime.pieceId) &&
    Boolean(runtime.hostedSampleIndexFormatUrls?.opus && runtime.hostedManifestFormatUrls?.opus)
}

/** Package the public web descriptors unchanged, with an Android playback decision. */
export function nativeStationCatalogJson() {
  return JSON.stringify(listAtmosphereStations().map(station => ({
    station,
    playback: hasNativeStationPlayer(station) ? "generative-fm" : "unsupported",
  })))
}
