import ts from "typescript"
import { joinScopeSnapshots, mergeScopeSnapshots, restoreScopes, snapshotScopes } from "./cleanup-environment-flow.mjs"
import { COMMONJS_LOADER, PROCESS_OBJECT } from "./cleanup-environment-scope.mjs"
import { createCompletionRouter } from "./cleanup-control-router.mjs"
import { mergeCallableStates } from "./cleanup-environment-callables.mjs"

/** Model only normal-reaching structured flow needed by environment provenance. */
export function createEnvironmentControl(visitNode, visitAssignmentTarget, visitForInExpression, visitExpression = visitNode) {
  let suspendAtAwait = false
  const snap = (scope) => snapshotScopes(scope)
  const mergeNormal = (paths) => paths.length > 0 && Boolean(mergeScopeSnapshots(paths))
  const router = createCompletionRouter({ join: joinScopeSnapshots, merge: mergeScopeSnapshots, restore: restoreScopes, snapshot: snap })
  const staticTrue = (node) => {
    while (node && ts.isParenthesizedExpression(node)) node = node.expression
    return node?.kind === ts.SyntaxKind.TrueKeyword
  }
  const visitStatements = (statements, scope) => {
    for (const statement of statements) if (visitNode(statement, scope) === false) return false
    return true
  }

  const visitIf = (node, scope) => {
    if (visitNode(node.expression, scope) === false) return false
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
  const visitLogicalAssignment = (node, scope, kind, valueStatus, callableBranches, applyRight) => {
    visitNode(node.left, scope)
    if (callableBranches) {
      const initial = snap(scope), normal = []
      if (callableBranches.preserveEnvironmentJoin) {
        const rightNormal = applyRight() !== false, right = rightNormal ? snap(scope) : null
        restoreScopes(initial); mergeScopeSnapshots([initial, right].filter(Boolean))
        const rightCallable = right?.get(callableBranches.owner)?.callables.get(callableBranches.name) ?? null
        const executed = callableBranches.execute ? rightCallable : null
        callableBranches.owner.callables.set(callableBranches.name, callableBranches.skip && executed
          ? mergeCallableStates(callableBranches.skip, executed) : callableBranches.skip ?? executed)
        return true
      }
      if (callableBranches.skip) {
        restoreScopes(initial)
        callableBranches.owner.callables.set(callableBranches.name, callableBranches.skip)
        normal.push(snap(scope))
      }
      if (callableBranches.execute) {
        restoreScopes(initial)
        callableBranches.owner.callables.set(callableBranches.name, callableBranches.execute)
        if (applyRight() !== false) normal.push(snap(scope))
      }
      if (normal.length === 0) { restoreScopes(initial); return false }
      mergeScopeSnapshots(normal)
      return true
    }
    const prior = valueStatus(node.left, scope)
    const shortCircuits = prior === "proven" || prior === PROCESS_OBJECT || prior === COMMONJS_LOADER
    const definitelyExecutes = kind === "logical-and-assignment"
      ? shortCircuits || prior === "truthy"
      : kind === "logical-or-assignment"
        ? prior === "falsy" || prior === "nullish"
        : prior === "nullish"
    const definitelySkips = kind === "logical-and-assignment"
      ? prior === "falsy" || prior === "nullish"
      : shortCircuits || prior === "truthy" || kind === "logical-nullish-assignment" && prior === "falsy"
    if (definitelySkips) return true
    const initial = snap(scope)
    const rightNormal = applyRight() !== false
    if (definitelyExecutes) return rightNormal
    mergeScopeSnapshots([initial, ...(rightNormal ? [snap(scope)] : [])])
    return true
  }

  const visitLoop = (node, scope, loopScope) => {
    const frame = router.createLoopFrame(loopScope)
    let entry
    if (ts.isForStatement(node)) {
      if (node.initializer && visitNode(node.initializer, loopScope) === false) return false
      if (node.condition && visitNode(node.condition, loopScope) === false) return false
      entry = snap(loopScope)
    } else if (ts.isWhileStatement(node)) {
      if (visitNode(node.expression, loopScope) === false) return false
      entry = snap(loopScope)
    } else if (ts.isForInStatement(node) || ts.isForOfStatement(node)) {
      if (visitForInExpression(node, loopScope) === false) return false
      // Async iteration awaits its first step even for an empty synchronous source.
      if (node.awaitModifier && suspendAtAwait) {
        router.route({ kind: "suspend", state: snap(loopScope) })
        return false
      }
      entry = snap(loopScope)
      if (ts.isVariableDeclarationList(node.initializer)) visitNode(node.initializer, loopScope)
      else visitAssignmentTarget(node.initializer, loopScope)
    } else entry = snap(loopScope)

    const bodyNormal = router.withLoop(frame, () => visitNode(node.statement, loopScope) !== false)
    const bodyWraps = [...frame.continues]
    if (bodyNormal) bodyWraps.push(snap(loopScope))

    if (bodyWraps.length > 0) mergeScopeSnapshots(bodyWraps)
    let tailNormal = bodyWraps.length > 0
    if (ts.isForStatement(node) && bodyWraps.length > 0) {
      if (node.incrementor && visitNode(node.incrementor, loopScope) === false) tailNormal = false
    } else if (ts.isDoStatement(node) && bodyWraps.length > 0) {
      if (visitNode(node.expression, loopScope) === false) tailNormal = false
    }

    const iterationState = tailNormal ? snap(loopScope) : null
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
    if (visitNode(node.expression, scope) === false) return false
    const frame = { labels: [], scope: caseScope, breaks: [] }
    const clauses = node.caseBlock.clauses, matches = new Map()
    let unmatched = snap(caseScope)
    // Case expressions run only while searching. A matched fallthrough path
    // bypasses later tests, and default is selected only after search completes.
    for (const clause of clauses) if (clause.expression && unmatched) {
      restoreScopes(unmatched)
      unmatched = visitExpression(clause.expression, caseScope) === false ? null : snap(caseScope)
      if (unmatched) matches.set(clause, unmatched)
    }
    const defaultClause = clauses.find((clause) => ts.isDefaultClause(clause))
    if (defaultClause && unmatched) matches.set(defaultClause, unmatched)
    let fallthrough = null
    const exits = []
    router.withBreak(frame, () => {
      for (const clause of clauses) {
        const entries = [matches.get(clause), fallthrough].filter(Boolean)
        if (entries.length === 0) continue
        mergeScopeSnapshots(entries)
        const normal = visitStatements(clause.statements, caseScope)
        fallthrough = normal ? snap(caseScope) : null
      }
    })
    if (fallthrough) exits.push(fallthrough)
    if (!defaultClause && unmatched) exits.push(unmatched)
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
      const suspended = completions.filter(({ kind }) => kind === "suspend")
      completions = [
        ...router.visitFinally(completions.filter(({ kind }) => kind !== "suspend"), node.finallyBlock, scope, visitNode),
        ...suspended,
      ]
    }
    const normal = completions.filter(({ kind }) => kind === "normal")
    if (normal.length > 0) mergeScopeSnapshots(normal.map(({ state }) => state))
    for (const completion of completions) if (completion.kind !== "normal") router.route(completion)
    return normal.length > 0
  }

  /** Function-local abrupt targets never escape into declaration-time control frames. */
  const visitFunctionRegion = (scope, callback, suspend = false) => {
    const priorSuspend = suspendAtAwait
    suspendAtAwait = suspend
    let isolated
    try { isolated = router.isolateFunction(callback) } finally { suspendAtAwait = priorSuspend }
    const normalKinds = suspend ? ["return", "throw", "suspend"] : ["return"]
    const normalStates = isolated.completions.filter(({ kind }) => normalKinds.includes(kind)).map(({ state }) => state)
    if (isolated.result !== false) normalStates.push(snap(scope))
    if (normalStates.length > 0) mergeScopeSnapshots(normalStates)
    return {
      normal: normalStates.length > 0 ? snap(scope) : null,
      throws: suspend ? [] : isolated.completions.filter(({ kind }) => kind === "throw").map(({ state }) => state),
    }
  }

  return {
    capturePotentialThrow: router.capturePotentialThrow, captureThrowState: router.captureThrowState,
    visitAbrupt: (node, scope) => router.visitAbrupt(node, scope, visitNode), visitConditional, visitIf,
    visitLabeled: (node, scope) => router.visitLabeled(node, scope, visitNode),
    visitAwait: (node, scope) => {
      if (!suspendAtAwait || !ts.isAwaitExpression(node)) return null
      if (visitNode(node.expression, scope) === false) return false
      router.route({ kind: "suspend", state: snap(scope) })
      return false
    }, visitFunctionRegion, visitLogical, visitLogicalAssignment, visitLoop, visitOptional: router.visitOptional, visitStatements, visitSwitch, visitTry,
  }
}
