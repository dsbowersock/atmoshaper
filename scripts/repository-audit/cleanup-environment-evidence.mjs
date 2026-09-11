import ts from "typescript"
import {
  COMMONJS_LOADER, NON_ALIAS, PROCESS_OBJECT, annexBFunctionDeclarations, childScope, hasStrictDirective, isEnvironmentAliasName, isProcessObjectSource, isProcessRequire,
  isProcessImportEquals, isTransparentExpression, lookupAlias, processImportBindings, unwrapTransparentExpression, varBindingScope,
} from "./cleanup-environment-scope.mjs"

import { compareText, requireTrackedTextIndex, sha256, validateCleanupPolicy } from "./cleanup-core.mjs"
import { isLiteralNode, scriptKind, sourceLocation } from "./cleanup-source.mjs"
import { isHandledObjectAssignment, logicalAssignmentKind, processEnvironmentAssignmentStatus, processEnvironmentBindingStatus, recordEnvironmentPattern } from "./cleanup-environment-patterns.mjs"
import { stableJson } from "./core.mjs"

function compareLocation(left, right) {
  return (
    compareText(left.path ?? "", right.path ?? "") ||
    (left.line ?? 0) - (right.line ?? 0) || (left.column ?? 0) - (right.column ?? 0) ||
    compareText(left.name ?? "", right.name ?? "") ||
    compareText(left.kind ?? left.code ?? "", right.kind ?? right.code ?? "")
  )
}


function isProcessEnv(node, scope) {
  if (!ts.isPropertyAccessExpression(node) || !ts.isIdentifier(node.expression) || node.name.text !== "env") return false
  const status = lookupAlias(scope, node.expression.text)
  return status === PROCESS_OBJECT || (node.expression.text === "process" && status === null)
}


function aliasStatus(node, scope) {
  const value = unwrapTransparentExpression(node)
  if (!value) return null
  if (isProcessEnv(value, scope)) return "proven"
  if (ts.isIdentifier(value)) {
    const status = lookupAlias(scope, value.text)
    return [PROCESS_OBJECT, COMMONJS_LOADER].includes(status) ? null : status
  }
  return null
}


/** Omit write-only targets while retaining compound accesses that also read the prior value. */
function hasReadSemantics(node) {
  return !ts.isWriteOnlyAccess(node) && !ts.isDeleteTarget(node)
}

