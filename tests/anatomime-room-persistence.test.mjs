import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import net from "node:net"
import tls from "node:tls"
import { after, it } from "node:test"
import { PrismaClient } from "@prisma/client"
import { createCompiledModuleLoader } from "./helpers/compiled-module.mjs"

const source = await readFile(new URL("../lib/anatomime-room-server.ts", import.meta.url), "utf8")
const load = createCompiledModuleLoader(import.meta.url)
const originalNetwork = [net.connect, net.createConnection, tls.connect, globalThis.fetch]
let networkAttempts = 0
const blockNetwork = () => {
  networkAttempts += 1
  throw new Error("Room persistence regression must never use a provider")
}
net.connect = blockNetwork
net.createConnection = blockNetwork
tls.connect = blockNetwork
globalThis.fetch = blockNetwork
after(() => {
  ;[net.connect, net.createConnection, tls.connect, globalThis.fetch] = originalNetwork
})

/**
 * Runs the actual room factory and installed Prisma compiler while blocking the
 * first database insert. Ordinary mocks cannot catch an omitted client default.
 */
it("supplies a non-null opaque room ID in the generated insert for guest and account hosts", async () => {
  const ids = []
  for (const userId of [null, "invented-account"]) {
    let capturedId
    let roomInserts = 0
    let guards = 0
    let publishes = 0
    const stopSql = async (query) => {
      roomInserts += 1
      const insert = query.sql.match(/INSERT INTO "public"\."AnatomimeRoom" \(([^)]*)\) VALUES \(([^)]*)\)/)
      assert.ok(insert, "the first dispatched SQL must be the room insert")
      const columns = [...insert[1].matchAll(/"([^"]+)"/g)].map((match) => match[1])
      const position = columns.indexOf("id")
      const values = insert[2].split(",").map((value) => value.trim())
      const parameter = values[position]?.match(/^\$(\d+)$/)
      capturedId = parameter ? query.args[Number(parameter[1]) - 1] : undefined
      throw new Error("OFFLINE_ROOM_INSERT_CAPTURED")
    }
    const transaction = {
      provider: "postgres", adapterName: "room-persistence-regression",
      options: { usePhantomQuery: true },
      queryRaw: stopSql, executeRaw: stopSql,
      commit: async () => {}, rollback: async () => {},
    }
    const adapter = {
      ...transaction,
      getConnectionInfo: () => ({ schemaName: "public", supportsRelationJoins: true }),
      startTransaction: async () => transaction, dispose: async () => {},
    }
    const client = new PrismaClient({
      adapter: { provider: "postgres", adapterName: adapter.adapterName, connect: async () => adapter },
      log: [],
    })
    const cards = Array.from({ length: 4 }, (_, index) => ({ id: `invented-${index}` }))
    const service = load(source, "lib/anatomime-room-server.persistence-test.ts", {
      "./auth-security.js": { generateRandomToken: () => "ABC123", hashToken: () => "invented-hash" },
      "./anatomime-session-server.ts": { AnatomimeSessionError: Error },
      "./anatomime-progress-server.ts": { updateAnatomimeNameRecallProgress: async () => {} },
      "./anatomime-realtime.ts": { publishAnatomimeRealtimeEvent: async () => { publishes += 1 } },
      "./anatomime-shared.ts": {
        createAnatomimeSessionDeck: () => cards, getAnatomimeCandidateCards: () => cards,
        normalizeAnatomimeSessionConfig: () => ({
          seed: "invented", selectedCardIds: [], teamNames: ["Invented A", "Invented B"], roundLimit: 1,
        }),
      },
      "./anatomime-room-rules.ts": {
        ANATOMIME_TERMS_PER_TURN: 4, ANATOMIME_ROOM_IDLE_MINUTES: 30, ANATOMIME_TERM_SECONDS: 60,
      },
      "./anatomime-traffic-server.ts": {},
      "./prisma.ts": {
        prisma: {
          anatomimeRoom: { findUnique: async () => null },
          $transaction: client.$transaction.bind(client),
        },
      },
    })
    try {
      await assert.rejects(() => service.createAnatomimeRoom({}, userId, {
        beforePersist: async () => { guards += 1 },
      }))
    } finally {
      await client.$disconnect()
    }
    assert.equal(roomInserts, 1)
    assert.equal(guards, 1)
    assert.equal(publishes, 0)
    assert.equal(typeof capturedId, "string", "Prisma must bind the required room ID")
    assert.ok(capturedId.length > 0, "the room ID must be non-empty")
    ids.push(capturedId)
  }
  assert.notEqual(ids[0], ids[1], "independent creations must receive distinct IDs")
  assert.equal(networkAttempts, 0)
})
