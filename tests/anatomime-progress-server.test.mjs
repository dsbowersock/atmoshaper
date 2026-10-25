import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import net from "node:net"
import tls from "node:tls"
import { after, it } from "node:test"
import * as shared from "../lib/anatomime-shared.js"
import * as progress from "../lib/flashcard-progress.js"
import { createCompiledModuleLoader } from "./helpers/compiled-module.mjs"

const originalNetwork = [net.connect, net.createConnection, tls.connect, globalThis.fetch]
const blockNetwork = () => { throw new Error("Progress contract checks must not access a database or provider") }
net.connect = blockNetwork
net.createConnection = blockNetwork
tls.connect = blockNetwork
globalThis.fetch = blockNetwork
after(() => { [net.connect, net.createConnection, tls.connect, globalThis.fetch] = originalNetwork })

const source = await readFile(new URL("../lib/anatomime-progress-server.ts", import.meta.url), "utf8")
const load = createCompiledModuleLoader(import.meta.url)
const { updateAnatomimeNameRecallProgress: record } = load(source, "lib/anatomime-progress-server.contract-test.ts", {
  "./anatomime-shared.ts": shared,
  "./flashcard-progress.ts": progress,
})
const card = shared.createAnatomimeSessionDeck({ seed: "invented-progress-contract", termCount: 4 })[0]
assert.ok(card && shared.getAnatomimeNameRecallPrompt(card.id), "the packaged test prompt must be supported")

/**
 * Models only a transaction's progress collection using invented identities.
 * This proves crediting semantics, never database durability or login/session identity.
 */
function memoryTransaction(seed = [], { failWrite = false } = {}) {
  const rows = structuredClone(seed)
  const calls = { locks: 0, creates: 0, updates: 0, reads: 0 }
  const tx = {
    $queryRaw: async () => { calls.locks += 1; return [] },
    learningProgress: {
      findFirst: async ({ where }) => {
        calls.reads += 1
        const row = rows.find((r) => r.userId === where.userId && r.tool === where.tool && r.anatomyTermId === where.anatomyTermId)
        return row ? structuredClone(row) : null
      },
      create: async ({ data }) => {
        if (failWrite) throw new Error("INVENTED_WRITE_FAILURE")
        calls.creates += 1
        const row = { id: `invented-progress-${rows.length}`, ...structuredClone(data) }
        rows.push(row)
        return structuredClone(row)
      },
      update: async ({ where, data }) => {
        if (failWrite) throw new Error("INVENTED_WRITE_FAILURE")
        calls.updates += 1
        const index = rows.findIndex((row) => row.id === where.id)
        assert.notEqual(index, -1, "an update must target an existing record")
        rows[index] = { ...rows[index], ...structuredClone(data) }
        return structuredClone(rows[index])
      },
    },
  }
  return { tx, rows, calls }
}

function input(overrides = {}) {
  return { userId: "invented-user-a", card, correct: true, score: 100, source: "device-typed", ...overrides }
}

function existing(userId, metadata) {
  return { id: `existing-${userId}`, userId, anatomyTermId: null, tool: shared.anatomimeFlashcardProgressTool(card.id), metadata }
}

it("does not record guest progress or touch an account's existing counters", async () => {
  const seed = [existing("invented-user-b", { correctCount: 2, incorrectCount: 1 })]
  for (const userId of [null, undefined]) {
    const store = memoryTransaction(seed)
    assert.equal(await record(store.tx, input({ userId })), null)
    assert.deepEqual(store.rows, seed)
    assert.deepEqual(store.calls, { locks: 0, creates: 0, updates: 0, reads: 0 })
  }
})

it("credits one first correct answer only to the intended signed-in user", async () => {
  const other = existing("invented-user-b", { correctCount: 2, incorrectCount: 1 })
  const store = memoryTransaction([other])
  await record(store.tx, input())
  const credited = store.rows.find((row) => row.userId === "invented-user-a")
  assert.ok(credited)
  assert.equal(credited.metadata.lifetimeAttemptCount, 1)
  assert.equal(credited.metadata.lifetimeCorrectCount, 1)
  assert.equal(credited.metadata.lifetimeIncorrectCount, 0)
  assert.equal(credited.metadata.sourceTool, "anatomime")
  assert.equal(credited.metadata.source, "device-typed")
  assert.deepEqual(store.rows.find((row) => row.userId === "invented-user-b"), other)
  assert.equal(store.calls.creates, 1)
  assert.equal(store.calls.updates, 0)
})

it("updates an existing prompt row and preserves normalized legacy lifetime counts", async () => {
  const a = existing("invented-user-a", { correctCount: 2, incorrectCount: 1 })
  const b = existing("invented-user-b", { correctCount: 8, incorrectCount: 1 })
  const store = memoryTransaction([a, b])
  await record(store.tx, input())
  const credited = store.rows.find((row) => row.userId === "invented-user-a")
  assert.equal(credited.id, a.id)
  assert.equal(credited.metadata.lifetimeAttemptCount, 4)
  assert.equal(credited.metadata.lifetimeCorrectCount, 3)
  assert.equal(credited.metadata.lifetimeIncorrectCount, 1)
  assert.equal(store.rows.length, 2)
  assert.deepEqual(store.rows.find((row) => row.userId === "invented-user-b"), b)
  assert.equal(store.calls.creates, 0)
  assert.equal(store.calls.updates, 1)
})

it("accumulates a later incorrect attempt without inventing a correct answer or another row", async () => {
  const store = memoryTransaction()
  await record(store.tx, input())
  const firstId = store.rows[0].id
  await record(store.tx, input({ correct: false, score: 0, source: "device-choice" }))
  assert.equal(store.rows.length, 1)
  assert.equal(store.rows[0].id, firstId)
  assert.equal(store.rows[0].metadata.lifetimeAttemptCount, 2)
  assert.equal(store.rows[0].metadata.lifetimeCorrectCount, 1)
  assert.equal(store.rows[0].metadata.lifetimeIncorrectCount, 1)
})

it("does not create progress for a card without a supported packaged prompt", async () => {
  const store = memoryTransaction()
  assert.equal(await record(store.tx, input({ card: { ...card, id: "invented-unsupported-card" } })), null)
  assert.deepEqual(store.rows, [])
  assert.deepEqual(store.calls, { locks: 0, creates: 0, updates: 0, reads: 0 })
})

it("propagates a failed progress write rather than returning a false success", async () => {
  const store = memoryTransaction([], { failWrite: true })
  await assert.rejects(record(store.tx, input()), /INVENTED_WRITE_FAILURE/)
  assert.deepEqual(store.rows, [])
})
