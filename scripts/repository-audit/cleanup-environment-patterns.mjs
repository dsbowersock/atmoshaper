import ts from "typescript"
import { isLiteralNode } from "./cleanup-source.mjs"
import { isProcessObjectSource, unwrapTransparentExpression } from "./cleanup-environment-scope.mjs"

const LOGICAL_ASSIGNMENT_KINDS = new Map([
  [ts.SyntaxKind.AmpersandAmpersandEqualsToken, "logical-and-assignment"],
  [ts.SyntaxKind.BarBarEqualsToken, "logical-or-assignment"],
  [ts.SyntaxKind.QuestionQuestionEqualsToken, "logical-nullish-assignment"],
])

/** Keep short-circuit assignment operators distinct in conservative evidence. */
export const logicalAssignmentKind = (operatorKind) => LOGICAL_ASSIGNMENT_KINDS.get(operatorKind) ?? null

/** True when a nested value can become the enclosing expression's result without a value conversion. */
export function contributesToExpressionResult(node, root) {
  let value = node
  while (value !== root) {
    const parent = value.parent
    if (!parent) return false
    if (unwrapTransparentExpression(parent) === value) value = parent
    else if (ts.isConditionalExpression(parent) && parent.condition !== value) value = parent
    else if (ts.isBinaryExpression(parent) && (
      [ts.SyntaxKind.AmpersandAmpersandToken, ts.SyntaxKind.BarBarToken, ts.SyntaxKind.QuestionQuestionToken].includes(parent.operatorToken.kind) ||
      parent.operatorToken.kind === ts.SyntaxKind.CommaToken && parent.right === value ||
      parent.right === value && (parent.operatorToken.kind === ts.SyntaxKind.EqualsToken || logicalAssignmentKind(parent.operatorToken.kind))
    )) value = parent
    else return false
  }
  return true
}

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

/** Evaluate binding-element defaults in source order and retain only supported provenance. */
export function bindEnvironmentPatternDefaults(pattern, context, processObjectSource = false) {
  const { aliasStatus, bindName, initializerScope, kind, recordObjectBinding, scope, visit } = context
  for (const element of pattern.elements) {
    if (!ts.isBindingElement(element)) continue
    if (ts.isObjectBindingPattern(pattern) && element.propertyName && ts.isComputedPropertyName(element.propertyName)) visit(element.propertyName.expression, initializerScope)
    if (element.initializer) visit(element.initializer, initializerScope)
    const processStatus = processObjectSource && ts.isObjectBindingPattern(pattern)
      ? processEnvironmentBindingStatus(element) : null
    if (processStatus && ts.isIdentifier(element.name)) scope.bindings.set(element.name.text, processStatus)
    else if (element.initializer && ts.isIdentifier(element.name)) bindName(element.name.text, element.initializer, scope, initializerScope)
    if (ts.isObjectBindingPattern(element.name) || ts.isArrayBindingPattern(element.name)) {
      if (ts.isObjectBindingPattern(element.name)) {
        recordObjectBinding(element.name, processStatus ?? aliasStatus(element.initializer, initializerScope), kind)
      }
      bindEnvironmentPatternDefaults(
        element.name, context, isProcessObjectSource(element.initializer, initializerScope),
      )
    }
  }
}
