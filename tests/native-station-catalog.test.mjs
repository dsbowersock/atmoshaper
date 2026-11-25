import test from "node:test"
import assert from "node:assert/strict"
import { listAtmosphereStations } from "../lib/atmosphere/stations.js"
import { nativeStationCatalogJson } from "../lib/native-station-catalog.js"

test("the packaged catalog keeps every station descriptor and identifies the unsupported engine", () => {
  const entries = JSON.parse(nativeStationCatalogJson())
  assert.deepEqual(entries.map(({ station }) => station), JSON.parse(JSON.stringify(listAtmosphereStations())))
  assert.deepEqual(entries.filter(entry => entry.playback === "unsupported").map(({ station }) => [station.id, station.sourceType]), [
    ["mlab-proof-drone", "tone-generator"],
  ])
  assert.equal(entries.filter(entry => entry.playback === "generative-fm").length, 57)
  const bells = entries.find(({ station }) => station.id === "generative-fm-little-bells")
  assert.equal(bells.station.title, "Little Bells")
  assert.equal(bells.station.attribution.artist, "Alex Bainter")
  assert.equal(entries.find(({ station }) => station.id === "observable-streams-probe").playback, "generative-fm")
})
