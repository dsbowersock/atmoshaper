import fs from "node:fs"
import path from "node:path"
import React from "react"
import { renderToStaticMarkup } from "react-dom/server"
import ts from "typescript"
import { createCompiledModuleLoader } from "../helpers/compiled-module.mjs"

const root = path.resolve(import.meta.dirname, "../..")
const load = createCompiledModuleLoader(import.meta.url)
const source = (relative) => fs.readFileSync(path.join(root, relative), "utf8")
const childrenOnly = ({ children }) => React.createElement(React.Fragment, null, children)
const seo = { createPublicPageMetadata: () => ({}), createSeoJsonLd: () => ({}) }

/** Isolates the real SidebarInset declaration; unrelated sidebar controls do not own this assertion. */
function loadSidebarInset() {
  const filename = "components/ui/sidebar.tsx"
  const text = source(filename)
  const ast = ts.createSourceFile(filename, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)
  const statement = ast.statements.find((node) => ts.isVariableStatement(node)
    && node.declarationList.declarations.some((declaration) => declaration.name.getText(ast) === "SidebarInset"))
  if (!statement) throw new Error("The shared SidebarInset declaration is missing")
  const compiledSource = `import * as React from "react"; const cn = (...values) => values.filter(Boolean).join(" ");\n${statement.getText(ast)}\nexport { SidebarInset };`
  return load(compiledSource, filename).SidebarInset
}

/** Keeps the actual root/shell/route JSX; auth, media and provider dependencies stay inert. */
export async function renderLandmarkDocument(kind) {
  const dependencies = {
    "next/font/google": { Inter: () => ({ className: "local-font-fixture" }) },
    "@/components/sidebar/sidebar": { getAppSidebarData: async () => ({
      user: {}, navigation: {}, accountBootstrap: { ownerKey: null, hasPracticeMembership: false },
    }) },
    "@/components/sidebar/app-sidebar-client": { AppSidebarClient: () => React.createElement("aside") },
    "@/components/sidebar/sidebar-calendar-provider": { SidebarCalendarProvider: childrenOnly },
    "@/components/providers/account-shell-bootstrap-provider": { AccountShellBootstrapProvider: childrenOnly },
    "@/components/providers/settings-provider": { SettingsProvider: childrenOnly },
    "@/components/providers/service-worker-provider": { ServiceWorkerProvider: () => null },
    "@/components/providers/pwa-install-provider": { PwaInstallProvider: childrenOnly },
    "@/components/providers/therapist-settings-provider": { TherapistSettingsProvider: childrenOnly },
    "@/components/providers/music-provider": { MusicProvider: childrenOnly },
    "@/components/layout-wrapper": { LayoutWrapper: childrenOnly },
    "@/components/ui/sidebar": { SidebarInset: loadSidebarInset(), SidebarProvider: childrenOnly },
    "@/lib/seo": seo,
    "@/lib/public-product-identity": { PUBLIC_PRODUCT_IDENTITY: { name: "AtmoShaper" } },
    "./globals.css": {},
  }
  const RootLayout = load(source("app/layout.tsx"), "app/layout.tsx", dependencies).default
  let child = React.createElement("section", null, "Invented local content")
  if (kind === "chimer" || kind === "preview") {
    const ChimerLayout = load(source("app/chimer/layout.tsx"), "app/chimer/layout.tsx", {
      "@/lib/seo": seo,
    }).default
    if (kind === "preview") {
      const { ChimerBackgroundPreviewScene } = load(source("app/chimer/background-preview/[backgroundId]/preview-scene.tsx"), "preview-scene.tsx", {
        "@/components/backgrounds/BackgroundHost": { BackgroundHost: () => React.createElement("div") },
        "@/lib/chimer-timer": { DEFAULT_CHIMER_SETTINGS: { massageLabGridMotionMantras: [] } },
        "@/lib/dna-twisted-cubes-background-host": { resolveDnaTwistedCubesBackgroundHostProps: () => ({}) },
        "@/lib/membership": { FEATURE_KEYS: { premiumBackgrounds: "premium_backgrounds" } },
        "./preview-scene.module.css": { scene: "scene", label: "label", frame: "frame", background: "background" },
      })
      child = React.createElement(ChimerBackgroundPreviewScene, { backgroundId: "massage-lab-aurora", label: "Invented preview" })
    }
    child = React.createElement(ChimerLayout, null, child)
  }
  if (kind === "account-link") {
    const Page = load(source("app/account/link-google/page.tsx"), "link-google-page.tsx", {
      "next/headers": { cookies: async () => ({ get: () => undefined }) },
      "./link-google-form": { LinkGoogleForm: () => React.createElement("p", null, "Invented invalid intent") },
      "@/lib/auth-env": { getAuthSecret: () => "invented-local-fixture" },
      "@/lib/auth-method-intents": { AUTH_METHOD_INTENT_COOKIE: "invented-cookie", resolveBoundAuthMethodIntent: async () => false },
      "@/lib/prisma": { prisma: {} },
    }).default
    child = await Page()
  }
  return renderToStaticMarkup(await RootLayout({ children: child }))
}

/** Scans literal route landmarks; global-error owns a standalone document outside the ordinary shell. */
export function findCompetingRouteMainLandmarks() {
  const findings = []
  /** Walks application sources while exempting the global error page's standalone document. */
  function visitDirectory(directory) {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const file = path.join(directory, entry.name)
      if (entry.isDirectory()) visitDirectory(file)
      else if (/\.[jt]sx?$/.test(entry.name)) {
        const relative = path.relative(root, file).replaceAll("\\", "/")
        if (relative === "app/global-error.tsx") continue
        const text = fs.readFileSync(file, "utf8")
        const ast = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true,
          entry.name.endsWith("x") ? ts.ScriptKind.TSX : ts.ScriptKind.TS)
        /** Collects literal JSX landmarks; browser cases separately check actual rendered semantics. */
        function visit(node) {
          if (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) {
            const main = node.tagName.getText(ast) === "main"
              || node.attributes.properties.some((attribute) => ts.isJsxAttribute(attribute)
                && attribute.name.getText(ast) === "role" && attribute.initializer
                && ts.isStringLiteral(attribute.initializer) && attribute.initializer.text === "main")
            if (main) findings.push(relative)
          }
          ts.forEachChild(node, visit)
        }
        visit(ast)
      }
    }
  }
  visitDirectory(path.join(root, "app"))
  return findings.sort()
}
