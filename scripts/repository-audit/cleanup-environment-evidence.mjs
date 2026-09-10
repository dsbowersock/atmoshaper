import ts from "typescript"

import {
  compareText,
  requireTrackedTextIndex,
  sha256,
  validateCleanupPolicy,
} from "./cleanup-core.mjs"
import { isLiteralNode, scriptKind, sourceLocation } from "./cleanup-source.mjs"
import { stableJson } from "./core.mjs"

function compareLocation(left, right) {
  return (
    compareText(left.path ?? "", right.path ?? "") ||
    (left.line ?? 0) - (right.line ?? 0) || (left.column ?? 0) - (right.column ?? 0) ||
    compareText(left.name ?? "", right.name ?? "") ||
    compareText(left.kind ?? left.code ?? "", right.kind ?? right.code ?? "")
  )
}

function isProcessEnv(node) {
  return (
    ts.isPropertyAccessExpression(node) && ts.isIdentifier(node.expression) &&
    node.expression.text === "process" && node.name.text === "env"
  )
}

function childScope(parent) {
  return { bindings: new Map(), parent }
}

function lookupAlias(scope, name) {
  for (let current = scope; current; current = current.parent) {
    if (current.bindings.has(name)) return current.bindings.get(name)
  }
  return null
}

function aliasStatus(node, scope) {
  if (!node) return null
  if (isProcessEnv(node)) return "proven"
  if (ts.isIdentifier(node)) return lookupAlias(scope, node.text)
  return null
}

function isEnvironmentAliasName(name) {
  return /^(?:env|environment)$/i.test(name)
}

/** Omit write-only targets while retaining compound accesses that also read the prior value. */
function hasReadSemantics(node) {
  return !ts.isWriteOnlyAccess(node) && !ts.isDeleteTarget(node)
}

const NON_ALIAS = "non-alias"

