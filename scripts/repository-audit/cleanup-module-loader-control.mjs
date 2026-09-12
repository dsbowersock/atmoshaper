import ts from "typescript"

const LOGICAL_OPERATORS = new Set([
  ts.SyntaxKind.AmpersandAmpersandToken, ts.SyntaxKind.BarBarToken, ts.SyntaxKind.QuestionQuestionToken,
  ts.SyntaxKind.AmpersandAmpersandEqualsToken, ts.SyntaxKind.BarBarEqualsToken, ts.SyntaxKind.QuestionQuestionEqualsToken,
])

function isAssignmentPatternDefault(node, current) {
  if (!ts.isBinaryExpression(node) || node.operatorToken.kind !== ts.SyntaxKind.EqualsToken || current !== node.right) return false
  let container = ts.isPropertyAssignment(node.parent) ? node.parent.parent :
    ts.isArrayLiteralExpression(node.parent) ? node.parent : null
  while (container) {
    if (ts.isPropertyAssignment(container.parent)) container = container.parent.parent
    else if (ts.isArrayLiteralExpression(container.parent)) container = container.parent
    else break
  }
  return Boolean(container && ts.isBinaryExpression(container.parent) &&
    ts.isAssignmentOperator(container.parent.operatorToken.kind) && container.parent.left === container)
}

/** True when an assignment may not execute in the current straight-line evaluation region. */
function maybeExecuted(node, withinIteration) {
  for (let current = node, parent; (parent = current.parent); current = parent) {
    if (ts.isFunctionLike(parent)) break
    if (ts.isIfStatement(parent) && current !== parent.expression) return true
    if (ts.isConditionalExpression(parent) && current !== parent.condition) return true
    if (ts.isBinaryExpression(parent) && LOGICAL_OPERATORS.has(parent.operatorToken.kind) && current === parent.right) return true
    if (ts.isOptionalChain(parent) && current !== parent.expression) return true
    if (ts.isBindingElement(parent) && current === parent.initializer ||
      ts.isShorthandPropertyAssignment(parent) && current === parent.objectAssignmentInitializer ||
      isAssignmentPatternDefault(parent, current)) return true
    const iterationBoundary = ts.isForStatement(parent) && parent.statement === current ||
      (ts.isForInStatement(parent) || ts.isForOfStatement(parent)) && parent.statement === current
    if (withinIteration && iterationBoundary) break
    if (ts.isCaseBlock(parent) || ts.isCatchClause(parent) || ts.isPropertyDeclaration(parent) &&
      !parent.modifiers?.some((modifier) => modifier.kind === ts.SyntaxKind.StaticKeyword) ||
      ts.isTryStatement(parent) && current === parent.tryBlock ||
      ts.isForStatement(parent) && [parent.statement, parent.incrementor].includes(current) ||
      (ts.isForInStatement(parent) || ts.isForOfStatement(parent) || ts.isWhileStatement(parent)) && current === parent.statement) return true
  }
  return false
}

export const isMaybeExecutedAssignment = (node) => maybeExecuted(node, false)
export const isMaybeExecutedWithinIteration = (node) => maybeExecuted(node, true)
