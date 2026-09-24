import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import test from "node:test"
import { runInNewContext } from "node:vm"
import ts from "typescript"

const browserSpecPath = new URL("./browser/anatomime-traffic.spec.ts", import.meta.url)
const clientFetchPath = new URL("../lib/client-fetch.ts", import.meta.url)
const normalizeNewlines = (source) => source.replace(/\r\n?/g, "\n")
const browserSpecSource = normalizeNewlines(readFileSync(browserSpecPath, "utf8"))
const clientFetchSource = normalizeNewlines(readFileSync(clientFetchPath, "utf8"))

/** Extracts the real named owners so the contract executes repository code, not copied models. */
function extractStatements(source, fileName, names) {
  const ast = ts.createSourceFile(fileName, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS)
  const selected = ast.statements.filter((statement) => {
    if (ts.isFunctionDeclaration(statement)) return names.has(statement.name?.text)
    if (!ts.isVariableStatement(statement)) return false
    return statement.declarationList.declarations.some((declaration) => (
      ts.isIdentifier(declaration.name) && names.has(declaration.name.text)
    ))
  })
  assert.equal(selected.length, names.size, `expected one declaration for each contract owner in ${fileName}`)
  return selected.map((statement) => statement.getText(ast)).join("\n")
}

/** Verifies every authored clock-driven test owns time before its first tested request. */
function assertClockOwnerOrder(source) {
  const ast = ts.createSourceFile("anatomime-traffic.spec.ts", source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS)
  const clockDrivenBodies = []
  const visit = (node) => {
    if (
      ts.isCallExpression(node)
      && ts.isIdentifier(node.expression)
      && node.expression.text === "test"
      && node.arguments.length >= 2
    ) {
      const callback = node.arguments[1]
      if ((ts.isArrowFunction(callback) || ts.isFunctionExpression(callback)) && ts.isBlock(callback.body)) {
        const body = callback.body.getText(ast)
        if (body.includes("installPausedClock(page)")) clockDrivenBodies.push(body)
      }
    }
    ts.forEachChild(node, visit)
  }
  visit(ast)
  assert.equal(clockDrivenBodies.length, 16, "expected every clock-driven test body")

  for (const body of clockDrivenBodies) {
    const owner = body.indexOf("installPausedClock(page)")
    const navigation = body.indexOf("page.goto(")
    if (body.includes('page.goto("/anatomime"')) {
      const directReadiness = body.indexOf('await expect(page.getByRole("button", { name: /Create Shared Game/i })).toBeVisible()')
      const aliasReadiness = body.indexOf("await expect(createGame).toBeVisible()")
      const readiness = Math.max(directReadiness, aliasReadiness)
      const requestAction = body.indexOf('getByRole("button", { name: /Create Shared Game/i }).click()')
      assert.ok(
        navigation < readiness && readiness < owner && owner < requestAction,
        "host/create clock must freeze after visible Create readiness and before create",
      )
    } else {
      assert.ok(owner < navigation, "player/join clock must freeze before navigation-owned requests")
    }
  }
}

const clockOwnerSource = extractStatements(
  browserSpecSource,
  "anatomime-traffic.spec.ts",
  new Set(["ANATOMIME_TEST_CLOCK_TIME", "installPausedClock"]),
)
const deadlineSource = extractStatements(
  clientFetchSource,
  "client-fetch.ts",
  new Set(["runWithFetchDeadline"]),
)

/** Transpiles the extracted TypeScript owners into a VM wired to the deterministic test clock. */
function compileContract(clock) {
  const source = `${clockOwnerSource}\n${deadlineSource}\n;globalThis.__contract = { installPausedClock, runWithFetchDeadline }`
  const compiled = ts.transpileModule(source, {
    compilerOptions: { target: ts.ScriptTarget.ES2022 },
  }).outputText
  const sandbox = {
    AbortController,
    DOMException,
    Date,
    Promise,
    URL,
    clearTimeout: (id) => clock.clearTimeout(id),
    setTimeout: (callback, delay) => clock.setTimeout(callback, delay),
  }
  sandbox.globalThis = sandbox
  runInNewContext(compiled, sandbox)
  return sandbox.__contract
}

function controlledFetch() {
  let resolve
  let signal
  const fetchImpl = (_input, init) => new Promise((resolveFetch, rejectFetch) => {
    resolve = resolveFetch
    signal = init.signal
    init.signal.addEventListener("abort", () => rejectFetch(init.signal.reason), { once: true })
  })
  return {
    fetchImpl,
    release(response = { ok: true }) { resolve(response) },
    get signal() { return signal },
  }
}

