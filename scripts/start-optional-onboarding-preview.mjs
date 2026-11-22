import { createOnboardingBundle, startOnboardingFixture } from "../tests/fixtures/onboarding-browser-harness.mjs"

// A standalone fictional account preview; never loads provider settings or auth.
const server = await startOnboardingFixture(await createOnboardingBundle(), 3028)
console.log(`Optional setup preview: ${server.origin}`)
console.log(`Account settings preview: ${server.origin}/account`)
for (const signal of ["SIGINT", "SIGTERM"]) process.on(signal, async () => { await server.close(); process.exit(0) })
