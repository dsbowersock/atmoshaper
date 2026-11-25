import ambientCatalog from "@/data/atmoshaper/production-audio-catalog.json"
import { createNativeAudioDownloads } from "@/lib/native-audio-downloads"
import { hasNativeStationPlayer } from "@/lib/native-station-catalog"
import { createOfflineMediaStore, offlineAudioCatalog } from "@/lib/offline-media"

const items = offlineAudioCatalog(ambientCatalog)
  .filter(item => "station" in item ? hasNativeStationPlayer(item.station) : item.kind === "ambient")
type Downloads = ReturnType<typeof createNativeAudioDownloads>
const host = window as Window & {
  AtmoShaperDownloadsHost?: { postMessage(message: string): void }
  atmoNativeAudioDownloads?: Downloads
}
const post = (event: unknown) => host.AtmoShaperDownloadsHost?.postMessage(JSON.stringify(event))
const downloads = createNativeAudioDownloads({
  items, store: createOfflineMediaStore(), report: post,
  fetchImpl: (url, init) => window.fetch(url, init),
  // A repair checks one failed sample with a context that cannot play audio.
  decodeReplacement: data => new OfflineAudioContext(1, 1, 48_000).decodeAudioData(data.slice(0)),
})
host.atmoNativeAudioDownloads = downloads
window.addEventListener("pagehide", downloads.cancel)
post({ catalog: items.map(({ id, title, kind }) => ({ id, title, kind })) })
