import ts from "typescript"
import {
  COMMONJS_LOADER, MIXED_SOURCE_PROVENANCE, NON_ALIAS, POSSIBLE_COMMONJS_LOADER, POSSIBLE_PROCESS_OBJECT, PROCESS_OBJECT, annexBFunctionDeclarations, childScope, declareEnvironmentBindingName, hasStrictDirective, isEnvironmentAliasName, isProcessEnvironment,
  isPossibleProcessEnvironment,
  isProcessImportEquals, isTransparentExpression, lookupAlias, predeclareEnvironmentBindingName, predeclareOrdinaryImports, processImportBindings, processObjectSourceStatus, TDZ_BINDING, unwrapTransparentExpression, varBindingScope,
} from "./cleanup-environment-scope.mjs"

import { compareText, requireTrackedTextIndex, sha256, validateCleanupPolicy } from "./cleanup-core.mjs"
import { isLiteralNode, scriptKind, sourceLocation } from "./cleanup-source.mjs"
import { bindEnvironmentPatternDefaults, contributesToExpressionResult, environmentResultOperands, hasReadSemantics, isHandledObjectAssignment, joinEnvironmentResultStatuses, logicalAssignmentKind, processEnvironmentAssignmentStatus, recordEnvironmentInKey, recordEnvironmentPattern, wholeObjectMethod } from "./cleanup-environment-patterns.mjs"
import { cloneScopeChain, mergeLogicalAssignmentStatus, snapshotScopes } from "./cleanup-environment-flow.mjs"
import { createEnvironmentValueStatus } from "./cleanup-environment-provenance.mjs"
import { createEnvironmentInputValues } from "./cleanup-environment-input-values.mjs"
import { isEnvironmentValueEscape } from "./cleanup-environment-value.mjs"
import { createEnvironmentControl } from "./cleanup-environment-control.mjs"
import { callReferenceKind, visitImmediateCall } from "./cleanup-environment-functions.mjs"
import { bindCallableName, callableExpressionState, callableLogicalBranches, callableState, createEnvironmentFunctionInvoker, declareCallableBindingName, invalidateCallableIntrinsicMutation, lookupCallable } from "./cleanup-environment-callables.mjs"
import { visitDefiniteIntrinsicAssignment } from "./cleanup-environment-intrinsics.mjs"
import { createOrderedArgumentFlow } from "./cleanup-module-call-flow.mjs"
import { stableJson } from "./core.mjs"

function compareLocation(left, right) {
  return (
    compareText(left.path ?? "", right.path ?? "") ||
    (left.line ?? 0) - (right.line ?? 0) || (left.column ?? 0) - (right.column ?? 0) ||
    compareText(left.name ?? "", right.name ?? "") ||
    compareText(left.kind ?? left.code ?? "", right.kind ?? right.code ?? "")
  )
}

const rowIdentity = (row) => [row.path, row.line, row.column, row.name ?? "", row.kind ?? ""].join("\0")
const uniqueRows = (rows) => [...new Map(rows.map((row) => [rowIdentity(row), row])).values()]


function aliasStatus(node, scope) {
  const value = unwrapTransparentExpression(node)
  if (!value) return null
  if (isProcessEnvironment(value, scope)) return "proven"; if (isPossibleProcessEnvironment(value, scope)) return "unknown"
  if ((ts.isPropertyAccessExpression(value) || ts.isElementAccessExpression(value)) &&
    ts.isIdentifier(value.expression) && ["environment-container", MIXED_SOURCE_PROVENANCE].includes(lookupAlias(scope, value.expression.text))) return "unknown"
  if (ts.isIdentifier(value)) {
    const status = lookupAlias(scope, value.text)
    return status === MIXED_SOURCE_PROVENANCE ? "unknown" : [PROCESS_OBJECT, POSSIBLE_PROCESS_OBJECT, COMMONJS_LOADER, POSSIBLE_COMMONJS_LOADER].includes(status) ? null : status
  }
  return null
}

