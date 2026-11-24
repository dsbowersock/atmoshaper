import path from "node:path"
import { createRequire } from "node:module"
import { fileURLToPath } from "node:url"
import { createHash } from "node:crypto"
import { readFile, writeFile, copyFile, mkdir, readdir, lstat, realpath, rm } from "node:fs/promises"
import { PUBLIC_PRODUCT_IDENTITY } from "../lib/public-product-identity.js"
import { backgroundRegistry, userCanUseBackground } from "../components/backgrounds/backgroundRegistry.ts"
import { projectClockAppearance } from "../lib/native-clock-appearance-transfer.js"

const require = createRequire(import.meta.url)
export const root = fileURLToPath(new URL("..", import.meta.url))
export const bundleRoot = path.join(root, "output/offline-core")
export const coreRoot = path.join(bundleRoot, "core")

/** This build owns this single generated directory, never browser/user data. */
async function resetOutput(bundleRoot) {
  const target = path.resolve(bundleRoot)
  if (path.dirname(target) !== path.resolve(root, "output") || !["offline-core", "offline-acceptance-core", "offline-acceptance-media", "offline-acceptance-backgrounds", "offline-acceptance-website"].includes(path.basename(target))) throw new Error("Unexpected offline build directory.")
  const existing = await lstat(target).catch(error => { if (error.code !== "ENOENT") throw error })
  if (existing?.isSymbolicLink()) throw new Error("The offline build output cannot be a link.")
  const physicalRoot = await realpath(root)
  const physicalParent = await realpath(path.dirname(target))
  const relativeParent = path.relative(physicalRoot, physicalParent)
  if (relativeParent.startsWith("..") || path.isAbsolute(relativeParent)) throw new Error("Offline output resolves outside this workspace.")
  await rm(target, { recursive: true, force: true })
  await mkdir(path.join(target, "core"), { recursive: true })
}

