import { registerHooks } from "node:module"

// Next aliases this marker in server bundles. Native Node tests need the same empty
// server marker, while the actual access/entitlement/database implementation stays real.
registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier === "server-only" && context.parentURL?.endsWith("/lib/calendar-sync-access.ts")) {
      return { url: new URL("../node_modules/next/dist/compiled/server-only/empty.js", import.meta.url).href, shortCircuit: true }
    }
    return nextResolve(specifier, context)
  },
})
