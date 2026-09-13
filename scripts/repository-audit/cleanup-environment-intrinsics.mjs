import ts from "typescript"

/** Handle intrinsic logical assignments whose inherited method fixes the branch. */
export function visitDefiniteIntrinsicAssignment(node, scope, mutation, context) {
  if (!mutation || !ts.isBinaryExpression(node) || !ts.isAssignmentOperator(node.operatorToken.kind)) return null
  const { addWholeObjectUncertainty, valueStatus, visit } = context
  if (mutation.skipRight) return visit(node.left, scope) !== false
  if (!mutation.executeRight) return null
  if (visit(node.left, scope) === false || visit(node.right, scope) === false) return false
  mutation.apply()
  addWholeObjectUncertainty(node.right, valueStatus(node.right, scope), context.kind)
  return true
}