/** Build actual product components into an app-owned, network-free asset set. */
export async function buildOfflineCore({ testPublicKeysPath = null, outputName = "offline-core", development = false, legacyAcceptance = false } = {}) {
  // Only acceptance can substitute an ephemeral public authority. The normal
  // Android build never supplies this argument and cannot ship a test key.
  if (testPublicKeysPath && path.resolve(testPublicKeysPath) !== path.join(root, "output/offline-acceptance-public-keys.json")) throw new Error("Unexpected receipt acceptance key path.")
  // Acceptance readers get independent trees. Parallel wildcard tests cannot
  // delete each other's assets or replace Android's normal trust configuration.
  if (!["offline-core", "offline-acceptance-core", "offline-acceptance-media", "offline-acceptance-backgrounds", "offline-acceptance-website"].includes(outputName)) throw new Error("Unexpected offline build output.")
  if (testPublicKeysPath && outputName !== "offline-acceptance-backgrounds") throw new Error("Synthetic authority requires isolated acceptance output.")
  if (legacyAcceptance && outputName === "offline-core") throw new Error("The earlier preview is acceptance-only.")
  const bundleRoot = path.join(root, "output", outputName), coreRoot = path.join(bundleRoot, "core")
  await mkdir(path.dirname(bundleRoot), { recursive: true })
  await resetOutput(bundleRoot)
  const { webpack } = require("next/dist/compiled/webpack/webpack")
  const compiler = webpack({
    mode: development ? "development" : "production", target: ["web", "es2020"], devtool: false,
    entry: legacyAcceptance ? { app: path.join(root, "scripts/fixtures/offline-legacy-entry.tsx") } : {
      app: path.join(root, "native/web/index.tsx"),
      "clock-appearance-export": path.join(root, "native/web/clock-appearance-export.js"),
      "timer-export": path.join(root, "native/web/timer-export.js"),
    },
    output: { path: coreRoot, filename: "[name].js", chunkFilename: "chunks/[name].[contenthash:12].js", publicPath: "./" },
    resolve: { alias: {
      "@/native/offline-access-public-keys.json$": testPublicKeysPath ?? path.join(root, "native/offline-access-public-keys.json"),
      ...(legacyAcceptance ? { "@/components/moving-background$": path.join(root,"native/web/offline-moving-background.tsx") } : {}),
      "next/link$": path.join(root, "native/web/platform/link.tsx"),
      "next/image$": path.join(root, "native/web/platform/image.tsx"),
      "next/navigation$": path.join(root, "native/web/platform/navigation.tsx"),
      "next/dynamic$": path.join(root, "native/web/platform/dynamic.tsx"),
      "next-auth/react$": path.join(root, "native/web/platform/auth.ts"),
      "regenerator-runtime/runtime.js$": path.join(root, "lib/atmosphere/regenerator-runtime-shim.js"),
      "tone$": path.join(root, "node_modules/tone/build/esm/index.js"),
      "@": root,
    }, modules: [path.join(root, "node_modules"), "node_modules"], extensions: [".tsx", ".ts", ".js", ".mjs"] },
    module: { rules: [
      { test: /\.m?js$/, resolve: { fullySpecified: false } },
      { scheme: "data", type: "asset/inline" },
      { test: /\.tsx?$/, exclude: /node_modules/, use: [path.join(root, "scripts/loaders/offline-typescript-loader.cjs"), path.join(root, "scripts/loaders/offline-local-assets-loader.cjs")] },
      { test: /\.module\.css$/, use: [path.join(root, "scripts/loaders/offline-style-loader.cjs"), {
        loader: path.join(root, "scripts/loaders/offline-css-loader.cjs"),
        options: { esModule: true, postcss: async () => ({ postcss: require("postcss") }), modules: {
          mode: "local",
          getLocalIdent(context, _template, name) {
            return "ml_" + createHash("sha256").update(path.relative(root, context.resourcePath).replaceAll("\\", "/") + ":" + name).digest("hex").slice(0, 12)
          },
        } },
      }] },
    ] },
    // Vendor production modules remain optimized; avoid Next's private optional
    // minifier path in this standalone compiler. APK compression handles size.
    optimization: { minimize: false, splitChunks: false, runtimeChunk: false },
    performance: { hints: false },
    // No .env values enter the native client. Shared public metadata may read
    // absent optional web bindings; provide an empty compile-time environment.
    plugins: [new webpack.DefinePlugin({ "process.env.NODE_ENV": JSON.stringify("production"), "process.env": "{}" }),
      new webpack.NormalModuleReplacementPlugin(/generative-fm-platform$/, resource => { resource.request = path.join(root, "native/web/platform/generative-fm.ts") }),
      new webpack.NormalModuleReplacementPlugin(/ambient-platform$/, resource => { resource.request = path.join(root, "native/web/platform/ambient.ts") }),
      new webpack.NormalModuleReplacementPlugin(/media-platform$/, resource => { resource.request = path.join(root, "native/web/platform/media.ts") }),
      new webpack.NormalModuleReplacementPlugin(/lib[\\/]planner-export$/, resource => { resource.request = path.join(root, "native/web/platform/planner-export.ts") }),
    ],
  })
  let forbiddenTrace = ""
  const modules = await new Promise((resolve, reject) => compiler.run((error, stats) => {
    let failure = error, sources
    try {
      if (!failure && stats.hasErrors()) failure = new Error(stats.toString({ all: false, errors: true }))
      if (!failure) {
        const resources = new Set()
        const visit = bundledModule => { if (bundledModule.resource) resources.add(bundledModule.resource); if (bundledModule.modules) for (const nested of bundledModule.modules) visit(nested) }
        for (const bundledModule of stats.compilation.modules) visit(bundledModule)
        sources = [...resources]
        for (const sourceModule of stats.compilation.modules) {
          if (!/[\\/]lib[\\/]prisma\./.test(sourceModule.resource ?? "")) continue
          const chain = [], seen = new Set()
          for (let owner = sourceModule; owner && !seen.has(owner) && chain.length < 24; owner = stats.compilation.moduleGraph.getIssuer(owner)) {
            seen.add(owner); if (owner.resource) chain.push(path.relative(root, owner.resource))
          }
          forbiddenTrace = chain.join(" <- ")
        }
      }
    } catch (cause) { failure = cause }
    compiler.close(cause => failure || cause ? reject(failure || cause) : resolve(sources))
  }))
  const forbidden = modules.filter(name => /(?:node_modules[\\/](?:@prisma|next-auth)|next[\\/]dist[\\/]server|[\\/]app[\\/]api[\\/]|[\\/]lib[\\/](?:server[\\/]|prisma\.)|[\\/]tests[\\/])/.test(name))
  if (forbidden.length) throw new Error("Server, authentication or test code leaked into the offline bundle: " + forbidden.join(", ") + "; import chain: " + forbiddenTrace)

  const globals = path.join(root, "app/globals.css")
  const compiled = await require("postcss")([require("tailwindcss")(path.join(root, "tailwind.config.ts"))]).process(await readFile(globals, "utf8"), { from: globals, map: false })
  const css = compiled.css.replaceAll("../public/fonts/", "./fonts/")
    + "\n" + await readFile(path.join(root, "native/web/website-fonts.css"), "utf8")
  await writeFile(path.join(coreRoot, "app.css"), css)
  await mkdir(path.join(coreRoot, "fonts/dseg"), { recursive: true })
  for (const name of ["DSEG7Modern-Regular.woff2", "DSEG7Modern-Bold.woff2", "DSEG14Modern-Bold.woff2", "DSEG-LICENSE.txt"]) {
    await copyFile(path.join(root, "public/fonts/dseg", name), path.join(coreRoot, "fonts/dseg", name))
  }
  await copyFile(path.join(root, "public", PUBLIC_PRODUCT_IDENTITY.assets.appBarWordmark), path.join(coreRoot, "wordmark.png"))
  // Ship the canonical accessible label with the wordmark for native Home.
  await writeFile(path.join(coreRoot, "wordmark-label.txt"), PUBLIC_PRODUCT_IDENTITY.name)
  // Preserve the website's public image URLs so shared markup needs no second
  // product-identity mapping. Only public brand images enter this directory.
  for (const asset of new Set(Object.values(PUBLIC_PRODUCT_IDENTITY.assets))) {
    if (typeof asset !== "string" || !asset.startsWith("/brand/") || !/\.(png|svg|webp|jpg)$/.test(asset)) continue
    await mkdir(path.join(coreRoot, "public/brand"), { recursive: true })
    await copyFile(path.join(root, "public", asset), path.join(coreRoot, "public", asset))
  }
  for (const family of ["inter", "reports"]) {
    for (const name of await readdir(path.join(root, "public/fonts", family))) {
      await mkdir(path.join(coreRoot, "fonts", family), { recursive: true })
      await mkdir(path.join(coreRoot, "public/fonts", family), { recursive: true })
      await copyFile(path.join(root, "public/fonts", family, name), path.join(coreRoot, "fonts", family, name))
      await copyFile(path.join(root, "public/fonts", family, name), path.join(coreRoot, "public/fonts", family, name))
    }
  }
  for (const asset of ["audio/atmosphere/media-session-carrier.mp3", "icons/icon-512.png"]) {
    await mkdir(path.dirname(path.join(coreRoot,"public",asset)),{recursive:true})
    await copyFile(path.join(root,"public",asset),path.join(coreRoot,"public",asset))
  }
  await mkdir(path.join(coreRoot, "textures"), { recursive: true })
  for (const [name, expected] of [
    ["earth-blue-marble.jpg", "228deba2e4b600146bdcb6cfa359b8ead6aacc2b1c13550a29cd82824cfa1c01"],
    ["earth-topology.png", "839b12da2e4dd346b256cebae72e10c479a102c8980a22084c41275e4b9a0e12"],
  ]) {
    const source = path.join(root, "native/assets/textures", name)
    const payload = await readFile(source)
    if (createHash("sha256").update(payload).digest("hex") !== expected) throw new Error("Offline globe texture checksum mismatch.")
    await copyFile(source, path.join(coreRoot, "textures", name))
  }
  await writeFile(path.join(coreRoot, "THIRD-PARTY-NOTICES.txt"), await offlineNotices(modules))
  await writeFile(path.join(coreRoot, "index.html"), `<!doctype html><html lang="en" class="dark"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; media-src 'self' blob:; connect-src 'self' blob: https://media.atmoshaper.com/atmosphere/; frame-src 'none'; worker-src blob:; base-uri 'none'; form-action 'none'"><title>${legacyAcceptance ? "AtmoShaper Offline Tools" : "AtmoShaper"}</title><link rel="icon" href="data:,"><link rel="stylesheet" href="./app.css"></head><body><div id="root"></div><script defer src="./app.js"></script></body></html>`)
  if (!legacyAcceptance) {
    // Resolve without account claims. The isolated exporter needs only these
    // public decisions, so it never loads any renderer or account modules.
    const publicBackgrounds = backgroundRegistry.filter(entry => userCanUseBackground(entry)).map(entry => entry.id)
    if (publicBackgrounds.some(id => !/^[a-z0-9-]+$/.test(id))) throw new Error("Invalid public Clock background identifier.")
    // The Compose picker and export use the same conservative registry decision.
    // Renderer code remains in the existing Previous Tools asset closure.
    const publicIds = new Set(publicBackgrounds)
    const clockBackgrounds = backgroundRegistry.filter(entry => entry.enabled && entry.category.includes("clock"))
      .map(entry => {
        const guestAccess = publicIds.has(entry.id)
        const defaults = guestAccess ? projectClockAppearance({ backgroundId: entry.id }, publicIds) : null
        if (defaults && defaults.background !== entry.id) throw new Error(`Free Clock background needs a native renderer: ${entry.id}`)
        return { id: entry.id, label: entry.label, guestAccess, defaults }
      })
    await writeFile(path.join(coreRoot, "clock-backgrounds.json"), JSON.stringify(clockBackgrounds))
    await writeFile(path.join(coreRoot, "clock-appearance-export.html"), `<!doctype html><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'self'; base-uri 'none'"><title>Clock appearance transfer</title><script defer src="./clock-appearance-export.js" data-public-backgrounds="${publicBackgrounds.join(",")}"></script>`)
    await writeFile(path.join(coreRoot, "timer-export.html"), `<!doctype html><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'self'; base-uri 'none'"><title>Timer transfer</title><script defer src="./timer-export.js"></script>`)
  }
  const files = await fileInventory(coreRoot)
  const manifest = { version: 2, entry: "core/index.html", networkRequired: false, sharedWebsite: !legacyAcceptance, syntheticReceiptAuthority: Boolean(testPublicKeysPath), tools: ["home", "navigation", "clock", "timer", "breathing", "backgrounds", "music", "downloads", "business-planners"], sourceModuleCount: modules.length, files }
  await writeFile(path.join(bundleRoot, "bundle-proof.json"), JSON.stringify(manifest, null, 2))
  console.log(JSON.stringify({ entry: manifest.entry, fileCount: files.length, bytes: files.reduce((sum, item) => sum + item.bytes, 0), networkRequired: false }))
  return manifest
}

