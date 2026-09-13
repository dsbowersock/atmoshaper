import ts from "typescript"

const unwrap = (node) => {
  let value = node
  while (value && (ts.isParenthesizedExpression(value) || ts.isAsExpression(value) ||
    ts.isTypeAssertionExpression(value) || ts.isNonNullExpression(value) || ts.isSatisfiesExpression(value))) {
    value = value.expression
  }
  return value
}

const isEvaluatedIdentifier = (node) => ts.isShorthandPropertyAssignment(node.parent) ||
  ts.isInExpressionContext(node) && !(ts.isPropertyAccessExpression(node.parent) && node.parent.name === node)

const memberName = (node) => ts.isPropertyAccessExpression(node) ? node.name.text :
  node.argumentExpression && (ts.isStringLiteral(node.argumentExpression) || ts.isNumericLiteral(node.argumentExpression) ||
    ts.isNoSubstitutionTemplateLiteral(node.argumentExpression)) ? node.argumentExpression.text : null

const propertyName = (node) => node.name && !ts.isComputedPropertyName(node.name) &&
  (ts.isIdentifier(node.name) || ts.isStringLiteral(node.name) || ts.isNumericLiteral(node.name)) ? node.name.text : null

/** Only an explicit ordinary own property rules out getter/proxy lookup failure. */
const isStaticSafeMember = (node, receiver) => {
  const name = memberName(node)
  if (name === null || !ts.isObjectLiteralExpression(receiver) || receiver.properties.some((property) =>
    ts.isSpreadAssignment(property) || property.name && ts.isComputedPropertyName(property.name))) return false
  const property = receiver.properties.filter((candidate) => propertyName(candidate) === name).at(-1)
  return Boolean(property && (ts.isPropertyAssignment(property) || ts.isShorthandPropertyAssignment(property) ||
    ts.isMethodDeclaration(property)))
}

export function moduleReferenceKind(scope, name) {
  for (let current = scope; current; current = current.parent) if (current.bindings.has(name)) {
    return current.bindingRules.get(name)?.initialized === false ? "throws" : "safe"
  }
  return "possible"
}

/** Propagate abrupt reference/member evaluation from every nested call-argument subexpression. */
export function createOrderedArgumentFlow({ captureThrow, isNullishMemberReceiver, isSafeMemberReceiver, referenceKind, visit, visitOptional }) {
  let depth = 0
  const intercept = (node, scope) => {
    if (depth === 0) return null
    if (ts.isIdentifier(node) && isEvaluatedIdentifier(node)) {
      const reference = referenceKind(scope, node.text)
      if (reference !== "safe") captureThrow(node, scope)
      return reference !== "throws"
    }
    if ((ts.isPropertyAccessExpression(node) || ts.isElementAccessExpression(node)) &&
      !(ts.isCallExpression(node.parent) && node.parent.expression === node)) {
      if (visit(node.expression, scope) === false) return false
      const receiver = unwrap(node.expression)
      const nullish = receiver?.kind === ts.SyntaxKind.NullKeyword || isNullishMemberReceiver(scope, node.expression)
      const safe = isSafeMemberReceiver(scope, node.expression) || receiver && isStaticSafeMember(node, receiver)
      const evaluate = () => {
        if (ts.isElementAccessExpression(node) && node.argumentExpression && visit(node.argumentExpression, scope) === false) return false
        if (!safe) captureThrow(node, scope)
        return !nullish
      }
      if (ts.isOptionalChain(node)) return nullish ? true : safe ? evaluate() : visitOptional(scope, evaluate)
      return evaluate()
    }
    return null
  }
  const visitArgument = (node, scope) => {
    depth += 1
    try { return visit(node, scope) !== false } finally { depth -= 1 }
  }
  const visitChildren = (node, scope) => {
    let normal = true
    ts.forEachChild(node, (child) => { if (depth === 0 || normal) normal = visit(child, scope) !== false && normal })
    return depth === 0 ? undefined : normal
  }
  return { intercept, visitArgument, visitChildren }
}

/** Preserve callee, member, argument, and invocation failure checkpoints in source order. */
export function visitModuleCall(node, scope, { captureThrow, classify, record, referenceKind, visit, visitArgument }) {
  const classification = classify(node)
  if (classification) record(classification)
  let target = unwrap(node.expression)
  while (target && (ts.isPropertyAccessExpression(target) || ts.isElementAccessExpression(target))) {
    target = unwrap(target.expression)
  }
  const reference = target && ts.isIdentifier(target) ? referenceKind(target.text) : "safe"
  if (reference !== "safe") captureThrow(node, scope)
  if (reference === "throws") return false
  if (visit(node.expression, scope) === false) return false
  const callee = unwrap(node.expression)
  if (callee && (ts.isPropertyAccessExpression(callee) || ts.isElementAccessExpression(callee))) {
    captureThrow(node, scope)
  }
  for (const argument of node.arguments) {
    if (!visitArgument(argument, scope)) return false
  }
  captureThrow(node, scope)
  return true
}
