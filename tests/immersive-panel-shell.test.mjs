import assert from "node:assert/strict"
import ts from "typescript"
import { readFile } from "node:fs/promises"
import test from "node:test"

const read = async (path) => {
  try {
    return await readFile(new URL(`../${path}`, import.meta.url), "utf8")
  } catch {
    return ""
  }
}

const shellSource = await read("app/chimer/immersive-panel-shell.tsx")
const shellStyles = await read("app/chimer/immersive-panel-shell.module.css")
const layoutSource = await read("app/chimer/immersive-panel-layout.js")
const runningTimerSource = await read("app/chimer/running-timer.tsx")
const runningTimerStyles = await read("app/chimer/running-timer.module.css")
const chimerControlStyles = await read("components/chimer-controls/chimer-controls.module.css")
const planSource = await read("docs/superpowers/plans/2026-07-18-clock-chimer-music-visualizer.md")
const specSource = await read("docs/superpowers/specs/2026-07-18-clock-chimer-music-visualizer-design.md")

function getPanelContentSource(startProp, endProp) {
  const start = runningTimerSource.indexOf(`${startProp}={`)
  const end = runningTimerSource.indexOf(`${endProp}={`)
  assert.ok(start >= 0 && end > start)
  return runningTimerSource.slice(start, end)
}

/**
 * Read the actual display guards/marker expressions without importing the
 * application's hooks, account owners or media. The deliberately small AST
 * evaluator rejects calls and unknown syntax rather than executing source.
 */
function productionDisplayWiring(source) {
  const ast = ts.createSourceFile("running-timer.tsx", source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)
  const declarations = new Map()
  const displays = new Map()
  const wanted = new Set(["isClockMode", "shouldRenderTimerDisplay", "isTimerPrimary", "isCurrentTimePrimary"])
  const visit = (node) => {
    if (ts.isVariableDeclaration(node) && wanted.has(node.name.getText(ast))) {
      const name = node.name.getText(ast)
      assert.equal(declarations.has(name), false, `Expected one production owner for ${name}`)
      declarations.set(name, node.initializer)
    }
    if (ts.isJsxElement(node) && node.openingElement.tagName.getText(ast) === "button") {
      const attributes = node.openingElement.attributes.properties
      const attribute = (name) => attributes.find((item) => ts.isJsxAttribute(item) && item.name.text === name)?.initializer
      const id = attribute("data-testid")
      const kind = ts.isStringLiteral(id ?? {}) ? { "running-timer-clock": "timer", "running-current-time": "clock" }[id.text] : null
      if (kind) {
        assert.equal(displays.has(kind), false)
        let wrapper = node.parent
        while (wrapper && !ts.isJsxExpression(wrapper)) wrapper = wrapper.parent
        const guard = wrapper?.expression
        const condition = ts.isBinaryExpression(guard ?? {}) && guard.operatorToken.kind === ts.SyntaxKind.AmpersandAmpersandToken
          ? guard.left : ts.isConditionalExpression(guard ?? {}) ? guard.condition : null
        assert.ok(condition, `Expected a conditional production ${kind} display`)
        const marker = (name) => {
          const value = attribute(name)
          assert.ok(ts.isJsxExpression(value ?? {}) && value.expression, `Expected production ${name}`)
          return value.expression
        }
        displays.set(kind, { condition, primary: marker("data-immersive-primary-display"), secondary: marker("data-immersive-secondary-display") })
      }
    }
    ts.forEachChild(node, visit)
  }
  visit(ast)
  assert.equal(declarations.size, wanted.size)
  assert.equal(displays.size, 2)
  const evaluate = (node, values) => {
    if (ts.isParenthesizedExpression(node)) return evaluate(node.expression, values)
    if (ts.isStringLiteral(node)) return node.text
    if (ts.isIdentifier(node)) {
      if (node.text === "undefined") return undefined
      if (Object.hasOwn(values, node.text)) return values[node.text]
      assert.ok(declarations.has(node.text), `Unexpected production identifier ${node.text}`)
      return evaluate(declarations.get(node.text), values)
    }
    if (ts.isPropertyAccessExpression(node)) {
      assert.equal(node.expression.getText(ast), "mode")
      assert.ok(["context", "showClock"].includes(node.name.text))
      return values.mode[node.name.text]
    }
    if (ts.isPrefixUnaryExpression(node) && node.operator === ts.SyntaxKind.ExclamationToken) return !evaluate(node.operand, values)
    if (ts.isConditionalExpression(node)) return evaluate(evaluate(node.condition, values) ? node.whenTrue : node.whenFalse, values)
    if (ts.isBinaryExpression(node)) {
      const left = evaluate(node.left, values)
      if (node.operatorToken.kind === ts.SyntaxKind.EqualsEqualsEqualsToken) return left === evaluate(node.right, values)
      if (node.operatorToken.kind === ts.SyntaxKind.AmpersandAmpersandToken) return left && evaluate(node.right, values)
      if (node.operatorToken.kind === ts.SyntaxKind.BarBarToken) return left || evaluate(node.right, values)
    }
    assert.fail(`Unsupported display-wiring syntax ${ts.SyntaxKind[node.kind]}`)
  }
  return (values) => [...displays].filter(([, display]) => evaluate(display.condition, values)).map(([kind, display]) => ({
    kind, primary: evaluate(display.primary, values) === "true", secondary: evaluate(display.secondary, values) === "true",
  }))
}