/** Retain license notices for every bundled package, plus the existing globe
 * image source's MIT notice. Audio credits remain attached to catalog entries. */
async function offlineNotices(modules) {
  const packages = new Set()
  for (const resource of modules) {
    const parts = resource.replaceAll("\\", "/").split("/node_modules/")
    if (parts.length < 2) continue
    const tail = parts.at(-1).split("/")
    packages.add(tail[0].startsWith("@") ? tail.slice(0, 2).join("/") : tail[0])
  }
  const notices = []
  for (const name of [...packages].sort()) {
    const directory = path.join(root, "node_modules", name)
    const entries = await readdir(directory).catch(() => [])
    const license = entries.find(value => /^(?:licen[cs]e|copying|notice)(?:[.-]|$)/i.test(value))
    if (license) notices.push(name + "\n" + await readFile(path.join(directory, license), "utf8"))
  }
  notices.push("Globe textures: three-globe v2.31.0, example/img; https://github.com/vasturiano/three-globe/tree/v2.31.0/example/img\n" + await readFile(path.join(root, "native/three-globe-LICENSE.txt"), "utf8"))
  return notices.join("\n\n---\n\n")
}

async function fileInventory(directory, prefix = "core") {
  const result = []
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const name = prefix + "/" + entry.name, absolute = path.join(directory, entry.name)
    if (entry.isDirectory()) result.push(...await fileInventory(absolute, name))
    else { const data = await readFile(absolute); result.push({ path: name, bytes: data.length, sha256: createHash("sha256").update(data).digest("hex") }) }
  }
  return result
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await buildOfflineCore({ development: process.argv.includes("--development") })
