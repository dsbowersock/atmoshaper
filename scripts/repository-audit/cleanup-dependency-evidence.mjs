import ts from "typescript"

import {
  compareText,
  requireTrackedTextIndex,
  sha256,
  validateCleanupPolicy,
} from "./cleanup-core.mjs"
import { buildModuleEvidence, parsePackage } from "./cleanup-module-evidence.mjs"
import { isLiteralNode, scriptKind, sourceLocation } from "./cleanup-source.mjs"
import { stableJson } from "./core.mjs"

const DEPENDENCY_SECTIONS = ["dependencies", "devDependencies", "optionalDependencies", "peerDependencies"]
/** Record only exact tracked configuration conventions with validated manifest identity. */
function configurationManifestOwners(index, declarations, policy) {
  const declaredNames = new Set(declarations.map((row) => row.name))
  const { textByPath, trackedPathSet } = requireTrackedTextIndex(index)
  const owners = []
  for (const rule of policy.configurationManifestOwnership) {
    if (!declaredNames.has(rule.packageName) || !trackedPathSet.has(rule.ownerPath)) continue
    if (rule.manifestIdentity === null) {
      owners.push({ packageName: rule.packageName, ownerPath: rule.ownerPath, kind: rule.kind })
      continue
    }
    const manifestText = textByPath.get(rule.ownerPath)
    if (manifestText === undefined) continue
    try {
      const manifest = JSON.parse(manifestText)
      if (
        manifest && typeof manifest === "object" && !Array.isArray(manifest) &&
        Object.hasOwn(manifest, rule.manifestIdentity.property) &&
        manifest[rule.manifestIdentity.property] === rule.manifestIdentity.value
      ) {
        owners.push({ packageName: rule.packageName, ownerPath: rule.ownerPath, kind: rule.kind })
      }
    } catch {
      // Invalid or unrelated JSON cannot prove package ownership.
    }
  }
  return owners.sort((left, right) => (
    compareText(left.packageName, right.packageName) ||
    compareText(left.ownerPath, right.ownerPath) ||
    compareText(left.kind, right.kind)
  ))
}

function staticPropertyName(property) {
  if (!property.name) return null
  if (ts.isIdentifier(property.name) || isLiteralNode(property.name)) return property.name.text
  if (ts.isComputedPropertyName(property.name) && isLiteralNode(property.name.expression)) {
    return property.name.expression.text
  }
  return null
}

function spreadMayAssign(expression, name) {
  while (ts.isParenthesizedExpression(expression)) expression = expression.expression
  if (ts.isConditionalExpression(expression)) {
    return spreadMayAssign(expression.whenTrue, name) || spreadMayAssign(expression.whenFalse, name)
  }
  if (!ts.isObjectLiteralExpression(expression)) return true
  return expression.properties.some((property) => {
    if (ts.isSpreadAssignment(property)) return spreadMayAssign(property.expression, name)
    return staticPropertyName(property) === name ||
      property.name && ts.isComputedPropertyName(property.name) && staticPropertyName(property) === null
  })
}

function propertyAssignment(object, name) {
  const matches = object.properties.filter((property) => staticPropertyName(property) === name)
  if (matches.length !== 1 || !ts.isPropertyAssignment(matches[0])) return null
  const propertyIndex = object.properties.indexOf(matches[0])
  const mayOverride = object.properties.slice(propertyIndex + 1).some((property) => (
    ts.isSpreadAssignment(property)
      ? spreadMayAssign(property.expression, name)
      : property.name && ts.isComputedPropertyName(property.name) && staticPropertyName(property) === null
  ))
  return mayOverride ? null : matches[0]
}

function topLevelStringConstants(sourceFile) {
  const constants = new Map()
  for (const statement of sourceFile.statements) {
    if (!ts.isVariableStatement(statement) || !(statement.declarationList.flags & ts.NodeFlags.Const)) continue
    for (const declaration of statement.declarationList.declarations) {
      if (ts.isIdentifier(declaration.name) && declaration.initializer && isLiteralNode(declaration.initializer)) {
        constants.set(declaration.name.text, declaration.initializer.text)
      }
    }
  }
  return constants
}

function bindingContainsName(binding, name) {
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
    : (ts.isFunctionDeclaration(statement) || ts.isClassDeclaration(statement) ||
      ts.isEnumDeclaration(statement) || ts.isModuleDeclaration(statement)) &&
      statement.name?.text === name
))

function scopeContainsVarBinding(scopeNode, name) {
  let found = false
  const visit = (node) => {
    if (found || ts.isFunctionLike(node) || ts.isClassDeclaration(node) || ts.isClassExpression(node)) return
    if (
      ts.isVariableDeclarationList(node) && !(node.flags & ts.NodeFlags.BlockScoped) &&
      variableListContainsName(node, name)
    ) found = true
    else ts.forEachChild(node, visit)
  }
  ts.forEachChild(scopeNode.body ?? scopeNode, visit)
  return found
}

