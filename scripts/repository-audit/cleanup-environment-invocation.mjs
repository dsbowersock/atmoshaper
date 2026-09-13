import ts from "typescript"
import { MIXED_SOURCE_PROVENANCE, NON_ALIAS, POSSIBLE_PROCESS_OBJECT, PROCESS_OBJECT, TDZ_BINDING } from "./cleanup-environment-scope.mjs"
import { callableExpressionState, callableState, lookupCallable, mergeCallableStates } from "./cleanup-environment-callables.mjs"
import { parameterBindingInput } from "./cleanup-environment-parameters.mjs"
import { mergeBindingStatuses, mergeScopeSnapshots } from "./cleanup-environment-flow.mjs"

/** Only the enclosing function's body vars copy parameters; nested function/static scopes own their vars. */
function bodyVarNames(node, names = new Set()) {
  if (!node || ts.isFunctionLike(node) || ts.isClassStaticBlockDeclaration(node)) return names
  const add = (name) => {
    if (ts.isIdentifier(name)) names.add(name.text)
    else if (ts.isObjectBindingPattern(name) || ts.isArrayBindingPattern(name)) {
      for (const element of name.elements) if (ts.isBindingElement(element)) add(element.name)
    }
  }
  if (ts.isVariableDeclarationList(node) && !(node.flags & ts.NodeFlags.BlockScoped)) {
    for (const declaration of node.declarations) add(declaration.name)
  }
  ts.forEachChild(node, (child) => { bodyVarNames(child, names) })
  return names
}

const sameInputs = (left, right) => left.length === right.length && left.every((input, index) => {
  const other = right[index]
  if (!input?.usesDefault && input?.literalKey == null && !input?.callable?.entries.size &&
    !["proven", PROCESS_OBJECT].includes(input?.environment)) return false
  return input?.environment === other?.environment && input?.kind === other?.kind &&
    input?.literalKey === other?.literalKey && input?.usesDefault === other?.usesDefault &&
    [...(input?.callable?.entries ?? [])].every((entry) =>
      [...(other?.callable?.entries ?? [])].some((otherEntry) => entry.identity === otherEntry.identity)) &&
    (input?.callable?.entries.size ?? 0) === (other?.callable?.entries.size ?? 0)
})

function hasParameterExpressions(node) {
  if (node.initializer || ts.isComputedPropertyName(node)) return true
  return Boolean(ts.forEachChild(node, hasParameterExpressions))
}

