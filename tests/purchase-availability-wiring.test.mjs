import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import { it } from "node:test"
import ts from "typescript"
import { createCompiledModuleLoader, createElement, elementText, findElement, findElements, passThroughElement, renderFunctionComponents } from "./helpers/compiled-module.mjs"

const load = createCompiledModuleLoader(import.meta.url)
const Div = passThroughElement("div")
const react = {
  useEffect() {}, useLayoutEffect() {},
  useState: (value) => [value, () => {}],
  useRef: (current) => ({ current }),
  useMemo: (fn) => fn(), useCallback: (fn) => fn,
  useReducer: (_reducer, value) => [value, () => {}],
  createContext: () => ({ Provider: Div }),
}
/** Replaces unrelated shell dependencies; the selected producer and consumers execute unchanged. */
async function moduleAt(file, overrides = {}) {
  const source = await readFile(new URL(`../${file}`, import.meta.url), "utf8")
  const ast = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)
  const deps = {}
  for (const node of ast.statements) {
    if (!ts.isImportDeclaration(node)) continue
    const named = { __esModule: true, default: Div }
    for (const binding of node.importClause?.namedBindings?.elements ?? []) named[binding.propertyName?.text ?? binding.name.text] = Div
    deps[node.moduleSpecifier.text] = named
  }
  return load(source, file, {
    ...deps, react, "react/jsx-runtime": { jsx: createElement, jsxs: createElement, Fragment: "fragment" },
    ...overrides,
  })
}

it("executes RootLayout → LayoutWrapper → provider for both guest and account availability", async () => {
  for (const ownerKey of [null, "account-a"]) for (const ready of [false, true]) {
    let readinessCalls = 0
    const provider = await moduleAt("components/backgrounds/BackgroundCommerceProvider.tsx", {
      "@/lib/background-commerce-client.js": { EMPTY_BACKGROUND_COMMERCE_STATE: {}, normalizeBackgroundCommerceSnapshot: (value) => value },
      "@/lib/guest-background-cart": { createGuestBackgroundCommerceSnapshot: () => ({ cart: { items: [] } }) },
    })
    const wrapper = await moduleAt("components/layout-wrapper.tsx", {
      "@/components/backgrounds/BackgroundCommerceProvider": provider,
      "@/components/providers/settings-provider": { useSettings: () => ({ settings: {} }) },
      "@/components/providers/account-shell-bootstrap-provider": { useAccountShellBootstrap: () => ({ ownerKey }) },
      "next/navigation": { usePathname: () => "/clock" },
    })
    const root = await moduleAt("app/layout.tsx", {
      "@/components/layout-wrapper": wrapper,
      "@/components/sidebar/sidebar": { getAppSidebarData: async () => ({ user: null, navigation: {}, accountBootstrap: { ownerKey } }) },
      "@/lib/commerce/catalog": { getBackgroundCommercePurchaseReadiness: () => { readinessCalls += 1; return { ready, tax: { private: "never-project" } } } },
      "@/lib/seo": { createPublicPageMetadata: () => ({}), createSeoJsonLd: () => ({}) },
      "@/lib/public-product-identity": { PUBLIC_PRODUCT_IDENTITY: { name: "AtmoShaper" } },
      "next/font/google": { Inter: () => ({ className: "font" }) },
    })
    const rootTree = await root.default({ children: "content" })
    const projectedWrapper = findElement(rootTree, (node) => node.type === wrapper.LayoutWrapper)
    assert.equal(projectedWrapper.props.backgroundPurchasesAvailable, ready)
    const wrapperTree = wrapper.LayoutWrapper(projectedWrapper.props)
    const projectedProvider = findElement(wrapperTree, (node) => node.type === provider.BackgroundCommerceProvider)
    assert.equal(projectedProvider.props.backgroundPurchasesAvailable, ready)
    const ownerProvider = provider.BackgroundCommerceProvider(projectedProvider.props)
    const context = ownerProvider.type(ownerProvider.props).props.value
    assert.equal(context.backgroundPurchasesAvailable, ready)
    assert.equal(context.signedIn, Boolean(ownerKey))
    assert.equal(readinessCalls, 1)
    assert.doesNotMatch(JSON.stringify(projectedWrapper.props), /never-project|"tax"/)
    if (!ready) await assert.rejects(context.startCheckout({}), /Background purchases are temporarily unavailable\./)
  }
})

async function surface(file, context) {
  return moduleAt(file, {
    "@/components/backgrounds/BackgroundCommerceProvider": { useBackgroundCommerce: () => context },
    "@/components/ui/button": { Button: passThroughElement("button") },
    "next/link": { __esModule: true, default: passThroughElement("a") },
    "next/navigation": { usePathname: () => "/clock", useSearchParams: () => new URLSearchParams() },
    "@/lib/background-commerce-client.js": { buildBackgroundCartAuthReturnPath: () => "/clock", formatCommerceAmount: () => "$1" },
    "@/lib/public-product-identity": { PUBLIC_PRODUCT_IDENTITY: { name: "AtmoShaper" } },
  })
}
const state = { status: "ready", snapshot: { creditBalance: 2, ownerships: [], cart: { items: [{ productKey: "one", displayName: "One" }], notices: [], reservedOrder: null } } }

