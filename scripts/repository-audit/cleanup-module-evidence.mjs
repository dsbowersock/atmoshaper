import { builtinModules } from "node:module"
import { extname, posix } from "node:path"

import ts from "typescript"

import {
  auditError,
  compareText,
  isFrameworkConventionPath,
  pathMatches,
  requireTrackedTextIndex,
  sha256,
  validateCleanupPolicy,
} from "./cleanup-core.mjs"
import { isLiteralNode, scriptKind, sourceLocation } from "./cleanup-source.mjs"
import { normalizeRepoPath, stableJson } from "./core.mjs"

const BUILTIN_MODULES = new Set(builtinModules.map((name) => name.replace(/^node:/, "")))
const PACKAGE_SEGMENT = /^[A-Za-z0-9._~-]+$/

function packageOwner(specifier) {
  const unprefixed = specifier.replace(/^node:/, "")
  if (BUILTIN_MODULES.has(unprefixed)) return null
  if (specifier.startsWith("node:")) return undefined
  const parts = specifier.split("/")
  if (parts.some((part) => !part || part === "." || part === "..")) return undefined
  if (specifier.startsWith("@")) {
    if (parts.length < 2 || !PACKAGE_SEGMENT.test(parts[0].slice(1)) || !parts.slice(1).every((part) => PACKAGE_SEGMENT.test(part))) {
      return undefined
    }
    return parts.slice(0, 2).join("/")
  }
  return parts.every((part) => PACKAGE_SEGMENT.test(part)) ? parts[0] : undefined
}

function moduleCandidatePaths(fromPath, specifier, policy) {
  let base
  if (specifier.startsWith("@/")) base = specifier.slice(2)
  else if (specifier.startsWith("./") || specifier.startsWith("../")) {
    base = posix.normalize(posix.join(posix.dirname(fromPath), specifier))
  } else return []
  if (base === ".." || base.startsWith("../") || base.startsWith("/")) return []
  const candidates = [base]
  const extension = extname(base).toLowerCase()
  const hasSupportedExtension = policy.sourceExtensions.includes(extension) || [".css", ".json"].includes(extension)
  if (!hasSupportedExtension) {
    for (const supported of policy.sourceExtensions) candidates.push(`${base}${supported}`)
    candidates.push(`${base}.json`, `${base}.css`)
    for (const supported of policy.sourceExtensions) candidates.push(`${base}/index${supported}`)
    candidates.push(`${base}/index.json`, `${base}/index.css`)
  } else if ([".js", ".jsx", ".mjs", ".cjs"].includes(extension)) {
    const stem = base.slice(0, -extension.length)
    for (const supported of [".ts", ".tsx"]) candidates.push(`${stem}${supported}`)
  }
  return [...new Set(candidates)]
}

function resolveModuleReference(fromPath, specifier, trackedPathSet, policy) {
  const candidates = moduleCandidatePaths(fromPath, specifier, policy)
  if (candidates.length > 0) {
    const path = candidates.find((candidate) => trackedPathSet.has(candidate))
    return path ? { targetKind: "tracked-module", targetPath: path } : { targetKind: "unresolved" }
  }
  if (
    specifier.startsWith("/") || specifier === "@" || specifier.startsWith("@/") ||
    specifier === "." || specifier === ".."
  ) return { targetKind: "unresolved" }
  const dependency = packageOwner(specifier)
  if (dependency) return { dependency, targetKind: "package" }
  return dependency === null ? { targetKind: "builtin" } : { targetKind: "unresolved" }
}

