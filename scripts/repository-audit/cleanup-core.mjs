import { execFileSync } from "node:child_process"
import { createHash } from "node:crypto"
import { builtinModules } from "node:module"
import { extname, posix } from "node:path"

import ts from "typescript"

import {
  assertPrivatePathsAbsent,
  listTrackedIndexEntries,
  loadJson,
  normalizeRepoPath,
  stableJson,
} from "./core.mjs"

const POLICY_FIELDS = [
  "assetExtensions",
  "assetRoots",
  "environmentDeclarationPaths",
  "forbiddenTrackedPaths",
  "frameworkRoots",
  "ignoredPathPrefixes",
  "packageScriptCliOwnership",
  "protectedPathPrefixes",
  "schemaVersion",
  "scopes",
  "sourceExtensions",
  "textExtensions",
  "topLevelConfigRoots",
]
const SCOPE_NAMES = ["runtime", "tool", "test", "doc"]
const FRAMEWORK_FIELDS = ["directoryPrefixes", "fileBasenames"]
const DEPENDENCY_SECTIONS = ["dependencies", "devDependencies", "optionalDependencies", "peerDependencies"]
const BUILTIN_MODULES = new Set(builtinModules.map((name) => name.replace(/^node:/, "")))
const indexInternals = new WeakMap()

const compareText = (left, right) => left < right ? -1 : left > right ? 1 : 0
const sha256 = (value) => createHash("sha256").update(value).digest("hex")

function auditError(code) {
  const error = new Error(code)
  error.code = code
  return error
}

function assertExactFields(value, expected, code) {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw auditError(code)
  const keys = Object.keys(value).sort(compareText)
  const wanted = [...expected].sort(compareText)
  if (keys.length !== wanted.length || keys.some((key, index) => key !== wanted[index])) {
    throw auditError(code)
  }
}

function isNormalizedPolicyPath(value, { prefix = false } = {}) {
  if (typeof value !== "string" || value.length === 0) return false
  if (normalizeRepoPath(value) !== value || value.startsWith("/") || /^[a-z]:/i.test(value)) return false
  if (prefix && !value.endsWith("/")) return false
  if (!prefix && value.endsWith("/")) return false
  const comparable = prefix ? value.slice(0, -1) : value
  return !comparable.split("/").some((segment) => segment === "" || segment === "." || segment === "..")
}

function assertUniqueStrings(values, code, options = {}) {
  if (!Array.isArray(values) || values.length === 0) throw auditError(code)
  const seen = new Set()
  for (const value of values) {
    const valid = options.extension
      ? typeof value === "string" && /^\.[a-z0-9]+$/.test(value)
      : options.basename
        ? typeof value === "string" && /^[a-z0-9][a-z0-9-]*$/.test(value)
        : isNormalizedPolicyPath(value, { prefix: options.prefix })
    if (!valid || seen.has(value)) throw auditError(code)
    seen.add(value)
  }
}

