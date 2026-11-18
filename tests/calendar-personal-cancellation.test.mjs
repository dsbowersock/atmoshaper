import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import { describe, it } from "node:test"
import { createCompiledModuleLoader } from "./helpers/compiled-module.mjs"

const source = await readFile(new URL("../app/calendar/actions/cancel-personal.ts", import.meta.url), "utf8")
const load = createCompiledModuleLoader(import.meta.url)

/** Execute the production action with invented DB state; no provider or network is available. */
function fixture(options = {}) {
  const snapshot = {
    id: "event-test", practiceId: "practice-test", ownerUserId: "therapist-test", kind: "PERSONAL",
    status: "ACTIVE", blocksAvailability: true, startsAt: new Date("2026-11-20T17:00:00Z"),
    endsAt: new Date("2026-11-20T17:15:00Z"), practice: { slug: "invented-practice" }, personalBlock: { id: "block-test" },
    ...options.snapshot,
  }
  const current = { ...snapshot, ...options.current }
  const actor = options.actor ?? "therapist-test"
  const calls = []; let updated; let committed = false
  const tx = {
    calendarEvent: {
      findUnique: async () => { calls.push("locked-read"); return current },
      updateMany: async (value) => { calls.push("update"); updated = value; return { count: options.changedCount ?? 1 } },
    },
    practiceMembership: { findUnique: async () => ({ role: options.currentRole ?? options.role ?? "THERAPIST" }) },
  }
  const prisma = {
    calendarEvent: { findUnique: async () => snapshot },
    $transaction: async (work) => { calls.push("transaction"); await work(tx); committed = true; calls.push("commit") },
  }
  const actionModule = load(source, "app/calendar/actions/cancel-personal.ts", {
    "server-only": {}, "@/lib/prisma": { prisma },
    "@/lib/calendar-readiness": { assertCalendarDatabaseReady: async () => {} },
    "@/lib/calendar-sync-service": { pushCalendarEventToGoogleBestEffort: async (id) => {
      assert.equal(committed, true); assert.equal(id, snapshot.id); calls.push("google")
      return options.googleFailure ? { pushed: false, error: "Calendar sync failed." } : { deleted: true }
    } },
    "next/navigation": { redirect: (path) => { assert.equal(path, `/calendar/availability?block=cancelled${options.googleFailure ? "&google=error" : ""}`); calls.push("redirect") } },
    "./availability": { lockAppointmentSchedulingRows: async (db, input) => {
      assert.equal(db, tx); assert.equal(input.practiceId, snapshot.practiceId)
      assert.equal(input.therapistId, snapshot.ownerUserId); assert.deepEqual(input.eventIds, [snapshot.id]); calls.push("lock")
    } },
    "./audit": { writeCalendarAuditAndNotifications: async (db, input) => {
      assert.equal(db, tx); assert.deepEqual(input.payload, { status: "CANCELLED" }); calls.push("audit")
    } },
    "./revalidation": { revalidateCalendarRoutes: () => calls.push("revalidate") },
    "./access": {
      THERAPIST_ROLES: ["OWNER", "THERAPIST"], currentUserId: async () => actor,
      fieldString: (data, key) => String(data.get(key) ?? ""),
      assertPracticeAccess: async () => ({ role: options.role ?? "THERAPIST" }),
    },
  })
  const data = new FormData(); data.set("eventId", snapshot.id)
  return { run: () => actionModule.cancelPersonalEvent(data), calls, updated: () => updated }
}

describe("personal block cancellation", () => {
  it("retains history and clears only the owned event after locked checks, then removes the Google mirror", async () => {
    const f = fixture(); await f.run()
    assert.deepEqual(f.calls, ["transaction", "lock", "locked-read", "update", "audit", "commit", "google", "revalidate", "redirect"])
    assert.deepEqual(f.updated().data, { status: "CANCELLED", blocksAvailability: false })
    assert.equal(f.updated().where.id, "event-test")
    assert.equal(f.updated().where.practiceId, "practice-test")
    assert.equal(f.updated().where.ownerUserId, "therapist-test")
    assert.equal(f.updated().where.kind, "PERSONAL")
    assert.equal(f.updated().where.status, "ACTIVE")
  })
  it("allows practice owners to cancel a provider block", async () => {
    const f = fixture({ role: "OWNER", actor: "practice-owner" }); await f.run(); assert.ok(f.updated())
  })
  for (const options of [
    { actor: "other-therapist" }, { role: "STAFF" }, { role: "CLIENT" },
    { snapshot: { kind: "APPOINTMENT" } }, { snapshot: { kind: "CLASS" } },
    { snapshot: { personalBlock: null } }, { snapshot: { ownerUserId: null } },
  ]) {
    it(`rejects forged/unowned cancellation ${JSON.stringify(options)}`, async () => {
      const f = fixture(options); await assert.rejects(f.run()); assert.equal(f.updated(), undefined); assert.equal(f.calls.includes("google"), false)
    })
  }
  for (const options of [
    { currentRole: "STAFF" }, { current: { ownerUserId: "reassigned-owner" } },
    { current: { practiceId: "different-practice" } }, { current: { kind: "APPOINTMENT" } },
    { current: { startsAt: new Date("2026-11-20T18:00:00Z") } }, { current: { status: "COMPLETED" } },
    { changedCount: 0 },
  ]) {
    it(`rejects a changed locked snapshot ${JSON.stringify(options)}`, async () => {
      const f = fixture(options); await assert.rejects(f.run()); assert.equal(f.calls.includes("commit"), false); assert.equal(f.calls.includes("google"), false)
    })
  }
  it("does not duplicate audit/history for an already cancelled block", async () => {
    const f = fixture({ current: { status: "CANCELLED", blocksAvailability: false } }); await f.run()
    assert.equal(f.updated(), undefined); assert.equal(f.calls.includes("audit"), false); assert.equal(f.calls.includes("google"), true)
  })
  it("reports a Google failure after retaining the committed local cancellation", async () => {
    const f = fixture({ googleFailure: true }); await f.run()
    assert.equal(f.updated().data.status, "CANCELLED")
    assert.ok(f.calls.indexOf("commit") < f.calls.indexOf("google"))
    assert.equal(f.calls.at(-1), "redirect")
  })
})
