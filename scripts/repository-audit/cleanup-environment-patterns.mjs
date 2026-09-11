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

function staticPropertyName(name) {
  if (ts.isIdentifier(name) || ts.isStringLiteral(name)) return name.text
  return ts.isComputedPropertyName(name) && isLiteralNode(name.expression) ? name.expression.text : null
}

function processEnvironmentStatus(name, target, ambiguous = false) {
  if (ambiguous) return "unknown"
  const propertyName = staticPropertyName(name)
  if (propertyName === null) return "unknown"
  if (propertyName !== "env") return null
  const value = unwrapTransparentExpression(target)
  return value && ts.isBinaryExpression(value) && value.operatorToken.kind === ts.SyntaxKind.EqualsToken
    ? "unknown"
    : "proven"
}

/** Classify the environment target selected from a proven process-object binding pattern. */
export function processEnvironmentBindingStatus(element) {
  if (!ts.isBindingElement(element)) return null
  return processEnvironmentStatus(
    element.propertyName ?? element.name, element.name,
    Boolean(element.dotDotDotToken || element.initializer),
  )
}

/** Classify the environment target selected from a proven process-object assignment pattern. */
export function processEnvironmentAssignmentStatus(property) {
  if (ts.isSpreadAssignment(property)) return "unknown"
  if (ts.isShorthandPropertyAssignment(property)) {
    return processEnvironmentStatus(property.name, property.name, Boolean(property.objectAssignmentInitializer))
  }
  if (ts.isPropertyAssignment(property)) return processEnvironmentStatus(property.name, property.initializer)
  return null
}
