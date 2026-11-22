// eslint-disable-next-line @typescript-eslint/no-require-imports -- Webpack's loader API is CommonJS.
const ts = require("typescript")

/** Production client bundle transform; the separate typecheck remains mandatory. */
module.exports = function offlineTypeScriptLoader(source) {
  this.cacheable?.()
  return ts.transpileModule(source, {
    fileName: this.resourcePath,
    compilerOptions: { jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.ESNext },
  }).outputText
}
