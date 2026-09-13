import ts from "typescript"
import { callableExpressionState } from "./cleanup-environment-callables.mjs"
import { lookupAlias, TDZ_BINDING, unwrapTransparentExpression } from "./cleanup-environment-scope.mjs"
import { staticValueKind } from "./cleanup-static-value.mjs"

/** Snapshot literal members when evaluated, before later members/arguments can rebind them. */
export function createEnvironmentInputValues(valueStatus) {
  const evaluated = new WeakMap()
  const capture = (node, scope) => {
    const source = unwrapTransparentExpression(node)
    if (!source) return null
    const callable = callableExpressionState(source, scope)
    const environment = valueStatus(source, scope)
    const kind = staticValueKind(source, (name) => name === "undefined" && lookupAlias(scope, name) === null
      ? "nullish" : lookupAlias(scope, name) === TDZ_BINDING ? "throws" : "unknown")
    const usesDefault = ts.isOmittedExpression(source) || ts.isVoidExpression(source) ||
      ts.isIdentifier(source) && source.text === "undefined" && lookupAlias(scope, source.text) === null
    const values = new Map()
    const collect = (child) => {
      const value = evaluated.get(unwrapTransparentExpression(child))
      if (value) {
        values.set(unwrapTransparentExpression(child), value)
        for (const [key, nested] of value.values) values.set(key, nested)
        return
      }
      if (!ts.isFunctionLike(child)) ts.forEachChild(child, collect)
    }
    if (!ts.isFunctionLike(source)) ts.forEachChild(source, collect)
    const literalKey = ts.isStringLiteral(source) || ts.isNumericLiteral(source) || ts.isBigIntLiteral(source) ||
      ts.isNoSubstitutionTemplateLiteral(source) || [ts.SyntaxKind.NullKeyword, ts.SyntaxKind.TrueKeyword, ts.SyntaxKind.FalseKeyword].includes(source.kind)
      ? source.getText() : null
    return { callable, environment, kind, literalKey, source, usesDefault,
      maybeDefault: !usesDefault && kind === "unknown" &&
        !["proven", "process-object", "commonjs-wrapper-loader", "environment-container"].includes(environment) &&
        !(callable?.entries.size && !callable.maybeNonCallable), values }
  }
  return {
    record(node, scope) {
      // Capturing only literal children keeps routine scans and deep call graphs cheap.
      const parent = node.parent
      if (parent && (ts.isPropertyAssignment(parent) || ts.isShorthandPropertyAssignment(parent) ||
        ts.isArrayLiteralExpression(parent) || ts.isObjectLiteralExpression(parent) ||
        ts.isSpreadElement(parent) || ts.isSpreadAssignment(parent))) {
        evaluated.set(unwrapTransparentExpression(node), capture(node, scope))
      }
    },
    capture,
  }
}
