import ts from "typescript"
import { MIXED_SOURCE_PROVENANCE, POSSIBLE_PROCESS_OBJECT, PROCESS_OBJECT, unwrapTransparentExpression } from "./cleanup-environment-scope.mjs"
import { staticValueKind } from "./cleanup-static-value.mjs"

/** Classify only binding conversions whose success or failure is syntax-certain. */
const missingInput = Symbol("missing-input")
const unknownInput = Symbol("unknown-input")

const bindingKey = (element) => {
  const name = element.propertyName ?? element.name
  if (ts.isIdentifier(name) || ts.isStringLiteral(name) || ts.isNumericLiteral(name)) return name.text
  if (ts.isComputedPropertyName(name)) {
    let value = unwrapTransparentExpression(name.expression)
    while (ts.isBinaryExpression(value) && value.operatorToken.kind === ts.SyntaxKind.CommaToken) {
      value = unwrapTransparentExpression(value.right)
    }
    if (ts.isStringLiteral(value) || ts.isNumericLiteral(value) || ts.isNoSubstitutionTemplateLiteral(value)) return value.text
  }
  return null
}

/** Flatten literal iterator positions; an unbounded spread hides every later index. */
function arrayElementInput(value, index) {
  function* elements(array) {
    for (const element of array.elements) {
      if (!ts.isSpreadElement(element)) yield element
      else {
        const spread = unwrapTransparentExpression(element.expression)
        if (spread && ts.isArrayLiteralExpression(spread)) yield* elements(spread)
        else yield unknownInput
      }
    }
  }
  let position = 0
  for (const element of elements(value)) {
    if (element === unknownInput) return unknownInput
    if (position++ === index) return ts.isOmittedExpression(element) ? missingInput : element
  }
  return missingInput
}

/** Rest copies own enumerable keys in property order, retaining possible overrides. */
function restElementInputs(source, excluded, unknownExclusion) {
  const value = unwrapTransparentExpression(source), members = new Map(), ambiguousGetters = []
  if (!value || !ts.isObjectLiteralExpression(value)) return { getters: [], unknown: true }
  let unknown = false
  for (const property of value.properties) {
    const key = property.name ? bindingKey({ name: property.name }) : null
    if (key === null) {
      unknown = true
      for (const member of members.values()) member.possible = true
      if (ts.isGetAccessorDeclaration(property)) ambiguousGetters.push({ getter: property, possible: true })
      continue
    }
    const prior = members.get(key)
    const getter = ts.isGetAccessorDeclaration(property) ? property :
      ts.isSetAccessorDeclaration(property) && prior?.accessor ? prior.getter : null
    members.set(key, {
      getter, accessor: ts.isGetAccessorDeclaration(property) || ts.isSetAccessorDeclaration(property),
      possible: unknownExclusion || Boolean(getter && getter === prior?.getter && prior.possible),
    })
  }
  const arrayIndex = (key) => /^(0|[1-9]\d*)$/.test(key) && Number(key) < 2 ** 32 - 1
  const keys = [...members.keys()].filter((key) => !excluded.has(key))
  keys.sort((left, right) => arrayIndex(left) && arrayIndex(right) ? Number(left) - Number(right) :
    arrayIndex(left) ? -1 : arrayIndex(right) ? 1 : 0)
  const getters = keys.map((key) => members.get(key)).filter((member) => member.getter)
  // An unknown key may sort on either side of a known getter or be overwritten.
  // Optional reads at each boundary conservatively retain both orders and throws.
  return { getters: [...ambiguousGetters, ...getters.flatMap((getter) => [getter, ...ambiguousGetters])], unknown }
}

/** Select an exact literal source member without evaluating it a second time. */
function bindingElementInput(pattern, element, source) {
  const value = unwrapTransparentExpression(source)
  if (ts.isObjectBindingPattern(pattern) && value && ts.isObjectLiteralExpression(value)) {
    const key = bindingKey(element)
    if (key === null || value.properties.some((property) => ts.isSpreadAssignment(property) ||
      property.name && bindingKey({ name: property.name }) === null)) return unknownInput
    let selected = missingInput, getter = null
    for (const property of value.properties) {
      if (!property.name || bindingKey({ name: property.name }) !== key) continue
      if (ts.isGetAccessorDeclaration(property)) {
        getter = property; selected = { getter }
      } else if (ts.isSetAccessorDeclaration(property)) {
        selected = getter ? { getter } : unknownInput
      } else {
        getter = null
        selected = ts.isPropertyAssignment(property) ? property.initializer :
          ts.isShorthandPropertyAssignment(property) ? property.name :
            ts.isMethodDeclaration(property) ? property : unknownInput
      }
    }
    return selected
  }
  if (ts.isArrayBindingPattern(pattern) && value && ts.isArrayLiteralExpression(value)) {
    return arrayElementInput(value, pattern.elements.indexOf(element))
  }
  return unknownInput
}

