import ts from "typescript"
import { unwrapTransparentExpression } from "./cleanup-environment-scope.mjs"
import { staticValueKind } from "./cleanup-static-value.mjs"

const cloneState = (state) => state && ({
  entries: new Set(state.entries),
  intrinsics: { ...state.intrinsics },
  maybeNonCallable: state.maybeNonCallable,
  nonCallableKind: state.nonCallableKind,
})

const nonCallableState = (nonCallableKind) => ({
  entries: new Set(), maybeNonCallable: true, nonCallableKind,
})


/** Keep callable identity separate from environment provenance and binding values. */
export function callableState(node, closureScope) {
  return {
    entries: new Set([{ closureScope, identity: {}, node }]), intrinsics: { apply: "valid", call: "valid" },
    maybeNonCallable: false,
  }
}

export function mergeCallableStates(left, right) {
  if (!left && !right) return null
  const entries = new Set()
  for (const entry of [...(left?.entries ?? []), ...(right?.entries ?? [])]) {
    if (![...entries].some((known) => known.identity === entry.identity ||
      known.node === entry.node && known.closureScope === entry.closureScope)) {
      entries.add(entry)
    }
  }
  const nonCallableKinds = [
    !left || left.maybeNonCallable ? left?.nonCallableKind ?? "unknown" : null,
    !right || right.maybeNonCallable ? right?.nonCallableKind ?? "unknown" : null,
  ].filter(Boolean)
  const callableParts = [left, right].filter((state) => state?.entries.size > 0)
  const intrinsics = Object.fromEntries(["apply", "call"].map((name) => {
    const capabilities = callableParts.map((state) => state.intrinsics?.[name] ?? "valid")
    return [name, new Set(capabilities).size === 1 ? capabilities[0] : "possible"]
  }))
  return {
    entries, intrinsics,
    maybeNonCallable: !left || !right || left.maybeNonCallable || right.maybeNonCallable,
    nonCallableKind: new Set(nonCallableKinds).size === 1 ? nonCallableKinds[0] : "unknown",
  }
}

export function cloneCallableBindings(bindings, scopeCopies = null) {
  return new Map([...bindings].map(([name, state]) => [name, state && ({
    entries: new Set([...state.entries].map((entry) => scopeCopies?.has(entry.closureScope)
      ? { ...entry, closureScope: scopeCopies.get(entry.closureScope) } : entry)),
    intrinsics: { ...state.intrinsics },
    maybeNonCallable: state.maybeNonCallable,
    nonCallableKind: state.nonCallableKind,
  })]))
}

export function lookupCallable(scope, name) {
  for (let current = scope; current; current = current.parent) {
    if (current.callables.has(name)) return current.callables.get(name)
  }
  return null
}

export function bindCallableName(name, initializer, scope, initializerScope = scope, statusSnapshot) {
  let owner = scope
  while (owner && !owner.bindings.has(name)) owner = owner.parent
  if (owner) owner.callables.set(name, statusSnapshot === undefined
    ? callableExpressionState(initializer, initializerScope) : statusSnapshot)
}

export function declareCallableBindingName(name, scope, preserveExisting = false) {
  if (ts.isIdentifier(name)) {
    if (!preserveExisting || !scope.callables.has(name.text)) scope.callables.set(name.text, null)
  } else if (ts.isObjectBindingPattern(name) || ts.isArrayBindingPattern(name)) {
    for (const element of name.elements) if (ts.isBindingElement(element)) {
      declareCallableBindingName(element.name, scope, preserveExisting)
    }
  }
}

/** Resolve only lexical identifiers and syntax whose result identity is statically bounded. */
export function callableExpressionState(node, scope) {
  const value = unwrapTransparentExpression(node)
  if (!value) return null
  if (ts.isFunctionLike(value)) return callableState(value, scope)
  if (ts.isIdentifier(value)) return cloneState(lookupCallable(scope, value.text))
  const literalKind = staticValueKind(value)
  if (literalKind !== "unknown") return nonCallableState(literalKind)
  if (ts.isConditionalExpression(value)) return mergeCallableStates(
    callableExpressionState(value.whenTrue, scope), callableExpressionState(value.whenFalse, scope),
  )
  if (ts.isBinaryExpression(value) && value.operatorToken.kind === ts.SyntaxKind.CommaToken) {
    return callableExpressionState(value.right, scope)
  }
  if (ts.isBinaryExpression(value) && [
    ts.SyntaxKind.AmpersandAmpersandToken, ts.SyntaxKind.BarBarToken,
    ts.SyntaxKind.QuestionQuestionToken,
  ].includes(value.operatorToken.kind)) {
    const left = callableExpressionState(value.left, scope)
    const right = callableExpressionState(value.right, scope)
    if (left && !left.maybeNonCallable) {
      return value.operatorToken.kind === ts.SyntaxKind.AmpersandAmpersandToken ? right : left
    }
    return mergeCallableStates(left, right)
  }
  if (ts.isBinaryExpression(value) && ts.isAssignmentOperator(value.operatorToken.kind)) {
    const right = callableExpressionState(value.right, scope)
    if (value.operatorToken.kind === ts.SyntaxKind.EqualsToken) return right
    if ([
      ts.SyntaxKind.AmpersandAmpersandEqualsToken, ts.SyntaxKind.BarBarEqualsToken,
      ts.SyntaxKind.QuestionQuestionEqualsToken,
    ].includes(value.operatorToken.kind)) {
      // Once evaluated, a logical assignment returns its target's post-write value.
      return callableExpressionState(value.left, scope) ?? right
    }
    // Arithmetic and bitwise compound assignments convert both operands to primitives.
    return nonCallableState("unknown")
  }
  return null
}

