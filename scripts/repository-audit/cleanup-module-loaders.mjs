import { extname } from "node:path"

import ts from "typescript"

import { annexBFunctionDeclarations } from "./cleanup-environment-scope.mjs"

const PROVEN_LOADER = "proven-loader"
const CREATE_REQUIRE_FACTORY = "create-require-factory"
const POSSIBLE_LOADER = "possible-loader"
const UNPROVEN = "unproven"

const childScope = (parent, ownsVarBindings = false, strict = parent?.strict ?? false) => ({
  bindings: new Map(), enumMembers: new Map(), outerWriteNames: null, shadowBindings: new Set(),
  parent, ownsVarBindings, strict,
})

function lookup(scope, name) {
  for (let current = scope; current; current = current.parent) {
    if (current.bindings.has(name)) return current.bindings.get(name)
  }
  return null
}

function varScope(scope) {
  let owner = scope
  while (owner.parent && !owner.ownsVarBindings) owner = owner.parent
  return owner
}

function addBindingNames(pattern, callback) {
  if (ts.isIdentifier(pattern)) callback(pattern.text)
  else if (ts.isObjectBindingPattern(pattern) || ts.isArrayBindingPattern(pattern)) {
    for (const element of pattern.elements) {
      if (ts.isBindingElement(element)) addBindingNames(element.name, callback)
    }
  }
}

function hasStrictDirective(node) {
  if (ts.isSourceFile(node) && ts.isExternalModule(node)) return true
  for (const statement of node.statements ?? []) {
    if (!ts.isExpressionStatement(statement) || !ts.isStringLiteral(statement.expression)) break
    if (["'use strict'", "\"use strict\""].includes(statement.expression.getText())) return true
  }
  return false
}

function directStatements(container) {
  if (ts.isSourceFile(container) || ts.isBlock(container) || ts.isModuleBlock(container)) return container.statements
  if (ts.isCaseBlock(container)) return container.clauses.flatMap((clause) => clause.statements)
  return []
}

function shadowName(scope, name) {
  const prior = scope.bindings.get(name) ?? lookup(scope.parent, name)
  scope.bindings.set(name, [PROVEN_LOADER, POSSIBLE_LOADER].includes(prior) ? POSSIBLE_LOADER : UNPROVEN)
  scope.shadowBindings.add(name)
}

function predeclareLexical(container, scope) {
  for (const statement of directStatements(container)) {
    if (ts.isEnumDeclaration(statement)) {
      const members = scope.enumMembers.get(statement.name.text) ?? []
      scope.enumMembers.set(statement.name.text, [...members, ...statement.members])
    }
    if (ts.isVariableStatement(statement) && statement.declarationList.flags & ts.NodeFlags.BlockScoped) {
      for (const declaration of statement.declarationList.declarations) {
        addBindingNames(declaration.name, (name) => shadowName(scope, name))
      }
    } else if (
      (ts.isFunctionDeclaration(statement) || ts.isClassDeclaration(statement) ||
        ts.isEnumDeclaration(statement) || ts.isModuleDeclaration(statement)) && statement.name
    ) {
      addBindingNames(statement.name, (name) => shadowName(scope, name))
    } else if (ts.isImportEqualsDeclaration(statement)) {
      shadowName(scope, statement.name.text)
    }
  }
}

function predeclareVarBindings(container, scope, annexBDeclarations) {
  const scan = (node) => {
    if (node !== container && (
      ts.isFunctionLike(node) || ts.isClassDeclaration(node) || ts.isClassExpression(node) ||
      ts.isClassStaticBlockDeclaration(node) || ts.isModuleBlock(node)
    )) return
    if (ts.isVariableDeclarationList(node) && !(node.flags & ts.NodeFlags.BlockScoped)) {
      for (const declaration of node.declarations) {
        addBindingNames(declaration.name, (name) => {
          if (!(ts.isSourceFile(container) && name === "require" && scope.bindings.get(name) === PROVEN_LOADER)) {
            shadowName(scope, name)
          }
        })
      }
    }
    ts.forEachChild(node, scan)
  }
  scan(container)
  if (!scope.strict) for (const declaration of annexBFunctionDeclarations(container)) {
    annexBDeclarations.add(declaration)
    shadowName(scope, declaration.name.text)
  }
}

