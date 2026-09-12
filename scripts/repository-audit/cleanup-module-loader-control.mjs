import ts from "typescript"
import { captureScopeState, mergeScopeStates, restoreScopeState } from "./cleanup-flow-state.mjs"
import { createCompletionRouter } from "./cleanup-control-router.mjs"

export function hasStrictDirective(node) {
  if (ts.isSourceFile(node) && ts.isExternalModule(node)) return true
  for (const statement of node.statements ?? []) {
    if (!ts.isExpressionStatement(statement) || !ts.isStringLiteral(statement.expression)) break
    if (["'use strict'", "\"use strict\""].includes(statement.expression.getText())) return true
  }
  return false
}

function isAssignmentPatternDefault(node, current) {
  if (!ts.isBinaryExpression(node) || node.operatorToken.kind !== ts.SyntaxKind.EqualsToken || current !== node.right) return false
  let container = ts.isPropertyAssignment(node.parent) ? node.parent.parent :
    ts.isArrayLiteralExpression(node.parent) ? node.parent : null
  while (container) {
    if (ts.isPropertyAssignment(container.parent)) container = container.parent.parent
    else if (ts.isArrayLiteralExpression(container.parent)) container = container.parent
    else break
  }
  return Boolean(container && ts.isBinaryExpression(container.parent) &&
    ts.isAssignmentOperator(container.parent.operatorToken.kind) && container.parent.left === container)
}

/** True when an assignment may not execute in the current straight-line evaluation region. */
function maybeExecuted(node, withinIteration) {
  for (let current = node, parent; (parent = current.parent); current = parent) {
    if (ts.isFunctionLike(parent)) break
    if (ts.isOptionalChain(parent) && current !== parent.expression) return true
    if (ts.isBindingElement(parent) && current === parent.initializer ||
      ts.isShorthandPropertyAssignment(parent) && current === parent.objectAssignmentInitializer ||
      isAssignmentPatternDefault(parent, current)) return true
    const iterationBoundary = ts.isForStatement(parent) && parent.statement === current ||
      (ts.isForInStatement(parent) || ts.isForOfStatement(parent)) && parent.statement === current
    if (withinIteration && iterationBoundary) break
    if (ts.isPropertyDeclaration(parent) &&
      !parent.modifiers?.some((modifier) => modifier.kind === ts.SyntaxKind.StaticKeyword) ||
      ts.isClassStaticBlockDeclaration(parent)) return true
  }
  return false
}

export const isMaybeExecutedWithinIteration = (node) => maybeExecuted(node, true)

const joinedLoaderStatus = (left, right) => {
  if (left === right) return left
  return [left, right].some((status) => status === "proven-loader" || status === "possible-loader")
    ? "possible-loader" : "unproven"
}

export const joinLoaderStatus = joinedLoaderStatus

const isStaticTrue = (node) => {
  while (node && ts.isParenthesizedExpression(node)) node = node.expression
  return node?.kind === ts.SyntaxKind.TrueKeyword
}

const snapshotScopes = (scope) => {
  return captureScopeState(scope, (current) => ({
    bindings: new Map(current.bindings), shadows: new Set(current.shadowBindings),
  }))
}

const restoreScopes = (snapshot) => {
  restoreScopeState(snapshot, (scope, value) => {
    scope.bindings = new Map(value.bindings); scope.shadowBindings = new Set(value.shadows)
  })
}

const mergeScopes = (snapshots) => {
  return Boolean(mergeScopeStates(snapshots, (left, right) => {
    const bindings = new Map(left.bindings)
    for (const name of new Set([...bindings.keys(), ...right.bindings.keys()])) {
      bindings.set(name, joinedLoaderStatus(bindings.get(name) ?? "unproven", right.bindings.get(name) ?? "unproven"))
    }
    return { bindings, shadows: new Set([...left.shadows, ...right.shadows]) }
  }, (scope, value) => {
    scope.bindings = new Map(value.bindings); scope.shadowBindings = new Set(value.shadows)
  }))
}

