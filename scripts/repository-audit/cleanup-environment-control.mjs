import ts from "typescript"
import { mergeScopeSnapshots, restoreScopes, snapshotScopes } from "./cleanup-environment-flow.mjs"
import { COMMONJS_LOADER, PROCESS_OBJECT } from "./cleanup-environment-scope.mjs"
import { createCompletionRouter } from "./cleanup-control-router.mjs"

/** Model only normal-reaching structured flow needed by environment provenance. */
export function createEnvironmentControl(visitNode, visitAssignmentTarget, visitForInExpression) {
  const snap = (scope) => snapshotScopes(scope)
  const mergeNormal = (paths) => paths.length > 0 && Boolean(mergeScopeSnapshots(paths))
  const router = createCompletionRouter({ merge: mergeScopeSnapshots, restore: restoreScopes, snapshot: snap })
  const staticTrue = (node) => {
    while (node && ts.isParenthesizedExpression(node)) node = node.expression
    return node?.kind === ts.SyntaxKind.TrueKeyword
  }
  const visitStatements = (statements, scope) => {
    for (const statement of statements) if (visitNode(statement, scope) === false) return false
    return true
  }

  const visitIf = (node, scope) => {
    visitNode(node.expression, scope)
    const initial = snap(scope)
    const thenNormal = visitNode(node.thenStatement, scope) !== false
    const thenState = thenNormal ? snap(scope) : null
    restoreScopes(initial)
    const elseNormal = node.elseStatement ? visitNode(node.elseStatement, scope) !== false : true
    const elseState = elseNormal ? snap(scope) : null
    return mergeNormal([thenState, elseState].filter(Boolean))
  }

  const visitConditional = (node, scope) => {
    if (visitNode(node.condition, scope) === false) return false
    const initial = snap(scope)
    const trueNormal = visitNode(node.whenTrue, scope) !== false
    const whenTrue = trueNormal ? snap(scope) : null
    restoreScopes(initial)
    const falseNormal = visitNode(node.whenFalse, scope) !== false
    return mergeNormal([whenTrue, falseNormal ? snap(scope) : null].filter(Boolean))
  }

  const visitLogical = (node, scope, valueStatus) => {
    if (visitNode(node.left, scope) === false) return false
    const prior = valueStatus(node.left, scope)
    const truthy = prior === "proven" || prior === PROCESS_OBJECT || prior === COMMONJS_LOADER
    if (truthy && [ts.SyntaxKind.BarBarToken, ts.SyntaxKind.QuestionQuestionToken].includes(node.operatorToken.kind)) {
      return true
    }
    if (truthy && node.operatorToken.kind === ts.SyntaxKind.AmpersandAmpersandToken) {
      return visitNode(node.right, scope) !== false
    }
    const withoutRight = snap(scope)
    const rightNormal = visitNode(node.right, scope) !== false
    mergeScopeSnapshots([withoutRight, ...(rightNormal ? [snap(scope)] : [])])
    return true
  }

  /** Skip unreachable logical-assignment RHSs; otherwise retain both possible results. */
  const visitLogicalAssignment = (node, scope, kind, valueStatus, applyRight) => {
    visitNode(node.left, scope)
    const prior = valueStatus(node.left, scope)
    const shortCircuits = prior === "proven" || prior === PROCESS_OBJECT || prior === COMMONJS_LOADER
    if (shortCircuits && ["logical-or-assignment", "logical-nullish-assignment"].includes(kind)) return true
    const initial = snap(scope)
    const rightNormal = applyRight() !== false
    if (shortCircuits && kind === "logical-and-assignment") return rightNormal
    mergeScopeSnapshots([initial, ...(rightNormal ? [snap(scope)] : [])])
    return true
  }

  const visitLoop = (node, scope, loopScope) => {
    const frame = router.createLoopFrame(loopScope)
    let entry
    if (ts.isForStatement(node)) {
      if (node.initializer) visitNode(node.initializer, loopScope)
      if (node.condition) visitNode(node.condition, loopScope)
      entry = snap(loopScope)
    } else if (ts.isWhileStatement(node)) {
      visitNode(node.expression, loopScope)
      entry = snap(loopScope)
    } else if (ts.isForInStatement(node) || ts.isForOfStatement(node)) {
      visitForInExpression(node, loopScope)
      entry = snap(loopScope)
      if (ts.isVariableDeclarationList(node.initializer)) visitNode(node.initializer, loopScope)
      else visitAssignmentTarget(node.initializer, loopScope)
    } else entry = snap(loopScope)

    const bodyNormal = router.withLoop(frame, () => visitNode(node.statement, loopScope) !== false)
    const bodyWraps = [...frame.continues]
    if (bodyNormal) bodyWraps.push(snap(loopScope))

    if (bodyWraps.length > 0) mergeScopeSnapshots(bodyWraps)
    if (ts.isForStatement(node) && bodyWraps.length > 0) {
      if (node.incrementor) visitNode(node.incrementor, loopScope)
    } else if (ts.isDoStatement(node) && bodyWraps.length > 0) {
      visitNode(node.expression, loopScope)
    }

    const iterationState = bodyWraps.length > 0 ? snap(loopScope) : null
    const normalExits = [...frame.breaks]
    const unconditional = ts.isForStatement(node) && !node.condition ||
      (ts.isWhileStatement(node) || ts.isDoStatement(node)) && staticTrue(node.expression)
    if (!ts.isDoStatement(node) && !unconditional) normalExits.push(entry)
    if (iterationState && !unconditional) {
      normalExits.push(iterationState)
    }
    if (normalExits.length === 0) {
      restoreScopes(entry)
      return false
    }
    mergeScopeSnapshots(normalExits)
    return true
  }

  const visitSwitch = (node, scope, caseScope = scope) => {
    visitNode(node.expression, scope)
    const entry = snap(caseScope)
    const frame = { labels: [], scope: caseScope, breaks: [] }
    let fallthrough = null
    const exits = []
    router.withBreak(frame, () => {
      for (const clause of node.caseBlock.clauses) {
        restoreScopes(entry)
        if (fallthrough) mergeScopeSnapshots([entry, fallthrough])
        if (clause.expression) visitNode(clause.expression, caseScope)
        const normal = visitStatements(clause.statements, caseScope)
        fallthrough = normal ? snap(caseScope) : null
      }
    })
    if (fallthrough) exits.push(fallthrough)
    if (!node.caseBlock.clauses.some((clause) => ts.isDefaultClause(clause))) exits.push(entry)
    return mergeNormal([...frame.breaks, ...exits])
  }

  const visitTry = (node, scope) => {
    const entry = snap(scope)
    const tried = router.collectTry(() => visitNode(node.tryBlock, scope))
    let completions = [...tried.completions]
    const tryNormal = tried.result !== false
    if (tryNormal) completions.push({ kind: "normal", state: snap(scope) })
    const thrown = completions.filter(({ kind }) => kind === "throw")
    if (node.catchClause && thrown.length > 0) {
      mergeScopeSnapshots(thrown.map(({ state }) => state))
      const caught = router.collectTry(() => visitNode(node.catchClause, scope))
      const catchNormal = caught.result !== false
      completions = completions.filter(({ kind }) => kind !== "throw")
      if (catchNormal) completions.push({ kind: "normal", state: snap(scope) })
      completions.push(...caught.completions)
    } else if (node.catchClause) {
      const continuing = completions.length > 0 ? snap(scope) : entry
      restoreScopes(entry)
      visitNode(node.catchClause, scope)
      restoreScopes(continuing)
    }
    if (node.finallyBlock && completions.length > 0) {
      completions = router.visitFinally(completions, node.finallyBlock, scope, visitNode)
    }
    const normal = completions.filter(({ kind }) => kind === "normal")
    if (normal.length > 0) mergeScopeSnapshots(normal.map(({ state }) => state))
    for (const completion of completions) if (completion.kind !== "normal") router.route(completion)
    return normal.length > 0
  }

  /** Function-local abrupt targets never escape into declaration-time control frames. */
  const visitFunctionRegion = (scope, callback) => {
    const isolated = router.isolateFunction(callback)
    const normalStates = isolated.completions.filter(({ kind }) => kind === "return").map(({ state }) => state)
    if (isolated.result !== false) normalStates.push(snap(scope))
    if (normalStates.length > 0) mergeScopeSnapshots(normalStates)
    return {
      normal: normalStates.length > 0 ? snap(scope) : null,
      throws: isolated.completions.filter(({ kind }) => kind === "throw").map(({ state }) => state),
    }
  }

  return {
    capturePotentialThrow: router.capturePotentialThrow, captureThrowState: router.captureThrowState,
    visitAbrupt: (node, scope) => router.visitAbrupt(node, scope, visitNode), visitConditional, visitIf,
    visitLabeled: (node, scope) => router.visitLabeled(node, scope, visitNode),
    visitFunctionRegion, visitLogical, visitLogicalAssignment, visitLoop, visitOptional: router.visitOptional, visitStatements, visitSwitch, visitTry,
  }
}