/** Models only the monotonic timer and install/pause semantics exercised by the extracted owners. */
function virtualClock() {
  let now = 0
  let nextId = 1
  let paused = false
  const timers = new Map()
  const fireDue = () => {
    for (const [id, timer] of [...timers].sort((left, right) => left[1].at - right[1].at)) {
      if (timer.at > now) continue
      timers.delete(id)
      timer.callback()
    }
  }
  const advance = (milliseconds) => {
    now += milliseconds
    fireDue()
  }
  const clock = {
    clearTimeout(id) { timers.delete(id) },
    setTimeout(callback, delay) {
      const id = nextId++
      timers.set(id, { at: now + delay, callback })
      return id
    },
    advance,
    observeWallTime(milliseconds) {
      if (!paused) advance(milliseconds)
    },
    page: {
      clock: {
        async install({ time } = {}) {
          if (time) now = time.valueOf()
          paused = false
        },
        async pauseAt(time) {
          const target = time.valueOf()
          if (target < now) throw new Error("Cannot pause in the past")
          advance(target - now)
          paused = true
        },
      },
    },
    now: () => now,
  }
  return clock
}

test("clock-driven Anatomime cases use only the fixed paused request owner", () => {
  assert.doesNotMatch(browserSpecSource, /pauseClockAtCurrentTime|Date\.now\(\) \+ 500/)
  assert.equal(browserSpecSource.match(/await installPausedClock\(page\)/g)?.length, 16)
  assert.equal(browserSpecSource.match(/await page\.clock\.install/g)?.length, 1)

  assertClockOwnerOrder(browserSpecSource)
  assertClockOwnerOrder(browserSpecSource.replace(/\n/g, "\r\n"))

  const lateOwnerMutation = browserSpecSource.replace(
    "await installPausedClock(page)\n  await installPlayerRuntime(page)",
    "await installPlayerRuntime(page)\n  await page.goto(`/anatomime/play/${ROOM_CODE}`, { waitUntil: \"domcontentloaded\" })\n  await installPausedClock(page)",
  )
  assert.notEqual(lateOwnerMutation, browserSpecSource, "negative control must mutate the selected test body")
  assert.throws(() => assertClockOwnerOrder(lateOwnerMutation), /player\/join clock must freeze before navigation-owned requests/)

  const hostBoundary = [
    'await page.goto("/anatomime", { waitUntil: "domcontentloaded" })',
    '  await page.getByRole("button", { name: /Choose Anatomy Terms/i }).click()',
    '  await expect(page.getByRole("button", { name: /Create Shared Game/i })).toBeVisible()',
    "  await installPausedClock(page)",
  ].join("\n")
  const earlyHostFreezeMutation = browserSpecSource.replace(hostBoundary, [
    'await page.goto("/anatomime", { waitUntil: "domcontentloaded" })',
    "  await installPausedClock(page)",
    '  await page.getByRole("button", { name: /Choose Anatomy Terms/i }).click()',
    '  await expect(page.getByRole("button", { name: /Create Shared Game/i })).toBeVisible()',
  ].join("\n"))
  assert.notEqual(earlyHostFreezeMutation, browserSpecSource, "early-host negative control must move the owner")
  assert.throws(
    () => assertClockOwnerOrder(earlyHostFreezeMutation),
    /host\/create clock must freeze after visible Create readiness and before create/,
  )

  const missingReadinessMutation = browserSpecSource.replace(
    '  await expect(page.getByRole("button", { name: /Create Shared Game/i })).toBeVisible()\n',
    "",
  )
  assert.notEqual(missingReadinessMutation, browserSpecSource, "missing-readiness negative control must remove the assertion")
  assert.throws(
    () => assertClockOwnerOrder(missingReadinessMutation),
    /host\/create clock must freeze after visible Create readiness and before create/,
  )
})

test("the actual fixed clock owner preserves a slow valid response without consuming its deadline", async () => {
  const clock = virtualClock()
  const { installPausedClock, runWithFetchDeadline } = compileContract(clock)
  await installPausedClock(clock.page)
  const origin = clock.now()
  const transport = controlledFetch()
  const request = runWithFetchDeadline("/room", {}, 1_500, (response) => response, transport.fetchImpl)

  clock.observeWallTime(1_100)
  assert.equal(clock.now(), origin)
  transport.release({ ok: true, marker: "ACTIVE_TERM" })
  assert.equal((await request).marker, "ACTIVE_TERM")
})

test("the actual fetch deadline still aborts at the real 1500ms boundary", async () => {
  const clock = virtualClock()
  const { installPausedClock, runWithFetchDeadline } = compileContract(clock)
  await installPausedClock(clock.page)
  const transport = controlledFetch()
  const request = runWithFetchDeadline("/room", {}, 1_500, (response) => response, transport.fetchImpl)

  clock.advance(1_499)
  assert.equal(transport.signal.aborted, false)
  clock.advance(1)
  await assert.rejects(request, (error) => error?.name === "TimeoutError")
})

test("late pause ordering reproduces deadline consumption and is rejected by the source contract", async () => {
  const clock = virtualClock()
  const { runWithFetchDeadline } = compileContract(clock)
  await clock.page.clock.install({ time: new Date("2026-09-20T12:00:00.000Z") })
  const transport = controlledFetch()
  const request = runWithFetchDeadline("/room", {}, 1_500, (response) => response, transport.fetchImpl)

  clock.observeWallTime(1_100)
  await clock.page.clock.pauseAt(new Date(clock.now() + 500))
  await assert.rejects(request, (error) => error?.name === "TimeoutError")
})
