import { describeOfflinePack, offlineAudioCatalog } from "../lib/offline-media.js"
import { mkdir, readFile, writeFile } from "node:fs/promises"

/** Metadata-only public read. Every generator's complete published dependency
 * closure is checked; raw audio downloads remain explicit per selected pack. */
const catalog = offlineAudioCatalog(JSON.parse(await readFile(new URL("../data/atmoshaper/production-audio-catalog.json", import.meta.url))))
const results = []
for (const item of catalog.filter(item => item.kind === "station")) {
  const pack = await describeOfflinePack(item)
  results.push({ id: item.id, sampleCount: pack.files.length, bytes: pack.files.reduce((sum, file) => sum + file.bytes, 0) })
}
await mkdir(new URL("../output/", import.meta.url), { recursive: true })
await writeFile(new URL("../output/offline-station-catalog-proof.json", import.meta.url), JSON.stringify({ checkedAt: new Date().toISOString(), stations: results }, null, 2))
console.log(`Verified complete metadata for ${results.length} stations.`)
