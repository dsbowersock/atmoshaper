import {
  COMMONJS_LOADER, NON_ALIAS, POSSIBLE_COMMONJS_LOADER,
  POSSIBLE_PROCESS_OBJECT, PROCESS_OBJECT, TDZ_BINDING,
} from "./cleanup-environment-scope.mjs"
import { captureScopeState, restoreScopeState } from "./cleanup-flow-state.mjs"

/** Capture every reachable lexical environment so mutually exclusive paths can be joined. */
export function snapshotScopes(scope) {
  return captureScopeState(scope, (current) => new Map(current.bindings))
}

export function restoreScopes(rows) {
  restoreScopeState(rows, (scope, bindings) => { scope.bindings = new Map(bindings) })
}

export function mergeBindingStatuses(left, right) {
  if (left === right) return left
  if ([left, right].includes("unknown") || [left, right].includes("proven")) return "unknown"
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

/** Join only normal-reaching paths; absent bindings conservatively behave as non-alias values. */
export function mergeScopeSnapshots(snapshots) {
  if (snapshots.length === 0) return null
  const result = new Map()
  for (const scope of new Set(snapshots.flatMap((state) => [...state.keys()]))) {
    const values = snapshots.flatMap((state) => state.has(scope) ? [state.get(scope)] : [])
    const names = new Set(values.flatMap((bindings) => [...bindings.keys()]))
    const bindings = new Map()
    for (const name of names) {
      const absent = name === "process" ? PROCESS_OBJECT : NON_ALIAS
      bindings.set(name, values.map((value) => value.get(name) ?? absent).reduce(mergeBindingStatuses))
    }
    result.set(scope, bindings)
  }
  restoreScopes(result)
  return result
}

/** Deferred bodies need declaration-time visibility without permission to mutate outer flow. */
export function cloneScopeChain(scope) {
  if (!scope) return null
  const parent = cloneScopeChain(scope.parent)
  return {
    bindings: new Map(scope.bindings),
    enumMembers: new Map([...scope.enumMembers].map(([name, members]) => [name, [...members]])),
    ownsVarBindings: scope.ownsVarBindings,
    parent,
    strict: scope.strict,
  }
}