function predeclareImports(sourceFile, scope, factoryNames) {
  for (const statement of sourceFile.statements) {
    if (!ts.isImportDeclaration(statement) || !ts.isStringLiteral(statement.moduleSpecifier)) continue
    const clause = statement.importClause
    if (!clause) continue
    if (clause.name) scope.bindings.set(clause.name.text, UNPROVEN)
    const named = clause.namedBindings
    if (named && ts.isNamespaceImport(named)) scope.bindings.set(named.name.text, UNPROVEN)
    if (!named || !ts.isNamedImports(named)) continue
    const exactModule = ["module", "node:module"].includes(statement.moduleSpecifier.text)
    for (const element of named.elements) {
      const imported = element.propertyName?.text ?? element.name.text
      const status = exactModule && !clause.isTypeOnly && !element.isTypeOnly && imported === "createRequire"
        ? CREATE_REQUIRE_FACTORY : UNPROVEN
      scope.bindings.set(element.name.text, status)
      if (status === CREATE_REQUIRE_FACTORY) factoryNames.add(element.name.text)
    }
  }
}

function isImportMetaUrl(node) {
  return ts.isPropertyAccessExpression(node) && node.name.text === "url" &&
    ts.isMetaProperty(node.expression) && node.expression.keywordToken === ts.SyntaxKind.ImportKeyword &&
    node.expression.name.text === "meta"
}

function initializerStatus(node, scope, factoryNames) {
  if (!node) return UNPROVEN
  if (ts.isParenthesizedExpression(node) || ts.isAsExpression(node) || ts.isTypeAssertionExpression(node) ||
    ts.isNonNullExpression(node) || ts.isSatisfiesExpression(node)) return initializerStatus(node.expression, scope, factoryNames)
  if (ts.isIdentifier(node)) {
    const status = lookup(scope, node.text)
    return [PROVEN_LOADER, POSSIBLE_LOADER].includes(status) ? status : UNPROVEN
  }
  if (
    ts.isCallExpression(node) && !node.questionDotToken && ts.isIdentifier(node.expression) &&
    factoryNames.has(node.expression.text)
  ) return lookup(scope, node.expression.text) === CREATE_REQUIRE_FACTORY && node.arguments.length === 1 &&
      isImportMetaUrl(node.arguments[0]) ? PROVEN_LOADER : POSSIBLE_LOADER
  return UNPROVEN
}

function loaderCall(node, scope, resolveCapabilityDowngraded) {
  if (!ts.isCallExpression(node)) return null
  if (ts.isIdentifier(node.expression)) {
    const status = lookup(scope, node.expression.text)
    if (status === PROVEN_LOADER) return { kind: "require", proven: true }
    if (status === POSSIBLE_LOADER) return { kind: "require", proven: false }
    if (node.expression.text === "require") return { kind: "require", proven: false }
  }
  if (
    ts.isPropertyAccessExpression(node.expression) &&
    node.expression.name.text === "resolve" && ts.isIdentifier(node.expression.expression)
  ) {
    const base = node.expression.expression
    const status = lookup(scope, base.text)
    if (status === PROVEN_LOADER) return { kind: "require-resolve", proven: !resolveCapabilityDowngraded }
    if (status === POSSIBLE_LOADER) return { kind: "require-resolve", proven: false }
    if (base.text === "require") return { kind: "require-resolve", proven: false }
  }
  return null
}

function invalidateName(scope, name) {
  for (let current = scope; current; current = current.parent) {
    if (!current.bindings.has(name)) continue
    const status = current.bindings.get(name)
    current.bindings.set(name, [PROVEN_LOADER, POSSIBLE_LOADER].includes(status) ? POSSIBLE_LOADER : UNPROVEN)
    if (current.outerWriteNames?.has(name)) invalidateName(current.parent, name)
    return
  }
}

