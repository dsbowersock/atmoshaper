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
    const { chromium } = require("@playwright/test")
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

  it("locks a committed legacy migration after partial cleanup and recovers every draft on unlock", () => fixture(async (page) => {
    const failedCreate = await page.evaluate(async () => {
      const f = window.__vaultFixture
      const keys = f.helpers.LEGACY_PROFESSIONAL_RECORD_STORAGE_KEYS
      f.legacyEntries = [
        [keys.soap, JSON.stringify({ schemaVersion: 2, noteType: "soap", clientName: "Invented migration SOAP" })],
        [keys.intake, JSON.stringify({ schemaVersion: 1, templates: [], clients: [{ id: "invented-migration-client", displayName: "Invented migration Intake" }], documents: [] })],
        [keys.journal, JSON.stringify({ schemaVersion: 1, documentType: "client-journal", clientName: "Invented migration Journal", entries: [] })],
        [keys.rom, JSON.stringify({ schemaVersion: 1, documentType: "rom-session", clientName: "Invented migration ROM", entries: [] })],
      ]
      for (const [key, value] of f.legacyEntries) f.stored.set(key, value)
      f.stored.set("invented-unrelated-storage", "preserve these exact unrelated bytes")
      const removeStored = f.stored.delete
      let cleanupFaulted = false
      let faultAfterSoap = false
      // Fault only this fixture's adapter, after real ciphertext commit and SOAP removal.
      f.stored.delete = function (key) {
        if (key === keys.intake && !cleanupFaulted) {
          cleanupFaulted = true
          faultAfterSoap = !f.stored.has(keys.soap)
            && Boolean(f.stored.get(f.helpers.PROFESSIONAL_RECORD_VAULT_STORAGE_KEY))
          throw new Error("Invented controlled legacy cleanup failure")
        }
        return removeStored.call(this, key)
      }
      let created
      try {
        await f.act(async () => { created = await f.api.createVault("invented-vault-fixture-only", "invented-vault-fixture-only") })
      } finally {
        f.stored.delete = removeStored
      }
      f.committedCipher = f.stored.get(f.helpers.PROFESSIONAL_RECORD_VAULT_STORAGE_KEY)
      f.postFaultLegacyEntries = f.legacyEntries.map(([key]) => [key, f.stored.get(key)])
      return { created, status: f.api.status, message: f.api.message, cleanupFaulted, faultAfterSoap }
    })
    assert.equal(failedCreate.created, false)
    assert.equal(failedCreate.status, "locked")
    assert.equal(failedCreate.message, "Encrypted vault saved, but legacy plaintext cleanup is incomplete. Unlock the vault to recover your drafts.")
    assert.equal(failedCreate.cleanupFaulted, true)
    assert.equal(failedCreate.faultAfterSoap, true, "The injected failure must occur after SOAP cleanup and ciphertext commit")
    assert.equal(await page.evaluate(async () => {
      const f = window.__vaultFixture
      const keys = f.helpers.LEGACY_PROFESSIONAL_RECORD_STORAGE_KEYS
      const storedPayload = await f.helpers.decryptEncryptedProfessionalRecordVault(JSON.parse(f.committedCipher), "invented-vault-fixture-only")
      return storedPayload.records.soap.draft.clientName === "Invented migration SOAP"
        && storedPayload.records.intake.workspace.clients[0].displayName === "Invented migration Intake"
        && storedPayload.records.journal.draft.clientName === "Invented migration Journal"
        && storedPayload.records.rom.draft.clientName === "Invented migration ROM"
        && !f.committedCipher.includes("Invented migration")
        && f.api.payload.records.soap.draft === null
        && f.api.payload.records.intake.workspace.clients.length === 0
        && f.api.payload.records.intake.workspace.documents.length === 0
        && f.api.payload.records.journal.draft === null
        && f.api.payload.records.rom.draft === null
        && f.stored.get(keys.intake) === f.legacyEntries[1][1]
        && f.legacyEntries.every(([key, value]) => !f.stored.has(key) || f.stored.get(key) === value)
        && f.stored.get("invented-unrelated-storage") === "preserve these exact unrelated bytes"
    }), true, "Partial cleanup must preserve complete ciphertext, hide plaintext payload and retain failed intake/unrelated bytes")
    const recovered = await page.evaluate(async () => {
      const f = window.__vaultFixture
      let unlocked
      await f.act(async () => { unlocked = await f.api.unlockVault("invented-vault-fixture-only") })
      return {
        unlocked, status: f.api.status,
        soap: f.api.payload.records.soap.draft?.clientName,
        intake: f.api.payload.records.intake.workspace?.clients[0]?.displayName,
        journal: f.api.payload.records.journal.draft?.clientName,
        rom: f.api.payload.records.rom.draft?.clientName,
        ciphertextUnchanged: f.stored.get(f.helpers.PROFESSIONAL_RECORD_VAULT_STORAGE_KEY) === f.committedCipher,
        legacyUnchanged: f.postFaultLegacyEntries.every(([key, value]) => f.stored.get(key) === value),
        unrelated: f.stored.get("invented-unrelated-storage"),
      }
    })
    assert.deepEqual(recovered, {
      unlocked: true, status: "unlocked",
      soap: "Invented migration SOAP", intake: "Invented migration Intake",
      journal: "Invented migration Journal", rom: "Invented migration ROM",
      ciphertextUnchanged: true, legacyUnchanged: true,
      unrelated: "preserve these exact unrelated bytes",
    })
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
      assert.equal(await page.evaluate(async () => {
        const saved = await window.__vaultFixture.pending
        return saved?.records?.soap?.draft?.subjective === "Invented pending note"
      }), true, "A committed save must report success without reopening its locked view")
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
