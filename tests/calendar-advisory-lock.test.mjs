import assert from "node:assert/strict"
import { EventEmitter } from "node:events"
import { readFile } from "node:fs/promises"
import { createRequire } from "node:module"
import net from "node:net"
import tls from "node:tls"
import { after, it } from "node:test"
import { PrismaClient } from "@prisma/client"
import { createCompiledModuleLoader } from "./helpers/compiled-module.mjs"

const require = createRequire(import.meta.url)
const { PrismaNeon } = require("@prisma/adapter-neon")
const originals = [net.Socket.prototype.connect, tls.connect, globalThis.fetch]
const blocked = () => { throw new Error("OFFLINE_CALENDAR_LOCK_NETWORK_BLOCKED") }
net.Socket.prototype.connect = blocked; tls.connect = blocked; globalThis.fetch = blocked
after(() => { [net.Socket.prototype.connect, tls.connect, globalThis.fetch] = originals })

const load = createCompiledModuleLoader(import.meta.url)
const read = (file) => readFile(new URL(`../${file}`, import.meta.url), "utf8")
const setupSource = await read("app/calendar/actions/setup.ts")
// Expose the existing private helper only in the in-memory test module.
const setup = load(setupSource + "\nexport { lockPracticeSlugAllocation }", "app/calendar/actions/setup.lock-test.ts", {
  "server-only": {}, "next/cache": {}, "next/navigation": {}, "@/lib/prisma": {},
  "@/lib/calendar": {}, "@/lib/calendar-readiness": {}, "@/lib/membership": {},
  "@/lib/service-catalog": {}, "./access": {},
})
const ids = load(await read("lib/public-request-id.ts"), "lib/public-request-id.lock-test.ts")
const owners = load(await read("lib/public-request-owner.ts"), "lib/public-request-owner.lock-test.ts", {
  "server-only": {}, "./public-request-id.ts": ids,
})
const requests = load(await read("lib/public-booking-idempotency.ts"), "lib/public-booking-idempotency.lock-test.ts", {
  "server-only": {}, "./public-request-owner.ts": owners,
})

/** Real installed Prisma/Neon conversion, invented wire responses, no PG connection.
 * The fake wire accepts the lock call; real parameter and decoder behavior is exercised.
 * This proves neither database lock contention nor the prior browser's SQL cause.
 */
async function withClient(run) {
  const factory = new PrismaNeon({ connectionString: "postgresql://invented:invented@127.0.0.1:1/invented" })
  const adapter = await factory.connect(), pool = adapter.underlyingDriver(), queries = [], compiled = []
  const connection = new EventEmitter()
  connection.release = () => {}
  connection.query = async (options, args) => {
    const sql = options.text ?? options
    if (!sql.includes("pg_advisory_xact_lock")) return { fields: [], rows: [], rowCount: 0 }
    queries.push({ sql, args })
    const prefixLock = sql.includes("hashtextextended")
    if (!prefixLock) assert.match(sql, /pg_advisory_xact_lock\(\$1(?:::int)?,\s*\$2(?:::int)?\)/)
    if (prefixLock) assert.match(sql, /pg_advisory_xact_lock\(hashtextextended\(\$1, 0\)\)/)
    return { fields: [{ name: "pg_advisory_xact_lock", dataTypeID: sql.trim().endsWith("::text") ? 25 : 2278 }], rows: [[""]], rowCount: 1 }
  }
  pool.connect = async () => connection; pool.query = connection.query; pool.end = async () => {}
  const start = adapter.startTransaction.bind(adapter)
  adapter.startTransaction = async (...args) => {
    const tx = await start(...args), query = tx.queryRaw.bind(tx)
    tx.queryRaw = async (value) => { compiled.push(value); return query(value) }
    return tx
  }
  const client = new PrismaClient({ adapter: { provider: "postgres", adapterName: factory.adapterName, connect: async () => adapter }, log: [] })
  try { return await run(client, queries, compiled) } finally { await client.$disconnect() }
}

it("actual practice slug lock preserves both keys with int4 overload and decodable output", async () => {
  await withClient(async (client, queries, compiled) => {
    await client.$transaction((tx) => setup.lockPracticeSlugAllocation(tx))
    assert.equal(queries.length, 1)
    assert.deepEqual(queries[0].args.map(Number), [8520, 1])
    assert.match(queries[0].sql, /pg_advisory_xact_lock\(\$1::int,\s*\$2::int\)::text/)
    assert.deepEqual(compiled[0].argTypes.map((type) => type.scalarType), ["decimal", "decimal"])
  })
})

it("actual booking and waitlist locks keep the UUID prefix independent of selection", async () => {
  const selection = { requestId: "00000000-0000-4000-8000-000000000001", primaryServiceVariantId: "invented-variant",
    addOnServiceVariantIds: [], requestedPressureLevel: 3, requestedStartsAt: "2030-01-01T15:00:00.000Z", preferredProviderId: "" }
  const first = requests.publicBookingRequestOwner(selection)
  const changed = requests.publicBookingRequestOwner({ ...selection, requestedPressureLevel: 4 })
  const { requestedStartsAt, ...waitlistSelection } = selection
  const waitlist = requests.publicWaitlistRequestOwner({ ...waitlistSelection, preferredStartsAt: requestedStartsAt })
  assert.notEqual(first.id, changed.id)
  await withClient(async (client, queries, compiled) => {
    await client.$transaction(async (tx) => {
      for (const owner of [first, changed, waitlist]) await requests.acquirePublicRequestLock(tx, owner)
    })
    assert.deepEqual(queries.map((query) => query.args), [[first.prefix], [first.prefix], [waitlist.prefix]])
    assert.ok(compiled.every((query) => query.argTypes.length === 1 && query.argTypes[0].scalarType === "string"))
    assert.ok(queries.every((query) => !query.sql.includes(first.selectionDigest)))
  })
})

it("original practice query reaches the decoder with decimal parameters and an unsupported void result", async () => {
  await withClient(async (client, queries, compiled) => {
    await assert.rejects(client.$transaction((tx) => tx.$queryRaw`SELECT pg_advisory_xact_lock(${8520}, ${1})`),
      (error) => error.code === "P2010" && JSON.stringify(error.meta ?? {}).includes("void"))
    assert.deepEqual(compiled[0].argTypes.map((type) => type.scalarType), ["decimal", "decimal"])
    assert.deepEqual(queries[0].args.map(Number), [8520, 1])
  })
})

it("installed decoder rejects both native void results even with valid lock signatures", async () => {
  await withClient(async (client) => {
    const isVoidFailure = (error) => error.code === "P2010" && JSON.stringify(error.meta ?? {}).includes("void")
    await assert.rejects(client.$transaction((tx) => tx.$queryRaw`SELECT pg_advisory_xact_lock(${8520}::int, ${1}::int)`), isVoidFailure)
    await assert.rejects(client.$transaction((tx) => tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtextextended(${"invented-prefix"}, 0))`), isVoidFailure)
  })
})

it("practice owner and slug locks remain before quota, lookup and create in the transaction", () => {
  const body = setupSource.slice(setupSource.indexOf("export async function createPractice("), setupSource.indexOf("export async function createAvailabilityRule("))
  const ordered = ["await prisma.$transaction(async (tx)", "await lockPracticeCreationOwner(tx, userId)",
    "await lockPracticeSlugAllocation(tx)", "await tx.practiceMembership.count", "await tx.practice.findUnique", "return tx.practice.create"]
  const indexes = ordered.map((text) => body.indexOf(text))
  assert.ok(indexes.every((value, index) => value >= 0 && (index === 0 || value > indexes[index - 1])))
})