function resolveTargetName(node) {
  while (node && (ts.isParenthesizedExpression(node) || ts.isAsExpression(node) ||
    ts.isTypeAssertionExpression(node) || ts.isNonNullExpression(node) || ts.isSatisfiesExpression(node))) {
    node = node.expression
  }
  let base = null
  if (ts.isPropertyAccessExpression(node) && node.name.text === "resolve") base = node.expression
  else if (ts.isElementAccessExpression(node) &&
    (ts.isStringLiteral(node.argumentExpression) || ts.isNoSubstitutionTemplateLiteral(node.argumentExpression)) &&
    node.argumentExpression.text === "resolve") base = node.expression
  while (base && (ts.isParenthesizedExpression(base) || ts.isAsExpression(base) ||
    ts.isTypeAssertionExpression(base) || ts.isNonNullExpression(base) || ts.isSatisfiesExpression(base))) {
    base = base.expression
  }
  return base && ts.isIdentifier(base) ? base.text : null
}

function isDestructuringTarget(node) {
  while (node && (ts.isParenthesizedExpression(node) || ts.isAsExpression(node) ||
    ts.isTypeAssertionExpression(node) || ts.isNonNullExpression(node) || ts.isSatisfiesExpression(node))) {
    node = node.expression
  }
  return Boolean(node && (ts.isObjectLiteralExpression(node) || ts.isArrayLiteralExpression(node)))
}

function invalidateTarget(node, scope) {
  if (!node) return
  if (ts.isIdentifier(node)) { invalidateName(scope, node.text); return }
  if (ts.isParenthesizedExpression(node) || ts.isAsExpression(node) || ts.isTypeAssertionExpression(node) ||
    ts.isNonNullExpression(node) || ts.isSatisfiesExpression(node)) {
    invalidateTarget(node.expression, scope)
  } else if (ts.isBinaryExpression(node) && ts.isAssignmentOperator(node.operatorToken.kind)) {
    invalidateTarget(node.left, scope)
  } else if (ts.isObjectLiteralExpression(node)) {
    for (const property of node.properties) {
      if (ts.isShorthandPropertyAssignment(property)) invalidateTarget(property.name, scope)
      else if (ts.isPropertyAssignment(property)) invalidateTarget(property.initializer, scope)
      else if (ts.isSpreadAssignment(property)) invalidateTarget(property.expression, scope)
    }
  } else if (ts.isArrayLiteralExpression(node)) {
    for (const element of node.elements) if (!ts.isOmittedExpression(element)) invalidateTarget(element, scope)
  } else if (ts.isSpreadElement(node)) {
    invalidateTarget(node.expression, scope)
  } else if (ts.isObjectBindingPattern(node) || ts.isArrayBindingPattern(node)) {
    for (const element of node.elements) if (ts.isBindingElement(element)) invalidateTarget(element.name, scope)
  }
}