/** Validate the complete schema-v1 cleanup policy without echoing rejected input. */
export function validateCleanupPolicy(policy) {
  assertExactFields(policy, POLICY_FIELDS, "CLEANUP_POLICY_INVALID")
  if (policy.schemaVersion !== 1) throw auditError("CLEANUP_POLICY_INVALID")
  assertUniqueStrings(policy.sourceExtensions, "CLEANUP_POLICY_INVALID", { extension: true })
  assertUniqueStrings(policy.textExtensions, "CLEANUP_POLICY_INVALID", { extension: true })
  if (policy.sourceExtensions.some((extension) => !policy.textExtensions.includes(extension))) {
    throw auditError("CLEANUP_POLICY_INVALID")
  }

  assertExactFields(policy.scopes, SCOPE_NAMES, "CLEANUP_POLICY_INVALID")
  const seenScopeRoots = new Set()
  for (const scope of SCOPE_NAMES) {
    if (!Array.isArray(policy.scopes[scope]) || policy.scopes[scope].length === 0) {
      throw auditError("CLEANUP_POLICY_INVALID")
    }
    for (const root of policy.scopes[scope]) {
      if (!isNormalizedPolicyPath(root, { prefix: root.endsWith("/") }) || seenScopeRoots.has(root)) {
        throw auditError("CLEANUP_POLICY_INVALID")
      }
      seenScopeRoots.add(root)
    }
  }

  assertExactFields(policy.frameworkRoots, FRAMEWORK_FIELDS, "CLEANUP_POLICY_INVALID")
  assertUniqueStrings(policy.frameworkRoots.directoryPrefixes, "CLEANUP_POLICY_INVALID", { prefix: true })
  assertUniqueStrings(policy.frameworkRoots.fileBasenames, "CLEANUP_POLICY_INVALID", { basename: true })
  assertUniqueStrings(policy.topLevelConfigRoots, "CLEANUP_POLICY_INVALID")
  assertUniqueStrings(policy.protectedPathPrefixes, "CLEANUP_POLICY_INVALID", { prefix: true })
  assertUniqueStrings(policy.assetRoots, "CLEANUP_POLICY_INVALID", { prefix: true })
  assertUniqueStrings(policy.assetExtensions, "CLEANUP_POLICY_INVALID", { extension: true })
  assertUniqueStrings(policy.environmentDeclarationPaths, "CLEANUP_POLICY_INVALID")
  assertUniqueStrings(policy.ignoredPathPrefixes, "CLEANUP_POLICY_INVALID", { prefix: true })

  if (!Array.isArray(policy.forbiddenTrackedPaths) || policy.forbiddenTrackedPaths.length === 0) {
    throw auditError("CLEANUP_POLICY_INVALID")
  }
  const forbiddenSeen = new Set()
  for (const path of policy.forbiddenTrackedPaths) {
    if (!isNormalizedPolicyPath(path, { prefix: path.endsWith("/") }) || forbiddenSeen.has(path)) {
      throw auditError("CLEANUP_POLICY_INVALID")
    }
    forbiddenSeen.add(path)
  }

  if (
    !policy.packageScriptCliOwnership ||
    typeof policy.packageScriptCliOwnership !== "object" ||
    Array.isArray(policy.packageScriptCliOwnership) ||
    Object.keys(policy.packageScriptCliOwnership).length === 0
  ) {
    throw auditError("CLEANUP_POLICY_INVALID")
  }
  for (const [cli, packageName] of Object.entries(policy.packageScriptCliOwnership)) {
    if (
      !/^[a-z0-9][a-z0-9-]*$/.test(cli) ||
      typeof packageName !== "string" ||
      !/^(?:@[a-z0-9._-]+\/)?[a-z0-9._-]+$/.test(packageName)
    ) {
      throw auditError("CLEANUP_POLICY_INVALID")
    }
  }
  return policy
}

/** Load and validate a cleanup policy while keeping parse and filesystem details private. */
export function loadCleanupPolicy(path) {
  try {
    return validateCleanupPolicy(loadJson(path))
  } catch {
    throw auditError("CLEANUP_POLICY_INVALID")
  }
}

function pathMatches(path, candidate) {
  return candidate.endsWith("/") ? path.startsWith(candidate) : path === candidate
}

function classifyScope(path, policy) {
  for (const scope of SCOPE_NAMES) {
    if (policy.scopes[scope].some((root) => pathMatches(path, root))) return scope
  }
  return "other"
}

