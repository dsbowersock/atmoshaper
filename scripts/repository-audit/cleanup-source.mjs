import { extname } from "node:path"

import ts from "typescript"

export function scriptKind(path) {
  const extension = extname(path).toLowerCase()
  if (extension === ".tsx") return ts.ScriptKind.TSX
  if (extension === ".jsx") return ts.ScriptKind.JSX
  if ([".js", ".mjs", ".cjs"].includes(extension)) return ts.ScriptKind.JS
  return ts.ScriptKind.TS
}

export function sourceLocation(sourceFile, node) {
  const position = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile))
  return { line: position.line + 1, column: position.character + 1 }
}

export function isLiteralNode(node) {
  return ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)
}