function collectEnvironmentRows(record, text) {
  const sourceFile = ts.createSourceFile(record.path, text, ts.ScriptTarget.Latest, true, scriptKind(record.path))
  const reads = [], uncertainties = []
  const annexBDeclarations = new Set()
  let forInExpression = null, forInStatus = null, inExpression = null, inOperands = null, inStatuses = null
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

  const valueStatus = createEnvironmentValueStatus()
  const inputValues = createEnvironmentInputValues(valueStatus)

  /** Record a whole-object read without pretending that any individual key is known. */
  const addWholeObjectUncertainty = (node, status, kind) => {
    if (status === "proven") addComputedUncertainty(node, kind)
    else if (["unknown", MIXED_SOURCE_PROVENANCE].includes(status)) addAliasUncertainty(node, null, kind)
  }

  const recordObjectBinding = (pattern, status, kind) => recordEnvironmentPattern(pattern, status === MIXED_SOURCE_PROVENANCE ? "unknown" : status, kind, { addRead, addComputedUncertainty, addAliasUncertainty })

  const bindName = (name, initializer, scope, initializerScope = scope, statusSnapshot) => {
    const status = statusSnapshot === undefined ? valueStatus(initializer, initializerScope) : statusSnapshot
    scope.bindings.set(name, status ?? (isEnvironmentAliasName(name) ? "unknown" : NON_ALIAS))
  }

  const declareBindingName = (name, scope, preserveExisting = false) => {
    declareEnvironmentBindingName(name, scope, preserveExisting); declareCallableBindingName(name, scope, preserveExisting)
  }
  const predeclareBindingName = (name, scope, status, replace = false) => {
    predeclareEnvironmentBindingName(name, scope, status, replace); declareCallableBindingName(name, scope, !replace)
  }

  const shadowEnvironmentBinding = (name, scope, preserveLoader = false) => {
    if (ts.isIdentifier(name)) {
      if (scope.bindings.has(name.text)) {
        if (!preserveLoader && [COMMONJS_LOADER, POSSIBLE_COMMONJS_LOADER, MIXED_SOURCE_PROVENANCE].includes(scope.bindings.get(name.text))) scope.bindings.set(name.text, NON_ALIAS)
        return
      }
      const status = lookupAlias(scope.parent, name.text)
      if ([PROCESS_OBJECT, POSSIBLE_PROCESS_OBJECT, COMMONJS_LOADER, POSSIBLE_COMMONJS_LOADER, MIXED_SOURCE_PROVENANCE, "proven", "unknown"].includes(status) || (["process", "require"].includes(name.text) && status === null)) {
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
      if (ts.isImportEqualsDeclaration(statement)) {
        shadowEnvironmentBinding(statement.name, scope)
        predeclareBindingName(statement.name, scope, NON_ALIAS)
      }
      else if (ts.isVariableStatement(statement) && statement.declarationList.flags & ts.NodeFlags.BlockScoped) {
        for (const declaration of statement.declarationList.declarations) {
          shadowEnvironmentBinding(declaration.name, scope)
          predeclareBindingName(declaration.name, scope, TDZ_BINDING, true)
        }
      } else if (ts.isFunctionDeclaration(statement)) {
        const owner = ts.isBlock(statement.parent) && ts.isFunctionLike(statement.parent.parent)
          ? varBindingScope(scope) : scope
        shadowEnvironmentBinding(statement.name, owner)
        predeclareBindingName(statement.name, owner, NON_ALIAS, true)
        if (statement.name) owner.callables.set(statement.name.text, callableState(statement, owner))
      } else if (
        (ts.isClassDeclaration(statement) ||
          ts.isEnumDeclaration(statement) || ts.isModuleDeclaration(statement)) &&
        statement.name && ts.isIdentifier(statement.name)
      ) {
        shadowEnvironmentBinding(statement.name, scope)
        predeclareBindingName(statement.name, scope, TDZ_BINDING, true)
      }
    }
  }

  const predeclareVarEnvironmentShadows = (container, scope) => {
    if (record.extension === ".cjs" && !scope.strict) {
      for (const declaration of annexBFunctionDeclarations(container)) {
        annexBDeclarations.add(declaration)
        predeclareBindingName(declaration.name, scope, NON_ALIAS)
      }
    }
    const scan = (node) => {
      if (node !== container && (ts.isFunctionLike(node) ||
        ts.isClassStaticBlockDeclaration(node) || ts.isModuleBlock(node))) return
      if (
        ts.isVariableDeclaration(node) && ts.isVariableDeclarationList(node.parent) &&
        !(node.parent.flags & ts.NodeFlags.BlockScoped)
      ) {
        shadowEnvironmentBinding(node.name, scope, true)
        predeclareBindingName(node.name, scope, NON_ALIAS)
      }
      ts.forEachChild(node, scan)
    }
    scan(container)
  }

  const assignName = (name, initializer, scope, conditionalKind = null, statusSnapshot) => {
    let owner = scope
    while (owner && !owner.bindings.has(name)) owner = owner.parent
    if (name === "require" && [COMMONJS_LOADER, POSSIBLE_COMMONJS_LOADER, MIXED_SOURCE_PROVENANCE].includes(owner?.bindings.get(name))) owner = varBindingScope(scope)
    if (!owner && name === "require") varBindingScope(scope).bindings.set(name, NON_ALIAS)
    if (!owner && name === "process") varBindingScope(scope).bindings.set(name, NON_ALIAS)
    if (!owner) return
    let status = statusSnapshot === undefined
      ? valueStatus(initializer, scope)
      : statusSnapshot
    const initializerValue = unwrapTransparentExpression(initializer)
    if (statusSnapshot === undefined && initializerValue && ts.isCallExpression(initializerValue) &&
      [PROCESS_OBJECT, POSSIBLE_PROCESS_OBJECT].includes(status)) status = null
    const prior = owner.bindings.get(name)
    if (conditionalKind && status !== null) {
      if (["proven", "unknown", MIXED_SOURCE_PROVENANCE].includes(status)) addWholeObjectUncertainty(initializer, status, conditionalKind)
      status = mergeLogicalAssignmentStatus(prior ?? NON_ALIAS, status, conditionalKind)
    }
    owner.bindings.set(
      name,
      status ?? (prior === MIXED_SOURCE_PROVENANCE ? prior : isEnvironmentAliasName(name) || ["proven", "unknown"].includes(prior) ? "unknown" : NON_ALIAS),
    )
  }

  /** Walk assignment targets in evaluation order; computed keys/defaults remain real reads. */
  const visitAssignmentTarget = (target, scope, initializer, conditionalKind = null, statusSnapshot, callableSnapshot) => {
    const value = unwrapTransparentExpression(target)
    if (ts.isIdentifier(value)) {
      assignName(value.text, initializer, scope, conditionalKind, statusSnapshot)
      bindCallableName(value.text, initializer, scope, scope, callableSnapshot)
    }
    else if (ts.isObjectLiteralExpression(value)) {
      // Snapshot RHS provenance before computed keys/defaults or target writes can change aliases.
      const processObjectSource = processObjectSourceStatus(initializer, scope)
      if (isHandledObjectAssignment(value)) recordObjectBinding(value, aliasStatus(initializer, scope), "assignment-destructure")
      for (const property of value.properties) {
        const processStatus = processObjectSource ? processEnvironmentAssignmentStatus(
          property, processObjectSource === POSSIBLE_PROCESS_OBJECT, (value) => aliasStatus(value, scope),
        ) : undefined
        if (ts.isSpreadAssignment(property)) visitAssignmentTarget(property.expression, scope, undefined, null, processStatus, null)
        else if (ts.isShorthandPropertyAssignment(property)) {
          if (property.objectAssignmentInitializer) visit(property.objectAssignmentInitializer, scope)
          assignName(property.name.text, property.objectAssignmentInitializer, scope, "assignment-default", processStatus)
          bindCallableName(property.name.text, property.objectAssignmentInitializer, scope)
        } else if (ts.isPropertyAssignment(property)) {
          if (ts.isComputedPropertyName(property.name)) visit(property.name.expression, scope)
          const target = unwrapTransparentExpression(property.initializer)
          if (processStatus && ts.isObjectLiteralExpression(target)) recordObjectBinding(target, processStatus, "assignment-destructure")
          visitAssignmentTarget(property.initializer, scope, undefined, null, processStatus, null)
        }
      }
    } else if (ts.isArrayLiteralExpression(value)) {
      for (const element of value.elements) if (!ts.isOmittedExpression(element)) visitAssignmentTarget(element, scope)
    } else if (ts.isSpreadElement(value)) visitAssignmentTarget(value.expression, scope)
    else if (ts.isBinaryExpression(value) && value.operatorToken.kind === ts.SyntaxKind.EqualsToken) {
      visit(value.right, scope)
      visitAssignmentTarget(value.left, scope, value.right, "assignment-default", statusSnapshot, callableSnapshot)
    } else visit(value, scope)
  }

  const bindPatternElementInitializers = (pattern, scope, initializerScope, kind, processObjectSource = false, visitValue = visit, input) => bindEnvironmentPatternDefaults(
    pattern, { aliasStatus, bindName, declareBindingName, initializerScope, input, kind, recordObjectBinding, scope, visit: visitValue }, processObjectSource)

  let visitNode, control, argumentFlow, visitFunctionLike
  const visit = (node, scope) => {
    const result = visitNode(node, scope)
    if (result !== false) inputValues.record(node, scope)
    return result
  }
  const visitForInExpression = (node, loopScope) => {
    if (!ts.isForInStatement(node)) return argumentFlow.visitArgument(node.expression, loopScope)
    const outerExpression = forInExpression, outerStatus = forInStatus
    forInExpression = node.expression; forInStatus = null
    const normal = argumentFlow.visitArgument(node.expression, loopScope) !== false
    if (normal) addWholeObjectUncertainty(node.expression, forInStatus, "whole-object-value")
    forInExpression = outerExpression; forInStatus = outerStatus; return normal
  }
  visitNode = (node, scope) => {
    const awaitResult = control?.visitAwait(node, scope); if (awaitResult !== null && awaitResult !== undefined) return awaitResult; const intrinsicMutation = invalidateCallableIntrinsicMutation(node, scope)
    if (inOperands?.has(node)) inStatuses.push(aliasStatus(node, scope))
    const resultStatus = forInExpression && contributesToExpressionResult(node, forInExpression) ? aliasStatus(node, scope) : null
    if (resultStatus === "proven" || resultStatus === "unknown" && forInStatus === null) forInStatus = resultStatus
    if (ts.isImportEqualsDeclaration(node)) {
      // Bind at the declaration, retaining predeclaration shadows and normal later invalidation.
      if (isProcessImportEquals(node)) scope.bindings.set(node.name.text, PROCESS_OBJECT)
      return
    }
    const abrupt = control.visitAbrupt(node, scope)
    if (abrupt !== null) return abrupt
    if (ts.isExpressionStatement(node)) return visit(node.expression, scope)
    if (isTransparentExpression(node)) return visit(node.expression, scope)
    if (ts.isLabeledStatement(node)) return control.visitLabeled(node, scope)
    if (ts.isIfStatement(node)) return control.visitIf(node, scope)
    if (ts.isSwitchStatement(node)) {
      const caseScope = childScope(scope)
      predeclareDirectEnvironmentShadows(node.caseBlock.clauses.flatMap((clause) => clause.statements), caseScope)
      return control.visitSwitch(node, scope, caseScope)
    }
    if (ts.isTryStatement(node)) return control.visitTry(node, scope)
    if (ts.isConditionalExpression(node)) return control.visitConditional(node, scope)
    if (ts.isBinaryExpression(node) && [ts.SyntaxKind.AmpersandAmpersandToken, ts.SyntaxKind.BarBarToken, ts.SyntaxKind.QuestionQuestionToken].includes(node.operatorToken.kind)) return control.visitLogical(node, scope, valueStatus)
    if (ts.isCallExpression(node)) {
      const immediate = visitImmediateCall(
        node, scope, visit, argumentFlow.visitArgument, visitFunctionLike, control.captureThrowState,
        (name) => {
          const status = lookupAlias(scope, name)
          return status === null ? "nullish" : status === TDZ_BINDING ? "throws" : "unknown"
        },
        (name) => lookupCallable(scope, name),
        (expression) => callableExpressionState(expression, scope),
        (argument) => inputValues.capture(argument, scope),
      )
      if (immediate !== null) return immediate
    }
    if (ts.isFunctionLike(node)) {
      visitFunctionLike(node, scope)
      return true
    }
    if (ts.isForStatement(node) || ts.isForInStatement(node) || ts.isForOfStatement(node) || ts.isWhileStatement(node) || ts.isDoStatement(node)) {
      const initializer = node.initializer
      const loopScope = initializer && ts.isVariableDeclarationList(initializer) &&
        (initializer.flags & ts.NodeFlags.BlockScoped)
        ? childScope(scope)
        : scope
      if (loopScope !== scope) for (const declaration of initializer.declarations) declareBindingName(declaration.name, loopScope)
      return control.visitLoop(node, scope, loopScope)
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
      ts.forEachChild(node, (child) => { visit(child, classScope) })
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
      return control.visitStatements(node.statements, moduleScope)
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
      return control.visitStatements(node.statements, blockScope)
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
      const bindingPattern = ts.isObjectBindingPattern(node.name) || ts.isArrayBindingPattern(node.name)
      const hasAssignment = Boolean(node.initializer) || isIterationAssignment
      declareBindingName(node.name, declarationScope, isVarDeclaration && !hasAssignment)
      if (!hasAssignment && !bindingPattern) return
      const processObjectSource = ts.isObjectBindingPattern(node.name) && processObjectSourceStatus(node.initializer, scope)
      if (node.initializer && visit(node.initializer, scope) === false) return false
      const status = aliasStatus(node.initializer, scope)
      if (ts.isIdentifier(node.name)) {
        bindName(node.name.text, node.initializer, declarationScope, scope)
        bindCallableName(node.name.text, node.initializer, declarationScope, scope)
      }
      else if (bindingPattern) {
        if (ts.isObjectBindingPattern(node.name)) recordObjectBinding(node.name, status, "destructure")
        bindPatternElementInitializers(node.name, declarationScope, scope, "destructure", processObjectSource)
      }
      return
    }
    if (ts.isBinaryExpression(node) && ts.isAssignmentOperator(node.operatorToken.kind)) {
      const logicalKind = logicalAssignmentKind(node.operatorToken.kind), leftResultStatus = logicalKind && forInExpression && contributesToExpressionResult(node, forInExpression) ? aliasStatus(node.left, scope) : null
      if (leftResultStatus === "proven" || leftResultStatus === "unknown" && forInStatus === null) forInStatus = leftResultStatus
      const target = unwrapTransparentExpression(node.left), memberTarget = ts.isPropertyAccessExpression(target) || ts.isElementAccessExpression(target)
      const intrinsicResult = visitDefiniteIntrinsicAssignment(node, scope, intrinsicMutation, { addWholeObjectUncertainty, kind: logicalKind, valueStatus, visit })
      if (intrinsicResult !== null) return intrinsicResult
      if (logicalKind) return control.visitLogicalAssignment(
        node, scope, logicalKind, valueStatus, callableLogicalBranches(node.left, scope, logicalKind), () => {
        if (visit(node.right, scope) === false) return false; intrinsicMutation?.apply()
        const statusSnapshot = valueStatus(node.right, scope) ?? NON_ALIAS, callableSnapshot = callableExpressionState(node.right, scope)
        if (memberTarget) addWholeObjectUncertainty(node.right, statusSnapshot, logicalKind)
        else visitAssignmentTarget(node.left, scope, node.right, logicalKind, statusSnapshot, callableSnapshot)
      })
      if (memberTarget) visit(node.left, scope)
      if (visit(node.right, scope) === false) return false
      intrinsicMutation?.apply()
      if (!memberTarget) visitAssignmentTarget(
        node.left, scope,
        node.operatorToken.kind === ts.SyntaxKind.EqualsToken ? node.right : undefined,
        null, undefined, node.operatorToken.kind === ts.SyntaxKind.EqualsToken
          ? callableExpressionState(node.right, scope) : null,
      )
      return
    }
    if (ts.isBinaryExpression(node) && node.operatorToken.kind === ts.SyntaxKind.InKeyword) {
      const outerIn = inExpression, outerOperands = inOperands, outerStatuses = inStatuses; inExpression = node.left; inOperands = new Set(); inStatuses = []; visit(node.left, scope)
      inExpression = node.right; inOperands = new Set(environmentResultOperands(node.right)); inStatuses = []; visit(node.right, scope); const status = joinEnvironmentResultStatuses(inStatuses)
      inExpression = outerIn; inOperands = outerOperands; inStatuses = outerStatuses
      if (status) recordEnvironmentInKey(node.left, status, { addRead, addComputedUncertainty, addAliasUncertainty }); return
    }
    if (
      (ts.isPrefixUnaryExpression(node) || ts.isPostfixUnaryExpression(node)) &&
      [ts.SyntaxKind.PlusPlusToken, ts.SyntaxKind.MinusMinusToken].includes(node.operator)
    ) {
      visitAssignmentTarget(node.operand, scope)
      return
    }
    if (
      !isTransparentExpression(node) &&
      (aliasStatus(node, scope) === "proven" || valueStatus(node, scope) === MIXED_SOURCE_PROVENANCE) &&
      isEnvironmentValueEscape(node, scope, aliasStatus, inExpression)
    ) {
      // Retain mixed-source escapes without broadening name-only unknown aliases.
      addWholeObjectUncertainty(node, aliasStatus(node, scope), "whole-object-value")
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
    const argumentResult = argumentFlow?.intercept(node, scope); if (argumentResult !== null && argumentResult !== undefined) return argumentResult
    if (ts.isCallExpression(node)) {
      const reference = callReferenceKind(node.expression, (name) => lookupAlias(scope, name), TDZ_BINDING)
      if (reference !== "safe") control.capturePotentialThrow(node, scope)
      if (reference === "throws") return false
      if (visit(node.expression, scope) === false) return false
      const callee = unwrapTransparentExpression(node.expression)
      if (callee && (ts.isPropertyAccessExpression(callee) || ts.isElementAccessExpression(callee))) {
        control.capturePotentialThrow(node, scope)
      }
      for (const argument of node.arguments) {
        if (!argumentFlow.visitArgument(argument, scope)) return false
      }
      control.capturePotentialThrow(node, scope)
      return true
    }
    return argumentFlow.visitChildren(node, scope)
  }
  control = createEnvironmentControl((node, scope) => visit(node, scope), visitAssignmentTarget, visitForInExpression, (node, scope) => argumentFlow.visitArgument(node, scope))
  visitFunctionLike = createEnvironmentFunctionInvoker({
    captureInput: inputValues.capture, onExhaustion: (node) => addAliasUncertainty(node, null, "call-expansion-budget"),
    annexBDeclarations, assignName, bindName, bindPatternElementInitializers,
    childScope, cloneScopeChain, control, declareBindingName, hasStrictDirective,
    predeclareBindingName, predeclareVarEnvironmentShadows, processObjectSourceStatus, recordObjectBinding,
    snapshotScopes, valueStatus, varBindingScope, visit: (...args) => visit(...args), visitArgument: (...args) => argumentFlow.visitArgument(...args),
  })
  argumentFlow = createOrderedArgumentFlow({ captureThrow: control.capturePotentialThrow, isNullishMemberReceiver: (scope, node) => { const value = unwrapTransparentExpression(node); return ts.isIdentifier(value) && value.text === "undefined" && lookupAlias(scope, value.text) === null }, isSafeMemberReceiver: (scope, node) => processObjectSourceStatus(node, scope) === PROCESS_OBJECT || aliasStatus(node, scope) === "proven", referenceKind: (scope, name) => lookupAlias(scope, name) === TDZ_BINDING ? "throws" : lookupAlias(scope, name) === null && !["process", "undefined"].includes(name) ? "possible" : "safe", visit, visitOptional: control.visitOptional })
  const sourceScope = childScope(null, true, hasStrictDirective(sourceFile))
  if (record.extension === ".cjs") sourceScope.bindings.set("require", COMMONJS_LOADER)
  for (const [name, status] of processImportBindings(sourceFile)) sourceScope.bindings.set(name, status)
  predeclareOrdinaryImports(sourceFile, sourceScope)
  predeclareVarEnvironmentShadows(sourceFile, sourceScope)
  visit(sourceFile, sourceScope)
  const errors = sourceFile.parseDiagnostics.length > 0
    ? [{ code: "SOURCE_PARSE_DIAGNOSTIC", path: record.path, count: sourceFile.parseDiagnostics.length }]
    : []
  const uniqueUncertainties = uniqueRows(uncertainties)
  const uncertain = new Set(uniqueUncertainties.map(rowIdentity))
  return { reads: uniqueRows(reads).filter((row) => !uncertain.has(rowIdentity(row))), uncertainties: uniqueUncertainties, errors }
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
