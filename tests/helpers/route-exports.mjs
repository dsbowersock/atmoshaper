import ts from "typescript"

// Next 16.2's webpack route validator checks runtime exports; erased types are permitted.
export const SUPPORTED_ROUTE_RUNTIME_EXPORTS = Object.freeze([
  "GET", "HEAD", "OPTIONS", "POST", "PUT", "DELETE", "PATCH", "config",
  "generateStaticParams", "unstable_instant", "unstable_dynamicStaleTime",
  "revalidate", "dynamic", "dynamicParams", "fetchCache", "preferredRegion",
  "runtime", "maxDuration",
])

/** Returns actual runtime export names, including aliases/defaults; unresolved export-stars fail closed. */
export function runtimeRouteExports(source, fileName = "route.ts") {
  const ast = ts.createSourceFile(fileName, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS)
  const names = []
  function bindingNames(name) {
    if (ts.isIdentifier(name)) names.push(name.text)
    else for (const element of name.elements) if (ts.isBindingElement(element)) bindingNames(element.name)
  }
  for (const node of ast.statements) {
    if (ts.isExportDeclaration(node)) {
      if (node.isTypeOnly) continue
      if (!node.exportClause) names.push("*")
      else if (ts.isNamedExports(node.exportClause)) {
        for (const entry of node.exportClause.elements) if (!entry.isTypeOnly) names.push(entry.name.text)
      } else names.push(node.exportClause.name.text)
      continue
    }
    if (ts.isExportAssignment(node)) { names.push("default"); continue }
    if (!node.modifiers?.some((modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword)) continue
    if (ts.isInterfaceDeclaration(node) || ts.isTypeAliasDeclaration(node)) continue
    if (node.modifiers.some((modifier) => modifier.kind === ts.SyntaxKind.DefaultKeyword)) {
      names.push("default")
      continue
    }
    if (ts.isVariableStatement(node)) for (const declaration of node.declarationList.declarations) bindingNames(declaration.name)
    else if (node.name) names.push(node.name.text)
  }
  return [...new Set(names)].sort()
}

/** Finds framework-incompatible exports without loading route code or its provider dependencies. */
export function unsupportedRouteExports(source, fileName) {
  const supported = new Set(SUPPORTED_ROUTE_RUNTIME_EXPORTS)
  return runtimeRouteExports(source, fileName).filter((name) => !supported.has(name))
}