/** Join loader provenance at structured continue paths before evaluating a for incrementor. */
export function createModuleLoaderControl(visitNode) {
  const router = createCompletionRouter({ merge: mergeScopes, restore: restoreScopes, snapshot: snapshotScopes })

  const visitStatements = (statements, scope) => {
    for (const statement of statements) if (visitNode(statement, scope) === false) return false
    return true
  }

  const visitIf = (node, scope) => {
    visitNode(node.expression, scope)
    const initial = snapshotScopes(scope)
    const thenNormal = visitNode(node.thenStatement, scope) !== false
    const thenState = thenNormal ? snapshotScopes(scope) : null
    restoreScopes(initial)
    const elseNormal = node.elseStatement ? visitNode(node.elseStatement, scope) !== false : true
    const elseState = elseNormal ? snapshotScopes(scope) : null
    return mergeScopes([thenState, elseState].filter(Boolean))
  }

  const visitConditional = (node, scope) => {
    visitNode(node.condition, scope)
    const initial = snapshotScopes(scope)
    visitNode(node.whenTrue, scope); const yes = snapshotScopes(scope)
    restoreScopes(initial)
    visitNode(node.whenFalse, scope)
    return mergeScopes([yes, snapshotScopes(scope)])
  }

  const visitLogical = (node, scope, prior) => {
    visitNode(node.left, scope)
    if (prior === "proven-loader" && [ts.SyntaxKind.BarBarToken, ts.SyntaxKind.QuestionQuestionToken].includes(node.operatorToken.kind)) return true
    if (prior === "proven-loader" && node.operatorToken.kind === ts.SyntaxKind.AmpersandAmpersandToken) {
      visitNode(node.right, scope); return true
    }
    const skipped = snapshotScopes(scope)
    visitNode(node.right, scope)
    return mergeScopes([skipped, snapshotScopes(scope)])
  }

  const visitLogicalAssignment = (node, scope, prior, applyRight) => {
    visitNode(node.left, scope)
    const shortCircuit = prior === "proven-loader" && [
      ts.SyntaxKind.BarBarEqualsToken, ts.SyntaxKind.QuestionQuestionEqualsToken,
    ].includes(node.operatorToken.kind)
    if (shortCircuit) return true
    const entry = snapshotScopes(scope)
    applyRight()
    if (!(prior === "proven-loader" && node.operatorToken.kind === ts.SyntaxKind.AmpersandAmpersandEqualsToken)) {
      mergeScopes([entry, snapshotScopes(scope)])
    }
    return true
  }

  const visitLoop = (node, loopScope, visitSetup) => {
    visitSetup()
    const entry = snapshotScopes(loopScope)
    const frame = router.createLoopFrame(loopScope)
    const bodyNormal = router.withLoop(frame, () => visitNode(node.statement, loopScope) !== false)
    const incrementPaths = [...frame.continues]
    if (bodyNormal) incrementPaths.push(snapshotScopes(loopScope))
    if (incrementPaths.length > 0) {
      mergeScopes(incrementPaths)
      if (ts.isForStatement(node) && node.incrementor) visitNode(node.incrementor, loopScope)
      else if (ts.isDoStatement(node)) visitNode(node.expression, loopScope)
    }
    const normalExits = [...frame.breaks]
    const canSkip = !ts.isDoStatement(node) && !(
      ts.isForStatement(node) && !node.condition ||
      ts.isWhileStatement(node) && isStaticTrue(node.expression)
    )
    const canFinishIteration = !(
      ts.isForStatement(node) && !node.condition ||
      (ts.isWhileStatement(node) || ts.isDoStatement(node)) && isStaticTrue(node.expression)
    )
    if (canSkip) normalExits.push(entry)
    if (incrementPaths.length > 0 && canFinishIteration) {
      normalExits.push(snapshotScopes(loopScope))
    }
    return mergeScopes(normalExits)
  }

  const visitSwitch = (node, scope, caseScope) => {
    visitNode(node.expression, scope)
    const entry = snapshotScopes(caseScope)
    const frame = { labels: [], scope: caseScope, breaks: [] }
    let fallthrough = null
    const exits = []
    router.withBreak(frame, () => {
      for (const clause of node.caseBlock.clauses) {
        restoreScopes(entry)
        if (fallthrough) mergeScopes([entry, fallthrough])
        if (clause.expression) visitNode(clause.expression, caseScope)
        const normal = visitStatements(clause.statements, caseScope)
        fallthrough = normal ? snapshotScopes(caseScope) : null
      }
    })
    if (fallthrough) exits.push(fallthrough)
    if (!node.caseBlock.clauses.some(ts.isDefaultClause)) exits.push(entry)
    return mergeScopes([...frame.breaks, ...exits])
  }

  const visitTry = (node, scope) => {
    const entry = snapshotScopes(scope)
    const tried = router.collectTry(() => visitNode(node.tryBlock, scope))
    const tryNormal = tried.result !== false
    let outcomes = [...tried.completions]
    if (tryNormal) outcomes.push({ kind: "normal", state: snapshotScopes(scope) })
    const throws = outcomes.filter(({ kind }) => kind === "throw")
    if (node.catchClause && throws.length > 0) {
      mergeScopes(throws.map(({ state }) => state))
      const caught = router.collectTry(() => visitNode(node.catchClause, scope))
      const normal = caught.result !== false
      outcomes = outcomes.filter(({ kind }) => kind !== "throw")
      if (normal) outcomes.push({ kind: "normal", state: snapshotScopes(scope) })
      outcomes.push(...caught.completions)
    } else if (node.catchClause) {
      const continuing = outcomes.length ? snapshotScopes(scope) : entry
      restoreScopes(entry); visitNode(node.catchClause, scope); restoreScopes(continuing)
    }
    if (node.finallyBlock && outcomes.length > 0) {
      outcomes = router.visitFinally(outcomes, node.finallyBlock, scope, visitNode)
    }
    const normal = outcomes.filter(({ kind }) => kind === "normal")
    if (normal.length) mergeScopes(normal.map(({ state }) => state))
    for (const outcome of outcomes) if (outcome.kind !== "normal") router.route(outcome)
    return normal.length > 0
  }

  const visitFunctionRegion = (callback) => {
    return router.isolateFunction(callback).result
  }

  return {
    capturePotentialThrow: router.capturePotentialThrow,
    visitAbrupt: (node, scope) => router.visitAbrupt(node, scope, visitNode), visitConditional, visitIf,
    visitLabeled: (node, scope) => router.visitLabeled(node, scope, visitNode),
    visitFunctionRegion, visitLogical, visitLogicalAssignment, visitLoop, visitOptional: router.visitOptional, visitStatements, visitSwitch, visitTry,
  }
}