for (const signedIn of [false, true]) {
  it(`keeps ${signedIn ? "account" : "guest"} tray guidance neutral and Unlock usable`, async () => {
    let unlocks = 0
    let selections = 0
    const { BackgroundCarouselControlTray } = await moduleAt("components/backgrounds/background-carousel-control-tray.tsx", {
      react: { ...react, useId: () => "tray-guidance" },
      "@/components/ui/button": { Button: passThroughElement("button") },
      // Keep decorative/data dependencies inert while rendering the real tray and action handler.
      "@/lib/background-catalog": { getBackgroundVisualTags: () => [] },
      "@/lib/background-carousel-access-label.js": { backgroundCarouselAccessLabel: () => "Locked" },
      "@/lib/background-commerce-client.js": { hasActivePermanentOwnership: () => false },
    })
    const tree = renderFunctionComponents(BackgroundCarouselControlTray({
      option: { id: "two", label: "Two", visualDescriptor: "Two background" },
      commerceState: { state: "locked", canSelect: false, ownershipSource: null },
      signedIn, selected: false, saved: false, previewPreferenceEnabled: false,
      reducedMotion: false, canGoPrevious: false, canGoNext: false,
      onPrevious() {}, onNext() {}, onToggleSaved() {}, onPreviewPreferenceChange() {},
      onLockedSelect: () => { unlocks += 1 }, onSelect: () => { selections += 1 },
    }))
    const hint = signedIn
      ? "Review account credits, permanent access, or membership options."
      : "Review access options, or sign in to use account credits."
    const unlock = findElement(tree, (node) => node.type === "button" && node.props["aria-label"] === "Unlock Two background")
    assert.equal(unlock.props.title, hint)
    const description = findElement(tree, (node) => node.type === "span" && node.props.id === unlock.props["aria-describedby"])
    assert.equal(elementText(description), hint)
    assert.doesNotMatch(elementText(tree), /buy for \$1|Add this background now/i)
    assert.equal(unlock.props.disabled, false)
    unlock.props.onClick()
    assert.equal(unlocks, 1)
    assert.equal(selections, 0)
  })
}

it("disables only acquisition Buy, retaining credits and membership without zero-credit purchase advice", async () => {
  for (const available of [false, undefined, "true", true]) {
    let adds = 0
    const context = { state, signedIn: true, backgroundPurchasesAvailable: available, addToCart: async () => { adds += 1 } }
    const { BackgroundAcquisitionDialog } = await surface("components/backgrounds/BackgroundAcquisitionDialog.tsx", context)
    const props = { background: { id: "two", label: "Two" }, mode: "locked", open: true, onOpenChange() {}, onAcquired() {} }
    const tree = renderFunctionComponents(BackgroundAcquisitionDialog(props))
    const buy = findElement(tree, (node) => node.type === "button" && elementText(node) === "Buy for $1")
    const credit = findElement(tree, (node) => node.type === "button" && elementText(node) === "Use free credit")
    assert.equal(buy.props.disabled, available !== true)
    assert.equal(credit.props.disabled, false)
    if (available !== true) assert.match(buy.props.className, /disabled:pointer-events-auto disabled:cursor-not-allowed/)
    assert.ok(findElement(tree, (node) => node.type === "a" && elementText(node) === "Unlock all").props.href)
    if (available !== true) { buy.props.onClick(); assert.equal(adds, 0) }
    else { buy.props.onClick(); assert.equal(adds, 1) }
    context.state = { ...state, snapshot: { ...state.snapshot, creditBalance: 0 } }
    const zero = renderFunctionComponents(BackgroundAcquisitionDialog(props))
    if (available !== true) assert.doesNotMatch(elementText(zero), /You have 0 credits\. (?:Buy|Purchase)/)
  }
})

it("keeps unavailable cart removal and reservation cancellation while guest checkout anchors are inactive", async () => {
  for (const signedIn of [false, true]) for (const reserved of [false, true]) for (const available of [false, true]) {
    let removes = 0; let cancels = 0
    const context = { signedIn, backgroundPurchasesAvailable: available, state: { ...state, snapshot: { ...state.snapshot, cart: { ...state.snapshot.cart, reservedOrder: reserved ? { orderId: "reserved", expiresAt: "2026-10-26T12:00:00Z" } : null } } }, removeFromCart: async () => { removes += 1 }, cancelReservation: async () => { cancels += 1 } }
    const { BackgroundCommerceCart } = await surface("components/backgrounds/BackgroundCommerceCart.tsx", context)
    const tree = renderFunctionComponents(BackgroundCommerceCart({ variant: "compact" }))
    const anchors = findElements(tree, (node) => node.type === "a" && /checkout|Create account/i.test(elementText(node)))
    assert.equal(anchors.length, available && !signedIn && !reserved ? 2 : 0)
    if (anchors.length) {
      assert.match(anchors[0].props.href, /^\/login\?callbackUrl=/)
      assert.match(anchors[1].props.href, /^\/register\?callbackUrl=/)
    }
    if (!available) assert.match(elementText(tree), /Background purchases are temporarily unavailable\./)
    const checkout = findElements(tree, (node) => node.type === "button" && /checkout|Create account/i.test(elementText(node)))
    if (!available) {
      assert.ok(checkout.length > 0)
      assert.ok(checkout.every((node) => node.props.disabled === true))
    } else {
      assert.ok(checkout.every((node) => !node.props.disabled))
    }
    const remove = findElement(tree, (node) => node.type === "button" && /Remove/.test(elementText(node)))
    assert.equal(remove.props.disabled, reserved)
    if (!reserved) { remove.props.onClick(); assert.equal(removes, 1) }
    if (reserved) { const cancel = findElement(tree, (node) => node.type === "button" && elementText(node) === "Cancel reservation"); assert.equal(cancel.props.disabled, false); cancel.props.onClick(); assert.equal(cancels, 1) }
  }
})
