// eslint-disable-next-line @typescript-eslint/no-require-imports -- Webpack loader API.
const { default: cssLoader } = require("next/dist/build/webpack/loaders/css-loader/src/index.js")
// eslint-disable-next-line @typescript-eslint/no-require-imports -- Use the compiler's real tracing API.
const { trace } = require("next/dist/trace")

/** Reuse Next's installed CSS Modules compiler without the server build runtime. */
module.exports = function offlineCssLoader(source, map, meta) {
  // Webpack seals its loader context; supply Next's extra trace on a derived one.
  const context = Object.create(this)
  context.currentTraceSpan = trace("offline-core-css")
  return cssLoader.call(context, source, map, meta)
}
