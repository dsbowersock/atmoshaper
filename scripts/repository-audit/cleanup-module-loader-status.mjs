import ts from "typescript"
import { joinLoaderStatus } from "./cleanup-module-loader-control.mjs"

const PROVEN = "proven-loader", POSSIBLE = "possible-loader", UNPROVEN = "unproven"

/** Resolve a logical assignment from its pre-RHS left value and evaluated RHS value. */
export function logicalAssignmentLoaderStatus(left, right, operator) {
  if ([ts.SyntaxKind.BarBarEqualsToken, ts.SyntaxKind.QuestionQuestionEqualsToken].includes(operator) && left === PROVEN) return left
  if (operator === ts.SyntaxKind.AmpersandAmpersandEqualsToken && left === PROVEN) return right
  return joinLoaderStatus(left, right)
}

const isImportMetaUrl = (node) => ts.isPropertyAccessExpression(node) && node.name.text === "url" &&
  ts.isMetaProperty(node.expression) && node.expression.keywordToken === ts.SyntaxKind.ImportKeyword &&
  node.expression.name.text === "meta"

/** Classify the loader value produced by an expression without executing its writes. */
export function moduleLoaderValueStatus(node, scope, lookup, factoryNames) {
  if (!node) return UNPROVEN
  if (ts.isParenthesizedExpression(node) || ts.isAsExpression(node) || ts.isTypeAssertionExpression(node) ||
    ts.isNonNullExpression(node) || ts.isSatisfiesExpression(node)) {
    return moduleLoaderValueStatus(node.expression, scope, lookup, factoryNames)
  }
  if (ts.isIdentifier(node)) {
    const status = lookup(scope, node.text)
    return [PROVEN, POSSIBLE].includes(status) ? status : UNPROVEN
  }
  if (ts.isConditionalExpression(node)) return joinLoaderStatus(
    moduleLoaderValueStatus(node.whenTrue, scope, lookup, factoryNames),
    moduleLoaderValueStatus(node.whenFalse, scope, lookup, factoryNames),
  )
  if (ts.isBinaryExpression(node) && node.operatorToken.kind === ts.SyntaxKind.CommaToken) {
    return moduleLoaderValueStatus(node.right, scope, lookup, factoryNames)
  }
  if (ts.isBinaryExpression(node) && [
    ts.SyntaxKind.AmpersandAmpersandToken, ts.SyntaxKind.BarBarToken, ts.SyntaxKind.QuestionQuestionToken,
  ].includes(node.operatorToken.kind)) {
    const left = moduleLoaderValueStatus(node.left, scope, lookup, factoryNames)
    const right = moduleLoaderValueStatus(node.right, scope, lookup, factoryNames)
    if (left === PROVEN) return node.operatorToken.kind === ts.SyntaxKind.AmpersandAmpersandToken ? right : left
    return joinLoaderStatus(left, right)
  }
  if (ts.isBinaryExpression(node) && ts.isAssignmentOperator(node.operatorToken.kind)) {
    const left = moduleLoaderValueStatus(node.left, scope, lookup, factoryNames)
    const right = moduleLoaderValueStatus(node.right, scope, lookup, factoryNames)
    if (node.operatorToken.kind === ts.SyntaxKind.EqualsToken) return right
    return logicalAssignmentLoaderStatus(left, right, node.operatorToken.kind)
  }
  if (ts.isCallExpression(node) && !node.questionDotToken && ts.isIdentifier(node.expression) &&
    factoryNames.has(node.expression.text)) {
    return lookup(scope, node.expression.text) === "create-require-factory" && node.arguments.length === 1 &&
      isImportMetaUrl(node.arguments[0]) ? PROVEN : POSSIBLE
  }
  return UNPROVEN
}

/** Recognize direct/captured loader calls while retaining resolve-capability downgrades. */
export function classifyModuleLoaderCall(node, scope, lookup, factoryNames, resolveDowngraded) {
  if (!ts.isCallExpression(node)) return null
  const status = moduleLoaderValueStatus(node.expression, scope, lookup, factoryNames)
  if (status === PROVEN) return { kind: "require", proven: true }
  if (status === POSSIBLE) return { kind: "require", proven: false }
  if (ts.isIdentifier(node.expression) && node.expression.text === "require") {
    return { kind: "require", proven: false }
  }
  if (ts.isPropertyAccessExpression(node.expression) && node.expression.name.text === "resolve" &&
    ts.isIdentifier(node.expression.expression)) {
    const base = node.expression.expression
    const baseStatus = lookup(scope, base.text)
    if (baseStatus === PROVEN) return { kind: "require-resolve", proven: !resolveDowngraded }
    if (baseStatus === POSSIBLE || base.text === "require") return { kind: "require-resolve", proven: false }
  }
  return null
}
