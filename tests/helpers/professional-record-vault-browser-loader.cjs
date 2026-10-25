// eslint-disable-next-line @typescript-eslint/no-require-imports -- Webpack invokes this cached TypeScript loader through CommonJS.
const ts = require("typescript")

/** Compile the real provider for the browser fixture without importing application services. */
module.exports = function professionalRecordVaultBrowserLoader(source) {
  return ts.transpileModule(source, {
    fileName: this.resourcePath,
    compilerOptions: { jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext },
  }).outputText
}
