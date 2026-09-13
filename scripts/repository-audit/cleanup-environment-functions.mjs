import ts from "typescript"
import { mergeScopeSnapshots, restoreScopes, snapshotScopes } from "./cleanup-environment-flow.mjs"
import { unwrapTransparentExpression } from "./cleanup-environment-scope.mjs"
import { staticValueKind } from "./cleanup-static-value.mjs"

const logicalOperators = new Set([
  ts.SyntaxKind.AmpersandAmpersandToken, ts.SyntaxKind.BarBarToken, ts.SyntaxKind.QuestionQuestionToken,
])

const methodName = (node) => ts.isPropertyAccessExpression(node) ? node.name.text :
  ts.isElementAccessExpression(node) && node.argumentExpression &&
  (ts.isStringLiteral(node.argumentExpression) || ts.isNoSubstitutionTemplateLiteral(node.argumentExpression))
    ? node.argumentExpression.text : null

const executesRight = (operator, kind) => operator === ts.SyntaxKind.AmpersandAmpersandToken
  ? kind === "truthy" || kind === "callable"
  : operator === ts.SyntaxKind.BarBarToken ? ["falsy", "nullish"].includes(kind) : kind === "nullish"

const staticallyUndefined = (node, identifierKind) => {
  const value = unwrapTransparentExpression(node)
  if (!value) return false
  if (ts.isIdentifier(value)) return value.text === "undefined" && identifierKind(value.text) === "nullish"
  if (ts.isVoidExpression(value)) return true
  return ts.isBinaryExpression(value) && value.operatorToken.kind === ts.SyntaxKind.CommaToken &&
    staticallyUndefined(value.right, identifierKind)
}

const staticallyNullish = (node, identifierKind) => {
  const value = unwrapTransparentExpression(node)
  if (!value) return false
  if (value.kind === ts.SyntaxKind.NullKeyword || staticallyUndefined(value, identifierKind)) return true
  return ts.isBinaryExpression(value) && value.operatorToken.kind === ts.SyntaxKind.CommaToken &&
    staticallyNullish(value.right, identifierKind)
}

const callableOutcomes = (callable, state) => [
  ...[...callable.entries].map((entry) => ({
    entry, intrinsics: { ...callable.intrinsics }, kind: "callable", value: entry.node, closureScope: entry.closureScope, state,
  })),
  ...(callable.maybeNonCallable ? [{ kind: callable.nonCallableKind ?? "unknown", state }] : []),
]

/** Classify the first lexical reference evaluated while resolving a call target. */
export function callReferenceKind(node, statusForName, tdzStatus) {
  let value = unwrapTransparentExpression(node)
  while (value && (ts.isPropertyAccessExpression(value) || ts.isElementAccessExpression(value))) {
    value = unwrapTransparentExpression(value.expression)
  }
  if (!value || !ts.isIdentifier(value)) return "safe"
  const status = statusForName(value.text)
  return status === tdzStatus ? "throws" : status === null ? "possible" : "safe"
}

