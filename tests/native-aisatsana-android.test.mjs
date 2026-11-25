import test from "node:test"
import assert from "node:assert/strict"
import { execFileSync } from "node:child_process"
import { createHash } from "node:crypto"
import { mkdir, readFile, writeFile } from "node:fs/promises"
import path from "node:path"
import { setTimeout as delay } from "node:timers/promises"
import { fileURLToPath } from "node:url"
import { chromium } from "playwright"

const root = fileURLToPath(new URL("..", import.meta.url))
const tools = path.join(root, "output/android-tools/sdk/platform-tools")
const adb = path.join(tools, process.platform === "win32" ? "adb.exe" : "adb")
const fixture = { serial: "emulator-5594", name: "AtmoShaper_Pilot_87_92_API35" }
const packageName = "com.atmoshaper.app.development"
const launch = `${packageName}/com.atmoshaper.app.HomeActivity`
const audioService = `${packageName}/com.atmoshaper.app.NativeAudioService`
const output = path.join(root, "output/native-aisatsana-android")
const playerUrl = "https://appassets.androidplatform.net/assets/core/native-audio-player.html"
const hierarchyPath = "/data/local/tmp/atmoshaper-native-aisatsana.xml"
const reattachOnly = process.env.ATMOSHAPER_AISATSANA_REATTACH_ONLY === "1"
const catalogMode = process.env.ATMOSHAPER_NATIVE_STATION_CATALOG_TEST === "1"

const run = (...args) => execFileSync(adb, ["-s", fixture.serial, ...args], {
  timeout: 30_000, windowsHide: true, encoding: "utf8", maxBuffer: 8 * 1024 * 1024,
}).trim()
const shell = (...args) => run("shell", ...args)
const press = code => shell("input", "keyevent", code)

async function waitFor(label, read, timeout = 45_000) {
  const deadline = Date.now() + timeout
  let lastError
  do {
    try {
      const value = await read()
      if (value) return value
    } catch (error) {
      lastError = error
    }
    await delay(180)
  } while (Date.now() < deadline)
  throw new Error(`Missing ${label}`, { cause: lastError })
}

function hierarchy() {
  shell("uiautomator", "dump", hierarchyPath)
  return shell("cat", hierarchyPath)
}

const boundsOf = node => node?.match(/bounds="\[(\d+),(\d+)\]\[(\d+),(\d+)\]"/)?.slice(1).map(Number)

async function tap(label, { attribute = "text", className } = {}) {
  const bounds = await waitFor(label, () => {
    const node = [...hierarchy().matchAll(/<node\b[^>]+>/g)].find(([text]) =>
      text.includes(`${attribute}="${label}"`) && (!className || text.includes(`class="${className}"`)))
    return boundsOf(node?.[0])
  })
  const [left, top, right, bottom] = bounds
  shell("input", "tap", String((left + right) >> 1), String((top + bottom) >> 1))
}

function openHome() {
  shell("am", "start", "-W", "-n", launch)
}

