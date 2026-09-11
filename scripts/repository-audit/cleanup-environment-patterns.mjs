import ts from "typescript"
import { isLiteralNode } from "./cleanup-source.mjs"
import { unwrapTransparentExpression } from "./cleanup-environment-scope.mjs"

const LOGICAL_ASSIGNMENT_KINDS = new Map([
  [ts.SyntaxKind.AmpersandAmpersandEqualsToken, "logical-and-assignment"],
  [ts.SyntaxKind.BarBarEqualsToken, "logical-or-assignment"],
  [ts.SyntaxKind.QuestionQuestionEqualsToken, "logical-nullish-assignment"],
])

/** Keep short-circuit assignment operators distinct in conservative evidence. */
export const logicalAssignmentKind = (operatorKind) => LOGICAL_ASSIGNMENT_KINDS.get(operatorKind) ?? null

/** Only complete object assignment patterns replace the generic whole-object escape signal. */
export function isHandledObjectAssignment(node) {
  const pattern = unwrapTransparentExpression(node)
  return pattern && ts.isObjectLiteralExpression(pattern) && pattern.properties.every((property) => (
    ts.isSpreadAssignment(property) || ts.isShorthandPropertyAssignment(property) || ts.isPropertyAssignment(property)
  ))
}

/** Record only this source object's keys; nested targets require their own proven default source. */
export function recordEnvironmentPattern(pattern, status, kind, { addRead, addComputedUncertainty, addAliasUncertainty }) {
  if (!["proven", "unknown"].includes(status)) return
  const binding = ts.isObjectBindingPattern(pattern)
  for (const element of binding ? pattern.elements : pattern.properties) {
    if (element.dotDotDotToken || ts.isSpreadAssignment(element)) {
      if (status === "proven") addComputedUncertainty(element, `${kind}-rest`)
      else addAliasUncertainty(element, null, `${kind}-rest`)
      continue
    }
    const propertyName = binding ? element.propertyName ?? element.name : element.name
    if (!propertyName) continue
    const literalName = ts.isIdentifier(propertyName) || isLiteralNode(propertyName)
      ? propertyName.text
      : ts.isComputedPropertyName(propertyName) && isLiteralNode(propertyName.expression)
        ? propertyName.expression.text
        : null
    const nameNode = ts.isComputedPropertyName(propertyName) ? propertyName.expression : propertyName
    if (literalName !== null) {
      if (status === "proven") addRead(nameNode, literalName, kind)
      else addAliasUncertainty(nameNode, literalName, kind)
    } else if (status === "proven") addComputedUncertainty(nameNode, kind)
    else addAliasUncertainty(nameNode, null, kind)
  }
}