/** Execute proven lexical callables at call time while bounding recursive re-entry. */
export function createEnvironmentFunctionInvoker(context) {
  const {
    annexBDeclarations, assignName, bindName, bindPatternElementInitializers,
    captureInput, childScope, cloneScopeChain, control, declareBindingName, hasStrictDirective, onExhaustion,
    predeclareBindingName, predeclareVarEnvironmentShadows, processObjectSourceStatus, recordObjectBinding,
    snapshotScopes, valueStatus, varBindingScope, visit, visitArgument,
  } = context
  const active = []
  let depth = 0, remaining = 0
  return function invoke(node, incomingScope, immediate = false, call = null) {
    if (depth === 0) remaining = 128
    if (remaining-- <= 0 || depth >= 64) {
      // Deferred inspection cannot widen its declaring scope, even when expansion is exhausted.
      if (!immediate) incomingScope = cloneScopeChain(incomingScope)
      // An exhausted expansion may return or throw and may change reachable bindings.
      // Keep a deterministic hash-only receipt; no host execution or timing controls analysis.
      onExhaustion(node)
      for (const scope of snapshotScopes(incomingScope).keys()) {
        for (const [name, status] of scope.bindings) if (status !== TDZ_BINDING) {
          scope.bindings.set(name, mergeBindingStatuses(status, "unknown"))
        }
        for (const [name, state] of scope.callables) scope.callables.set(name, mergeCallableStates(state, null))
      }
      const state = snapshotScopes(incomingScope)
      return { normal: state, throws: [state] }
    }
    const inputs = [...(call?.argumentStatuses ?? []), ...(call?.unknownFromIndex != null ? [{ environment: "unknown" }] : [])]
    const identity = call?.entry?.identity ?? incomingScope
    if (immediate && active.some((entry) => entry.node === node && entry.identity === identity && sameInputs(entry.inputs, inputs))) {
      // Identical active invocations retain the existing noncompletion boundary;
      // a different callback or primitive input may reach a finite base case.
      return { normal: null, throws: [] }
    }
    if (annexBDeclarations.has(node)) {
      const owner = varBindingScope(incomingScope)
      assignName(node.name.text, undefined, owner)
      owner.callables.set(node.name.text, callableState(node, incomingScope))
    }
    if (immediate) active.push({ node, identity, inputs })
    depth += 1
    const result = control.visitFunctionRegion(incomingScope, () => {
      const outerScope = immediate ? incomingScope : cloneScopeChain(incomingScope)
      const parameterScope = childScope(outerScope, false, outerScope.strict || hasStrictDirective(node.body))
      if (ts.isFunctionExpression(node) && node.name) {
        declareBindingName(node.name, parameterScope)
        // A self name denotes this invocation's function object, including its aliases.
        const existing = lookupCallable(outerScope, node.name.text)
        const entry = call?.entry ?? [...(existing?.entries ?? [])].find((entry) => entry.node === node)
        parameterScope.callables.set(node.name.text, entry ? {
          entries: new Set([entry]), intrinsics: { ...(call?.intrinsics ?? existing?.intrinsics) }, maybeNonCallable: false,
        } : callableState(node, outerScope))
      }
      for (const parameter of node.parameters) predeclareBindingName(parameter.name, parameterScope, TDZ_BINDING, true)
      for (const [index, parameter] of node.parameters.entries()) {
        const unknownArgument = call?.unknownFromIndex !== null && call?.unknownFromIndex !== undefined &&
          index >= call.unknownFromIndex
        const passed = immediate && !parameter.dotDotDotToken && (
          unknownArgument || index < (call?.arguments.length ?? 0)
        )
        let captured = unknownArgument ? { environment: "unknown", maybeDefault: true } : passed ? call.argumentStatuses[index] : null
        const supplied = passed && !captured?.usesDefault
        const source = supplied ? call.arguments[index] : parameter.initializer
        const processSource = ts.isObjectBindingPattern(parameter.name) && (
          supplied && [PROCESS_OBJECT, POSSIBLE_PROCESS_OBJECT, MIXED_SOURCE_PROVENANCE].includes(captured?.environment)
            ? captured.environment === MIXED_SOURCE_PROVENANCE ? POSSIBLE_PROCESS_OBJECT : captured.environment : processObjectSourceStatus(source, parameterScope)
        )
        const possibleDefault = supplied && captured?.maybeDefault && parameter.initializer
        const skipped = possibleDefault ? snapshotScopes(parameterScope) : null
        let defaultValue = null
        if ((!supplied || possibleDefault) && parameter.initializer) {
          const normal = visitArgument(parameter.initializer, parameterScope) !== false
          if (normal) defaultValue = captureInput(parameter.initializer, parameterScope)
          if (skipped) mergeScopeSnapshots([skipped, ...(normal ? [snapshotScopes(parameterScope)] : [])])
          else if (!normal) return false
        }
        if (!supplied) captured = defaultValue
        let status = supplied ? captured?.environment : valueStatus(source, parameterScope)
        if (possibleDefault && defaultValue) status = mergeBindingStatuses(status ?? NON_ALIAS, defaultValue.environment ?? NON_ALIAS)
        if (ts.isIdentifier(parameter.name)) {
          if (supplied || source) bindName(parameter.name.text, source, parameterScope, parameterScope, status)
          else declareBindingName(parameter.name, parameterScope)
          const callable = supplied ? captured?.callable ?? null : callableExpressionState(source, parameterScope)
          parameterScope.callables.set(parameter.name.text, possibleDefault && defaultValue
            ? mergeCallableStates(callable, defaultValue.callable) : callable)
        } else if (ts.isObjectBindingPattern(parameter.name) || ts.isArrayBindingPattern(parameter.name)) {
          const input = parameterBindingInput(source, status, parameterScope, {
            captureInput, captured, control, getterScope: supplied ? call.argumentScope : parameterScope,
            invoke, snapshotScopes, valueStatus, unknown: !immediate && !source,
          })
          if (ts.isObjectBindingPattern(parameter.name)) recordObjectBinding(parameter.name, status, "parameter-destructure")
          if (bindPatternElementInitializers(
            parameter.name, parameterScope, parameterScope, "parameter-destructure", processSource, visitArgument, input,
          ) === false) return false
        }
      }
      if (immediate && node.asteriskToken) return true
      const separatesVars = node.parameters.some(hasParameterExpressions)
      const functionScope = separatesVars ? childScope(parameterScope, true) : parameterScope
      if (!separatesVars) parameterScope.ownsVarBindings = true
      else for (const name of bodyVarNames(node.body)) if (parameterScope.bindings.has(name)) {
        functionScope.bindings.set(name, parameterScope.bindings.get(name))
        functionScope.callables.set(name, parameterScope.callables.get(name))
      }
      if (node.body) predeclareVarEnvironmentShadows(node.body, functionScope)
      return !node.body || visit(node.body, functionScope) !== false
    }, immediate && Boolean(node.modifiers?.some((modifier) => modifier.kind === ts.SyntaxKind.AsyncKeyword)))
    depth -= 1
    if (immediate) active.pop()
    return result
  }
}
