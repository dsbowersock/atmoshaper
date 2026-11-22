import path from "node:path"
import { createRequire } from "node:module"
import { fileURLToPath } from "node:url"
import { createHash } from "node:crypto"
import { readFile, writeFile, copyFile, mkdir, readdir, lstat, realpath, rm } from "node:fs/promises"
import { PUBLIC_PRODUCT_IDENTITY } from "../lib/public-product-identity.js"

const require = createRequire(import.meta.url)
export const root = fileURLToPath(new URL("..", import.meta.url))
export const bundleRoot = path.join(root, "output/offline-core")
export const coreRoot = path.join(bundleRoot, "core")

/** This build owns this single generated directory, never browser/user data. */
async function resetOutput() {
  const target = path.resolve(bundleRoot)
  if (target !== path.resolve(root, "output/offline-core") || path.relative(root, target).startsWith("..")) throw new Error("Unexpected offline build directory.")
  const existing = await lstat(target).catch(error => { if (error.code !== "ENOENT") throw error })
  if (existing?.isSymbolicLink()) throw new Error("The offline build output cannot be a link.")
  const physicalRoot = await realpath(root)
  const physicalParent = await realpath(path.dirname(target))
  if (path.relative(physicalRoot, physicalParent).startsWith("..")) throw new Error("Offline output resolves outside this workspace.")
  await rm(target, { recursive: true, force: true })
  await mkdir(coreRoot, { recursive: true })
}

/** Build actual product components into an app-owned, network-free asset set. */
export async function buildOfflineCore() {
  await resetOutput()
  const { webpack } = require("next/dist/compiled/webpack/webpack")
  const compiler = webpack({
    mode: "production", target: ["web", "es2020"], devtool: false,
    entry: path.join(root, "native/web/index.tsx"),
    output: { path: coreRoot, filename: "app.js", publicPath: "./" },
    resolve: { alias: { "@": root }, modules: [path.join(root, "node_modules"), "node_modules"], extensions: [".tsx", ".ts", ".js", ".mjs"] },
    module: { rules: [
      { test: /\.tsx?$/, exclude: /node_modules/, use: [path.join(root, "scripts/loaders/offline-typescript-loader.cjs")] },
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
    plugins: [new webpack.DefinePlugin({ "process.env.NODE_ENV": JSON.stringify("production") })],
  })
  const modules = await new Promise((resolve, reject) => compiler.run((error, stats) => {
    let failure = error, sources
    try {
      if (!failure && stats.hasErrors()) failure = new Error(stats.toString({ all: false, errors: true }))
      if (!failure) sources = [...stats.compilation.modules].map(module => module.resource).filter(Boolean)
    } catch (cause) { failure = cause }
    compiler.close(cause => failure || cause ? reject(failure || cause) : resolve(sources))
  }))
  const forbidden = modules.filter(name => /(?:node_modules[\\/](?:@prisma|next-auth)|next[\\/]dist[\\/]server|[\\/]app[\\/]api[\\/]|[\\/]tests[\\/])/.test(name))
  if (forbidden.length) throw new Error("Server, authentication or test code leaked into the offline bundle: " + forbidden.join(", "))

  const globals = path.join(root, "app/globals.css")
  const compiled = await require("postcss")([require("tailwindcss")(path.join(root, "tailwind.config.ts"))]).process(await readFile(globals, "utf8"), { from: globals, map: false })
  const css = compiled.css.replaceAll("../public/fonts/", "./fonts/")
  await writeFile(path.join(coreRoot, "app.css"), css)
  await mkdir(path.join(coreRoot, "fonts/dseg"), { recursive: true })
  for (const name of ["DSEG7Modern-Regular.woff2", "DSEG7Modern-Bold.woff2", "DSEG14Modern-Bold.woff2", "DSEG-LICENSE.txt"]) {
    await copyFile(path.join(root, "public/fonts/dseg", name), path.join(coreRoot, "fonts/dseg", name))
  }
  await copyFile(path.join(root, "public", PUBLIC_PRODUCT_IDENTITY.assets.appBarWordmark), path.join(coreRoot, "wordmark.png"))
  await writeFile(path.join(coreRoot, "index.html"), `<!doctype html><html lang="en" class="dark"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; media-src 'self'; connect-src 'none'; frame-src 'none'; worker-src 'none'; base-uri 'none'; form-action 'none'"><title>AtmoShaper Offline Tools</title><link rel="icon" href="data:,"><link rel="stylesheet" href="./app.css"></head><body><div id="root"></div><script defer src="./app.js"></script></body></html>`)
  const files = await fileInventory(coreRoot)
  const manifest = { version: 1, entry: "core/index.html", networkRequired: false, tools: ["clock", "timer", "breathing", "backgrounds"], sourceModuleCount: modules.length, files }
  await writeFile(path.join(bundleRoot, "bundle-proof.json"), JSON.stringify(manifest, null, 2))
  console.log(JSON.stringify({ entry: manifest.entry, fileCount: files.length, bytes: files.reduce((sum, item) => sum + item.bytes, 0), networkRequired: false }))
  return manifest
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

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await buildOfflineCore()
