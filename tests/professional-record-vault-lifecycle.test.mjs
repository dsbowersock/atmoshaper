import assert from "node:assert/strict"
import fs from "node:fs"
import { createRequire } from "node:module"
import { after, before, describe, it } from "node:test"
import { createProfessionalVaultLifecycleBundle, withProfessionalVaultLifecycleFixture } from "./fixtures/professional-record-vault-lifecycle-harness.mjs"

const require = createRequire(import.meta.url)

/** Create a real encrypted fixture vault; the record adapter remains an in-memory Map. */
async function createVault(page) {
  await page.evaluate(async () => {
    const f = window.__vaultFixture
    await f.act(async () => { await f.api.createVault("invented-vault-fixture-only", "invented-vault-fixture-only") })
  })
  assert.equal(await page.evaluate(() => window.__vaultFixture.api.status), "unlocked")
}

/** Start an accepted save without awaiting its held crypto continuation. */
async function holdSave(page, seam) {
  await page.evaluate(async (kind) => {
    const f = window.__vaultFixture
    f.holdNext = kind
    await f.act(async () => { f.pending = f.api.saveDraft("soap", { subjective: "Invented pending note" }) })
  }, seam)
  await page.waitForFunction(() => Boolean(window.__vaultFixture.gate), null, { timeout: 10_000 })
}

/** Apply the real lock method and flush React's committed view before releasing work. */
async function lock(page) {
  await page.evaluate(async () => { const f = window.__vaultFixture; await f.act(async () => { f.api.lockVault() }) })
  assert.equal(await page.evaluate(() => window.__vaultFixture.api.status), "locked")
}

/** Release one controlled boundary and await both the operation and React state commit. */
async function release(page) {
  await page.evaluate(async () => { const f = window.__vaultFixture; const gate = f.gate; f.gate = null; await f.act(async () => { gate.resolve(); await f.pending }) })
}