function readIndexBlobs(root, entries, execFile) {
  if (entries.length === 0) return []
  let output
  try {
    output = execFile("git", ["cat-file", "--batch"], {
      cwd: root,
      input: `${entries.map((entry) => entry.oid).join("\n")}\n`,
      maxBuffer: 128 * 1024 * 1024,
      stdio: ["pipe", "pipe", "pipe"],
      windowsHide: true,
    })
  } catch {
    throw auditError("CLEANUP_INDEX_READ_FAILED")
  }
  const bytes = Buffer.isBuffer(output) ? output : Buffer.from(output)
  const contents = []
  let cursor = 0
  for (const entry of entries) {
    const headerEnd = bytes.indexOf(10, cursor)
    if (headerEnd < 0) throw auditError("CLEANUP_INDEX_READ_FAILED")
    const header = bytes.subarray(cursor, headerEnd).toString("utf8").replace(/\r$/, "")
    const match = /^([a-f0-9]+) blob (\d+)$/.exec(header)
    if (!match || match[1] !== entry.oid) throw auditError("CLEANUP_INDEX_READ_FAILED")
    const size = Number(match[2])
    if (!Number.isSafeInteger(size) || size < 0) throw auditError("CLEANUP_INDEX_READ_FAILED")
    const start = headerEnd + 1
    const end = start + size
    if (end >= bytes.length || bytes[end] !== 10) throw auditError("CLEANUP_INDEX_READ_FAILED")
    contents.push(bytes.subarray(start, end).toString("utf8"))
    cursor = end + 1
  }
  if (cursor !== bytes.length) throw auditError("CLEANUP_INDEX_READ_FAILED")
  return contents
}

/**
 * Build a metadata-only index backed by canonical stage-0 blob text. Blob contents
 * remain in a private WeakMap so serializing the returned index cannot disclose them.
 */
export function buildTrackedTextIndex(root, policy, execFile = execFileSync) {
  validateCleanupPolicy(policy)
  let entries
  try {
    entries = listTrackedIndexEntries(root, execFile)
    assertPrivatePathsAbsent(entries.map((entry) => entry.path), policy.forbiddenTrackedPaths)
  } catch (error) {
    if (error?.code === "CLEANUP_POLICY_INVALID") throw error
    throw auditError("CLEANUP_FORBIDDEN_OR_INVALID_INDEX")
  }

  const evidenceEntries = entries.filter((entry) => (
    !policy.ignoredPathPrefixes.some((prefix) => entry.path.startsWith(prefix))
  ))
  const declarationPaths = new Set(policy.environmentDeclarationPaths)
  const textExtensions = new Set(policy.textExtensions)
  const textEntries = evidenceEntries.filter((entry) => (
    textExtensions.has(extname(entry.path).toLowerCase()) || declarationPaths.has(entry.path)
  ))
  const texts = readIndexBlobs(root, textEntries, execFile)
  const textByPath = new Map()
  const records = textEntries.map((entry, index) => {
    const text = texts[index]
    textByPath.set(entry.path, text)
    return {
      path: entry.path,
      mode: entry.mode,
      oid: entry.oid,
      bytes: Buffer.byteLength(text),
      extension: extname(entry.path).toLowerCase(),
      scope: classifyScope(entry.path, policy),
      textSha256: sha256(text),
    }
  })
  const index = stableJson({
    schemaVersion: 1,
    records,
    trackedPaths: evidenceEntries.map((entry) => entry.path),
  })
  indexInternals.set(index, {
    textByPath,
    trackedPathSet: new Set(index.trackedPaths),
  })
  return index
}

function requireIndex(index) {
  const internals = indexInternals.get(index)
  if (!internals || index?.schemaVersion !== 1 || !Array.isArray(index.records)) {
    throw auditError("CLEANUP_INDEX_INVALID")
  }
  return internals
}

function scriptKind(path) {
  const extension = extname(path).toLowerCase()
  if (extension === ".tsx") return ts.ScriptKind.TSX
  if (extension === ".jsx") return ts.ScriptKind.JSX
  if (extension === ".js" || extension === ".mjs" || extension === ".cjs") return ts.ScriptKind.JS
  return ts.ScriptKind.TS
}

function sourceLocation(sourceFile, node) {
  const position = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile))
  return { line: position.line + 1, column: position.character + 1 }
}

function isLiteralNode(node) {
  return ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)
}

function packageOwner(specifier) {
  const unprefixed = specifier.replace(/^node:/, "")
  if (specifier.startsWith("node:") || BUILTIN_MODULES.has(unprefixed)) return null
  const parts = specifier.split("/")
  return specifier.startsWith("@") ? parts.slice(0, 2).join("/") : parts[0]
}

