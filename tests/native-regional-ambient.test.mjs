import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import test from "node:test"
import { startRegionalBufferPlayback } from "../lib/atmoshaper/regional-buffer-playback.js"

const { concepts } = JSON.parse(readFileSync(new URL("../data/atmoshaper/production-audio-catalog.json", import.meta.url)))
const { runtimePolicy, sources } = concepts.find(({ id }) => id === "moodist-heavy-rain")

function playbackFixture() {
  const buffer = { duration: sources[0].durationSeconds }
  const voices = []
  const gains = []
  const ticks = new Set()
  const context = {
    currentTime: 5,
    async decodeAudioData() { return buffer },
    createBufferSource() {
      const voice = {
        connect() {},
        disconnect() { this.disconnected = true },
        start(...event) { this.started = event },
        stop() { this.stopped = true },
      }
      voices.push(voice)
      return voice
    },
    createGain() {
      const gain = {
        events: [],
        connect() {},
        disconnect() { this.disconnected = true },
        gain: {
          setValueAtTime(value, time) { gain.events.push(["set", value, time]) },
          linearRampToValueAtTime(value, time) { gain.events.push(["linear", value, time]) },
        },
      }
      gains.push(gain)
      return gain
    },
  }
  const options = {
    context, data: new Uint8Array([79, 103, 103, 83]).buffer,
    destination: {}, policy: runtimePolicy, gainDb: -6,
    random: () => 0,
    subscribe(callback) {
      ticks.add(callback)
      return () => ticks.delete(callback)
    },
    reportFailure(error) { throw error },
  }
  return {
    context, buffer, voices, gains, options, ticks,
    tick(time) {
      context.currentTime = time
      for (const run of ticks) run()
    },
  }
}

test("Heavy Rain enqueues one next region and schedules linear crossfades in audio time", async () => {
  const { voices, gains, options, tick } = playbackFixture()
  const random = [0, 0, 1, 1, 0, 0].values()
  const stop = await startRegionalBufferPlayback({ ...options, random: () => random.next().value })
  const sourceGain = 0.5011872336272722
  assert.deepEqual(voices.map(voice => voice.started), [[5, 0, 20], [15, 123.41300000000001, 20]])
  assert.deepEqual(gains[0].events, [["set", sourceGain, 5], ["set", sourceGain, 15], ["linear", 0, 25]])
  assert.deepEqual(gains[1].events, [["set", 0, 15], ["linear", sourceGain, 25], ["linear", 0, 35]])

  // Android pauses the whole context. Repeated scheduler ticks without an
  // advancing audio clock must not enqueue another region or alter a fade.
  for (let pausedTick = 0; pausedTick < 30; pausedTick++) tick(11)
  assert.equal(voices.length, 2)
  tick(15.1)
  assert.equal(voices.length, 3)
  assert.deepEqual(voices[2].started, [25, 0, 20])
  stop()
})

test("stop during decode detaches a copy and leaves no voices for the obsolete request", async () => {
  const { buffer, context, voices, options, ticks } = playbackFixture()
  let finishDecode
  let current = true
  let decodes = 0
  context.decodeAudioData = bytes => {
    decodes++
    assert.deepEqual(new Uint8Array(bytes), new Uint8Array(options.data))
    structuredClone(bytes, { transfer: [bytes] })
    return new Promise(resolve => { finishDecode = resolve })
  }
  const pending = startRegionalBufferPlayback({ ...options, isCurrent: () => current })
  current = false
  finishDecode(buffer)
  await assert.rejects(pending, { name: "AbortError" })
  assert.equal(decodes, 1)
  assert.equal(options.data.byteLength, 4)
  assert.equal(voices.length, 0)
  assert.equal(ticks.size, 0)
})

test("stopping a running region cancels its queued transition before a fresh restart", async () => {
  const { context, voices, gains, options, ticks, tick } = playbackFixture()
  const stop = await startRegionalBufferPlayback(options)
  tick(11)
  stop()
  stop()
  assert.equal(ticks.size, 0)
  assert.ok(voices.every(voice => voice.stopped && voice.disconnected && !voice.onended))
  assert.ok(gains.every(gain => gain.disconnected))
  tick(45)
  assert.equal(voices.length, 2)

  const stopRestart = await startRegionalBufferPlayback(options)
  assert.deepEqual(voices.slice(2).map(voice => voice.started), [[context.currentTime, 0, 20], [55, 0, 20]])
  assert.equal(ticks.size, 1)
  stopRestart()
})