function collectEnvironmentRows(record, text) {
  const sourceFile = ts.createSourceFile(record.path, text, ts.ScriptTarget.Latest, true, scriptKind(record.path))
  const reads = []
  const uncertainties = []
  const annexBDeclarations = new Set()
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

  /** Leave established exact/whole-object handlers and alias setup as the sole owner of those nodes. */
  const isHandledEnvironmentValue = (node) => {
    let value = node
    let parent = value.parent
    while (parent && isTransparentExpression(parent) && parent.expression === value) {
      value = parent
      parent = value.parent
    }
    if (!parent) return true
    if (ts.isVoidExpression(parent) || ts.isTypeOfExpression(parent)) return true
    if (ts.isPropertyAccessExpression(parent) && parent.name === value) return true
    if (
      (ts.isPropertyAccessExpression(parent) || ts.isElementAccessExpression(parent)) &&
      parent.expression === value
    ) return true
    if (
      (ts.isSpreadAssignment(parent) || ts.isSpreadElement(parent)) &&
      parent.expression === value
    ) return true
    if (
      ts.isCallExpression(parent) && parent.arguments[0] === value &&
      wholeObjectMethod(parent.expression)
    ) return true
    if (
      (ts.isVariableDeclaration(parent) || ts.isParameter(parent) || ts.isBindingElement(parent)) &&
      parent.initializer === value &&
      (ts.isBindingElement(parent) || ts.isIdentifier(parent.name) || ts.isObjectBindingPattern(parent.name))
    ) return true
    if (
      ts.isBinaryExpression(parent) &&
      ((parent.left === value && ts.isAssignmentOperator(parent.operatorToken.kind)) || (
        parent.right === value && (
          logicalAssignmentKind(parent.operatorToken.kind) ||
          parent.operatorToken.kind === ts.SyntaxKind.EqualsToken &&
          (ts.isIdentifier(parent.left) || isHandledObjectAssignment(parent.left))
        )
      ))
    ) return true
    return ts.isDeleteExpression(parent) && parent.expression === value
  }

  /** Detect only value flows that can expose the complete environment object to another owner. */
  const isEnvironmentValueEscape = (node, scope) => {
    if (isHandledEnvironmentValue(node)) return false
    let value = node
    let parent = value.parent
    const logicalOperators = new Set([
      ts.SyntaxKind.AmpersandAmpersandToken,
      ts.SyntaxKind.BarBarToken,
      ts.SyntaxKind.QuestionQuestionToken,
    ])
    while (
      isTransparentExpression(parent) && parent.expression === value ||
      ts.isConditionalExpression(parent) && parent.condition !== value ||
      ts.isBinaryExpression(parent) && logicalOperators.has(parent.operatorToken.kind)
    ) {
      value = parent
      parent = value.parent
    }
    if (!parent) return false
    if (ts.isPropertyAssignment(parent) && parent.initializer === value) return true
    if (ts.isShorthandPropertyAssignment(parent) && parent.name === value) return true
    if (
      (ts.isSpreadAssignment(parent) || ts.isSpreadElement(parent)) &&
      parent.expression === value
    ) return aliasStatus(value, scope) === null
    if (ts.isCallExpression(parent) && parent.arguments.includes(value)) {
      return !(
        parent.arguments[0] === value && wholeObjectMethod(parent.expression) &&
        aliasStatus(value, scope) !== null
      )
    }
    if (ts.isNewExpression(parent) && parent.arguments?.includes(value)) return true
    if (ts.isArrayLiteralExpression(parent) && parent.elements.includes(value)) return true
    if (
      (ts.isReturnStatement(parent) || ts.isThrowStatement(parent) || ts.isYieldExpression(parent) ||
        ts.isExportAssignment(parent) || ts.isJsxExpression(parent)) &&
      parent.expression === value
    ) return true
    if (ts.isArrowFunction(parent) && parent.body === value) return true
    if (
      ts.isBinaryExpression(parent) && parent.right === value &&
      ts.isAssignmentOperator(parent.operatorToken.kind)
    ) return !ts.isIdentifier(parent.left) || aliasStatus(value, scope) === null
    return (
      (ts.isVariableDeclaration(parent) || ts.isParameter(parent) || ts.isBindingElement(parent)) &&
      parent.initializer === value && value !== node
    )
  }

  const recordObjectBinding = (pattern, status, kind) =>
    recordEnvironmentPattern(pattern, status, kind, { addRead, addComputedUncertainty, addAliasUncertainty })

  const bindName = (name, initializer, scope, initializerScope = scope) => {
    const status = isProcessRequire(initializer, initializerScope) ? PROCESS_OBJECT : aliasStatus(initializer, initializerScope)
    scope.bindings.set(name, status ?? (isEnvironmentAliasName(name) ? "unknown" : NON_ALIAS))
  }

  const declareBindingName = (name, scope, preserveExisting = false) => {
    if (ts.isIdentifier(name)) {
      if (preserveExisting && scope.bindings.has(name.text)) return
      scope.bindings.set(name.text, isEnvironmentAliasName(name.text) ? "unknown" : NON_ALIAS)
      return
    }
    if (ts.isObjectBindingPattern(name) || ts.isArrayBindingPattern(name)) {
      for (const element of name.elements) {
        if (ts.isBindingElement(element)) declareBindingName(element.name, scope, preserveExisting)
      }
    }
  }

  const shadowEnvironmentBinding = (name, scope, preserveLoader = false) => {
    if (ts.isIdentifier(name)) {
      if (scope.bindings.has(name.text)) {
        if (!preserveLoader && scope.bindings.get(name.text) === COMMONJS_LOADER) scope.bindings.set(name.text, NON_ALIAS)
        return
      }
      const status = lookupAlias(scope.parent, name.text)
      if ([PROCESS_OBJECT, COMMONJS_LOADER, "proven", "unknown"].includes(status) || (["process", "require"].includes(name.text) && status === null)) {
        scope.bindings.set(name.text, NON_ALIAS)
      }
    } else if (ts.isObjectBindingPattern(name) || ts.isArrayBindingPattern(name)) {
      for (const element of name.elements) {
        if (ts.isBindingElement(element)) shadowEnvironmentBinding(element.name, scope, preserveLoader)
      }
    }
  }

  /** Predeclare tracked environment shadows so TDZ/hoisting cannot expose an outer binding. */
  const predeclareDirectEnvironmentShadows = (statements, scope) => {
    for (const statement of statements) {
      // Same-scope enum declarations merge; every member shadows throughout every initializer.
      if (ts.isEnumDeclaration(statement)) {
        const members = scope.enumMembers.get(statement.name.text) ?? []
        scope.enumMembers.set(statement.name.text, [...members, ...statement.members])
      }
      if (ts.isImportEqualsDeclaration(statement)) shadowEnvironmentBinding(statement.name, scope)
      else if (ts.isVariableStatement(statement) && statement.declarationList.flags & ts.NodeFlags.BlockScoped) {
        for (const declaration of statement.declarationList.declarations) shadowEnvironmentBinding(declaration.name, scope)
      } else if (
        (ts.isFunctionDeclaration(statement) || ts.isClassDeclaration(statement) ||
          ts.isEnumDeclaration(statement) || ts.isModuleDeclaration(statement)) &&
        statement.name && ts.isIdentifier(statement.name)
      ) shadowEnvironmentBinding(statement.name, scope)
    }
  }

  const predeclareVarEnvironmentShadows = (container, scope) => {
    if (record.extension === ".cjs" && !scope.strict) {
      for (const declaration of annexBFunctionDeclarations(container)) {
        annexBDeclarations.add(declaration)
        shadowEnvironmentBinding(declaration.name, scope, true)
      }
    }
    const scan = (node) => {
      if (node !== container && (ts.isFunctionLike(node) ||
        ts.isClassStaticBlockDeclaration(node) || ts.isModuleBlock(node))) return
      if (
        ts.isVariableDeclaration(node) && ts.isVariableDeclarationList(node.parent) &&
        !(node.parent.flags & ts.NodeFlags.BlockScoped)
      ) shadowEnvironmentBinding(node.name, scope, true)
      ts.forEachChild(node, scan)
    }
    scan(container)
  }

  const assignName = (name, initializer, scope, conditionalKind = null, statusSnapshot) => {
    let owner = scope
    while (owner && !owner.bindings.has(name)) owner = owner.parent
    if (name === "require" && owner?.bindings.get(name) === COMMONJS_LOADER) owner = varBindingScope(scope)
    if (!owner && name === "require") varBindingScope(scope).bindings.set(name, NON_ALIAS)
    if (!owner && name === "process") varBindingScope(scope).bindings.set(name, NON_ALIAS)
    if (!owner) return
    let status = statusSnapshot === undefined ? aliasStatus(initializer, scope) : statusSnapshot
    if (conditionalKind && ["proven", "unknown"].includes(status)) {
      // A conditional write is only one possible value: preserve its flow without proving the target.
      addWholeObjectUncertainty(initializer, status, conditionalKind)
      status = "unknown"
    }
    const prior = owner.bindings.get(name)
    owner.bindings.set(
      name,
      status ?? (isEnvironmentAliasName(name) || ["proven", "unknown"].includes(prior) ? "unknown" : NON_ALIAS),
    )
  }

  /** Walk assignment targets in evaluation order; computed keys/defaults remain real reads. */
  const visitAssignmentTarget = (target, scope, initializer, conditionalKind = null, statusSnapshot) => {
    const value = unwrapTransparentExpression(target)
    if (ts.isIdentifier(value)) assignName(value.text, initializer, scope, conditionalKind, statusSnapshot)
    else if (ts.isObjectLiteralExpression(value)) {
      // Snapshot RHS provenance before computed keys/defaults or target writes can change aliases.
      const processObjectSource = isProcessObjectSource(initializer, scope)
      if (!processObjectSource && isHandledObjectAssignment(value)) recordObjectBinding(value, aliasStatus(initializer, scope), "assignment-destructure")
      for (const property of value.properties) {
        const processStatus = processObjectSource ? processEnvironmentAssignmentStatus(property) : undefined
        if (ts.isSpreadAssignment(property)) visitAssignmentTarget(property.expression, scope, undefined, null, processStatus)
        else if (ts.isShorthandPropertyAssignment(property)) {
          if (property.objectAssignmentInitializer) visit(property.objectAssignmentInitializer, scope)
          assignName(property.name.text, property.objectAssignmentInitializer, scope, "assignment-default", processStatus)
        } else if (ts.isPropertyAssignment(property)) {
          if (ts.isComputedPropertyName(property.name)) visit(property.name.expression, scope)
          const target = unwrapTransparentExpression(property.initializer)
          if (processStatus && ts.isObjectLiteralExpression(target)) recordObjectBinding(target, processStatus, "assignment-destructure")
          visitAssignmentTarget(property.initializer, scope, undefined, null, processStatus)
        }
      }
    } else if (ts.isArrayLiteralExpression(value)) {
      for (const element of value.elements) if (!ts.isOmittedExpression(element)) visitAssignmentTarget(element, scope)
    } else if (ts.isSpreadElement(value)) visitAssignmentTarget(value.expression, scope)
    else if (ts.isBinaryExpression(value) && value.operatorToken.kind === ts.SyntaxKind.EqualsToken) {
      visit(value.right, scope)
      visitAssignmentTarget(value.left, scope, value.right, "assignment-default", statusSnapshot)
    } else visit(value, scope)
  }

  const bindObjectElementInitializers = (pattern, scope, initializerScope, kind, processObjectSource = false) => {
    for (const element of pattern.elements) {
      if (element.propertyName && ts.isComputedPropertyName(element.propertyName)) visit(element.propertyName.expression, initializerScope)
      if (element.initializer) {
        visit(element.initializer, initializerScope)
      }
      const processStatus = processObjectSource ? processEnvironmentBindingStatus(element) : null
      if (processStatus && ts.isIdentifier(element.name)) scope.bindings.set(element.name.text, processStatus)
      else if (element.initializer && ts.isIdentifier(element.name)) bindName(element.name.text, element.initializer, scope, initializerScope)
      if (ts.isObjectBindingPattern(element.name)) {
        recordObjectBinding(element.name, processStatus ?? aliasStatus(element.initializer, initializerScope), kind)
        bindObjectElementInitializers(element.name, scope, initializerScope, kind)
      }
    }
  }

  const visit = (node, scope) => {
    if (ts.isImportEqualsDeclaration(node)) {
      // Bind at the declaration, retaining predeclaration shadows and normal later invalidation.
      if (isProcessImportEquals(node)) scope.bindings.set(node.name.text, PROCESS_OBJECT)
      return
    }
    if (ts.isFunctionLike(node)) {
      if (annexBDeclarations.has(node)) assignName(node.name.text, undefined, varBindingScope(scope))
      const parameterScope = childScope(scope, false, scope.strict || hasStrictDirective(node.body))
      if ((ts.isFunctionDeclaration(node) || ts.isFunctionExpression(node)) && node.name) declareBindingName(node.name, parameterScope)
      for (const parameter of node.parameters) declareBindingName(parameter.name, parameterScope)
      for (const parameter of node.parameters) {
        if (parameter.initializer) visit(parameter.initializer, parameterScope)
        const status = aliasStatus(parameter.initializer, parameterScope)
        if (ts.isIdentifier(parameter.name)) bindName(parameter.name.text, parameter.initializer, parameterScope)
        else if (ts.isObjectBindingPattern(parameter.name)) {
          recordObjectBinding(parameter.name, status, "parameter-destructure")
          bindObjectElementInitializers(
            parameter.name, parameterScope, parameterScope, "parameter-destructure",
          )
        }
      }
      const functionScope = childScope(parameterScope, true)
      for (const [name, status] of parameterScope.bindings) functionScope.bindings.set(name, status)
      if (node.body) predeclareVarEnvironmentShadows(node.body, functionScope)
      if (node.body) visit(node.body, functionScope)
      return
    }
    if (ts.isForStatement(node) || ts.isForInStatement(node) || ts.isForOfStatement(node)) {
      const initializer = node.initializer
      const loopScope = initializer && ts.isVariableDeclarationList(initializer) &&
        (initializer.flags & ts.NodeFlags.BlockScoped)
        ? childScope(scope)
        : scope
      if (loopScope !== scope) for (const declaration of initializer.declarations) declareBindingName(declaration.name, loopScope)
      // Preserve lexical TDZ, iterable-before-rebinding, and first-body-before-increment effects.
      if (ts.isForStatement(node)) {
        if (initializer) visit(initializer, loopScope)
        if (node.condition) visit(node.condition, loopScope)
        visit(node.statement, loopScope)
        if (node.incrementor) visit(node.incrementor, loopScope)
      } else {
        visit(node.expression, loopScope)
        if (ts.isVariableDeclarationList(initializer)) visit(initializer, loopScope)
        else visitAssignmentTarget(initializer, loopScope)
        visit(node.statement, loopScope)
      }
      return
    }
    if (ts.isCatchClause(node)) {
      const catchScope = childScope(scope)
      if (node.variableDeclaration) visit(node.variableDeclaration, catchScope)
      visit(node.block, catchScope)
      return
    }
    if (ts.isClassStaticBlockDeclaration(node)) {
      const staticScope = childScope(scope, true)
      predeclareVarEnvironmentShadows(node.body, staticScope)
      const hadProcessBinding = staticScope.bindings.has("process")
      visit(node.body, staticScope)
      if (!hadProcessBinding && staticScope.bindings.get("process") === NON_ALIAS) varBindingScope(scope).bindings.set("process", NON_ALIAS)
      return
    }
    if (ts.isClassDeclaration(node) || ts.isClassExpression(node)) {
      const classScope = childScope(scope, false, true)
      if (node.name) declareBindingName(node.name, classScope)
      ts.forEachChild(node, (child) => visit(child, classScope))
      return
    }
    if (ts.isEnumDeclaration(node)) {
      const enumScope = childScope(scope)
      for (const member of scope.enumMembers.get(node.name.text) ?? node.members) {
        if (ts.isIdentifier(member.name) || isLiteralNode(member.name)) enumScope.bindings.set(member.name.text, NON_ALIAS)
      }
      for (const member of node.members) if (member.initializer) visit(member.initializer, enumScope)
      return
    }
    if (ts.isModuleBlock(node)) {
      const moduleScope = childScope(scope, true)
      predeclareVarEnvironmentShadows(node, moduleScope)
      predeclareDirectEnvironmentShadows(node.statements, moduleScope)
      for (const statement of node.statements) visit(statement, moduleScope)
      return
    }
    if (ts.isCaseBlock(node)) {
      const caseScope = childScope(scope)
      predeclareDirectEnvironmentShadows(node.clauses.flatMap((clause) => clause.statements), caseScope)
      for (const clause of node.clauses) visit(clause, caseScope)
      return
    }
    if (ts.isBlock(node) || ts.isSourceFile(node)) {
      const blockScope = ts.isSourceFile(node) ? scope : childScope(scope)
      predeclareDirectEnvironmentShadows(node.statements, blockScope)
      for (const statement of node.statements) visit(statement, blockScope)
      return
    }
    if (ts.isVariableDeclaration(node)) {
      const declarationList = ts.isVariableDeclarationList(node.parent) ? node.parent : null
      const isVarDeclaration = declarationList && !(declarationList.flags & ts.NodeFlags.BlockScoped)
      const isIterationAssignment = declarationList && (
        ts.isForInStatement(declarationList.parent) || ts.isForOfStatement(declarationList.parent)
      ) && declarationList.parent.initializer === declarationList
      const declarationScope = isVarDeclaration
        ? varBindingScope(scope)
        : scope
      const hasAssignment = Boolean(node.initializer) || isIterationAssignment
      declareBindingName(node.name, declarationScope, isVarDeclaration && !hasAssignment)
      if (!hasAssignment) return
      const processObjectSource = ts.isObjectBindingPattern(node.name) && isProcessObjectSource(node.initializer, scope)
      if (node.initializer) visit(node.initializer, scope)
      const status = aliasStatus(node.initializer, scope)
      if (ts.isIdentifier(node.name)) bindName(node.name.text, node.initializer, declarationScope, scope)
      else if (ts.isObjectBindingPattern(node.name)) {
        recordObjectBinding(node.name, status, "destructure")
        bindObjectElementInitializers(node.name, declarationScope, scope, "destructure", processObjectSource)
      }
      return
    }
    if (
      ts.isBinaryExpression(node) && ts.isAssignmentOperator(node.operatorToken.kind)
    ) {
      const logicalKind = logicalAssignmentKind(node.operatorToken.kind)
      const target = unwrapTransparentExpression(node.left)
      const memberTarget = ts.isPropertyAccessExpression(target) || ts.isElementAccessExpression(target)
      if (memberTarget) visit(node.left, scope)
      const statusSnapshot = logicalKind ? aliasStatus(node.right, scope) : undefined
      visit(node.right, scope)
      if (logicalKind && memberTarget) addWholeObjectUncertainty(node.right, statusSnapshot, logicalKind)
      if (!memberTarget) visitAssignmentTarget(
        node.left, scope,
        node.operatorToken.kind === ts.SyntaxKind.EqualsToken || logicalKind ? node.right : undefined,
        logicalKind, statusSnapshot,
      )
      return
    }
    if (
      (ts.isPrefixUnaryExpression(node) || ts.isPostfixUnaryExpression(node)) &&
      [ts.SyntaxKind.PlusPlusToken, ts.SyntaxKind.MinusMinusToken].includes(node.operator)
    ) {
      visitAssignmentTarget(node.operand, scope)
      return
    }
    if (
      !isTransparentExpression(node) && aliasStatus(node, scope) === "proven" &&
      isEnvironmentValueEscape(node, scope)
    ) {
      addComputedUncertainty(node, "whole-object-value")
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
      const status = aliasStatus(node.expression, scope)
      if (status === "proven") addRead(node.name, node.name.text, "property-access")
      else if (status === "unknown") addAliasUncertainty(node.name, node.name.text, "property-access")
    } else if (ts.isElementAccessExpression(node) && hasReadSemantics(node)) {
      const status = aliasStatus(node.expression, scope)
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
  const sourceScope = childScope(null, true, hasStrictDirective(sourceFile))
  if (record.extension === ".cjs") sourceScope.bindings.set("require", COMMONJS_LOADER)
  for (const [name, status] of processImportBindings(sourceFile)) sourceScope.bindings.set(name, status)
  predeclareVarEnvironmentShadows(sourceFile, sourceScope)
  visit(sourceFile, sourceScope)
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
