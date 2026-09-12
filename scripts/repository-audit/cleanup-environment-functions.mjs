import ts from "typescript"
import { mergeScopeSnapshots, restoreScopes, snapshotScopes } from "./cleanup-environment-flow.mjs"
import { unwrapTransparentExpression } from "./cleanup-environment-scope.mjs"

const logicalOperators = new Set([
  ts.SyntaxKind.AmpersandAmpersandToken, ts.SyntaxKind.BarBarToken, ts.SyntaxKind.QuestionQuestionToken,
])

const methodName = (node) => ts.isPropertyAccessExpression(node) ? node.name.text :
  ts.isElementAccessExpression(node) && node.argumentExpression &&
  (ts.isStringLiteral(node.argumentExpression) || ts.isNoSubstitutionTemplateLiteral(node.argumentExpression))
    ? node.argumentExpression.text : null

const simpleKind = (node, identifierKind) => {
  const value = unwrapTransparentExpression(node)
  if (!value) return "unknown"
  if (ts.isFunctionLike(value)) return "callable"
  if (value.kind === ts.SyntaxKind.NullKeyword) return "nullish"
  if (ts.isIdentifier(value) && value.text === "undefined") return identifierKind(value.text)
  if (value.kind === ts.SyntaxKind.FalseKeyword || ts.isNumericLiteral(value) && Number(value.text) === 0 ||
    ts.isStringLiteral(value) && value.text === "") return "falsy"
  if (value.kind === ts.SyntaxKind.TrueKeyword || ts.isLiteralExpression(value) || ts.isObjectLiteralExpression(value) ||
    ts.isArrayLiteralExpression(value) || ts.isClassExpression(value)) return "truthy"
  return "unknown"
}

const executesRight = (operator, kind) => operator === ts.SyntaxKind.AmpersandAmpersandToken
  ? kind === "truthy" || kind === "callable"
  : operator === ts.SyntaxKind.BarBarToken ? ["falsy", "nullish"].includes(kind) : kind === "nullish"

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
export function visitImmediateCall(node, scope, visit, visitArgument, visitFunctionLike, captureThrowState, identifierKind) {
  const optional = Boolean(node.questionDotToken || node.expression.questionDotToken)
  let recognized = optional
  const evaluate = (expression) => {
    const value = unwrapTransparentExpression(expression)
    if (value && ts.isFunctionLike(value)) {
      recognized = true
      return [{ kind: "callable", value, state: snapshotScopes(scope) }]
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
      return evaluate(value.expression).map((outcome) => ({
        ...outcome,
        memberCanThrow: !value.questionDotToken,
      }))
    }
    if (value && ts.isBinaryExpression(value) && ts.isAssignmentOperator(value.operatorToken.kind)) {
      recognized = true
      if (visit(value, scope) === false) return []
      const right = unwrapTransparentExpression(value.right)
      const kind = simpleKind(right, identifierKind)
      const outcome = { kind, value: kind === "callable" ? right : undefined, state: snapshotScopes(scope) }
      return value.operatorToken.kind === ts.SyntaxKind.EqualsToken ? [outcome] : [
        outcome, { kind: "unknown", state: outcome.state },
      ]
    }
    const kind = simpleKind(value, identifierKind)
    if (kind !== "unknown") recognized = true
    if (kind === "unknown" && !recognized) return []
    if (kind === "unknown" && visit(value, scope) === false) return []
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
    let argumentsComplete = true
    for (const argument of node.arguments) {
      if (!visitArgument(argument, scope)) { argumentsComplete = false; break }
    }
    if (!argumentsComplete) continue
    const afterArguments = snapshotScopes(scope)
    if (outcome.kind === "callable") {
      const result = visitFunctionLike(outcome.value, scope, true)
      if (result.normal) normal.push(result.normal)
      for (const state of result.throws) captureThrowState(state)
    } else if (outcome.kind === "unknown") {
      normal.push(afterArguments); captureThrowState(afterArguments)
    } else captureThrowState(afterArguments)
  }
  if (normal.length > 0) mergeScopeSnapshots(normal)
  return normal.length > 0
}