describe("Professional-record vault lifecycle", { concurrency: false, timeout: 120_000 }, () => {
  let browser, bundle
  before(async () => {
    const { chromium } = require("playwright")
    assert.ok(fs.existsSync(chromium.executablePath()), "Use cached Chromium; never download a browser in this suite")
    bundle = await createProfessionalVaultLifecycleBundle()
    browser = await chromium.launch({ headless: true, args: ["--disable-background-networking", "--disable-component-update", "--disable-domain-reliability", "--disable-sync"] })
  })
  after(async () => { await browser?.close() })
  const fixture = (run) => withProfessionalVaultLifecycleFixture(browser, bundle, run)

  it("saves normally and recovers the encrypted draft after a fresh unlock", () => fixture(async (page) => {
    await createVault(page)
    await page.evaluate(async () => { const f = window.__vaultFixture; await f.act(async () => { await f.api.saveDraft("soap", { subjective: "Invented saved note" }) }) })
    await lock(page)
    await page.evaluate(async () => { const f = window.__vaultFixture; await f.act(async () => { await f.api.unlockVault("invented-vault-fixture-only") }) })
    assert.equal(await page.evaluate(() => window.__vaultFixture.api.payload.records.soap.draft.subjective), "Invented saved note")
  }))

  it("retains create, save and unlock behavior through Strict Mode effect replay", () => fixture(async (page) => {
    await page.evaluate(async () => { const f = window.__vaultFixture; await f.unmount(); await f.mount(true) })
    await createVault(page)
    await page.evaluate(async () => { const f = window.__vaultFixture; await f.act(async () => { await f.api.saveDraft("soap", { subjective: "Invented strict-mode note" }) }) })
    await lock(page)
    await page.evaluate(async () => { const f = window.__vaultFixture; await f.act(async () => { await f.api.unlockVault("invented-vault-fixture-only") }) })
    assert.equal(await page.evaluate(() => window.__vaultFixture.api.payload.records.soap.draft.subjective), "Invented strict-mode note")
  }))

  for (const seam of ["decrypt-vault", "encrypt-vault"]) {
    it(`keeps the view locked when an accepted save finishes after ${seam}`, () => fixture(async (page) => {
      await createVault(page)
      await holdSave(page, seam)
      await lock(page)
      await release(page)
      assert.equal(await page.evaluate(() => window.__vaultFixture.api.status), "locked")
      assert.equal(await page.evaluate(() => window.__vaultFixture.api.payload.records.soap.draft), null)
      assert.equal(await page.evaluate(async () => {
        const f = window.__vaultFixture
        const raw = f.stored.get(f.helpers.PROFESSIONAL_RECORD_VAULT_STORAGE_KEY)
        const payload = await f.helpers.decryptEncryptedProfessionalRecordVault(JSON.parse(raw), "invented-vault-fixture-only")
        return payload.records.soap.draft.subjective === "Invented pending note" && !raw.includes("Invented pending note")
      }), true, "Lock must preserve the accepted encrypted save without reopening the view")
    }))
  }

  it("waits for an accepted save before a fresh unlock reads the vault", () => fixture(async (page) => {
    await createVault(page); await holdSave(page, "decrypt-vault"); await lock(page)
    await page.evaluate(async () => {
      const f = window.__vaultFixture
      f.callsBeforeUnlock = f.cryptoCalls["decrypt-vault"]
      await f.act(async () => { f.unlockPending = f.api.unlockVault("invented-vault-fixture-only") })
    })
    assert.equal(await page.evaluate(() => { const f = window.__vaultFixture; return f.cryptoCalls["decrypt-vault"] === f.callsBeforeUnlock }), true, "Fresh unlock must wait before reading an older ciphertext")
    await release(page)
    await page.evaluate(async () => { const f = window.__vaultFixture; await f.act(async () => { await f.unlockPending }) })
    assert.equal(await page.evaluate(() => window.__vaultFixture.api.status), "unlocked")
    assert.equal(await page.evaluate(() => window.__vaultFixture.api.payload.records.soap.draft.subjective), "Invented pending note")
  }))

  it("rejects a new save invoked through an expired context callback", () => fixture(async (page) => {
    await createVault(page)
    await page.evaluate(() => { const f = window.__vaultFixture; f.expiredApi = f.api; f.originalCipher = f.stored.get(f.helpers.PROFESSIONAL_RECORD_VAULT_STORAGE_KEY) })
    await lock(page)
    await page.evaluate(async () => { const f = window.__vaultFixture; await f.act(async () => { f.expiredResult = await f.expiredApi.saveDraft("soap", { subjective: "Invented expired callback" }) }) })
    assert.equal(await page.evaluate(() => window.__vaultFixture.api.status), "locked")
    assert.equal(await page.evaluate(() => { const f = window.__vaultFixture; return f.expiredResult === null && f.stored.get(f.helpers.PROFESSIONAL_RECORD_VAULT_STORAGE_KEY) === f.originalCipher }), true)
  }))

  it("does not apply an unlock completion after a later lock", () => fixture(async (page) => {
    await createVault(page); await lock(page)
    await page.evaluate(async () => { const f = window.__vaultFixture; f.holdNext = "decrypt-vault"; await f.act(async () => { f.pending = f.api.unlockVault("invented-vault-fixture-only") }) })
    await page.waitForFunction(() => Boolean(window.__vaultFixture.gate), null, { timeout: 10_000 })
    await lock(page); await release(page)
    assert.equal(await page.evaluate(() => window.__vaultFixture.api.status), "locked")
  }))

  it("keeps a later lock while accepted vault creation finishes encrypted", () => fixture(async (page) => {
    await page.evaluate(async () => { const f = window.__vaultFixture; f.holdNext = "encrypt-vault"; await f.act(async () => { f.pending = f.api.createVault("invented-vault-fixture-only", "invented-vault-fixture-only") }) })
    await page.waitForFunction(() => Boolean(window.__vaultFixture.gate), null, { timeout: 10_000 })
    await lock(page); await release(page)
    assert.equal(await page.evaluate(() => window.__vaultFixture.api.status), "locked")
    assert.equal(await page.evaluate(() => { const f = window.__vaultFixture; return f.helpers.isEncryptedProfessionalRecordVault(JSON.parse(f.stored.get(f.helpers.PROFESSIONAL_RECORD_VAULT_STORAGE_KEY))) }), true)
  }))

  it("carries an accepted import's original view through its later persistence", () => fixture(async (page) => {
    await createVault(page)
    await page.evaluate(async () => {
      const f = window.__vaultFixture
      await f.act(async () => { await f.api.saveDraft("soap", { subjective: "Invented imported note" }) })
      await f.act(async () => { f.bundle = await f.api.exportEncryptedBundle("invented-bundle-fixture-only") })
      await f.act(async () => { await f.api.saveDraft("soap", { subjective: "Invented note replaced by import" }) })
    })
    await page.evaluate(async () => { const f = window.__vaultFixture; f.holdNext = "decrypt-bundle"; await f.act(async () => { f.pending = f.api.importEncryptedBundle(JSON.stringify(f.bundle), "invented-bundle-fixture-only") }) })
    await page.waitForFunction(() => Boolean(window.__vaultFixture.gate), null, { timeout: 10_000 })
    await lock(page); await release(page)
    assert.equal(await page.evaluate(() => window.__vaultFixture.api.status), "locked")
    assert.equal(await page.evaluate(() => window.__vaultFixture.api.payload.records.soap.draft), null)
    assert.equal(await page.evaluate(async () => {
      const f = window.__vaultFixture
      const raw = f.stored.get(f.helpers.PROFESSIONAL_RECORD_VAULT_STORAGE_KEY)
      return (await f.helpers.decryptEncryptedProfessionalRecordVault(JSON.parse(raw), "invented-vault-fixture-only")).records.soap.draft.subjective === "Invented imported note"
    }), true)
  }))

  it("does not replace the lock message with a stale save error", () => fixture(async (page) => {
    await createVault(page); await holdSave(page, "decrypt-vault"); await lock(page)
    await page.evaluate(async () => { const f = window.__vaultFixture; const gate = f.gate; f.gate = null; await f.act(async () => { gate.reject(new Error("Invented controlled decrypt failure")); await f.pending }) })
    assert.equal(await page.evaluate(() => window.__vaultFixture.api.message), "Professional-record vault locked.")
  }))

  it("allows an accepted encrypted export without replacing the later lock message", () => fixture(async (page) => {
    await createVault(page)
    await page.evaluate(async () => { const f = window.__vaultFixture; f.holdNext = "encrypt-bundle"; await f.act(async () => { f.pending = f.api.exportEncryptedBundle("invented-bundle-fixture-only") }) })
    await page.waitForFunction(() => Boolean(window.__vaultFixture.gate), null, { timeout: 10_000 })
    await lock(page); await release(page)
    assert.equal(await page.evaluate(() => window.__vaultFixture.api.message), "Professional-record vault locked.")
    assert.equal(await page.evaluate(async () => { const f = window.__vaultFixture; return (await f.pending)?.format === f.helpers.PROFESSIONAL_RECORD_VAULT_BUNDLE_FORMAT }), true)
  }))

  it("recovers an accepted save after its issuing provider unmounts", () => fixture(async (page) => {
    await createVault(page); await holdSave(page, "encrypt-vault")
    await page.evaluate(async () => { const f = window.__vaultFixture; await f.unmount(); await f.mount() })
    assert.equal(await page.evaluate(() => window.__vaultFixture.api.status), "locked")
    await release(page)
    assert.equal(await page.evaluate(() => window.__vaultFixture.api.status), "locked")
    await page.evaluate(async () => { const f = window.__vaultFixture; await f.act(async () => { await f.api.unlockVault("invented-vault-fixture-only") }) })
    assert.equal(await page.evaluate(() => window.__vaultFixture.api.payload.records.soap.draft.subjective), "Invented pending note")
  }))

  it("does not restore an older ciphertext after reset and recreation across provider remounts", () => fixture(async (page) => {
    await createVault(page); await holdSave(page, "decrypt-vault")
    await page.evaluate(async () => {
      const f = window.__vaultFixture
      await f.unmount()
      f.stored.set(f.helpers.PROFESSIONAL_RECORD_VAULT_STORAGE_KEY, "invalid fixture metadata")
      await f.mount()
      await f.act(async () => { f.api.resetCorruptVault() })
      await f.act(async () => { await f.api.createVault("invented-replacement-only", "invented-replacement-only") })
      f.replacementCipher = f.stored.get(f.helpers.PROFESSIONAL_RECORD_VAULT_STORAGE_KEY)
    })
    await release(page)
    assert.equal(await page.evaluate(() => { const f = window.__vaultFixture; return f.stored.get(f.helpers.PROFESSIONAL_RECORD_VAULT_STORAGE_KEY) === f.replacementCipher }), true)
    assert.equal(await page.evaluate(() => window.__vaultFixture.api.payload.records.soap.draft), null)
  }))
})