/** Evaluate callee alternatives independently; each outcome owns its lexical entry state. */
export function visitImmediateCall(
  node, scope, visit, visitArgument, visitFunctionLike, captureThrowState, identifierKind,
  resolveCallable = () => null, resolveCallableExpression = () => null, argumentStatus = () => null,
) {
  const optional = Boolean(node.questionDotToken || node.expression.questionDotToken)
  let recognized = optional
  const evaluate = (expression) => {
    const value = unwrapTransparentExpression(expression)
    if (value && ts.isFunctionLike(value)) {
      recognized = true
      const callable = resolveCallableExpression(value)
      if (callable) return callableOutcomes(callable, snapshotScopes(scope))
      return [{ intrinsics: { apply: "valid", call: "valid" }, kind: "callable", value, state: snapshotScopes(scope) }]
    }
    if (value && ts.isIdentifier(value)) {
      const callable = resolveCallable(value.text)
      if (callable) {
        recognized = true
        const state = snapshotScopes(scope)
        return callableOutcomes(callable, state)
      }
    }
    if (value && ts.isBinaryExpression(value) && value.operatorToken.kind === ts.SyntaxKind.CommaToken) {
      recognized = true
      return visit(value.left, scope) === false ? [] : evaluate(value.right)
    }
    if (value && ts.isConditionalExpression(value)) {
      recognized = true
      if (visit(value.condition, scope) === false) return []
      const entry = snapshotScopes(scope), outcomes = []
      for (const branch of [value.whenTrue, value.whenFalse]) {
        restoreScopes(entry); outcomes.push(...evaluate(branch))
      }
      return outcomes
    }
    if (value && ts.isBinaryExpression(value) && logicalOperators.has(value.operatorToken.kind)) {
      recognized = true
      const outcomes = []
      for (const left of evaluate(value.left)) {
        const definite = executesRight(value.operatorToken.kind, left.kind)
        const skips = !definite && left.kind !== "unknown"
        if (!definite) outcomes.push(left)
        if (!skips) { restoreScopes(left.state); outcomes.push(...evaluate(value.right)) }
      }
      return outcomes
    }
    if (value && (ts.isPropertyAccessExpression(value) || ts.isElementAccessExpression(value)) &&
      ["call", "apply"].includes(methodName(value))) {
      recognized = true
      return evaluate(value.expression).flatMap((outcome) => {
        // A second intrinsic layer has its own receiver; it cannot invoke the original body directly.
        if (outcome.callMode || outcome.composedLayers) return [{
          ...outcome, kind: "unknown", callMode: undefined, memberCanThrow: true,
          composedLayers: [...(outcome.composedLayers ?? [value.expression]), value],
        }]
        const callMode = methodName(value)
        const wrapped = { ...outcome, callMode, memberCanThrow: !value.questionDotToken }
        const capability = outcome.intrinsics?.[callMode] ?? "valid"
        if (outcome.kind !== "callable" || capability === "valid") return [wrapped]
        const invalid = { kind: "unknown", memberCanThrow: wrapped.memberCanThrow, state: outcome.state }
        return capability === "invalid" ? [invalid] : [wrapped, invalid]
      })
    }
    if (value && ts.isBinaryExpression(value) && ts.isAssignmentOperator(value.operatorToken.kind)) {
      recognized = true
      if (visit(value, scope) === false) return []
      const state = snapshotScopes(scope)
      const callable = resolveCallableExpression(value)
      if (callable) return callableOutcomes(callable, state)
      const right = unwrapTransparentExpression(value.right)
      const kind = staticValueKind(right, identifierKind)
      const outcome = { kind, value: kind === "callable" ? right : undefined, state }
      return value.operatorToken.kind === ts.SyntaxKind.EqualsToken ? [outcome] : [
        outcome, { kind: "unknown", state: outcome.state },
      ]
    }
    const kind = staticValueKind(value, identifierKind)
    if (kind !== "unknown") recognized = true
    if (kind === "unknown" && !recognized) return []
    if (visit(value, scope) === false) return []
    return [{ kind, state: snapshotScopes(scope) }]
  }

  const outcomes = evaluate(node.expression)
  if (!recognized) return null
  if (outcomes.length === 0) return false
  const normal = []
  for (const outcome of outcomes) {
    restoreScopes(outcome.state)
    if (outcome.kind === "throws") { captureThrowState(outcome.state); continue }
    if (outcome.memberCanThrow && ["nullish", "unknown"].includes(outcome.kind)) {
      captureThrowState(outcome.state)
      if (outcome.kind === "nullish") continue
    }
    if (optional && ["nullish", "unknown"].includes(outcome.kind)) normal.push(outcome.state)
    if (optional && outcome.kind === "nullish") continue
    let argumentsComplete = true, unknownFromIndex = null
    const invocationArguments = [], argumentStatuses = []
    const capture = (argument, supplied = true) => {
      if (!visitArgument(argument, scope)) { argumentsComplete = false; return }
      if (supplied) {
        invocationArguments.push(argument)
        argumentStatuses.push({ ...argumentStatus(argument, scope), usesDefault: staticallyUndefined(argument, identifierKind) })
      }
    }
    const expandArguments = (argumentsToExpand, dropFirst = false) => {
      let position = 0
      const append = (argument) => {
        const supplied = !dropFirst || position > 0
        position += 1
        if (unknownFromIndex !== null) capture(argument, false)
        else capture(argument, supplied)
      }
      const expand = (argument) => {
        if (!ts.isSpreadElement(argument)) { append(argument); return }
        const spread = unwrapTransparentExpression(argument.expression)
        if (spread && ts.isArrayLiteralExpression(spread)) {
          for (const element of spread.elements) {
            if (!argumentsComplete) break
            if (ts.isSpreadElement(element)) { expand(element); continue }
            if (ts.isOmittedExpression(element)) {
              const supplied = !dropFirst || position > 0
              position += 1
              if (supplied && unknownFromIndex === null) {
                invocationArguments.push(element); argumentStatuses.push({ usesDefault: true })
              }
            } else append(element)
          }
          return
        }
        if (!visitArgument(argument, scope)) { argumentsComplete = false; return }
        unknownFromIndex ??= invocationArguments.length
      }
      for (const argument of argumentsToExpand) if (argumentsComplete) expand(argument)
    }
    if (outcome.callMode === "call") expandArguments(node.arguments, true)
    else if (outcome.callMode === "apply") {
      // Evaluate and flatten the outer argument list before selecting thisArg/list.
      // Array members were already evaluated; applying the list must not replay them.
      expandArguments(node.arguments)
      const list = unwrapTransparentExpression(invocationArguments[1]), listStatus = argumentStatuses[1]
      const outerUnknown = unknownFromIndex
      invocationArguments.length = 0; argumentStatuses.length = 0
      unknownFromIndex = outerUnknown !== null && outerUnknown <= 1 ? 0 : null
      const appendList = (array) => {
        for (const element of array.elements) {
          if (ts.isSpreadElement(element)) {
            const spread = unwrapTransparentExpression(element.expression)
            if (spread && ts.isArrayLiteralExpression(spread)) appendList(spread)
            else unknownFromIndex ??= invocationArguments.length
          } else if (unknownFromIndex === null) {
            invocationArguments.push(element)
            argumentStatuses.push(ts.isOmittedExpression(element) ? { usesDefault: true } :
              listStatus?.values?.get(unwrapTransparentExpression(element)) ?? { maybeDefault: true })
          }
        }
      }
      if (argumentsComplete && list && ts.isArrayLiteralExpression(list)) appendList(list)
      else if (list && !listStatus?.usesDefault && !staticallyNullish(list, identifierKind)) unknownFromIndex = 0
    } else expandArguments(node.arguments)
    if (!argumentsComplete) continue
    const afterArguments = snapshotScopes(scope)
    if (outcome.kind === "callable") {
      const result = visitFunctionLike(outcome.value, outcome.closureScope ?? scope, true, {
        arguments: invocationArguments, argumentScope: scope, argumentStatuses, entry: outcome.entry, intrinsics: outcome.intrinsics, unknownFromIndex,
      })
      if (result.normal) normal.push(result.normal)
      for (const state of result.throws) captureThrowState(state)
    } else if (outcome.kind === "unknown") {
      normal.push(afterArguments); captureThrowState(afterArguments)
      if (outcome.composedLayers && outcome.value) {
        // Each intrinsic layer changes this/positions. Until composition is proven,
        // join a skipped call with possible original-body effects using unknown inputs.
        const result = visitFunctionLike(outcome.value, outcome.closureScope ?? scope, true, {
          arguments: [], argumentScope: scope, argumentStatuses: [], entry: outcome.entry, unknownFromIndex: 0,
        })
        if (result.normal) normal.push(result.normal)
        for (const state of result.throws) captureThrowState(state)
      }
    } else captureThrowState(afterArguments)
  }
  if (normal.length > 0) mergeScopeSnapshots(normal)
  return normal.length > 0
}
