import ts from "typescript"

const isLoop = (node) => ts.isForStatement(node) || ts.isForInStatement(node) ||
  ts.isForOfStatement(node) || ts.isWhileStatement(node) || ts.isDoStatement(node)

/** Own abrupt-completion targets once for both audit flow domains. */
export function createCompletionRouter({ merge, restore, snapshot }) {
  const loops = [], breaks = [], tries = [], functions = []
  let pendingLoopLabels = []

  const route = (completion) => {
    if (tries.length > 0) tries.at(-1).push(completion)
    else if (["return", "throw"].includes(completion.kind) && functions.length > 0) functions.at(-1).push(completion)
    else if (completion.target) {
      const rows = completion.kind === "continue" ? completion.target.continues : completion.target.breaks
      rows.push(completion.state)
    }
  }

  const visitAbrupt = (node, scope, visit) => {
    if (ts.isReturnStatement(node) || ts.isThrowStatement(node)) {
      if (node.expression && visit(node.expression, scope) === false) return false
      route({ kind: ts.isThrowStatement(node) ? "throw" : "return", state: snapshot(scope) })
      return false
    }
    if (!ts.isBreakStatement(node) && !ts.isContinueStatement(node)) return null
    const label = node.label?.text
    const candidates = ts.isContinueStatement(node) ? loops : breaks
    const target = [...candidates].reverse().find((frame) => !label || frame.labels.includes(label))
    if (target) route({
      kind: ts.isContinueStatement(node) ? "continue" : "break",
      state: snapshot(target.scope), target,
    })
    return false
  }

  const visitLabeled = (node, scope, visit) => {
    const labels = []
    let statement = node
    while (ts.isLabeledStatement(statement)) { labels.push(statement.label.text); statement = statement.statement }
    if (isLoop(statement)) {
      const prior = pendingLoopLabels
      pendingLoopLabels = labels
      try { return visit(statement, scope) } finally { pendingLoopLabels = prior }
    }
    const frame = { labels: [node.label.text], scope, breaks: [] }
    breaks.push(frame)
    const normal = visit(node.statement, scope) !== false
    const state = normal ? snapshot(scope) : null
    breaks.pop()
    return Boolean(merge([state, ...frame.breaks].filter(Boolean)))
  }

  const createLoopFrame = (scope) => {
    const frame = { labels: pendingLoopLabels, scope, breaks: [], continues: [] }
    pendingLoopLabels = []
    return frame
  }
  const withLoop = (frame, callback) => {
    loops.push(frame); breaks.push(frame)
    try { return callback() } finally { loops.pop(); breaks.pop() }
  }
  const withBreak = (frame, callback) => {
    breaks.push(frame)
    try { return callback() } finally { breaks.pop() }
  }
  const collectTry = (callback) => {
    const completions = []
    tries.push(completions)
    try { return { completions, result: callback() } } finally { tries.pop() }
  }
  const captureThrowState = (state) => route({ kind: "throw", state })
  const capturePotentialThrow = (_node, scope) => {
    if (tries.length > 0 || functions.length > 0) captureThrowState(snapshot(scope))
  }
  const visitOptional = (scope, callback) => {
    const skipped = snapshot(scope)
    const completes = callback() !== false
    const evaluated = completes ? snapshot(scope) : null
    restore(skipped); merge([skipped, evaluated].filter(Boolean))
    return true
  }
  const visitFinally = (outcomes, block, scope, visit) => {
    const finalized = []
    for (const outcome of outcomes) {
      restore(outcome.state)
      const { completions, result } = collectTry(() => visit(block, scope))
      if (result !== false) finalized.push({ ...outcome, state: snapshot(scope) })
      finalized.push(...completions)
    }
    return finalized
  }
  const isolateFunction = (callback) => {
    const saved = {
      loops: loops.splice(0), breaks: breaks.splice(0), tries: tries.splice(0),
      labels: pendingLoopLabels,
    }
    const completions = []
    pendingLoopLabels = []
    functions.push(completions)
    try { return { completions, result: callback() } } finally {
      functions.pop()
      loops.push(...saved.loops); breaks.push(...saved.breaks); tries.push(...saved.tries)
      pendingLoopLabels = saved.labels
    }
  }

  return {
    capturePotentialThrow, captureThrowState, collectTry, createLoopFrame, isolateFunction,
    route, visitAbrupt, visitFinally, visitLabeled, visitOptional, withBreak, withLoop,
  }
}