/** Let shared logical flow use a callable's bounded runtime truthiness. */
export function callableLogicalBranches(target, scope, kind) {
  const value = unwrapTransparentExpression(target)
  if (!value || !ts.isIdentifier(value)) return null
  let owner = scope
  while (owner && !owner.callables.has(value.text)) owner = owner.parent
  const state = owner?.callables.get(value.text)
  if (!state) return null
  let execute = null, skip = null
  const add = (branch, part) => branch ? mergeCallableStates(branch, part) : cloneState(part)
  if (state.entries.size > 0) {
    const callable = { entries: new Set(state.entries), intrinsics: { ...state.intrinsics }, maybeNonCallable: false }
    if (kind === "logical-and-assignment") execute = add(execute, callable)
    else skip = add(skip, callable)
  }
  if (state.maybeNonCallable) {
    const nonCallable = nonCallableState(state.nonCallableKind ?? "unknown")
    const executes = kind === "logical-and-assignment"
      ? nonCallable.nonCallableKind === "truthy"
      : kind === "logical-or-assignment"
        ? ["falsy", "nullish"].includes(nonCallable.nonCallableKind)
        : nonCallable.nonCallableKind === "nullish"
    const unknown = nonCallable.nonCallableKind === "unknown"
    if (executes || unknown) execute = add(execute, nonCallable)
    if (!executes || unknown) skip = add(skip, nonCallable)
  }
  return { execute, name: value.text, owner, preserveEnvironmentJoin: state.entries.size === 0, skip }
}

const staticMemberName = (node) => ts.isPropertyAccessExpression(node) ? node.name.text :
  ts.isElementAccessExpression(node) && node.argumentExpression &&
  (ts.isStringLiteral(node.argumentExpression) || ts.isNoSubstitutionTemplateLiteral(node.argumentExpression))
    ? node.argumentExpression.text : null

/** Apply writes with the operator-specific truthiness of inherited call/apply methods. */
export function invalidateCallableIntrinsicMutation(node, scope) {
  let target = ts.isBinaryExpression(node) && ts.isAssignmentOperator(node.operatorToken.kind) ? node.left :
    (ts.isPrefixUnaryExpression(node) || ts.isPostfixUnaryExpression(node)) &&
      [ts.SyntaxKind.PlusPlusToken, ts.SyntaxKind.MinusMinusToken].includes(node.operator) ? node.operand :
      ts.isDeleteExpression(node) ? node.expression : null
  target = unwrapTransparentExpression(target)
  if (!target || !(ts.isPropertyAccessExpression(target) || ts.isElementAccessExpression(target)) ||
    !["call", "apply"].includes(staticMemberName(target))) return null
  const intrinsicName = staticMemberName(target)
  const receiver = callableExpressionState(target.expression, scope)
  if (!receiver?.entries.size) return null
  const operator = ts.isBinaryExpression(node) ? node.operatorToken.kind : null
  const priorCapability = receiver.intrinsics?.[intrinsicName] ?? "valid"
  const skipRight = [ts.SyntaxKind.BarBarEqualsToken, ts.SyntaxKind.QuestionQuestionEqualsToken].includes(operator) &&
    priorCapability === "valid"
  const executeRight = operator === ts.SyntaxKind.AmpersandAmpersandEqualsToken && priorCapability === "valid"
  const nextCapability = (prior) => {
    if (ts.isDeleteExpression(node)) return "valid"
    if ([ts.SyntaxKind.BarBarEqualsToken, ts.SyntaxKind.QuestionQuestionEqualsToken].includes(operator)) {
      return prior === "valid" ? "valid" : prior
    }
    if (operator === ts.SyntaxKind.AmpersandAmpersandEqualsToken) {
      return prior === "valid" ? "invalid" : prior
    }
    return "invalid"
  }
  const scopes = new Set()
  const addScope = (current) => {
    if (!current || scopes.has(current)) return
    scopes.add(current); addScope(current.parent)
    for (const state of current.callables.values()) {
      for (const entry of state?.entries ?? []) addScope(entry.closureScope)
    }
  }
  addScope(scope)
  const receiverIdentities = new Set([...receiver.entries].map((entry) => entry.identity ?? entry))
  const apply = () => {
    scopes.clear(); addScope(scope)
    for (const current of scopes) for (const [bindingName, state] of current.callables) {
      if (state?.entries && [...state.entries].some((entry) => receiverIdentities.has(entry.identity ?? entry))) {
        current.callables.set(bindingName, {
          ...state, intrinsics: {
            ...state.intrinsics,
            [intrinsicName]: receiverIdentities.size > 1 || receiver.maybeNonCallable
              ? "possible" : nextCapability(priorCapability),
          },
        })
      }
    }
  }
  const mutation = { apply, executeRight, skipRight }
  if (!ts.isBinaryExpression(node)) apply()
  return mutation
}

export { createEnvironmentFunctionInvoker } from "./cleanup-environment-invocation.mjs"
