import fs from "node:fs"
import path from "node:path"
import { createRequire } from "node:module"
import { fileURLToPath } from "node:url"
import { runInNewContext } from "node:vm"
import React from "react"
import ts from "typescript"

const projectRoot = fileURLToPath(new URL("../../", import.meta.url))
const cachedRequire = createRequire(path.join(projectRoot, "package.json"))

/** Render actual TSX owners with cached dependencies; only Next's link transport is replaced. */
export function loadAttributionComponent(relativePath) {
  const cache = new Map()
  const load = (filename) => {
    const resolved = [filename, `${filename}.tsx`, `${filename}.ts`, `${filename}.js`].find((candidate) => fs.existsSync(candidate) && fs.statSync(candidate).isFile())
    if (!resolved || !resolved.startsWith(projectRoot)) throw new Error(`Unexpected component path: ${filename}`)
    if (cache.has(resolved)) return cache.get(resolved).exports
    const record = { exports: {} }
    cache.set(resolved, record)
    const compiled = ts.transpileModule(fs.readFileSync(resolved, "utf8"), {
      fileName: resolved,
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
    }).outputText
    runInNewContext(compiled, {
      URL,
      module: record,
      exports: record.exports,
      require(name) {
        if (name === "next/link") return { __esModule: true, default: ({ children, ...props }) => React.createElement("a", props, children) }
        if (name.startsWith("@/")) return load(path.join(projectRoot, name.slice(2)))
        if (name.startsWith(".")) return load(path.resolve(path.dirname(resolved), name))
        return cachedRequire(name)
      },
    }, { filename: resolved })
    return record.exports
  }
  return load(path.join(projectRoot, relativePath))
}
