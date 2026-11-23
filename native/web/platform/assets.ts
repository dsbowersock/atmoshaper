/** Only the report's packaged public font uses a root-relative fetch in shared
 * code. This exact rewrite never handles API requests or arbitrary file paths. */
export function installPackagedFontFetch() {
  const original = globalThis.fetch.bind(globalThis)
  globalThis.fetch = (input, init) => {
    if (input === "/fonts/reports/NotoSans-Regular.ttf") return original(new URL("./public/fonts/reports/NotoSans-Regular.ttf", document.baseURI), { ...init, credentials: "omit" })
    return original(input, init)
  }
}
