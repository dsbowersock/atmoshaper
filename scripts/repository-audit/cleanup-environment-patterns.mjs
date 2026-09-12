import ts from "typescript"
import { isLiteralNode } from "./cleanup-source.mjs"
import { NON_ALIAS, POSSIBLE_PROCESS_OBJECT, PROCESS_OBJECT, isProcessObjectSource, unwrapTransparentExpression } from "./cleanup-environment-scope.mjs"

const LOGICAL_ASSIGNMENT_KINDS = new Map([
  [ts.SyntaxKind.AmpersandAmpersandEqualsToken, "logical-and-assignment"],
  [ts.SyntaxKind.BarBarEqualsToken, "logical-or-assignment"],
  [ts.SyntaxKind.QuestionQuestionEqualsToken, "logical-nullish-assignment"],
])

/** Keep short-circuit assignment operators distinct in conservative evidence. */
export const logicalAssignmentKind = (operatorKind) => LOGICAL_ASSIGNMENT_KINDS.get(operatorKind) ?? null

/** Omit write-only targets while retaining compound accesses that also read the prior value. */
export const hasReadSemantics = (node) => !ts.isWriteOnlyAccess(node) && !ts.isDeleteTarget(node)

export const wholeObjectMethod = (node) => (
  ts.isPropertyAccessExpression(node) && ts.isIdentifier(node.expression) &&
  node.expression.text === "Object" && ["entries", "keys", "values"].includes(node.name.text)
    ? node.name.text : null
)

/** Keep exact `in` keys distinct from privacy-safe dynamic-key uncertainty. */
export function recordEnvironmentInKey(node, status, { addRead, addComputedUncertainty, addAliasUncertainty }) {
  let value = unwrapTransparentExpression(node)
  while (ts.isBinaryExpression(value) && value.operatorToken.kind === ts.SyntaxKind.CommaToken) {
    value = unwrapTransparentExpression(value.right)
  }
  const literal = ts.isStringLiteral(value) || ts.isNoSubstitutionTemplateLiteral(value) || ts.isNumericLiteral(value)
  if (status === "proven") {
    if (literal) addRead(value, value.text, "in-operator")
    else addComputedUncertainty(node, "in-operator")
  } else if (status === "possible") addComputedUncertainty(node, "in-operator")
  else if (literal) addAliasUncertainty(value, value.text, "in-operator")
  else addAliasUncertainty(node, null, "in-operator")
}

/** Return the operands whose values can become the enclosing expression result. */
export function environmentResultOperands(node) {
  const value = unwrapTransparentExpression(node)
  if (value !== node) return environmentResultOperands(value)
  if (ts.isConditionalExpression(value)) return [...environmentResultOperands(value.whenTrue), ...environmentResultOperands(value.whenFalse)]
  if (ts.isBinaryExpression(value) && [ts.SyntaxKind.AmpersandAmpersandToken, ts.SyntaxKind.BarBarToken, ts.SyntaxKind.QuestionQuestionToken].includes(value.operatorToken.kind)) return [...environmentResultOperands(value.left), ...environmentResultOperands(value.right)]
  if (ts.isBinaryExpression(value) && value.operatorToken.kind === ts.SyntaxKind.CommaToken) return environmentResultOperands(value.right)
  if (ts.isBinaryExpression(value) && value.operatorToken.kind === ts.SyntaxKind.EqualsToken) return environmentResultOperands(value.right)
  if (ts.isBinaryExpression(value) && logicalAssignmentKind(value.operatorToken.kind)) return [...environmentResultOperands(value.left), ...environmentResultOperands(value.right)]
  return [value]
}

export function joinEnvironmentResultStatuses(statuses) {
  if (statuses.every((status) => status === "proven")) return "proven"
  if (statuses.every((status) => status === "unknown")) return "unknown"
  return statuses.some((status) => ["proven", "unknown"].includes(status)) ? "possible" : null
}

const snapshotScopes = (scope) => {
  const rows = []; for (let current = scope; current; current = current.parent) rows.push([current, new Map(current.bindings)])
  return rows
}
const restoreScopes = (rows) => { for (const [scope, bindings] of rows) scope.bindings = new Map(bindings) }
const mergedBinding = (left, right) => left === right ? left : [left, right].some((value) => ["proven", "unknown"].includes(value)) ? "unknown" :
  [left, right].some((value) => [PROCESS_OBJECT, POSSIBLE_PROCESS_OBJECT].includes(value)) ? POSSIBLE_PROCESS_OBJECT : NON_ALIAS
const mergeScopes = (left, right) => {
  for (let index = 0; index < left.length; index += 1) {
    const [scope, leftBindings] = left[index], rightBindings = right[index][1]
    scope.bindings = new Map([...new Set([...leftBindings.keys(), ...rightBindings.keys()])].map((name) => [name, mergedBinding(leftBindings.get(name), rightBindings.get(name))]))
  }
}

/** Evaluate mutually exclusive result branches from the same incoming lexical state. */
export function visitConditionalEnvironmentResult(node, scope, visit) {
  visit(node.condition, scope)
  const initial = snapshotScopes(scope)
  visit(node.whenTrue, scope)
  const whenTrue = snapshotScopes(scope); restoreScopes(initial)
  visit(node.whenFalse, scope)
  mergeScopes(whenTrue, snapshotScopes(scope))
}


/** A logical RHS is conditional; merge its effects with the state after the always-evaluated left side. */
export function visitLogicalEnvironmentResult(node, scope, visit) {
  visit(node.left, scope); const withoutRight = snapshotScopes(scope)
  visit(node.right, scope); mergeScopes(withoutRight, snapshotScopes(scope))
}

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