test(catalogMode ? "an audible station switch reuses the same Android media renderer" :
  "actual Aisatsana audio outlives its screen, lock and recent task", {
  skip: process.env.ATMOSHAPER_AISATSANA_ANDROID_TEST !== "1",
  timeout: 300_000,
}, async () => {
  assert.equal(run("emu", "avd", "name").split(/[\r\n]+/)[0], fixture.name)
  shell("test", "-f", "/data/local/tmp/atmoshaper-parity-fixture")
  const apk = path.join(root, "output/android/AtmoShaper-preview.apk")
  const build = JSON.parse(await readFile(path.join(root, "output/android/build-proof.json"), "utf8"))
  assert.equal(createHash("sha256").update(await readFile(apk)).digest("hex"), build.sha256)
  const airplane = shell("settings", "get", "global", "airplane_mode_on") === "1"
  const wifi = shell("settings", "get", "global", "wifi_on") !== "0"
  let browser, port
  const observations = []
  await mkdir(output, { recursive: true })
  const receipt = catalogMode ? "station-catalog.json" : reattachOnly ? "reattachment.json" : "lifecycle.json"
  const report = completed => writeFile(path.join(output, receipt), JSON.stringify({
    apkSha256: build.sha256, fixture: fixture.name, observations, completed, physicalDeviceVerified: false,
  }, null, 2))
  try {
    // Another Stage 1 test may have installed a newer debug preview.
    run("install", "-r", "-d", apk)
    shell("am", "force-stop", packageName)
    shell("cmd", "connectivity", "airplane-mode", "disable")
    shell("svc", "wifi", "enable")
    press("KEYCODE_WAKEUP")
    shell("wm", "dismiss-keyguard")
    openHome()
    await tap("Music")
    assert.match(hierarchy(), /text="Ready to play"/)
    assert.doesNotMatch(shell("dumpsys", "activity", "services", audioService), /isForeground=true/)
    await tap("Play")
    const pid = await waitFor("application process", () => /^\d+$/.test(shell("pidof", packageName)) && shell("pidof", packageName))
    const socket = `webview_devtools_remote_${pid}`
    await waitFor("guarded service WebView", () => shell("cat", "/proc/net/unix").includes(`@${socket}`))
    port = run("forward", "tcp:0", `localabstract:${socket}`)
    assert.match(port, /^\d+$/)
    browser = await chromium.connectOverCDP(`http://127.0.0.1:${port}`, { timeout: 20_000, noDefaults: true })
    const page = await waitFor("audio-only WebView page", () => browser.contexts().flatMap(context => context.pages())
      .find(candidate => candidate.url() === playerUrl))
    const probe = async () => page.evaluate(() => ({
      ...window.atmoNativeAudio?.outputProbe(), documentStart: performance.timeOrigin,
    }))
    let first
    async function audible(phase, stationId = "generative-fm-aisatsana") {
      const reading = await waitFor(`non-silent ${stationId} output while ${phase}`, async () => {
        const sample = await probe()
        return sample.stationId === stationId && sample.peak > 0.00001 && (!first || sample.currentTime > first.currentTime) && sample
      }, catalogMode ? 90_000 : 45_000)
      assert.match(shell("dumpsys", "activity", "services", audioService), /isForeground=true/)
      // An actual Android audio player from the app process must be started as
      // well as the generator producing a waveform at its output gain.
      const actor = new RegExp("(?:pid:|/)" + pid + "\\b")
      const players = shell("dumpsys", "audio").split(/\r?\n/).filter(line => actor.test(line))
      assert.ok(players.some(line => /state:started/i.test(line)), JSON.stringify(players))
      if (first) assert.equal(reading.documentStart, first.documentStart)
      else first = reading
      observations.push({ phase, ...reading, androidPlayerStarted: true })
      await report(false)
      console.log(`Confirmed non-silent Android audio while ${phase}.`)
    }
    await audible("music is visible")
    if (catalogMode) {
      const requests = []
      page.on("request", request => {
        const url = new URL(request.url())
        if (url.origin === "https://media.atmoshaper.com") requests.push(url.pathname)
      })
      await tap("Search stations")
      await tap("native_station_query", { attribute: "resource-id" })
      shell("input", "text", "Little%sBells")
      // Android accessibility exposes the typed query and result with the same text.
      await tap("Little Bells", { className: "android.widget.TextView" })
      assert.match(hierarchy(), /Current station: aisatsana \(generative remix\)/)
      const switchStart = performance.now()
      await tap("Play")
      await audible("Little Bells replaces Aisatsana", "generative-fm-little-bells")
      const media = requests.filter(url => url.includes("/little-bells/"))
      // A verified pack suppresses online reads. When no pack was seeded,
      // both metadata requests must precede the first demanded sample.
      if (media.length) {
        const firstSample = media.findIndex(url => url.endsWith(".ogg"))
        assert.ok(firstSample >= 2)
        assert.ok(media.slice(0, firstSample).some(url => url.endsWith("sample-index.opus.json")))
        assert.ok(media.slice(0, firstSample).some(url => url.endsWith("manifest.opus.json")))
        const samples = media.filter(url => url.endsWith(".ogg"))
        assert.equal(samples.length, new Set(samples).size)
      }
      observations.push({ phase: "station switched", audibleAfterMillis: Math.round(performance.now() - switchStart), media })
      await tap("Stop")
      await waitFor("station output released", () => page.isClosed())
      await report(true)
      return
    }
    if (!reattachOnly) {
      await tap("Back to Home")
      await tap("Open breathing guide")
      await audible("using the breathing guide")
      press("KEYCODE_HOME")
      await audible("the launcher is foregrounded")
      press("KEYCODE_SLEEP")
      await waitFor("display asleep", () => /mWakefulness=Asleep/.test(shell("dumpsys", "power")))
      await audible("the display is locked")
      press("KEYCODE_WAKEUP")
      shell("wm", "dismiss-keyguard")
      openHome()
    }
    press("KEYCODE_APP_SWITCH")
    const [left, top, right, bottom] = await waitFor("exact AtmoShaper Recents card", () => {
      const card = [...hierarchy().matchAll(/<node\b[^>]+>/g)].find(([node]) =>
        node.includes('resource-id="com.android.launcher3:id/task"') &&
        node.includes('content-desc="AtmoShaper Preview"'))
      return boundsOf(card?.[0])
    })
    const center = String((left + right) >> 1)
    shell("input", "swipe", center, String((top + bottom) >> 1), center, String(Math.max(1, top >> 1)), "220")
    await waitFor("Home task removed", () => !shell("dumpsys", "activity", "activities").includes(launch))
    await audible("the Home task is dismissed")
    openHome()
    await tap("Music")
    assert.match(hierarchy(), /text="Playing"/)
    await audible("the recreated Music screen is attached")
    await tap("Pause")
    const paused = await waitFor("suspended output", async () => {
      const sample = await probe()
      return sample.state === "suspended" && sample.peak === 0 && sample
    })
    observations.push({ phase: "paused", ...paused })
    await tap("Play")
    await audible("resumed")
    await tap("Stop")
    await waitFor("stopped service", () => !shell("dumpsys", "activity", "services", audioService).includes("isForeground=true"))
    assert.match(hierarchy(), /text="Ready to play"/)
    await waitFor("audio renderer released", () => page.isClosed())
    observations.push({ phase: "stopped", rendererReleased: true })
    await report(true)
  } finally {
    await browser?.close().catch(() => {})
    if (port) run("forward", "--remove", `tcp:${port}`)
    shell("am", "force-stop", packageName)
    press("KEYCODE_WAKEUP")
    shell("wm", "dismiss-keyguard")
    shell("cmd", "connectivity", "airplane-mode", airplane ? "enable" : "disable")
    shell("svc", "wifi", wifi ? "enable" : "disable")
  }
})