/** Classify CommonJS module-loader calls without confusing same-spelled lexical bindings with Node's loader. */
export function moduleLoaderCalls(sourceFile, sourcePath) {
  const calls = new WeakMap()
  const factoryNames = new Set()
  const annexBDeclarations = new Set()
  // A mutated .resolve property may be shared by aliases; plain loader-call proof remains independent.
  let resolveCapabilityDowngraded = false
  const root = childScope(null, true, hasStrictDirective(sourceFile))
  if ([".cjs", ".cts"].includes(extname(sourcePath).toLowerCase())) root.bindings.set("require", PROVEN_LOADER)
  predeclareImports(sourceFile, root, factoryNames)
  predeclareLexical(sourceFile, root)
  predeclareVarBindings(sourceFile, root, annexBDeclarations)

  const isResolveMutationTarget = (node, scope) => {
    const name = resolveTargetName(node)
    if (!name) return false
    for (let current = scope; current; current = current.parent) {
      if (!current.bindings.has(name)) continue
      return current.bindings.get(name) === PROVEN_LOADER ||
        (current.bindings.get(name) === POSSIBLE_LOADER && !current.shadowBindings.has(name)) ||
        Boolean(current.outerWriteNames?.has(name))
    }
    return false
  }

  const downgradeResolveTarget = (node, scope, captured = isResolveMutationTarget(node, scope)) => {
    if (captured) resolveCapabilityDowngraded = true
  }

  // Binding names become assigned in pattern order, after their computed key and default execute.
  const visitBindingPattern = (node, scope) => {
    if (ts.isIdentifier(node)) { invalidateTarget(node, scope); return }
    if (ts.isObjectBindingPattern(node) || ts.isArrayBindingPattern(node)) {
      for (const element of node.elements) {
        if (ts.isBindingElement(element)) visitBindingPattern(element, scope)
      }
      return
    }
    if (!ts.isBindingElement(node)) return
    if (node.propertyName && ts.isComputedPropertyName(node.propertyName)) visit(node.propertyName.expression, scope)
    if (node.initializer) visit(node.initializer, scope)
    if (ts.isObjectBindingPattern(node.name) || ts.isArrayBindingPattern(node.name)) {
      visitBindingPattern(node.name, scope)
    } else invalidateTarget(node.name, scope)
  }

  const visitAssignmentTargetReference = (node, scope) => {
    while (node && (ts.isParenthesizedExpression(node) || ts.isAsExpression(node) ||
      ts.isTypeAssertionExpression(node) || ts.isNonNullExpression(node) || ts.isSatisfiesExpression(node))) {
      node = node.expression
    }
    if (ts.isPropertyAccessExpression(node)) visit(node.expression, scope)
    else if (ts.isElementAccessExpression(node)) {
      visit(node.expression, scope)
      if (node.argumentExpression) visit(node.argumentExpression, scope)
    }
  }

  // Destructuring resolves its RHS first, then evaluates and assigns each target in pattern order.
  const visitAssignmentPattern = (node, scope) => {
    if (!node) return
    if (ts.isIdentifier(node)) { invalidateTarget(node, scope); return }
    if (ts.isParenthesizedExpression(node) || ts.isAsExpression(node) || ts.isTypeAssertionExpression(node) ||
      ts.isNonNullExpression(node) || ts.isSatisfiesExpression(node) || ts.isSpreadElement(node)) {
      visitAssignmentPattern(node.expression, scope); return
    }
    if (ts.isBinaryExpression(node) && ts.isAssignmentOperator(node.operatorToken.kind)) {
      if (isDestructuringTarget(node.left)) {
        visit(node.right, scope); visitAssignmentPattern(node.left, scope)
      } else {
        const resolveMutation = isResolveMutationTarget(node.left, scope)
        visitAssignmentTargetReference(node.left, scope); visit(node.right, scope); invalidateTarget(node.left, scope)
        downgradeResolveTarget(node.left, scope, resolveMutation)
      }
      return
    }
    if (ts.isObjectLiteralExpression(node)) {
      for (const property of node.properties) {
        if (property.name && ts.isComputedPropertyName(property.name)) visit(property.name.expression, scope)
        if (ts.isShorthandPropertyAssignment(property)) {
          if (property.objectAssignmentInitializer) visit(property.objectAssignmentInitializer, scope)
          invalidateTarget(property.name, scope)
        } else if (ts.isPropertyAssignment(property)) visitAssignmentPattern(property.initializer, scope)
        else if (ts.isSpreadAssignment(property)) visitAssignmentPattern(property.expression, scope)
      }
      return
    }
    if (ts.isArrayLiteralExpression(node)) {
      for (const element of node.elements) {
        if (!ts.isOmittedExpression(element)) visitAssignmentPattern(element, scope)
      }
      return
    }
    visitAssignmentTargetReference(node, scope)
    invalidateTarget(node, scope)
    downgradeResolveTarget(node, scope)
  }

  const visitFunction = (node, outerScope) => {
    for (const decorator of ts.canHaveDecorators(node) ? ts.getDecorators(node) ?? [] : []) {
      visit(decorator.expression, outerScope)
    }
    for (const parameter of node.parameters) {
      for (const decorator of ts.canHaveDecorators(parameter) ? ts.getDecorators(parameter) ?? [] : []) {
        visit(decorator.expression, outerScope)
      }
    }
    if (node.name && ts.isComputedPropertyName(node.name)) visit(node.name.expression, outerScope)
    const parameterScope = childScope(outerScope)
    if ((ts.isFunctionDeclaration(node) || ts.isFunctionExpression(node)) && node.name) {
      shadowName(parameterScope, node.name.text)
    }
    for (const parameter of node.parameters) {
      addBindingNames(parameter.name, (name) => shadowName(parameterScope, name))
    }
    for (const parameter of node.parameters) {
      if (parameter.initializer) visit(parameter.initializer, parameterScope)
      visitBindingPattern(parameter.name, parameterScope)
    }
    if (!node.body) return
    const bodyScope = childScope(parameterScope, true, parameterScope.strict || hasStrictDirective(node.body))
    predeclareLexical(node.body, bodyScope)
    predeclareVarBindings(node.body, bodyScope, annexBDeclarations)
    if (ts.isBlock(node.body)) visitContainer(node.body, bodyScope)
    else visit(node.body, bodyScope)
  }

  const visitContainer = (container, scope) => {
    for (const statement of directStatements(container)) visit(statement, scope)
  }

  const visit = (node, scope) => {
    if (ts.isClassDeclaration(node) || ts.isClassExpression(node)) {
      for (const decorator of ts.canHaveDecorators(node) ? ts.getDecorators(node) ?? [] : []) {
        visit(decorator.expression, scope)
      }
      const classScope = childScope(scope, false, true)
      if (node.name) shadowName(classScope, node.name.text)
      for (const heritageClause of node.heritageClauses ?? []) visit(heritageClause, classScope)
      for (const member of node.members) visit(member, classScope)
      return
    }
    if (ts.isFunctionLike(node)) {
      if (ts.isFunctionDeclaration(node) && node.name && annexBDeclarations.has(node)) {
        // Sloppy Annex-B assigns the block function to its var binding when this declaration executes.
        invalidateName(varScope(scope), node.name.text)
      }
      visitFunction(node, scope); return
    }
    if (ts.isEnumDeclaration(node)) {
      const enumScope = childScope(scope)
      for (const member of scope.enumMembers.get(node.name.text) ?? node.members) {
        if (ts.isIdentifier(member.name) || ts.isStringLiteral(member.name) || ts.isNumericLiteral(member.name)) {
          shadowName(enumScope, member.name.text)
        }
      }
      for (const member of node.members) if (member.initializer) visit(member.initializer, enumScope)
      return
    }
    if (ts.isModuleBlock(node)) {
      const moduleScope = childScope(scope, true, true)
      predeclareLexical(node, moduleScope)
      predeclareVarBindings(node, moduleScope, annexBDeclarations)
      visitContainer(node, moduleScope); return
    }
    if (ts.isClassStaticBlockDeclaration(node)) {
      const staticScope = childScope(scope, true, true)
      predeclareLexical(node.body, staticScope); predeclareVarBindings(node.body, staticScope, annexBDeclarations)
      visitContainer(node.body, staticScope); return
    }
    if (ts.isBlock(node) && !ts.isFunctionLike(node.parent) && !ts.isCatchClause(node.parent)) {
      const blockScope = childScope(scope)
      predeclareLexical(node, blockScope); visitContainer(node, blockScope); return
    }
    if (ts.isCaseBlock(node)) {
      const caseScope = childScope(scope)
      predeclareLexical(node, caseScope)
      for (const clause of node.clauses) visit(clause, caseScope)
      return
    }
    if (ts.isCatchClause(node)) {
      const catchScope = childScope(scope)
      if (node.variableDeclaration) addBindingNames(node.variableDeclaration.name, (name) => shadowName(catchScope, name))
      if (node.variableDeclaration) visitBindingPattern(node.variableDeclaration.name, catchScope)
      predeclareLexical(node.block, catchScope); visitContainer(node.block, catchScope); return
    }
    if (ts.isWithStatement(node)) {
      visit(node.expression, scope)
      if (scope.strict) visit(node.statement, scope)
      else {
        const withScope = childScope(scope)
        const seen = new Set()
        // Writes that resolve through the synthetic object environment may also reach the outer binding.
        withScope.outerWriteNames = new Set()
        for (let current = scope; current; current = current.parent) {
          for (const [name, status] of current.bindings) {
            if (seen.has(name)) continue
            seen.add(name)
            if ([PROVEN_LOADER, POSSIBLE_LOADER].includes(status)) {
              withScope.bindings.set(name, POSSIBLE_LOADER); withScope.outerWriteNames.add(name)
            } else if (status === CREATE_REQUIRE_FACTORY) {
              withScope.bindings.set(name, UNPROVEN); withScope.outerWriteNames.add(name)
            }
          }
        }
        visit(node.statement, withScope)
      }
      return
    }
    if (ts.isForStatement(node) || ts.isForInStatement(node) || ts.isForOfStatement(node)) {
      const initializer = node.initializer
      const lexical = initializer && ts.isVariableDeclarationList(initializer) && initializer.flags & ts.NodeFlags.BlockScoped
      const loopScope = lexical ? childScope(scope) : scope
      if (lexical) for (const declaration of initializer.declarations) {
        addBindingNames(declaration.name, (name) => shadowName(loopScope, name))
      }
      if (ts.isForStatement(node)) {
        if (initializer) visit(initializer, loopScope)
        if (node.condition) visit(node.condition, loopScope)
      } else {
        visit(node.expression, loopScope)
        if (initializer && ts.isVariableDeclarationList(initializer)) {
          for (const declaration of initializer.declarations) {
            visitBindingPattern(declaration.name, loopScope)
          }
        } else {
          visitAssignmentPattern(initializer, loopScope)
        }
      }
      visit(node.statement, loopScope)
      if (ts.isForStatement(node) && node.incrementor) visit(node.incrementor, loopScope)
      return
    }
    if (ts.isVariableDeclaration(node)) {
      if (node.initializer) visit(node.initializer, scope)
      if (node.initializer && !ts.isIdentifier(node.name)) visitBindingPattern(node.name, scope)
      const declarationList = ts.isVariableDeclarationList(node.parent) ? node.parent : null
      const targetScope = declarationList && !(declarationList.flags & ts.NodeFlags.BlockScoped) ? varScope(scope) : scope
      if (node.initializer) {
        const status = ts.isIdentifier(node.name) ? initializerStatus(node.initializer, scope, factoryNames) : UNPROVEN
        addBindingNames(node.name, (name) => {
          targetScope.bindings.set(name, status); targetScope.shadowBindings.delete(name)
        })
      }
      return
    }
    if (ts.isBinaryExpression(node) && ts.isAssignmentOperator(node.operatorToken.kind)) {
      if (isDestructuringTarget(node.left)) {
        visit(node.right, scope)
        visitAssignmentPattern(node.left, scope)
      } else {
        const resolveMutation = isResolveMutationTarget(node.left, scope)
        visit(node.left, scope); visit(node.right, scope)
        invalidateTarget(node.left, scope)
        downgradeResolveTarget(node.left, scope, resolveMutation)
      }
      return
    }
    if ((ts.isPrefixUnaryExpression(node) || ts.isPostfixUnaryExpression(node)) &&
      [ts.SyntaxKind.PlusPlusToken, ts.SyntaxKind.MinusMinusToken].includes(node.operator)) {
      const resolveMutation = isResolveMutationTarget(node.operand, scope)
      ts.forEachChild(node, (child) => visit(child, scope))
      invalidateTarget(node.operand, scope)
      downgradeResolveTarget(node.operand, scope, resolveMutation)
      return
    }
    if (ts.isDeleteExpression(node)) {
      const resolveMutation = isResolveMutationTarget(node.expression, scope)
      visit(node.expression, scope)
      downgradeResolveTarget(node.expression, scope, resolveMutation)
      return
    }
    const classification = loaderCall(node, scope, resolveCapabilityDowngraded)
    if (classification) calls.set(node, classification)
    ts.forEachChild(node, (child) => visit(child, scope))
  }

  visitContainer(sourceFile, root)
  return calls
}
