/** Own registrations made by a piece's synchronous schedule function and its
 * Transport callbacks. Restore the shared methods immediately; ambient audio
 * and other owners keep their events. Piece deactivation runs outside this
 * scope so the upstream wrapper's final gain-disposal callback can still run. */
export function createStationTransportScope(transport) {
  const events = new Set()
  let stopped = false
  function run(action) {
    if (stopped) return undefined
    const originals = new Map()
    for (const name of ["schedule", "scheduleOnce", "scheduleRepeat"]) {
      const original = transport[name]
      originals.set(name, original)
      transport[name] = function (callback, ...args) {
        const id = original.call(this, (...values) => {
          if (name === "scheduleOnce") events.delete(id)
          return run(() => callback(...values))
        }, ...args)
        events.add(id)
        return id
      }
    }
    try { return action() }
    finally { for (const [name, original] of originals) transport[name] = original }
  }
  return {
    run,
    stop() {
      stopped = true
      for (const id of events) transport.clear(id)
      events.clear()
    },
  }
}