function collectEnvironmentRows(record, text) {
  const sourceFile = ts.createSourceFile(record.path, text, ts.ScriptTarget.Latest, true, scriptKind(record.path))
  const reads = []
  const uncertainties = []
  const addRead = (node, name, kind) => reads.push({
    name, path: record.path, ...sourceLocation(sourceFile, node), kind,
  })
  const addComputedUncertainty = (node, kind) => uncertainties.push({
    code: "COMPUTED_ENVIRONMENT_READ", path: record.path,
    ...sourceLocation(sourceFile, node), kind, expressionSha256: sha256(node.getText(sourceFile)),
  })
  const addAliasUncertainty = (node, name, kind) => uncertainties.push({
    code: "UNPROVEN_ENVIRONMENT_ALIAS", name, path: record.path,
    ...sourceLocation(sourceFile, node), kind, expressionSha256: sha256(node.getText(sourceFile)),
  })

  /** Record a whole-object read without pretending that any individual key is known. */
  const addWholeObjectUncertainty = (node, status, kind) => {
    if (status === "proven") addComputedUncertainty(node, kind)
    else if (status === "unknown") addAliasUncertainty(node, null, kind)
  }

  const wholeObjectMethod = (node) => (
    ts.isPropertyAccessExpression(node) && ts.isIdentifier(node.expression) &&
    node.expression.text === "Object" && ["entries", "keys", "values"].includes(node.name.text)
      ? node.name.text
      : null
  )

  const recordObjectBinding = (pattern, status, kind) => {
    if (!["proven", "unknown"].includes(status)) return
    for (const element of pattern.elements) {
      if (element.dotDotDotToken) {
        if (status === "proven") addComputedUncertainty(element, `${kind}-rest`)
        else addAliasUncertainty(element, null, `${kind}-rest`)
        continue
      }
      const propertyName = element.propertyName ?? element.name
      const literalName = ts.isIdentifier(propertyName) || isLiteralNode(propertyName)
        ? propertyName.text
        : ts.isComputedPropertyName(propertyName) && isLiteralNode(propertyName.expression)
          ? propertyName.expression.text
          : null
      const nameNode = ts.isComputedPropertyName(propertyName) ? propertyName.expression : propertyName
      if (literalName !== null) {
        if (status === "proven") addRead(nameNode, literalName, kind)
        else addAliasUncertainty(nameNode, literalName, kind)
      } else if (status === "proven") addComputedUncertainty(nameNode, kind)
      else addAliasUncertainty(nameNode, null, kind)
    }
  }

  const bindName = (name, initializer, scope) => {
    const status = aliasStatus(initializer, scope)
    scope.bindings.set(name, status ?? (isEnvironmentAliasName(name) ? "unknown" : NON_ALIAS))
  }

  const declareBindingName = (name, scope) => {
    if (ts.isIdentifier(name)) {
      scope.bindings.set(name.text, isEnvironmentAliasName(name.text) ? "unknown" : NON_ALIAS)
      return
    }
    if (ts.isObjectBindingPattern(name) || ts.isArrayBindingPattern(name)) {
      for (const element of name.elements) {
        if (ts.isBindingElement(element)) declareBindingName(element.name, scope)
      }
    }
  }

  const assignName = (name, initializer, scope) => {
    let owner = scope
    while (owner && !owner.bindings.has(name)) owner = owner.parent
    if (!owner) return
    const status = aliasStatus(initializer, scope)
    const prior = owner.bindings.get(name)
    owner.bindings.set(
      name,
      status ?? (isEnvironmentAliasName(name) || ["proven", "unknown"].includes(prior) ? "unknown" : NON_ALIAS),
    )
  }

  const bindObjectElementInitializers = (pattern, scope) => {
    for (const element of pattern.elements) {
      if (element.initializer) {
        visit(element.initializer, scope)
        if (ts.isIdentifier(element.name)) bindName(element.name.text, element.initializer, scope)
      }
      if (ts.isObjectBindingPattern(element.name)) bindObjectElementInitializers(element.name, scope)
    }
  }

  const visit = (node, scope) => {
    if (ts.isFunctionLike(node)) {
      const functionScope = childScope(scope)
      for (const parameter of node.parameters) declareBindingName(parameter.name, functionScope)
      for (const parameter of node.parameters) {
        if (parameter.initializer) visit(parameter.initializer, functionScope)
        const status = aliasStatus(parameter.initializer, functionScope)
        if (ts.isIdentifier(parameter.name)) bindName(parameter.name.text, parameter.initializer, functionScope)
        else if (ts.isObjectBindingPattern(parameter.name)) {
          recordObjectBinding(parameter.name, status, "parameter-destructure")
          bindObjectElementInitializers(parameter.name, functionScope)
        }
      }
      if (node.body) visit(node.body, functionScope)
      return
    }
    if (ts.isBlock(node) || ts.isSourceFile(node)) {
      const blockScope = ts.isSourceFile(node) ? scope : childScope(scope)
      for (const statement of node.statements) visit(statement, blockScope)
      return
    }
    if (ts.isVariableDeclaration(node)) {
      declareBindingName(node.name, scope)
      if (node.initializer) visit(node.initializer, scope)
      const status = aliasStatus(node.initializer, scope)
      if (ts.isIdentifier(node.name)) bindName(node.name.text, node.initializer, scope)
      else if (ts.isObjectBindingPattern(node.name)) {
        recordObjectBinding(node.name, status, "destructure")
        bindObjectElementInitializers(node.name, scope)
      }
      return
    }
    if (
      ts.isBinaryExpression(node) && node.operatorToken.kind === ts.SyntaxKind.EqualsToken &&
      ts.isIdentifier(node.left)
    ) {
      visit(node.right, scope)
      assignName(node.left.text, node.right, scope)
      return
    }
    if (ts.isSpreadAssignment(node) || ts.isSpreadElement(node)) {
      addWholeObjectUncertainty(node.expression, aliasStatus(node.expression, scope), "object-spread")
    } else if (ts.isCallExpression(node)) {
      const method = wholeObjectMethod(node.expression)
      const argument = node.arguments[0]
      if (method && argument) {
        addWholeObjectUncertainty(argument, aliasStatus(argument, scope), `object-${method}`)
      }
    }
    if (ts.isPropertyAccessExpression(node) && hasReadSemantics(node)) {
      const status = isProcessEnv(node.expression) ? "proven" : (
        ts.isIdentifier(node.expression) ? lookupAlias(scope, node.expression.text) : null
      )
      if (status === "proven") addRead(node.name, node.name.text, "property-access")
      else if (status === "unknown") addAliasUncertainty(node.name, node.name.text, "property-access")
    } else if (ts.isElementAccessExpression(node) && hasReadSemantics(node)) {
      const status = isProcessEnv(node.expression) ? "proven" : (
        ts.isIdentifier(node.expression) ? lookupAlias(scope, node.expression.text) : null
      )
      if (status === "proven" || status === "unknown") {
        if (node.argumentExpression && isLiteralNode(node.argumentExpression)) {
          if (status === "proven") addRead(node.argumentExpression, node.argumentExpression.text, "element-access")
          else addAliasUncertainty(node.argumentExpression, node.argumentExpression.text, "element-access")
        } else if (status === "proven") addComputedUncertainty(node.argumentExpression ?? node, "element-access")
        else addAliasUncertainty(node.argumentExpression ?? node, null, "element-access")
      }
    }
    ts.forEachChild(node, (child) => visit(child, scope))
  }
  visit(sourceFile, childScope(null))
  const errors = sourceFile.parseDiagnostics.length > 0
    ? [{ code: "SOURCE_PARSE_DIAGNOSTIC", path: record.path, count: sourceFile.parseDiagnostics.length }]
    : []
  return { reads, uncertainties, errors }
}

/** Extract static environment names, including proven aliases, without reading process.env. */
export function buildEnvironmentEvidence(index, policy) {
  validateCleanupPolicy(policy)
  const { textByPath } = requireTrackedTextIndex(index)
  const sourceExtensions = new Set(policy.sourceExtensions)
  const reads = []
  const uncertainties = []
  const errors = []
  for (const record of index.records) {
    if (!sourceExtensions.has(record.extension)) continue
    const rows = collectEnvironmentRows(record, textByPath.get(record.path))
    reads.push(...rows.reads)
    uncertainties.push(...rows.uncertainties)
    errors.push(...rows.errors)
  }
  const declarations = []
  for (const path of policy.environmentDeclarationPaths) {
    const text = textByPath.get(path)
    if (text === undefined) continue
    const lines = text.split(/\r?\n/)
    for (let index = 0; index < lines.length; index += 1) {
      const match = /^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=/.exec(lines[index])
      if (match) declarations.push({
        name: match[1], path, line: index + 1, column: lines[index].indexOf(match[1]) + 1,
      })
    }
  }
  return stableJson({
    schemaVersion: 1, declarations: declarations.sort(compareLocation), reads: reads.sort(compareLocation),
    uncertainties: uncertainties.sort(compareLocation), errors: errors.sort(compareLocation),
  })
}