function patternInputCompletion(pattern, source, status) {
  const value = unwrapTransparentExpression(source)
  let completion
  if ([PROCESS_OBJECT, POSSIBLE_PROCESS_OBJECT, "proven", "unknown"].includes(status)) {
    completion = status === POSSIBLE_PROCESS_OBJECT || status === "unknown" ? "possible" :
      ts.isArrayBindingPattern(pattern) ? "throws" : "normal"
  } else if (!value || value.kind === ts.SyntaxKind.NullKeyword || ts.isVoidExpression(value)) completion = "throws"
  else if (ts.isObjectBindingPattern(pattern)) completion = staticValueKind(value) === "unknown" ? "possible" : "normal"
  else if (ts.isArrayLiteralExpression(value) || ts.isStringLiteral(value) || ts.isNoSubstitutionTemplateLiteral(value)) completion = "normal"
  else if (ts.isObjectLiteralExpression(value)) completion = value.properties.some((property) =>
    ts.isSpreadAssignment(property) || property.name && ts.isComputedPropertyName(property.name)) ? "possible" : "throws"
  else if (ts.isNumericLiteral(value) || ts.isBigIntLiteral(value) ||
    [ts.SyntaxKind.TrueKeyword, ts.SyntaxKind.FalseKeyword].includes(value.kind)) completion = "throws"
  else completion = "possible"
  return completion
}

/** Resolve each parameter property only when the ordered binding walk reaches it. */
export function parameterBindingInput(source, status, scope, context) {
  const { control, invoke, valueStatus } = context
  const excluded = new Set()
  let unknownExclusion = false
  const readGetter = (getter) => {
    const result = invoke(getter, context.getterScope, true)
    for (const state of result.throws) control.captureThrowState(state)
    return Boolean(result.normal)
  }
  return {
    complete(pattern) {
      const completion = context.unknown ? "possible" : patternInputCompletion(pattern, source, status)
      if (completion !== "normal") control.captureThrowState(context.snapshotScopes(scope))
      return completion !== "throws"
    },
    select(pattern, element) {
      if (ts.isArrayBindingPattern(pattern) && element.dotDotDotToken) {
        const contained = [...(context.captured?.values?.values() ?? [])].some((value) =>
          ["proven", "unknown", "environment-container", MIXED_SOURCE_PROVENANCE].includes(value.environment))
        return { source: null, defaults: "never", captured: {
          environment: contained ? "environment-container" : null, callable: null,
        } }
      }
      if (ts.isObjectBindingPattern(pattern)) {
        if (element.dotDotDotToken) {
          const rest = restElementInputs(source, excluded, unknownExclusion)
          if (rest.unknown && ![PROCESS_OBJECT, "proven"].includes(status)) {
            control.captureThrowState(context.snapshotScopes(scope))
          }
          for (const member of rest.getters) {
            const normal = member.possible
              ? control.visitOptional(scope, () => readGetter(member.getter)) : readGetter(member.getter)
            if (!normal) return false
          }
          return { source: null, defaults: "never" }
        }
        const key = bindingKey(element)
        if (key === null) unknownExclusion = true
        else excluded.add(key)
      }
      let selected = bindingElementInput(pattern, element, source)
      if (selected === unknownInput && ![PROCESS_OBJECT, "proven"].includes(status)) {
        control.captureThrowState(context.snapshotScopes(scope))
      }
      if (selected?.getter) {
        if (!readGetter(selected.getter)) return false
        selected = unknownInput
      }
      const value = selected === missingInput || selected === unknownInput ? null : unwrapTransparentExpression(selected)
      const captured = context.captured?.values?.get(value)
      const absent = selected === missingInput || captured?.usesDefault || value && !captured && (ts.isVoidExpression(value) ||
        ts.isIdentifier(value) && value.text === "undefined" && valueStatus(value, scope) === null)
      return { source: value, captured, defaults: absent ? "always" : selected === unknownInput || captured?.maybeDefault ? "possible" : "never" }
    },
    child(selected, initializer, processStatus) {
      const childSource = selected.defaults === "always" ? initializer : selected.source
      const captured = selected.defaults === "always" ? context.captureInput(initializer, scope) : selected.captured
      const childStatus = processStatus ?? (selected.defaults === "possible" ? "unknown" : captured ? captured.environment : valueStatus(childSource, scope))
      return parameterBindingInput(childSource, childStatus, scope, {
        ...context, captured, unknown: selected.defaults === "possible" && !childSource,
        getterScope: selected.defaults === "always" ? scope : context.getterScope,
      })
    },
  }
}