function collectSourceModuleRows(record, text, trackedPathSet, policy) {
  const sourceFile = ts.createSourceFile(record.path, text, ts.ScriptTarget.Latest, true, scriptKind(record.path))
  const references = []
  const uncertainties = []
  const errors = sourceFile.parseDiagnostics.length > 0
    ? [{ code: "SOURCE_PARSE_DIAGNOSTIC", path: record.path, count: sourceFile.parseDiagnostics.length }]
    : []
  const recordLiteral = (node, kind, literal) => {
    const location = sourceLocation(sourceFile, node)
    const resolution = resolveModuleReference(record.path, literal, trackedPathSet, policy)
    const row = {
      fromPath: record.path, ...location, kind, literalSha256: sha256(literal), ...resolution,
    }
    references.push(row)
    if (resolution.targetKind === "unresolved") {
      errors.push({
        code: "UNRESOLVED_LITERAL_MODULE", fromPath: record.path,
        ...location, literalSha256: row.literalSha256,
      })
    }
  }
  const recordUncertainty = (node, kind) => {
    uncertainties.push({
      code: "NONLITERAL_MODULE_EXPRESSION", path: record.path,
      ...sourceLocation(sourceFile, node), kind, expressionSha256: sha256(node.getText(sourceFile)),
    })
  }
  const visit = (node) => {
    if (ts.isImportTypeNode(node)) {
      const argument = ts.isLiteralTypeNode(node.argument) ? node.argument.literal : node.argument
      if (isLiteralNode(argument)) recordLiteral(argument, "import-type", argument.text)
      else recordUncertainty(argument, "import-type")
    } else if (ts.isImportDeclaration(node) && node.moduleSpecifier) {
      if (isLiteralNode(node.moduleSpecifier)) recordLiteral(node.moduleSpecifier, "import", node.moduleSpecifier.text)
      else recordUncertainty(node.moduleSpecifier, "import")
    } else if (ts.isExportDeclaration(node) && node.moduleSpecifier) {
      if (isLiteralNode(node.moduleSpecifier)) recordLiteral(node.moduleSpecifier, "export-from", node.moduleSpecifier.text)
      else recordUncertainty(node.moduleSpecifier, "export-from")
    } else if (ts.isCallExpression(node)) {
      const kind = node.expression.kind === ts.SyntaxKind.ImportKeyword
        ? "dynamic-import"
        : ts.isIdentifier(node.expression) && node.expression.text === "require"
          ? "require"
          : ts.isPropertyAccessExpression(node.expression) &&
              ts.isIdentifier(node.expression.expression) &&
              node.expression.expression.text === "require" && node.expression.name.text === "resolve"
            ? "require-resolve"
            : null
      if (kind) {
        const argument = node.arguments[0]
        if (argument && isLiteralNode(argument)) recordLiteral(argument, kind, argument.text)
        else recordUncertainty(argument ?? node, kind)
      }
    }
    for (const jsDoc of node.jsDoc ?? []) visit(jsDoc)
    ts.forEachChild(node, visit)
  }
  visit(sourceFile)
  return { references, uncertainties, errors }
}

function compareLocation(left, right) {
  return (
    compareText(left.path ?? left.fromPath ?? "", right.path ?? right.fromPath ?? "") ||
    (left.line ?? 0) - (right.line ?? 0) || (left.column ?? 0) - (right.column ?? 0) ||
    compareText(left.kind ?? left.code ?? "", right.kind ?? right.code ?? "") ||
    compareText(left.literalSha256 ?? left.expressionSha256 ?? "", right.literalSha256 ?? right.expressionSha256 ?? "")
  )
}

function parsePackage(index) {
  const { textByPath } = requireTrackedTextIndex(index)
  const text = textByPath.get("package.json")
  if (text === undefined) throw auditError("CLEANUP_PACKAGE_MISSING")
  try {
    const value = JSON.parse(text)
    if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error()
    return value
  } catch {
    throw auditError("CLEANUP_PACKAGE_INVALID")
  }
}

const NODE_CODE_OPTIONS = new Set(["-e", "--eval", "-p", "--print"])
const NODE_MODULE_OPTIONS = new Set(["--experimental-loader", "--import", "--loader", "-r", "--require"])
const NODE_OPTIONS_WITH_VALUES = new Set([
  "-C", "--conditions", "--cpu-prof-dir", "--diagnostic-dir", "--env-file", "--env-file-if-exists",
  "--heap-prof-dir", "--import", "--inspect-port", "--loader", "--experimental-loader",
  "--openssl-config", "-r", "--require", "--test-reporter", "--test-reporter-destination", "--title",
])

function shellTokens(segment) {
  return (segment.match(/"(?:\\.|[^"])*"|'(?:\\.|[^'])*'|[^\s]+/g) ?? []).map((token) => (
    (token.startsWith('"') && token.endsWith('"')) || (token.startsWith("'") && token.endsWith("'"))
      ? token.slice(1, -1) : token
  ))
}

