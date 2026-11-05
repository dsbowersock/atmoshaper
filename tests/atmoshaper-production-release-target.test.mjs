import assert from "node:assert/strict"
import { spawnSync } from "node:child_process"
import { mkdtempSync, rmSync, rmdirSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { fileURLToPath } from "node:url"
import test, { after } from "node:test"

const script = fileURLToPath(new URL("../scripts/atmoshaper-production-release.mjs", import.meta.url))
const cwd = mkdtempSync(join(tmpdir(), "atmo-release-target-"))
after(() => {
  rmSync(join(cwd, "release-stage.json"), { force: true })
  rmdirSync(cwd)
})
const publicMedia = "https://media.atmoshaper.com"
const legacy = "https://media.massagelab.app"
const blockedFetch = "data:text/javascript," + encodeURIComponent('globalThis.fetch = () => { throw Error("UNEXPECTED_NETWORK_REQUEST") }')
const fixedEnv = Object.fromEntries(["PATH", "SystemRoot", "WINDIR", "TEMP", "TMP"].filter(k => process.env[k]).map(k => [k, process.env[k]]))

function command(args, env = {}) {
  return spawnSync(process.execPath, ["--import", blockedFetch, script, ...args], {
    cwd,
    env: { ...fixedEnv, ...env },
    encoding: "utf8",
    windowsHide: true,
    timeout: 15000,
  })
}

function check(args, env) {
  const result = command(["check", "--ffmpeg-path", join(cwd, "absent-ffmpeg"), "--ffprobe-path", join(cwd, "absent-ffprobe"), ...args], env)
  assert.equal(result.status, 0, result.stderr)
  return JSON.parse(result.stdout.slice(result.stdout.lastIndexOf("\n{") + 1))
}

test("configured branded URL and bucket are selected by the real check command", () => {
  const result = check([], {
    MASSAGELAB_PUBLIC_MEDIA_PUBLIC_BASE_URL: publicMedia + "/",
    MASSAGELAB_PUBLIC_MEDIA_BUCKET: "public-media",
  })
  assert.equal(result.publicBaseUrl, publicMedia)
  assert.equal(result.bucket, "public-media")
})
test("the explicit legacy override and unconfigured fallback remain available", () => {
  const env = { MASSAGELAB_PUBLIC_MEDIA_PUBLIC_BASE_URL: publicMedia }
  assert.equal(check(["--public-base-url", legacy], env).publicBaseUrl, legacy)
  const result = check([])
  assert.equal(result.publicBaseUrl, legacy)
  assert.equal(result.bucket, "massagelab-public-media")
})
test("known branded and legacy destinations cannot be paired with the wrong bucket", () => {
  for (const env of [
    { MASSAGELAB_PUBLIC_MEDIA_PUBLIC_BASE_URL: publicMedia },
    { MASSAGELAB_PUBLIC_MEDIA_BUCKET: "public-media" },
  ]) {
    const result = command(["check"], env)
    assert.equal(result.status, 1)
    assert.match(result.stderr, /requires/)
    assert.doesNotMatch(result.stderr, /UNEXPECTED_NETWORK_REQUEST/)
  }
})

test("equivalent known origins cannot bypass bucket guards", () => {
  for (const [publicBaseUrl, bucket] of [
    ["https://MEDIA.ATMOSHAPER.COM", "massagelab-public-media"],
    [`${publicMedia}:443`, "massagelab-public-media"],
    ["https://MEDIA.MASSAGELAB.APP", "public-media"],
    [`${legacy}:443`, "public-media"],
  ]) {
    const result = command(["check"], {
      MASSAGELAB_PUBLIC_MEDIA_PUBLIC_BASE_URL: publicBaseUrl,
      MASSAGELAB_PUBLIC_MEDIA_BUCKET: bucket,
    })
    assert.equal(result.status, 1, `Expected bucket refusal for ${publicBaseUrl}`)
    assert.match(result.stderr, /requires/)
    assert.doesNotMatch(result.stderr, /UNEXPECTED_NETWORK_REQUEST/)
  }
})

test("valid normalized release authorities preserve the configured base", () => {
  for (const [publicBaseUrl, bucket] of [
    ["https://MEDIA.ATMOSHAPER.COM", "public-media"],
    [`${publicMedia}:443/reviewed-prefix`, "public-media"],
    ["https://MEDIA.MASSAGELAB.APP", "massagelab-public-media"],
    ["https://invented-cdn.example.test/reviewed-prefix", "public-media"],
  ]) {
    const result = check([], {
      MASSAGELAB_PUBLIC_MEDIA_PUBLIC_BASE_URL: publicBaseUrl,
      MASSAGELAB_PUBLIC_MEDIA_BUCKET: bucket,
    })
    assert.equal(result.publicBaseUrl, publicBaseUrl)
    assert.equal(result.bucket, bucket)
  }
})
test("upload stops before probing when its configured origin differs from the staged origin", () => {
  writeFileSync(join(cwd, "release-stage.json"), JSON.stringify({
    version: 1,
    releaseKind: "atmoshaper-production-r2-stage",
    bucket: "public-media",
    publicBaseUrl: legacy,
    audioObjects: [{ publicUrl: legacy + "/inert.opus" }],
  }))
  const result = command(["upload", "--staging-root", cwd], {
    CLOUDFLARE_ACCOUNT_ID: "invented-account",
    R2_ACCESS_KEY_ID: "invented-key",
    R2_SECRET_ACCESS_KEY: "invented-secret",
    MASSAGELAB_PUBLIC_MEDIA_BUCKET: "public-media",
    MASSAGELAB_PUBLIC_MEDIA_PUBLIC_BASE_URL: publicMedia,
  })
  assert.equal(result.status, 1)
  assert.match(result.stderr, /R2 stage public URL differs/)
  assert.doesNotMatch(result.stderr, /UNEXPECTED_NETWORK_REQUEST/)
})
