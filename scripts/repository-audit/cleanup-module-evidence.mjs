import { posix } from "node:path"

import ts from "typescript"

import {
  auditError,
  compareText,
  isFrameworkConventionPath,
  pathMatches,
  requireTrackedTextIndex,
  selectTrackedMetadata,
  sha256,
  validateCleanupPolicy,
} from "./cleanup-core.mjs"
import { isLiteralNode, scriptKind, sourceLocation } from "./cleanup-source.mjs"
import { moduleLoaderCalls } from "./cleanup-module-loaders.mjs"
import { resolveModuleReference } from "./cleanup-module-resolution.mjs"
import { normalizeRepoPath, stableJson } from "./core.mjs"

function collectSourceModuleRows(record, text, trackedPathSet, policy) {
  const sourceFile = ts.createSourceFile(record.path, text, ts.ScriptTarget.Latest, true, scriptKind(record.path))
  const loaderCalls = moduleLoaderCalls(sourceFile, record.path)
  const isFrameworkConfig = policy.topLevelConfigRoots.includes(record.path)
  const references = []
  const uncertainties = []
  const errors = sourceFile.parseDiagnostics.length > 0
    ? [{ code: "SOURCE_PARSE_DIAGNOSTIC", path: record.path, count: sourceFile.parseDiagnostics.length }]
    : []
  const configBindings = new Map()
  const pathResolveNames = new Set()
  const pathDirnameNames = new Set()
  const fileUrlToPathNames = new Set()
  const hasTypeOnlySpecifier = (clause) => Boolean(
    clause && (ts.isNamedImports(clause) || ts.isNamedExports(clause)) &&
    clause.elements.some((element) => element.isTypeOnly),
  )

  for (const statement of sourceFile.statements) {
    if (ts.isImportDeclaration(statement) && isLiteralNode(statement.moduleSpecifier)) {
      const source = statement.moduleSpecifier.text
      const bindings = statement.importClause?.namedBindings
      if (bindings && ts.isNamedImports(bindings)) {
        for (const element of bindings.elements) {
          const importedName = element.propertyName?.text ?? element.name.text
          if (source === "node:path" && importedName === "resolve") pathResolveNames.add(element.name.text)
          if (source === "node:path" && importedName === "dirname") pathDirnameNames.add(element.name.text)
          if (source === "node:url" && importedName === "fileURLToPath") fileUrlToPathNames.add(element.name.text)
        }
      }
    } else if (
      ts.isVariableStatement(statement) &&
      (statement.declarationList.flags & ts.NodeFlags.Const) !== 0
    ) {
      for (const declaration of statement.declarationList.declarations) {
        if (ts.isIdentifier(declaration.name) && declaration.initializer) {
          configBindings.set(declaration.name.text, declaration.initializer)
        }
      }
    }
  }

  const bindingContainsName = (binding, name) => {
    if (ts.isIdentifier(binding)) return binding.text === name
    if (ts.isObjectBindingPattern(binding) || ts.isArrayBindingPattern(binding)) {
      return binding.elements.some((element) => (
        ts.isBindingElement(element) && bindingContainsName(element.name, name)
      ))
    }
    return false
  }
  const variableListContainsName = (list, name) => (
    list.declarations.some((declaration) => bindingContainsName(declaration.name, name))
  )
  const statementsContainBinding = (statements, name) => statements.some((statement) => (
    ts.isVariableStatement(statement)
      ? variableListContainsName(statement.declarationList, name)
      : (ts.isFunctionDeclaration(statement) || ts.isClassDeclaration(statement)) && statement.name?.text === name
  ))
  const functionContainsVarBinding = (functionNode, name) => {
    let found = false
    const visit = (node) => {
      if (found || ts.isFunctionLike(node) || ts.isClassDeclaration(node) || ts.isClassExpression(node)) return
      if (
        ts.isVariableDeclarationList(node) && (node.flags & ts.NodeFlags.BlockScoped) === 0 &&
        variableListContainsName(node, name)
      ) {
        found = true
        return
      }
      ts.forEachChild(node, visit)
    }
    if (functionNode.body) ts.forEachChild(functionNode.body, visit)
    return found
  }
  /** Reject identifiers captured by a nearer lexical declaration than the validated top-level owner. */
  const isLexicallyShadowed = (identifier) => {
    const name = identifier.text
    for (let current = identifier.parent; current && !ts.isSourceFile(current); current = current.parent) {
      if (ts.isFunctionLike(current) && (
        current.name?.text === name || current.parameters.some((parameter) => bindingContainsName(parameter.name, name)) ||
        functionContainsVarBinding(current, name)
      )) return true
      if (ts.isBlock(current) && statementsContainBinding(current.statements, name)) return true
      if (ts.isCaseBlock(current) && current.clauses.some((clause) => (
        statementsContainBinding(clause.statements, name)
      ))) return true
      if (ts.isCatchClause(current) && current.variableDeclaration && (
        bindingContainsName(current.variableDeclaration.name, name)
      )) return true
      if (
        (ts.isForStatement(current) || ts.isForInStatement(current) || ts.isForOfStatement(current)) &&
        current.initializer && ts.isVariableDeclarationList(current.initializer) &&
        variableListContainsName(current.initializer, name)
      ) return true
    }
    return false
  }
  const isNamedCall = (node, names) => (
    ts.isCallExpression(node) && ts.isIdentifier(node.expression) &&
    names.has(node.expression.text) && !isLexicallyShadowed(node.expression)
  )
  const isImportMetaUrl = (node) => (
    ts.isPropertyAccessExpression(node) && node.name.text === "url" &&
    ts.isMetaProperty(node.expression) && node.expression.keywordToken === ts.SyntaxKind.ImportKeyword &&
    node.expression.name.text === "meta"
  )
  const isConfigRootExpression = (node, seen = new Set()) => {
    if (ts.isParenthesizedExpression(node)) return isConfigRootExpression(node.expression, seen)
    if (ts.isIdentifier(node) && !seen.has(node.text) && !isLexicallyShadowed(node)) {
      const initializer = configBindings.get(node.text)
      return Boolean(initializer) && isConfigRootExpression(initializer, new Set(seen).add(node.text))
    }
    if (!isNamedCall(node, pathDirnameNames) || node.arguments.length !== 1) return false
    const fileUrlCall = node.arguments[0]
    return isNamedCall(fileUrlCall, fileUrlToPathNames) && fileUrlCall.arguments.length === 1 &&
      isImportMetaUrl(fileUrlCall.arguments[0])
  }

  /** Preserve node:path relative resolution without reinterpreting its argument as an import alias. */
  const configFilesystemSpecifier = (literal) => {
    const normalized = normalizeRepoPath(literal)
    if (posix.isAbsolute(normalized) || /^[A-Za-z]:\//.test(normalized)) return null
    return `./${normalized}`
  }

  /** Resolve only literals, conditionals, bindings, or node:path resolve calls rooted at this config file. */
  const configAliasResolution = (node, seen = new Set()) => {
    if (!node) return { literals: [], supported: false }
    if (isLiteralNode(node)) return { literals: [{ node, literal: node.text }], supported: true }
    if (ts.isParenthesizedExpression(node)) return configAliasResolution(node.expression, seen)
    if (ts.isConditionalExpression(node)) {
      const whenTrue = configAliasResolution(node.whenTrue, seen)
      const whenFalse = configAliasResolution(node.whenFalse, seen)
      return whenTrue.supported && whenFalse.supported
        ? { literals: [...whenTrue.literals, ...whenFalse.literals], supported: true }
        : { literals: [], supported: false }
    }
    if (ts.isIdentifier(node) && !seen.has(node.text) && !isLexicallyShadowed(node)) {
      const initializer = configBindings.get(node.text)
      return initializer
        ? configAliasResolution(initializer, new Set(seen).add(node.text))
        : { literals: [], supported: false }
    }
    if (
      isNamedCall(node, pathResolveNames) && node.arguments.length === 2 &&
      isConfigRootExpression(node.arguments[0])
    ) {
      const argument = configAliasResolution(node.arguments[1], seen)
      if (!argument.supported || argument.literals.some((entry) => entry.moduleSpecifier)) {
        return { literals: [], supported: false }
      }
      const literals = argument.literals.map((entry) => ({
        ...entry,
        moduleSpecifier: configFilesystemSpecifier(entry.literal),
      }))
      return literals.some((entry) => entry.moduleSpecifier === null)
        ? { literals: [], supported: false }
        : { literals, supported: true }
    }
    return { literals: [], supported: false }
  }

  const propertyName = (node) => (
    ts.isIdentifier(node) || isLiteralNode(node) ? node.text : null
  )
  const isResolveAliasProperty = (node) => (
    isFrameworkConfig && ts.isPropertyAssignment(node) && ts.isObjectLiteralExpression(node.parent) &&
    ts.isPropertyAssignment(node.parent.parent) && propertyName(node.parent.parent.name) === "resolveAlias"
  )
  const accessSegments = (node) => {
    const reversed = []
    let current = node
    while (ts.isPropertyAccessExpression(current) || ts.isElementAccessExpression(current)) {
      if (ts.isPropertyAccessExpression(current)) reversed.push(current.name.text)
      else if (current.argumentExpression && isLiteralNode(current.argumentExpression)) {
        reversed.push(current.argumentExpression.text)
      }
      current = current.expression
    }
    if (ts.isIdentifier(current)) reversed.push(current.text)
    return reversed.reverse()
  }
  const isResolveAliasAssignment = (node) => {
    if (!isFrameworkConfig) return false
    const segments = accessSegments(node)
    return segments.some((segment, index) => segment === "resolve" && segments[index + 1] === "alias")
  }
  /** Retain the implementation edge and add an independently labeled tracked type companion. */
  const recordResolvedReference = (node, kind, literal, resolution, companionSourceKind = kind) => {
    const { declarationTargetPath, ...implementationResolution } = resolution
    const location = sourceLocation(sourceFile, node)
    const literalSha256 = sha256(literal)
    const row = {
      fromPath: record.path, ...location, kind, literalSha256, ...implementationResolution,
    }
    references.push(row)
    if (declarationTargetPath) {
      references.push({
        fromPath: record.path, ...location, kind: "declaration-companion", sourceKind: companionSourceKind, literalSha256,
        targetKind: "tracked-module", targetPath: declarationTargetPath,
      })
    }
    return row
  }
  /** Capture only configuration alias values that resolve to exact tracked modules. */
  const recordConfigAlias = (expression) => {
    const resolutionResult = configAliasResolution(expression)
    if (!resolutionResult.supported) {
      uncertainties.push({ code: "NONLITERAL_MODULE_EXPRESSION", path: record.path,
        ...sourceLocation(sourceFile, expression), kind: "framework-config-alias",
        expressionSha256: sha256(expression.getText(sourceFile)),
      })
      return
    }
    for (const { node, literal, moduleSpecifier = literal } of resolutionResult.literals) {
      const resolution = resolveModuleReference(record.path, moduleSpecifier, trackedPathSet, policy)
      if (resolution.targetKind !== "tracked-module") continue
      recordResolvedReference(node, "framework-config-alias", literal, resolution)
    }
  }
  const recordLiteral = (node, kind, literal, declarationSourceKind = null) => {
    const resolution = resolveModuleReference(record.path, literal, trackedPathSet, policy, declarationSourceKind !== null)
    const row = recordResolvedReference(node, kind, literal, resolution, declarationSourceKind ?? kind)
    if (resolution.targetKind === "unresolved") {
      errors.push({
        code: "UNRESOLVED_LITERAL_MODULE", fromPath: record.path, line: row.line,
        column: row.column, literalSha256: row.literalSha256,
      })
    }
  }
  const recordUncertainty = (node, kind) => {
    uncertainties.push({ code: "NONLITERAL_MODULE_EXPRESSION", path: record.path,
      ...sourceLocation(sourceFile, node), kind, expressionSha256: sha256(node.getText(sourceFile)),
    })
  }
  const visit = (node) => {
    if (ts.isImportTypeNode(node)) {
      const argument = ts.isLiteralTypeNode(node.argument) ? node.argument.literal : node.argument
      if (isLiteralNode(argument)) recordLiteral(argument, "import-type", argument.text, "import-type")
      else recordUncertainty(argument, "import-type")
    } else if (ts.isImportEqualsDeclaration(node) && ts.isExternalModuleReference(node.moduleReference)) {
      const argument = node.moduleReference.expression // require() is not a CallExpression in this syntax.
      if (argument && isLiteralNode(argument)) recordLiteral(argument, "import-equals", argument.text, node.isTypeOnly ? "import-type" : null)
      else recordUncertainty(argument ?? node, "import-equals")
    } else if (ts.isImportDeclaration(node) && node.moduleSpecifier) {
      if (isLiteralNode(node.moduleSpecifier)) recordLiteral(
        node.moduleSpecifier, "import", node.moduleSpecifier.text,
        node.importClause?.isTypeOnly || hasTypeOnlySpecifier(node.importClause?.namedBindings) ? "import-type" : null,
      )
      else recordUncertainty(node.moduleSpecifier, "import")
    } else if (ts.isExportDeclaration(node) && node.moduleSpecifier) {
      if (isLiteralNode(node.moduleSpecifier)) recordLiteral(
        node.moduleSpecifier, "export-from", node.moduleSpecifier.text,
        node.isTypeOnly || hasTypeOnlySpecifier(node.exportClause) ? "export-type" : null,
      )
      else recordUncertainty(node.moduleSpecifier, "export-from")
    } else if (isResolveAliasProperty(node)) {
      recordConfigAlias(node.initializer)
    } else if (
      ts.isBinaryExpression(node) && node.operatorToken.kind === ts.SyntaxKind.EqualsToken &&
      isResolveAliasAssignment(node.left)
    ) {
      recordConfigAlias(node.right)
    } else if (ts.isCallExpression(node)) {
      const loaderCall = loaderCalls.get(node)
      const kind = node.expression.kind === ts.SyntaxKind.ImportKeyword ? "dynamic-import" : loaderCall?.kind
      if (loaderCall && !loaderCall.proven) {
        uncertainties.push({ code: "UNPROVEN_MODULE_LOADER", path: record.path,
          ...sourceLocation(sourceFile, node), kind, expressionSha256: sha256(node.getText(sourceFile)),
        })
      } else if (kind) {
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
  const modules = index.records.filter((record) => sourceExtensions.has(record.extension))
    .map((record) => ({ path: record.path, scope: record.scope, textSha256: record.textSha256 }))
  const references = [], uncertainties = [], errors = []
  const manualTools = selectTrackedMetadata(index, policy.manualToolSources)
  uncertainties.push(...manualTools.tracked.map((row) => ({ ...row, code: "OPAQUE_MANUAL_TOOL_SOURCE" })))
  errors.push(...manualTools.missing.map((path) => ({ path, code: "MANUAL_TOOL_SOURCE_MISSING" })))
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
