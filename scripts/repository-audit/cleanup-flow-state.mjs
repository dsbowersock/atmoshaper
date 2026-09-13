/** Capture lexical state by scope identity so branch-local scopes cannot shift outer joins. */
export function captureScopeState(scope, capture) {
  const state = new Map()
  for (let current = scope; current; current = current.parent) state.set(current, capture(current))
  return state
}

export function restoreScopeState(state, restore) {
  for (const [scope, value] of state) restore(scope, value)
}

/** Merge values only among snapshots that contain the same lexical scope identity. */
export function mergeScopeStates(states, merge, restore) {
  if (states.length === 0) return null
  const scopes = new Set(states.flatMap((state) => [...state.keys()]))
  const result = new Map()
  for (const scope of scopes) {
    const values = states.flatMap((state) => state.has(scope) ? [state.get(scope)] : [])
    if (values.length > 0) result.set(scope, values.reduce(merge))
  }
  restoreScopeState(result, restore)
  return result
}
