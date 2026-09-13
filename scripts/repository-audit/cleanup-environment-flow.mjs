import {
  COMMONJS_LOADER, MIXED_SOURCE_PROVENANCE, NON_ALIAS, POSSIBLE_COMMONJS_LOADER,
  POSSIBLE_PROCESS_OBJECT, PROCESS_OBJECT, TDZ_BINDING,
} from "./cleanup-environment-scope.mjs"
import { cloneCallableBindings, mergeCallableStates } from "./cleanup-environment-callables.mjs"
import { restoreScopeState } from "./cleanup-flow-state.mjs"

/** Capture every reachable lexical environment so mutually exclusive paths can be joined. */
export function snapshotScopes(scope) {
  const state = new Map()
  const capture = (current) => {
    if (!current || state.has(current)) return
    state.set(current, { bindings: new Map(current.bindings), callables: cloneCallableBindings(current.callables) })
    capture(current.parent)
    for (const callable of current.callables.values()) {
      for (const entry of callable?.entries ?? []) capture(entry.closureScope)
    }
  }
  capture(scope)
  return state
}

export function restoreScopes(rows) {
  restoreScopeState(rows, (scope, state) => {
    scope.bindings = new Map(state.bindings)
    scope.callables = cloneCallableBindings(state.callables)
  })
}

const sourceFamilies = new Map([
  ["proven", "environment"], ["unknown", "environment"], ["environment-container", "container"],
  [PROCESS_OBJECT, "process"], [POSSIBLE_PROCESS_OBJECT, "process"],
  [COMMONJS_LOADER, "loader"], [POSSIBLE_COMMONJS_LOADER, "loader"],
])

/** Cross-family joins retain every potential source instead of selecting one scalar family. */
export function mergeBindingStatuses(left, right) {
  if (left === right) return left
  const leftFamily = sourceFamilies.get(left), rightFamily = sourceFamilies.get(right)
  if ([left, right].includes(MIXED_SOURCE_PROVENANCE) || leftFamily && rightFamily && leftFamily !== rightFamily) {
    return MIXED_SOURCE_PROVENANCE
  }
  if ([left, right].includes("unknown") || [left, right].includes("proven")) return "unknown"
  if ([left, right].includes("environment-container")) return "environment-container"
  if ([left, right].some((value) => [PROCESS_OBJECT, POSSIBLE_PROCESS_OBJECT].includes(value))) {
    return POSSIBLE_PROCESS_OBJECT
  }
  if ([left, right].some((value) => [COMMONJS_LOADER, POSSIBLE_COMMONJS_LOADER].includes(value))) {
    return POSSIBLE_COMMONJS_LOADER
  }
  if ([left, right].includes(TDZ_BINDING)) return NON_ALIAS
  return NON_ALIAS
}

/** Preserve the loader's known function truthiness without weakening established env uncertainty. */
export function mergeLogicalAssignmentStatus(left, right, kind) {
  if (left === COMMONJS_LOADER && ["logical-or-assignment", "logical-nullish-assignment"].includes(kind)) return left
  return mergeBindingStatuses(left, right)
}

/** Join by lexical scope identity without changing the currently executing path. */
export function joinScopeSnapshots(snapshots) {
  if (snapshots.length === 0) return null
  const result = new Map()
  for (const scope of new Set(snapshots.flatMap((state) => [...state.keys()]))) {
    const values = snapshots.flatMap((state) => state.has(scope) ? [state.get(scope)] : [])
    const names = new Set(values.flatMap(({ bindings }) => [...bindings.keys()]))
    const bindings = new Map()
    for (const name of names) {
      const absent = name === "process" ? PROCESS_OBJECT : NON_ALIAS
      bindings.set(name, values.map((value) => value.bindings.get(name) ?? absent).reduce(mergeBindingStatuses))
    }
    const callableNames = new Set(values.flatMap(({ callables }) => [...callables.keys()]))
    const callables = new Map()
    for (const name of callableNames) {
      callables.set(name, values.map((value) => value.callables.get(name) ?? null).reduce(mergeCallableStates))
    }
    result.set(scope, { bindings, callables })
  }
  return result
}

/** Apply a conservative join after mutually exclusive paths have completed. */
export function mergeScopeSnapshots(snapshots) {
  const result = joinScopeSnapshots(snapshots)
  if (result) restoreScopes(result)
  return result
}

/** Clone the complete callable-reachable scope graph before remapping cyclic edges. */
export function cloneScopeChain(scope) {
  if (!scope) return null
  const originals = new Set()
  const collect = (current) => {
    if (!current || originals.has(current)) return
    originals.add(current); collect(current.parent)
    for (const callable of current.callables.values()) {
      for (const entry of callable?.entries ?? []) collect(entry.closureScope)
    }
  }
  collect(scope)
  const copies = new Map([...originals].map((current) => [current, {
    bindings: new Map(current.bindings), callables: new Map(),
    enumMembers: new Map([...current.enumMembers].map(([name, members]) => [name, [...members]])),
    ownsVarBindings: current.ownsVarBindings, parent: null, strict: current.strict,
  }]))
  for (const current of originals) {
    const copy = copies.get(current)
    copy.parent = copies.get(current.parent) ?? null
    copy.callables = cloneCallableBindings(current.callables, copies)
  }
  return copies.get(scope)
}
