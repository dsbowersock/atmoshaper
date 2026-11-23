import test from "node:test"
import assert from "node:assert/strict"
import { createStationTransportScope } from "../lib/offline-station-transport.js"

function fixture() {
  let next = 0
  const pending = new Map()
  const transport = { clear(id) { pending.delete(id) } }
  for (const method of ["schedule", "scheduleOnce", "scheduleRepeat"]) transport[method] = callback => { const id = ++next; pending.set(id, callback); return id }
  return { transport, pending }
}

test("stopping a piece clears discarded repeat IDs and recursively registered events only", () => {
  const { transport, pending } = fixture()
  const outside = transport.scheduleRepeat(() => {})
  const first = createStationTransportScope(transport)
  let calls = 0, nested
  const repeat = first.run(() => transport.scheduleRepeat(() => { calls++; nested = transport.scheduleOnce(() => { calls++ }) }))
  const oldCallback = pending.get(repeat)
  oldCallback()
  assert.ok(pending.has(nested))
  const next = createStationTransportScope(transport)
  const replacement = next.run(() => transport.scheduleRepeat(() => {}))
  first.stop(); first.stop()
  oldCallback()
  assert.equal(calls, 1, "a callback already dispatched before Stop cannot reschedule after it")
  assert.deepEqual([...pending.keys()], [outside, replacement])
  next.stop()
  assert.deepEqual([...pending.keys()], [outside])
})

test("failed scheduling restores shared methods and cancels acquired registrations", () => {
  const { transport, pending } = fixture()
  const original = transport.scheduleRepeat
  const scope = createStationTransportScope(transport)
  assert.throws(() => scope.run(() => { transport.scheduleRepeat(() => {}); throw new Error("schedule failure") }), /schedule failure/)
  assert.equal(transport.scheduleRepeat, original)
  scope.stop()
  assert.equal(pending.size, 0)
  const cleanup = transport.scheduleOnce(() => {})
  assert.ok(pending.has(cleanup), "upstream deactivation can still schedule its final gain disposal outside the stopped scope")
})