function moduleCandidatePaths(fromPath, specifier, policy) {
  let base
  if (specifier.startsWith("@/")) {
    base = specifier.slice(2)
  } else if (specifier.startsWith("./") || specifier.startsWith("../")) {
    base = posix.normalize(posix.join(posix.dirname(fromPath), specifier))
  } else {
    return []
  }
  if (base === ".." || base.startsWith("../") || base.startsWith("/")) return []
  const candidates = [base]
  const extension = extname(base).toLowerCase()
  if (!extension) {
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
  if (specifier.startsWith("/") || specifier === "@" || specifier.startsWith("@/") || specifier === "." || specifier === "..") {
    return { targetKind: "unresolved" }
  }
  const dependency = packageOwner(specifier)
  return dependency ? { dependency, targetKind: "package" } : { targetKind: "builtin" }
}

function collectSourceModuleRows(record, text, trackedPathSet, policy) {
  const sourceFile = ts.createSourceFile(
    record.path,
    text,
    ts.ScriptTarget.Latest,
    true,
    scriptKind(record.path),
  )
  const references = []
  const uncertainties = []
  const errors = sourceFile.parseDiagnostics.length > 0
    ? [{ code: "SOURCE_PARSE_DIAGNOSTIC", path: record.path, count: sourceFile.parseDiagnostics.length }]
    : []

  const recordLiteral = (node, kind, literal) => {
    const location = sourceLocation(sourceFile, node)
    const resolution = resolveModuleReference(record.path, literal, trackedPathSet, policy)
    const row = {
      fromPath: record.path,
      ...location,
      kind,
      literalSha256: sha256(literal),
      ...resolution,
    }
    references.push(row)
    if (resolution.targetKind === "unresolved") {
      errors.push({
        code: "UNRESOLVED_LITERAL_MODULE",
        fromPath: record.path,
        ...location,
        literalSha256: row.literalSha256,
      })
    }
  }
  const recordUncertainty = (node, kind) => {
    const location = sourceLocation(sourceFile, node)
    uncertainties.push({
      code: "NONLITERAL_MODULE_EXPRESSION",
      path: record.path,
      ...location,
      kind,
      expressionSha256: sha256(node.getText(sourceFile)),
    })
  }

  const visit = (node) => {
    if (ts.isImportDeclaration(node) && node.moduleSpecifier) {
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
          : null
      if (kind) {
        const argument = node.arguments[0]
        if (argument && isLiteralNode(argument)) recordLiteral(argument, kind, argument.text)
        else recordUncertainty(argument ?? node, kind)
      }
    }
    ts.forEachChild(node, visit)
  }
  visit(sourceFile)
  return { references, uncertainties, errors }
}

function compareLocation(left, right) {
  return (
    compareText(left.path ?? left.fromPath ?? "", right.path ?? right.fromPath ?? "") ||
    (left.line ?? 0) - (right.line ?? 0) ||
    (left.column ?? 0) - (right.column ?? 0) ||
    compareText(left.kind ?? left.code ?? "", right.kind ?? right.code ?? "") ||
    compareText(left.literalSha256 ?? left.expressionSha256 ?? "", right.literalSha256 ?? right.expressionSha256 ?? "")
  )
}

function parsePackage(index) {
  const { textByPath } = requireIndex(index)
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

function packageScriptEntrypoints(index, policy) {
  const packageJson = parsePackage(index)
  const scripts = packageJson.scripts && typeof packageJson.scripts === "object" ? packageJson.scripts : {}
  const sourceExtensions = new Set(policy.sourceExtensions)
  const sourcePaths = index.records
    .filter((record) => sourceExtensions.has(record.extension))
    .map((record) => record.path)
  const roots = []
  for (const [scriptName, command] of Object.entries(scripts)) {
    if (typeof command !== "string") continue
    const normalizedCommand = normalizeRepoPath(command)
    for (const path of sourcePaths) {
      if (normalizedCommand.includes(path)) roots.push({ path, reason: `package-script:${scriptName}` })
    }
  }
  return roots
}

function frameworkRoot(path, policy) {
  if (!policy.frameworkRoots.directoryPrefixes.some((prefix) => path.startsWith(prefix))) return false
  const basename = posix.basename(path, extname(path))
  return policy.frameworkRoots.fileBasenames.includes(basename)
}

/** Build the static module graph, explicit roots, parse errors, and dynamic uncertainty sites. */
export function buildModuleEvidence(index, policy) {
  validateCleanupPolicy(policy)
  const { textByPath, trackedPathSet } = requireIndex(index)
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
    uncertainties.push(...rows.uncertainties)
    errors.push(...rows.errors)
  }

  const roots = []
  for (const module of modules) {
    if (frameworkRoot(module.path, policy)) roots.push({ path: module.path, reason: "framework-root" })
    if (policy.topLevelConfigRoots.includes(module.path)) roots.push({ path: module.path, reason: "top-level-config" })
    if (module.scope === "test") roots.push({ path: module.path, reason: "test-root" })
    if (policy.protectedPathPrefixes.some((prefix) => module.path.startsWith(prefix))) {
      roots.push({ path: module.path, reason: "protected-path" })
    }
  }
  roots.push(...packageScriptEntrypoints(index, policy))
  const uniqueRoots = [...new Map(
    roots
      .sort((left, right) => compareText(left.path, right.path) || compareText(left.reason, right.reason))
      .map((row) => [`${row.path}\0${row.reason}`, row]),
  ).values()]
  return stableJson({
    schemaVersion: 1,
    modules,
    roots: uniqueRoots,
    references: references.sort(compareLocation),
    uncertainties: uncertainties.sort(compareLocation),
    errors: errors.sort(compareLocation),
  })
}

/** Build package declaration and usage evidence, folding package subpaths to their owner. */
export function buildDependencyEvidence(index, policy) {
  validateCleanupPolicy(policy)
  const packageJson = parsePackage(index)
  const declarations = []
  for (const section of DEPENDENCY_SECTIONS) {
    const values = packageJson[section]
    if (!values || typeof values !== "object" || Array.isArray(values)) continue
    for (const name of Object.keys(values).sort(compareText)) declarations.push({ name, section })
  }

  const moduleEvidence = buildModuleEvidence(index, policy)
  const references = moduleEvidence.references
    .filter((row) => row.targetKind === "package")
    .map((row) => ({
      packageName: row.dependency,
      fromPath: row.fromPath,
      line: row.line,
      column: row.column,
      kind: row.kind,
      literalSha256: row.literalSha256,
    }))
  const scripts = packageJson.scripts && typeof packageJson.scripts === "object" ? packageJson.scripts : {}
  for (const [scriptName, command] of Object.entries(scripts)) {
    if (typeof command !== "string") continue
    const ownedPackages = new Set()
    for (const segment of command.split(/&&|\|\||[;|]/)) {
      const tokens = segment.trim().split(/\s+/).filter(Boolean)
      while (tokens[0] && /^[A-Za-z_][A-Za-z0-9_]*=/.test(tokens[0])) tokens.shift()
      const cli = ["npx", "pnpm", "yarn"].includes(tokens[0]) ? tokens[1] : tokens[0]
      const packageName = policy.packageScriptCliOwnership[cli]
      if (packageName) ownedPackages.add(packageName)
    }
    for (const packageName of ownedPackages) {
      references.push({ packageName, scriptName, kind: "package-script-cli" })
    }
  }
  references.sort((left, right) => (
    compareText(left.packageName, right.packageName) ||
    compareText(left.fromPath ?? "package.json", right.fromPath ?? "package.json") ||
    (left.line ?? 0) - (right.line ?? 0) ||
    (left.column ?? 0) - (right.column ?? 0) ||
    compareText(left.scriptName ?? "", right.scriptName ?? "")
  ))
  return stableJson({
    schemaVersion: 1,
    declarations,
    references,
    uncertainties: moduleEvidence.uncertainties,
    errors: moduleEvidence.errors,
  })
}

function collectTextLiterals(record, text) {
  if ([".js", ".jsx", ".ts", ".tsx", ".mjs", ".cjs"].includes(record.extension)) {
    const sourceFile = ts.createSourceFile(record.path, text, ts.ScriptTarget.Latest, true, scriptKind(record.path))
    const literals = []
    const visit = (node) => {
      if (isLiteralNode(node)) literals.push({ value: node.text, ...sourceLocation(sourceFile, node) })
      ts.forEachChild(node, visit)
    }
    visit(sourceFile)
    return literals
  }
  const literals = []
  const seen = new Set()
  const addLiteral = (value, offset) => {
    const trimmed = value.trim()
    const start = offset + Math.max(0, value.indexOf(trimmed))
    const key = `${start}\0${trimmed}`
    if (!trimmed || seen.has(key)) return
    seen.add(key)
    const prefix = text.slice(0, start)
    const lastNewline = prefix.lastIndexOf("\n")
    literals.push({
      value: trimmed,
      line: prefix.split("\n").length,
      column: start - lastNewline,
    })
  }
  const scan = (matcher) => {
    for (let match = matcher.exec(text); match; match = matcher.exec(text)) {
      const value = match.slice(1).find((candidate) => candidate !== undefined)
      if (value !== undefined) addLiteral(value, match.index + Math.max(0, match[0].indexOf(value)))
      if (match[0].length === 0) matcher.lastIndex += 1
    }
  }

  scan(/(?:url\(\s*)?["']([^"'\r\n)]+)["']\s*\)?|url\(\s*([^)'"\s][^)]*)\s*\)/g)
  if (record.extension === ".md") {
    scan(/!?\[[^\]\r\n]*\]\(\s*(?:<([^>\r\n]+)>|([^\s)]+))/g)
  }
  if (record.extension === ".html") {
    scan(/(?:src|href|poster)\s*=\s*([^\s"'=<>`]+)/gi)
  }
  if (record.extension === ".yaml" || record.extension === ".yml") {
    scan(/^[ \t]*[^#\r\n:]+:[ \t]*([^\s#]+)[ \t]*(?:#.*)?$/gm)
  }
  return literals
}

function assetTarget(fromPath, literal, assetExtensions) {
  if (/^(?:[a-z][a-z0-9+.-]*:|#|\\\\)/i.test(literal)) return null
  const withoutSuffix = literal.split(/[?#]/, 1)[0].replaceAll("\\", "/")
  if (!assetExtensions.has(extname(withoutSuffix).toLowerCase())) return null
  let target
  if (withoutSuffix.startsWith("/")) target = `public${withoutSuffix}`
  else if (withoutSuffix.startsWith("public/")) target = withoutSuffix
  else if (withoutSuffix.startsWith("./") || withoutSuffix.startsWith("../")) {
    target = posix.normalize(posix.join(posix.dirname(fromPath), withoutSuffix))
  } else {
    return null
  }
  if (target === ".." || target.startsWith("../") || target.startsWith("/")) return null
  return target
}

/** Build tracked-asset and literal-reference evidence without retaining literal contents. */
export function buildAssetEvidence(index, policy) {
  validateCleanupPolicy(policy)
  const { textByPath, trackedPathSet } = requireIndex(index)
  const assetExtensions = new Set(policy.assetExtensions)
  const assets = index.trackedPaths
    .filter((path) => (
      policy.assetRoots.some((root) => path.startsWith(root)) &&
      assetExtensions.has(extname(path).toLowerCase())
    ))
    .map((path) => ({ path }))
  const references = []
  const errors = []
  for (const record of index.records) {
    for (const literal of collectTextLiterals(record, textByPath.get(record.path))) {
      const targetPath = assetTarget(record.path, literal.value, assetExtensions)
      if (!targetPath) continue
      const row = {
        fromPath: record.path,
        line: literal.line,
        column: literal.column,
        literalSha256: sha256(literal.value),
        targetPath,
      }
      references.push(row)
      if (!trackedPathSet.has(targetPath)) {
        errors.push({
          code: "UNRESOLVED_LITERAL_ASSET",
          fromPath: row.fromPath,
          line: row.line,
          column: row.column,
          literalSha256: row.literalSha256,
        })
      }
    }
  }
  return stableJson({
    schemaVersion: 1,
    assets,
    references: references.sort(compareLocation),
    uncertainties: [],
    errors: errors.sort(compareLocation),
  })
}

function isProcessEnv(node) {
  return (
    ts.isPropertyAccessExpression(node) &&
    ts.isIdentifier(node.expression) &&
    node.expression.text === "process" &&
    node.name.text === "env"
  )
}

function collectEnvironmentRows(record, text) {
  const sourceFile = ts.createSourceFile(record.path, text, ts.ScriptTarget.Latest, true, scriptKind(record.path))
  const reads = []
  const uncertainties = []
  const addRead = (node, name, kind) => reads.push({
    name,
    path: record.path,
    ...sourceLocation(sourceFile, node),
    kind,
  })
  const addUncertainty = (node, kind) => uncertainties.push({
    code: "COMPUTED_ENVIRONMENT_READ",
    path: record.path,
    ...sourceLocation(sourceFile, node),
    kind,
    expressionSha256: sha256(node.getText(sourceFile)),
  })
  const visit = (node) => {
    if (ts.isPropertyAccessExpression(node) && isProcessEnv(node.expression)) {
      addRead(node.name, node.name.text, "property-access")
    } else if (ts.isElementAccessExpression(node) && isProcessEnv(node.expression)) {
      if (node.argumentExpression && isLiteralNode(node.argumentExpression)) {
        addRead(node.argumentExpression, node.argumentExpression.text, "element-access")
      } else {
        addUncertainty(node.argumentExpression ?? node, "element-access")
      }
    } else if (
      ts.isVariableDeclaration(node) &&
      ts.isObjectBindingPattern(node.name) &&
      node.initializer &&
      isProcessEnv(node.initializer)
    ) {
      for (const element of node.name.elements) {
        if (element.dotDotDotToken) {
          addUncertainty(element, "destructure-rest")
          continue
        }
        const propertyName = element.propertyName ?? element.name
        if (ts.isIdentifier(propertyName) || isLiteralNode(propertyName)) {
          addRead(propertyName, propertyName.text, "destructure")
        } else {
          addUncertainty(propertyName, "destructure")
        }
      }
    }
    ts.forEachChild(node, visit)
  }
  visit(sourceFile)
  return { reads, uncertainties }
}

/** Extract static environment-variable names and metadata without reading process.env. */
export function buildEnvironmentEvidence(index, policy) {
  validateCleanupPolicy(policy)
  const { textByPath } = requireIndex(index)
  const sourceExtensions = new Set(policy.sourceExtensions)
  const reads = []
  const uncertainties = []
  for (const record of index.records) {
    if (!sourceExtensions.has(record.extension)) continue
    const rows = collectEnvironmentRows(record, textByPath.get(record.path))
    reads.push(...rows.reads)
    uncertainties.push(...rows.uncertainties)
  }

  const declarations = []
  for (const path of policy.environmentDeclarationPaths) {
    const text = textByPath.get(path)
    if (text === undefined) continue
    const lines = text.split(/\r?\n/)
    for (let index = 0; index < lines.length; index += 1) {
      const match = /^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=/.exec(lines[index])
      if (match) declarations.push({ name: match[1], path, line: index + 1, column: lines[index].indexOf(match[1]) + 1 })
    }
  }
  return stableJson({
    schemaVersion: 1,
    declarations: declarations.sort(compareLocation),
    reads: reads.sort(compareLocation),
    uncertainties: uncertainties.sort(compareLocation),
    errors: [],
  })
}

/** Wrap canonical evidence in the shared non-authoritative deterministic report shape. */
export function buildAuditEnvelope(kind, evidence) {
  if (typeof kind !== "string" || !/^[a-z][a-z0-9-]*$/.test(kind)) {
    throw auditError("CLEANUP_AUDIT_KIND_INVALID")
  }
  const canonicalEvidence = stableJson(evidence)
  return stableJson({
    schemaVersion: 1,
    kind,
    deletionAuthority: false,
    evidenceSha256: sha256(JSON.stringify(canonicalEvidence)),
    evidence: canonicalEvidence,
  })
}
