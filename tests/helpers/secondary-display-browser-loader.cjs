// eslint-disable-next-line @typescript-eslint/no-require-imports -- Webpack's fixture loader runs in CommonJS.
const ts = require("typescript")

/** Compile the actual shell and fixture with cached TypeScript, without a Next server. */
module.exports = function secondaryDisplayBrowserLoader(source) {
  return ts.transpileModule(source, {
    fileName: this.resourcePath,
    compilerOptions: { jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext },
  }).outputText
}
