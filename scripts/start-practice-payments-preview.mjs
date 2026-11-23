import { createPracticePaymentsBundle, startPracticePaymentsPreview } from "../tests/fixtures/practice-payments-preview.mjs"

// This standalone preview deliberately never loads .env, accounts or providers.
const server=await startPracticePaymentsPreview(await createPracticePaymentsBundle(),3034)
console.log(`Practice payment design preview: ${server.origin}`)
console.log("Fictional account and transactions only; no card fields or live payment routes.")
for(const signal of ["SIGINT","SIGTERM"])process.on(signal,async()=>{await server.close();process.exit(0)})
