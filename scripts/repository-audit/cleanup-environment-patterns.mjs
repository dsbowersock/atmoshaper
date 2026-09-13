import ts from "typescript"
import { isLiteralNode } from "./cleanup-source.mjs"
import { POSSIBLE_PROCESS_OBJECT, isProcessObjectSource, unwrapTransparentExpression } from "./cleanup-environment-scope.mjs"
import { mergeScopeSnapshots, snapshotScopes } from "./cleanup-environment-flow.mjs"
import { callableExpressionState, mergeCallableStates } from "./cleanup-environment-callables.mjs"

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

function processEnvironmentStatus(name, target, ambiguous = false, defaultStatus) {
  const propertyName = staticPropertyName(name)
  let status = propertyName === null ? "unknown" : propertyName === "env"
    ? ambiguous ? "unknown" : "proven" : null
  if (defaultStatus !== undefined && status !== defaultStatus) status = "unknown"
  return status
}

/** Classify the environment target selected from a proven process-object binding pattern. */
export function processEnvironmentBindingStatus(element, ambiguous = false, defaultStatus) {
  if (!ts.isBindingElement(element)) return null
  if (element.dotDotDotToken) return "unknown"
  return processEnvironmentStatus(
    element.propertyName ?? element.name, element.name, ambiguous, defaultStatus,
  )
}

/** Classify the environment target selected from a proven process-object assignment pattern. */
export function processEnvironmentAssignmentStatus(property, ambiguous = false, statusForDefault = () => null) {
  if (ts.isSpreadAssignment(property)) return "unknown"
  if (ts.isShorthandPropertyAssignment(property)) {
    return processEnvironmentStatus(
      property.name, property.name, ambiguous,
      property.objectAssignmentInitializer ? statusForDefault(property.objectAssignmentInitializer) : undefined,
    )
  }
  if (ts.isPropertyAssignment(property)) {
    const target = unwrapTransparentExpression(property.initializer)
    const fallback = target && ts.isBinaryExpression(target) && target.operatorToken.kind === ts.SyntaxKind.EqualsToken
      ? target.right : null
    return processEnvironmentStatus(
      property.name, property.initializer, ambiguous, fallback ? statusForDefault(fallback) : undefined,
    )
  }
  return null
}

/** Evaluate binding-element defaults in source order and retain only supported provenance. */
export function bindEnvironmentPatternDefaults(pattern, context, processObjectSource = false) {
  const { aliasStatus, bindName, declareBindingName, initializerScope, input, kind, recordObjectBinding, scope, visit } = context
  if (input && !input.complete(pattern)) return false
  for (const element of pattern.elements) {
    if (!ts.isBindingElement(element)) continue
    if (ts.isObjectBindingPattern(pattern) && element.propertyName && ts.isComputedPropertyName(element.propertyName) &&
      visit(element.propertyName.expression, initializerScope) === false) return false
    const selected = input?.select(pattern, element)
    if (selected === false) return false
    const initializer = selected?.defaults === "never" ? undefined : element.initializer
    const skippedDefault = initializer && selected?.defaults === "possible" ? snapshotScopes(scope) : null
    if (initializer) {
      const normal = visit(initializer, initializerScope) !== false
      if (skippedDefault) mergeScopeSnapshots([skippedDefault, ...(normal ? [snapshotScopes(scope)] : [])])
      else if (!normal) return false
    }
    const boundSource = selected?.defaults === "never" ? selected.source : initializer
    const processStatus = processObjectSource && ts.isObjectBindingPattern(pattern)
      ? processEnvironmentBindingStatus(
        element, processObjectSource === POSSIBLE_PROCESS_OBJECT,
        initializer ? aliasStatus(initializer, initializerScope) : undefined,
      ) : null
    if (processStatus && ts.isIdentifier(element.name)) scope.bindings.set(element.name.text, processStatus)
    else if ((boundSource || selected?.captured) && ts.isIdentifier(element.name)) {
      const status = skippedDefault && aliasStatus(boundSource, initializerScope) ? "unknown" :
        selected?.defaults === "never" && selected.captured ? selected.captured.environment : undefined
      bindName(element.name.text, boundSource, scope, initializerScope, status)
    }
    else if (ts.isIdentifier(element.name)) declareBindingName(element.name, scope)
    if (ts.isIdentifier(element.name)) {
      const callable = selected?.defaults === "never" && selected.captured
        ? selected.captured.callable : callableExpressionState(boundSource, initializerScope)
      scope.callables.set(element.name.text, skippedDefault
        ? mergeCallableStates(selected?.captured?.callable, callable) : callable)
    }
    if (ts.isObjectBindingPattern(element.name) || ts.isArrayBindingPattern(element.name)) {
      if (ts.isObjectBindingPattern(element.name)) {
        recordObjectBinding(element.name, processStatus ?? aliasStatus(boundSource, initializerScope), kind)
      }
      if (bindEnvironmentPatternDefaults(
        element.name, input ? { ...context, input: input.child(selected, initializer, processStatus) } : context,
        isProcessObjectSource(boundSource, initializerScope),
      ) === false) return false
    }
  }
  return true
}
