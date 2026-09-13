import ts from "typescript"
import { unwrapTransparentExpression } from "./cleanup-environment-scope.mjs"

/** Classify only syntax with specification-stable truthiness; unsupported values stay unknown. */
export function staticValueKind(node, identifierKind = () => "unknown") {
  const value = unwrapTransparentExpression(node)
  if (!value) return "unknown"
  if (ts.isFunctionLike(value)) return "callable"
  if (value.kind === ts.SyntaxKind.NullKeyword || ts.isVoidExpression(value)) return "nullish"
  if (ts.isIdentifier(value)) return value.text === "undefined" ? identifierKind(value.text) : "unknown"
  if (value.kind === ts.SyntaxKind.FalseKeyword) return "falsy"
  if (value.kind === ts.SyntaxKind.TrueKeyword) return "truthy"
  if (ts.isNumericLiteral(value)) return Number(value.text) === 0 ? "falsy" : "truthy"
  if (ts.isBigIntLiteral(value)) return /^0n$/i.test(value.text) ? "falsy" : "truthy"
  if (ts.isStringLiteral(value) || ts.isNoSubstitutionTemplateLiteral(value)) {
    return value.text === "" ? "falsy" : "truthy"
  }
  if (ts.isObjectLiteralExpression(value) || ts.isArrayLiteralExpression(value) ||
    ts.isClassExpression(value) || ts.isRegularExpressionLiteral(value)) return "truthy"
  return "unknown"
}