function isLexicallyShadowed(identifier) {
  const name = identifier.text
  for (let current = identifier.parent; current && !ts.isSourceFile(current); current = current.parent) {
    if (
      (ts.isClassDeclaration(current) || ts.isClassExpression(current)) && current.name?.text === name
    ) return true
    if (ts.isFunctionLike(current) && (
      current.name?.text === name ||
      current.parameters.some((parameter) => bindingContainsName(parameter.name, name)) ||
      scopeContainsVarBinding(current, name)
    )) return true
    if (ts.isClassStaticBlockDeclaration(current) && scopeContainsVarBinding(current, name)) return true
    if (ts.isModuleBlock(current) && (
      statementsContainBinding(current.statements, name) || scopeContainsVarBinding(current, name)
    )) return true
    if (ts.isModuleDeclaration(current) && current.name.text === name) return true
    if (ts.isEnumDeclaration(current) && current.name.text === name) return true
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
      (current.initializer.flags & ts.NodeFlags.BlockScoped) &&
      variableListContainsName(current.initializer, name)
    ) return true
  }
  return false
}

function exactString(node, constants) {
  if (isLiteralNode(node)) return node.text
  if (!ts.isIdentifier(node) || isLexicallyShadowed(node)) return null
  return constants.get(node.text) ?? null
}

/** Accept only exact package/version pairs embedded in tracked runtime metadata objects. */
function runtimePackageMetadataOwners(index, declarations, packageJson, policy) {
  const { textByPath } = requireTrackedTextIndex(index)
  const sourceExtensions = new Set(policy.sourceExtensions)
  const declaredVersions = new Map()
  for (const row of declarations) {
    const version = packageJson[row.section]?.[row.name]
    if (typeof version !== "string") continue
    const versions = declaredVersions.get(row.name) ?? new Set()
    versions.add(version)
    declaredVersions.set(row.name, versions)
  }
  const owners = []
  for (const record of index.records) {
    if (record.scope !== "runtime" || !sourceExtensions.has(record.extension)) continue
    const sourceFile = ts.createSourceFile(
      record.path, textByPath.get(record.path), ts.ScriptTarget.Latest, true, scriptKind(record.path),
    )
    const constants = topLevelStringConstants(sourceFile)
    const visit = (node) => {
      if (ts.isPropertyAssignment(node) && (
        ts.isIdentifier(node.name) || isLiteralNode(node.name)
      ) && node.name.text === "runtime" && ts.isObjectLiteralExpression(node.parent) &&
      propertyAssignment(node.parent, "runtime") === node && ts.isObjectLiteralExpression(node.initializer)) {
        const packageNameProperty = propertyAssignment(node.initializer, "packageName")
        const packageVersionProperty = propertyAssignment(node.initializer, "packageVersion")
        const packageName = packageNameProperty
          ? exactString(packageNameProperty.initializer, constants)
          : null
        const packageVersion = packageVersionProperty
          ? exactString(packageVersionProperty.initializer, constants)
          : null
        const packageVersions = declaredVersions.get(packageName)
        if (
          packageName && typeof packageVersion === "string" && packageVersions?.has(packageVersion)
        ) {
          owners.push({
            packageName, ownerPath: record.path,
            ...sourceLocation(sourceFile, packageNameProperty.initializer),
            kind: "runtime-package-metadata", literalSha256: sha256(packageName),
          })
        }
      }
      ts.forEachChild(node, visit)
    }
    visit(sourceFile)
  }
  return owners.sort((left, right) => (
    compareText(left.packageName, right.packageName) || compareText(left.ownerPath, right.ownerPath) ||
    left.line - right.line || left.column - right.column
  ))
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
      packageName: row.dependency, fromPath: row.fromPath, line: row.line, column: row.column,
      kind: row.kind, literalSha256: row.literalSha256,
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
    for (const packageName of ownedPackages) references.push({ packageName, scriptName, kind: "package-script-cli" })
  }
  references.sort((left, right) => (
    compareText(left.packageName, right.packageName) ||
    compareText(left.fromPath ?? "package.json", right.fromPath ?? "package.json") ||
    (left.line ?? 0) - (right.line ?? 0) || (left.column ?? 0) - (right.column ?? 0) ||
    compareText(left.scriptName ?? "", right.scriptName ?? "")
  ))
  return stableJson({
    schemaVersion: 1, declarations, references,
    configurationManifestOwners: configurationManifestOwners(index, declarations, policy),
    runtimePackageMetadataOwners: runtimePackageMetadataOwners(index, declarations, packageJson, policy),
    uncertainties: moduleEvidence.uncertainties, errors: moduleEvidence.errors,
  })
}