test("production display markers swap timer/clock roles and pure Clock never renders an accessory", () => {
  const wiring = productionDisplayWiring(runningTimerSource)
  const primaryTimer = { kind: "timer", primary: true, secondary: false }
  const secondaryTimer = { kind: "timer", primary: false, secondary: true }
  const primaryClock = { kind: "clock", primary: true, secondary: false }
  const secondaryClock = { kind: "clock", primary: false, secondary: true }
  assert.deepEqual(wiring({ status: "running", primaryDisplay: "timer", mode: { context: "chimer", showClock: true } }), [primaryTimer, secondaryClock])
  assert.deepEqual(wiring({ status: "paused", primaryDisplay: "currentTime", mode: { context: "chimer", showClock: true } }), [secondaryTimer, primaryClock])
  assert.deepEqual(wiring({ status: "complete", primaryDisplay: "timer", mode: { context: "chimer", showClock: false } }), [primaryTimer])
  for (const context of ["chimer", "clock", "musicVisualizer"]) {
    for (const primaryDisplay of ["timer", "currentTime"]) {
      assert.deepEqual(wiring({ status: "clock", primaryDisplay, mode: { context, showClock: true } }), [primaryClock])
      assert.deepEqual(wiring({ status: "clock", primaryDisplay, mode: { context, showClock: false } }), [])
    }
  }
})

test("the production wiring projection detects guard and marker regressions independently of the fixture", () => {
  const input = { status: "clock", primaryDisplay: "currentTime", mode: { context: "chimer", showClock: true } }
  const expected = [{ kind: "clock", primary: true, secondary: false }]
  const mutations = [
    ['mode.context === "chimer" && !isClockMode', 'mode.context === "chimer"'],
    ['data-immersive-primary-display={isCurrentTimePrimary ? "true" : undefined}', 'data-immersive-primary-display={!isCurrentTimePrimary ? "true" : undefined}'],
  ]
  for (const [before, after] of mutations) {
    assert.ok(runningTimerSource.includes(before))
    assert.throws(() => assert.deepEqual(productionDisplayWiring(runningTimerSource.replace(before, after))(input), expected), { name: "AssertionError" })
  }
  const timerInput = { status: "running", primaryDisplay: "timer", mode: { context: "chimer", showClock: true } }
  const reversed = runningTimerSource.replace('data-immersive-secondary-display={!isTimerPrimary ? "true" : undefined}', 'data-immersive-secondary-display={isTimerPrimary ? "true" : undefined}')
  assert.throws(() => assert.deepEqual(productionDisplayWiring(reversed)(timerInput), productionDisplayWiring(runningTimerSource)(timerInput)), { name: "AssertionError" })
})

