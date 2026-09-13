import ts from "typescript"
import { COMMONJS_LOADER, MIXED_SOURCE_PROVENANCE, NON_ALIAS, PROCESS_OBJECT, isProcessEnvironment, isPossibleProcessEnvironment, lookupAlias, processObjectSourceStatus, unwrapTransparentExpression } from "./cleanup-environment-scope.mjs"
import { mergeBindingStatuses, mergeLogicalAssignmentStatus } from "./cleanup-environment-flow.mjs"
import { logicalAssignmentKind } from "./cleanup-environment-patterns.mjs"

export function createEnvironmentValueStatus() {
  /** Classify value provenance independently from whether it is an environment-property read. */
  const valueStatus = (node, scope) => {
    const value = unwrapTransparentExpression(node)
    if (!value) return null
    // Value copies retain all families; member/call consumers project the applicable possibility.
    if (ts.isIdentifier(value) && lookupAlias(scope, value.text) === MIXED_SOURCE_PROVENANCE) return MIXED_SOURCE_PROVENANCE
    const processStatus = processObjectSourceStatus(value, scope)
    if (processStatus) return processStatus
    if (isProcessEnvironment(value, scope)) return "proven"
    if (isPossibleProcessEnvironment(value, scope)) return "unknown"
    if ((ts.isPropertyAccessExpression(value) || ts.isElementAccessExpression(value)) &&
      ts.isIdentifier(value.expression) && ["environment-container", MIXED_SOURCE_PROVENANCE].includes(lookupAlias(scope, value.expression.text))) return "unknown"
    if (ts.isIdentifier(value)) return lookupAlias(scope, value.text)
    let statuses = null
    if (ts.isConditionalExpression(value)) statuses = [valueStatus(value.whenTrue, scope), valueStatus(value.whenFalse, scope)]
    else if (ts.isBinaryExpression(value) && [
      ts.SyntaxKind.AmpersandAmpersandToken, ts.SyntaxKind.BarBarToken,
      ts.SyntaxKind.QuestionQuestionToken,
    ].includes(value.operatorToken.kind)) {
      const left = valueStatus(value.left, scope) ?? NON_ALIAS
      const right = valueStatus(value.right, scope) ?? NON_ALIAS
      const truthy = ["proven", PROCESS_OBJECT, COMMONJS_LOADER].includes(left)
      if (truthy) return value.operatorToken.kind === ts.SyntaxKind.AmpersandAmpersandToken ? right : left
      statuses = [left, right]
    }
    else if (ts.isBinaryExpression(value) && value.operatorToken.kind === ts.SyntaxKind.CommaToken) return valueStatus(value.right, scope)
    else if (ts.isBinaryExpression(value) && ts.isAssignmentOperator(value.operatorToken.kind)) {
      const kind = logicalAssignmentKind(value.operatorToken.kind)
      if (kind) return mergeLogicalAssignmentStatus(
        valueStatus(value.left, scope) ?? NON_ALIAS, valueStatus(value.right, scope) ?? NON_ALIAS, kind,
      )
      return value.operatorToken.kind === ts.SyntaxKind.EqualsToken ? valueStatus(value.right, scope) : null
    }
    if (!statuses) return null
    const joined = mergeBindingStatuses(statuses[0] ?? NON_ALIAS, statuses[1] ?? NON_ALIAS)
    return joined === NON_ALIAS ? null : joined
  }
  return valueStatus
}