function nodeExecutedEntrypoints(command, sourcePathSet) {
  const entrypoints = []
  for (const segment of command.split(/&&|\|\||[;|]/)) {
    const tokens = shellTokens(segment)
    while (tokens[0] && /^[A-Za-z_][A-Za-z0-9_]*=/.test(tokens[0])) tokens.shift()
    if (!["node", "node.exe"].includes(tokens[0]?.toLowerCase())) continue
    let cursor = 1
    for (; cursor < tokens.length; cursor += 1) {
      const token = tokens[cursor]
      const option = token.split("=", 1)[0]
      if (token === "--") { cursor += 1; break }
      if (NODE_CODE_OPTIONS.has(option)) { cursor = tokens.length; break }
      if (NODE_OPTIONS_WITH_VALUES.has(option)) {
        const equalsIndex = token.indexOf("=")
        const value = equalsIndex >= 0 ? token.slice(equalsIndex + 1) : tokens[cursor + 1]
        if (equalsIndex < 0) cursor += 1
        const modulePath = normalizeRepoPath(value ?? "")
        if (NODE_MODULE_OPTIONS.has(option) && sourcePathSet.has(modulePath)) entrypoints.push(modulePath)
        continue
      }
      if (token.startsWith("-")) continue
      break
    }
    const candidate = normalizeRepoPath(tokens[cursor] ?? "")
    if (sourcePathSet.has(candidate)) entrypoints.push(candidate)
  }
  return entrypoints
}

function packageScriptEntrypoints(index, policy) {
  const packageJson = parsePackage(index)
  const scripts = packageJson.scripts && typeof packageJson.scripts === "object" ? packageJson.scripts : {}
  const sourcePaths = index.records
    .filter((record) => policy.sourceExtensions.includes(record.extension))
    .map((record) => record.path)
  const sourcePathSet = new Set(sourcePaths)
  const roots = []
  for (const [scriptName, command] of Object.entries(scripts)) {
    if (typeof command !== "string") continue
    for (const path of nodeExecutedEntrypoints(command, sourcePathSet)) {
      roots.push({ path, reason: `package-script:${scriptName}` })
    }
  }
  return roots
}

function isPolicyFixture(record, policy) {
  return record.scope === "test" && policy.protectedPathPrefixes.some((prefix) => pathMatches(record.path, prefix))
}

/** Build the static module graph and distinguish protected negative fixtures from active-code errors. */
export function buildModuleEvidence(index, policy) {
  validateCleanupPolicy(policy)
  const { textByPath, trackedPathSet } = requireTrackedTextIndex(index)
  const sourceExtensions = new Set(policy.sourceExtensions)
  const modules = index.records
    .filter((record) => sourceExtensions.has(record.extension))
    .map((record) => ({ path: record.path, scope: record.scope, textSha256: record.textSha256 }))
  const references = []
  const uncertainties = []
  const errors = []
  for (const record of index.records) {
    if (!sourceExtensions.has(record.extension)) continue
    const rows = collectSourceModuleRows(record, textByPath.get(record.path), trackedPathSet, policy)
    references.push(...rows.references)
    for (const error of rows.errors) {
      if (error.code === "UNRESOLVED_LITERAL_MODULE" && isPolicyFixture(record, policy)) {
        uncertainties.push({ ...error, code: "NEGATIVE_FIXTURE_UNRESOLVED_LITERAL_MODULE", path: error.fromPath })
      } else errors.push(error)
    }
    uncertainties.push(...rows.uncertainties)
  }
  const roots = []
  for (const moduleEntry of modules) {
    if (isFrameworkConventionPath(moduleEntry.path, policy)) {
      roots.push({ path: moduleEntry.path, reason: "framework-root" })
    }
    if (policy.topLevelConfigRoots.includes(moduleEntry.path)) roots.push({ path: moduleEntry.path, reason: "top-level-config" })
    if (moduleEntry.scope === "test") roots.push({ path: moduleEntry.path, reason: "test-root" })
    if (policy.protectedPathPrefixes.some((prefix) => moduleEntry.path.startsWith(prefix))) {
      roots.push({ path: moduleEntry.path, reason: "protected-path" })
    }
  }
  roots.push(...packageScriptEntrypoints(index, policy))
  const uniqueRoots = [...new Map(
    roots.sort((left, right) => compareText(left.path, right.path) || compareText(left.reason, right.reason))
      .map((row) => [`${row.path}\0${row.reason}`, row]),
  ).values()]
  return stableJson({
    schemaVersion: 1, modules, roots: uniqueRoots,
    references: references.sort(compareLocation), uncertainties: uncertainties.sort(compareLocation),
    errors: errors.sort(compareLocation),
  })
}

export { parsePackage }
