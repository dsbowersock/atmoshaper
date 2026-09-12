import ts from "typescript"
import { isTransparentExpression } from "./cleanup-environment-scope.mjs"
import {
  contributesToExpressionResult, isHandledObjectAssignment,
  logicalAssignmentKind, wholeObjectMethod,
} from "./cleanup-environment-patterns.mjs"

/** True when an established exact handler owns a complete-environment value. */
export function isHandledEnvironmentValue(node, inExpression) {
  if (inExpression && contributesToExpressionResult(node, inExpression)) return true
  let value = node
  let parent = value.parent
  while (parent && isTransparentExpression(parent) && parent.expression === value) {
    value = parent
    parent = value.parent
  }
  if (!parent) return true
  if (ts.isBinaryExpression(parent) && parent.operatorToken.kind === ts.SyntaxKind.InKeyword && parent.right === value) return true
  if (ts.isVoidExpression(parent) || ts.isTypeOfExpression(parent)) return true
  if (ts.isPropertyAccessExpression(parent) && parent.name === value) return true
  if ((ts.isPropertyAccessExpression(parent) || ts.isElementAccessExpression(parent)) && parent.expression === value) return true
  if ((ts.isSpreadAssignment(parent) || ts.isSpreadElement(parent)) && parent.expression === value) return true
  if (ts.isCallExpression(parent) && parent.arguments[0] === value && wholeObjectMethod(parent.expression)) return true
  if ((ts.isVariableDeclaration(parent) || ts.isParameter(parent) || ts.isBindingElement(parent)) &&
    parent.initializer === value &&
    (ts.isBindingElement(parent) || ts.isIdentifier(parent.name) || ts.isObjectBindingPattern(parent.name))) return true
  if (ts.isBinaryExpression(parent) && (
    parent.left === value && ts.isAssignmentOperator(parent.operatorToken.kind) ||
    parent.right === value && (logicalAssignmentKind(parent.operatorToken.kind) ||
      parent.operatorToken.kind === ts.SyntaxKind.EqualsToken &&
      (ts.isIdentifier(parent.left) || isHandledObjectAssignment(parent.left)))
  )) return true
  return ts.isDeleteExpression(parent) && parent.expression === value
}

/** Detect only value flows that can expose the complete environment object to another owner. */
export function isEnvironmentValueEscape(node, scope, aliasStatus, inExpression) {
  if (isHandledEnvironmentValue(node, inExpression)) return false
  let value = node
  let parent = value.parent
  const logicalOperators = new Set([
    ts.SyntaxKind.AmpersandAmpersandToken,
    ts.SyntaxKind.BarBarToken,
    ts.SyntaxKind.QuestionQuestionToken,
  ])
  while (
    isTransparentExpression(parent) && parent.expression === value ||
    ts.isConditionalExpression(parent) && parent.condition !== value ||
    ts.isBinaryExpression(parent) && logicalOperators.has(parent.operatorToken.kind)
  ) {
    value = parent
    parent = value.parent
  }
  if (!parent) return false
  if (ts.isPropertyAssignment(parent) && parent.initializer === value) return true
  if (ts.isShorthandPropertyAssignment(parent) && parent.name === value) return true
  if ((ts.isSpreadAssignment(parent) || ts.isSpreadElement(parent)) && parent.expression === value) {
    return aliasStatus(value, scope) === null
  }
  if (ts.isCallExpression(parent) && parent.arguments.includes(value)) {
    return !(parent.arguments[0] === value && wholeObjectMethod(parent.expression) && aliasStatus(value, scope) !== null)
  }
  if (ts.isNewExpression(parent) && parent.arguments?.includes(value)) return true
  if (ts.isArrayLiteralExpression(parent) && parent.elements.includes(value)) return true
  if ((ts.isReturnStatement(parent) || ts.isThrowStatement(parent) || ts.isYieldExpression(parent) ||
    ts.isExportAssignment(parent) || ts.isJsxExpression(parent)) && parent.expression === value) return true
  if (ts.isArrowFunction(parent) && parent.body === value) return true
  if (ts.isBinaryExpression(parent) && parent.right === value && ts.isAssignmentOperator(parent.operatorToken.kind)) {
    return !ts.isIdentifier(parent.left) || aliasStatus(value, scope) === null && aliasStatus(node, scope) === null
  }
  return (ts.isVariableDeclaration(parent) || ts.isParameter(parent) || ts.isBindingElement(parent)) &&
    parent.initializer === value && value !== node
}