test("exports the reusable controlled immersive panel contract", () => {
  assert.match(shellSource, /export type ImmersivePanelId = "clock" \| "visual" \| "background" \| null/)
  assert.match(shellSource, /interface ImmersivePanelShellProps \{[\s\S]*activePanel: ImmersivePanelId[\s\S]*onActivePanelChange: \(panel: ImmersivePanelId\) => void[\s\S]*protectedDisplayRef: RefObject<HTMLElement \| null>[\s\S]*clockContent: ReactNode[\s\S]*visualContent: ReactNode[\s\S]*backgroundContent: ReactNode[\s\S]*backgroundHeaderContent\?: ReactNode[\s\S]*backgroundUnavailableMessage\?: string \| null[\s\S]*hapticsEnabled: boolean/)
})

test("renders three accessible grouped panel toggles with responsive tooltips", () => {
  assert.match(shellSource, /role="group"[\s\S]*aria-label="Immersive display controls"/)
  for (const panel of ["clock", "visual", "background"]) {
    assert.match(shellSource, new RegExp(`id: "${panel}"`))
  }
  assert.match(shellSource, /aria-expanded=\{isActive\}/)
  assert.match(shellSource, /aria-controls=\{panelId\}/)
  assert.match(shellSource, /aria-label=\{label\}/)
  assert.match(shellSource, /<TooltipProvider[\s\S]*<Tooltip[\s\S]*<TooltipContent/)
  assert.match(shellSource, /requestActivePanelChange\(isActive \? null : id\)/)
  assert.match(
    shellStyles,
    /\.toolbarLabel\s*\{[\s\S]{0,300}position:\s*absolute[\s\S]{0,300}clip:\s*rect\(0, 0, 0, 0\)/,
  )
})

test("keeps ordinary phone toolbars from clipping controls into a shared box", () => {
  assert.match(
    shellStyles,
    /\.toolbar\[data-toolbar-fits-visual-viewport="true"\]\s*\{\s*overflow:\s*visible;/,
  )
  assert.match(shellSource, /toolbar\.scrollWidth <= toolbar\.clientWidth \+ 1/)
  assert.match(shellSource, /data-toolbar-fits-visual-viewport=\{toolbarFitsVisualViewport\}/)
  assert.match(shellSource, /new MutationObserver\(measureToolbarFit\)/)
  assert.match(shellSource, /mutationObserver\?\.observe\(toolbar, \{[\s\S]{0,200}attributes: true,[\s\S]{0,200}attributeFilter: \["class", "style"\],[\s\S]{0,200}childList: true,[\s\S]{0,200}characterData: true,[\s\S]{0,200}subtree: true/)
  assert.match(shellSource, /mutationObserver\?\.disconnect\(\)/)
  assert.match(shellSource, /document\.fonts\?\.addEventListener\("loadingdone", measureToolbarFit\)/)
  assert.match(shellSource, /document\.fonts\?\.removeEventListener\("loadingdone", measureToolbarFit\)/)
  assert.doesNotMatch(
    shellStyles,
    /@media \(min-width:\s*36\.0625rem\)\s*\{\s*\.toolbar\s*\{\s*overflow:\s*visible;/,
  )
  assert.match(shellSource, /const measureVisualViewportFrame = \(\) =>/)
  assert.match(shellSource, /return subscribeToViewportChanges\(measureVisualViewportFrame\)/)
  assert.match(shellSource, /visualViewport\?\.addEventListener\("resize", listener\)/)
  assert.match(shellSource, /visualViewport\?\.addEventListener\("scroll", listener\)/)
})

test("keeps Clock and Visual nonmodal with complete dismissal mechanics", () => {
  assert.match(shellSource, /role="dialog"/)
  assert.match(shellSource, /aria-modal="false"/)
  assert.match(shellSource, /event\.key !== "Escape"/)
  assert.match(shellSource, /document\.addEventListener\("pointerdown"/)
  assert.match(shellSource, /target instanceof Element && target\.closest\(CHIMER_CONTROL_PORTAL_SELECTOR\)/)
  assert.match(shellSource, /shouldIgnoreNonmodalEscape\(event\.target\)/)
  assert.match(shellSource, /toolbarButtonRefs\.current\[panelToRestore\]\?\.focus\(\)/)
  assert.match(shellSource, /aria-label=\{`Close \$\{activePanelLabel\} panel`\}/)
})

test("asks the owner before closing or changing Visual only", () => {
  assert.match(
    shellSource,
    /onRequestActivePanelChange\?: \(panel: ImmersivePanelId\) => boolean/,
  )
  assert.match(
    shellSource,
    /activePanel === "visual"[\s\S]*onRequestActivePanelChange\?\.\(nextPanel\) === false/,
  )
  assert.match(shellSource, /requestActivePanelChange\(null/)
  assert.match(shellSource, /requestActivePanelChange\(isActive \? null : id/)
  assert.match(runningTimerSource, /onRequestActivePanelChange=\{handlePanelChangeRequest\}/)
})

test("defers Visual dock pointer and Escape dismissal while its owner has a modal intent", () => {
  assert.match(shellSource, /modalInterlockActive\?: boolean/)
  assert.match(shellSource, /if \(!nonmodalPanel \|\| modalInterlockActive\) \{\s*return\s*\}/)
  assert.match(runningTimerSource, /modalInterlockActive=\{Boolean\(pendingVisualIntent\)\}/)
})

test("Background picker unmounts only the live renderer it fully covers", () => {
  assert.match(
    runningTimerSource,
    /const shouldSuspendCoveredLiveBackground = activePanel === "background"/,
  )
  assert.match(
    runningTimerSource,
    /shouldRenderLiveBackground && !shouldSuspendCoveredLiveBackground && \(\s*<BackgroundHost/,
  )
  assert.match(
    runningTimerSource,
    /key=\{`\$\{mode\.context\}:\$\{backgroundId\}`\}/,
  )
  assert.match(runningTimerSource, /active=\{activePanel === "background"\}/)
})

test("uses a full-screen Radix modal for Background with default outside dismissal", () => {
  assert.match(shellSource, /@radix-ui\/react-dialog/)
  assert.match(shellSource, /data-immersive-panel="background"/)
  assert.doesNotMatch(shellSource, /onPointerDownOutside=\{\(event\) => event\.preventDefault\(\)\}/)
  assert.doesNotMatch(shellSource, /onInteractOutside=\{\(event\) => event\.preventDefault\(\)\}/)
  assert.match(shellSource, /onCloseAutoFocus=\{handleBackgroundCloseAutoFocus\}/)
  assert.match(shellSource, /<DialogPrimitive\.Title className=\{styles\.backgroundHeaderTitle\}>Background<\/DialogPrimitive\.Title>[\s\S]*\{backgroundHeaderContent\}[\s\S]*aria-label="Close Background panel"/)
  assert.doesNotMatch(shellSource, /<span>Close<\/span>/)
  assert.match(shellStyles, /--immersive-global-chrome-z:\s*10030/)
  assert.match(shellStyles, /\.backgroundOverlay[\s\S]*position:\s*fixed[\s\S]*inset:\s*0[\s\S]*z-index:\s*var\(--immersive-global-chrome-z\)/)
  assert.match(shellStyles, /\.backgroundPanel[\s\S]*position:\s*fixed[\s\S]*inset:\s*0/)
})

test("measures a stable protected display and dock with bottom-first placement", () => {
  assert.match(shellSource, /import \{ calculateDockPlacement, toVisualViewportBounds \} from "\.\/immersive-panel-layout\.js"/)
  assert.match(shellSource, /function getStableVerticalBounds/)
  assert.doesNotMatch(shellSource, /currentProtectedDisplay\.getBoundingClientRect\(\)/)
  assert.match(layoutSource, /const bottomSpace =[\s\S]*if \(bottomSpace >= requestedPanelPx \+ SAFE_STAGE_GAP_PX \+ normalizedBottomInset\)/)
  assert.match(layoutSource, /const topSpace =[\s\S]*if \(topSpace >= requestedPanelPx \+ SAFE_STAGE_GAP_PX \+ normalizedTopInset\)/)
  assert.equal((shellSource.match(/new ResizeObserver/g) ?? []).length, 3)
  assert.match(shellSource, /resizeObserver\?\.observe\(toolbar\)/)
  assert.match(shellSource, /resizeObserver\?\.observe\(protectedDisplay\)/)
  assert.match(shellSource, /resizeObserver\?\.observe\(dock\)/)
  assert.match(shellSource, /const unsubscribeFromViewportChanges = subscribeToViewportChanges\(measure\)/)
  assert.match(shellSource, /unsubscribeFromViewportChanges\(\)/)
  assert.match(shellSource, /toVisualViewportBounds/)
  assert.match(shellSource, /visualViewportOffsetTop:\s*visualViewport\?\.offsetTop/)
  assert.match(shellSource, /topInset:\s*dockInsets\.top/)
  assert.match(shellSource, /bottomInset:\s*dockInsets\.bottom/)
  assert.match(shellSource, /--immersive-reserved-top/)
  assert.match(shellSource, /--immersive-reserved-bottom/)
  assert.match(shellSource, /--immersive-panel-max-height/)
  assert.match(runningTimerSource, /data-immersive-stage/)
  assert.match(runningTimerSource, /data-protected-display/)
  assert.match(shellSource, /data-immersive-dock=\{placement\.edge\}/)
  assert.match(shellSource, /data-immersive-inset-probe/)
  assert.doesNotMatch(shellStyles, /max-height:\s*max\(8rem,\s*var\(--immersive-panel-max-height\)\)/)
  assert.match(shellStyles, /@media \(max-width: 36rem\)[\s\S]*\.dock \{[\s\S]*width:\s*auto/)
})

test("caps Visual vertically and gives both panels an opposite-sidebar side sheet only at 16:9", () => {
  assert.match(shellSource, /const SIDE_SHEET_MIN_ASPECT_RATIO = 16 \/ 9/)
  assert.match(
    shellSource,
    /\(visualViewportFrame\.width \/ visualViewportFrame\.height\) >= SIDE_SHEET_MIN_ASPECT_RATIO/,
  )
  assert.match(shellSource, /data-immersive-layout=\{nonmodalPanelUsesSideSheet \? "side" : "dock"\}/)
  assert.match(shellSource, /--immersive-visual-viewport-half-width/)
  assert.match(shellSource, /--immersive-visual-viewport-half-height/)
  assert.match(
    shellStyles,
    /\.dock\[data-immersive-panel="visual"\]\s*\{[\s\S]{0,300}var\(--immersive-visual-viewport-half-height,\s*50dvh\)/,
  )
  assert.match(
    shellStyles,
    /\.dock\[data-immersive-layout="side"\]\s*\{[\s\S]{0,700}width:\s*min\(36rem,\s*var\(--immersive-visual-viewport-half-width,\s*50vw\)\)/,
  )
  assert.match(
    shellStyles,
    /html\[data-sidebar-position="right"\][\s\S]{0,180}\.dock\[data-immersive-layout="side"\][\s\S]{0,220}right:\s*auto;[\s\S]{0,220}left:\s*calc\(/,
  )
  assert.match(
    shellSource,
    /closeClockSideSheetBeforeCenterControls\s*=\s*nonmodalPanel === "clock" && nonmodalPanelUsesSideSheet/,
  )
  assert.match(
    shellSource,
    /\{closeClockSideSheetBeforeCenterControls \? dockHeaderCloseControl : null\}[\s\S]{0,220}dockHeaderCenterAction[\s\S]{0,220}\{!closeClockSideSheetBeforeCenterControls \? dockHeaderCloseControl : null\}/,
  )
  assert.match(shellSource, /--immersive-reserved-right/)
  assert.match(shellSource, /--immersive-reserved-left/)
  assert.match(
    shellSource,
    /panelHeight:\s*nonmodalPanel === "visual"[\s\S]{0,80}\?\s*0[\s\S]{0,80}:\s*dock\.scrollHeight/,
  )
  assert.match(shellSource, /attributeFilter:\s*\["data-sidebar-position"\]/)
  assert.match(runningTimerStyles, /right:\s*var\(--immersive-reserved-right\)/)
  assert.match(runningTimerStyles, /left:\s*var\(--immersive-reserved-left\)/)
  assert.match(
    chimerControlStyles,
    /\[data-immersive-panel="visual"\]\[data-immersive-layout="side"\][\s\S]{0,120}\.backgroundPaletteGrid[\s\S]{0,100}repeat\(7,\s*minmax\(0,\s*1fr\)\)/,
  )
  assert.match(
    chimerControlStyles,
    /\.backgroundPaletteHeader\s*\{[\s\S]{0,180}grid-template-areas:\s*"mode intro"/,
  )
})

test("RunningTimer owns one active panel without legacy settings tabs or auto-close", () => {
  assert.match(runningTimerSource, /useState<ImmersivePanelId>\(null\)/)
  assert.match(runningTimerSource, /<ImmersivePanelShell[\s\S]*activePanel=\{activePanel\}[\s\S]*onActivePanelChange=\{handleActivePanelChange\}/)
  assert.doesNotMatch(runningTimerSource, /type SettingsTab/)
  assert.doesNotMatch(runningTimerSource, /<Tabs(?:Content|List|Trigger)?\b/)
  assert.doesNotMatch(runningTimerSource, /settingsButton|SettingsButton|settingsAutoClose|SettingsAutoClose|SETTINGS_AUTO_CLOSE/)
  assert.doesNotMatch(runningTimerStyles, /settingsButton|settingsPanel|settingsTabs|settingsTabList|settingsTabTrigger/)
  assert.match(
    getPanelContentSource("visualContent", "backgroundContent"),
    /label="Keep timer screen awake"/,
  )
  assert.doesNotMatch(
    getPanelContentSource("clockContent", "visualContent"),
    /label="Keep timer screen awake"/,
  )
})

test("tracked docs clarify Background dismissal, selection, and Visual hint behavior", () => {
  for (const source of [planSource, specSource]) {
    assert.doesNotMatch(source, /close only through Close or `Escape`/i)
    assert.doesNotMatch(source, /outside overlay interaction does not close/i)
    assert.match(source, /Selecting an available background[\s\S]{0,300}closes Background/i)
    assert.match(source, /Customize this background in Visual\./)
  }
})

test("wires a non-blocking device-local Visual hint without changing the active-Chimer wake toggle", () => {
  assert.match(runningTimerSource, /readVisualPanelOpened/)
  assert.match(runningTimerSource, /writeVisualPanelOpened/)
  assert.match(runningTimerSource, /VISUAL_CUSTOMIZATION_HINT = "Customize this background in Visual\."/)
  assert.match(runningTimerSource, /visualHintMessage=\{visualHintMessage\}/)
  assert.match(shellSource, /aria-describedby=\{id === "visual" && visualHintMessage \? visualHintId : undefined\}/)
  assert.match(shellSource, /role="status"/)
  assert.match(shellStyles, /@media \(prefers-reduced-motion: reduce\)[\s\S]*\.visualHintActive/)
  assert.match(
    getPanelContentSource("visualContent", "backgroundContent"),
    /!isClockMode[\s\S]*label="Keep timer screen awake"/,
  )
})
