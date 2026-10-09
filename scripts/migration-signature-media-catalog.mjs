#!/usr/bin/env node

import { writeFile } from "node:fs/promises"
import path from "node:path"
import { pathToFileURL } from "node:url"
import committedCatalog from "../data/atmoshaper/production-audio-catalog.json" with { type: "json" }
import {
  ATMOSHAPER_PRODUCTION_CONCEPT_COUNT,
  rebindAtmoShaperProductionCatalog,
} from "../lib/atmoshaper/production-release-builder.js"

/**
 * Prepares only browser catalog metadata from committed public declarations.
 * Default prints a no-write summary. An explicit output uses exclusive creation;
 * no dotenv, provider/upload client, source audio, encoding or network is loaded.
 * The committed runtime catalog stays untouched.
 *
 * @param {string[]} args Only --output followed by a new local file is accepted.
 * @returns {Promise<object>} Aggregate preparation receipt.
 */
export async function prepareSignatureMediaCatalog(args = []) {
  let output
  if (args.length > 0) {
    if (args.length !== 2 || args[0] !== "--output" || !args[1] || args[1].startsWith("--")) {
      throw new Error("Usage: npm run migration:media:signature-catalog -- [--output NEW_LOCAL_FILE]")
    }
    output = path.resolve(args[1])
  }
  const candidate = rebindAtmoShaperProductionCatalog(committedCatalog, "https://media.atmoshaper.com")
  if (candidate.summary.conceptCount !== ATMOSHAPER_PRODUCTION_CONCEPT_COUNT) {
    throw new Error("Signature catalog concept count differs from the reviewed release")
  }
  const references = candidate.concepts.flatMap((concept) => concept.sources.flatMap((source) => source.formats))
  const distinct = new Map(references.map((format) => [format.publicUrl, format]))
  if (output) {
    await writeFile(output, JSON.stringify(candidate, null, 2) + "\n", { encoding: "utf8", flag: "wx", mode: 0o600 })
  }
  return {
    status: output ? "local-candidate-written" : "no-write-plan",
    originalRevision: committedCatalog.catalogRevision,
    candidateRevision: candidate.catalogRevision,
    ...candidate.summary,
    formatReferenceCount: references.length,
    distinctFormatObjectCount: distinct.size,
    declaredDistinctFormatBytes: [...distinct.values()].reduce((total, format) => total + format.byteSize, 0),
    sourcePayloadReads: 0,
    providerRequests: 0,
    mediaMutations: 0,
    committedCatalogChanged: false,
    runtimeBindingChanged: false,
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  try {
    console.log(JSON.stringify(await prepareSignatureMediaCatalog(process.argv.slice(2)), null, 2))
  } catch (error) {
    console.error(error instanceof Error ? error.message : "Signature metadata preparation failed")
    process.exitCode = 1
  }
}
