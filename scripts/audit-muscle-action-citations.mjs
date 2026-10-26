/** Audit current exact facts and retained public bytes; no retrieval or credential fallback. */
import assert from "node:assert/strict"
import {createHash} from "node:crypto"
import fs from "node:fs"
import path from "node:path"
import {fileURLToPath,pathToFileURL} from "node:url"

const sha = bytes => createHash("sha256").update(bytes).digest("hex")

/** Bind OpenStax links to element ranges independently verified against retained publisher bytes. */
export function assertMuscleActionPublisherLocators(manifest) {
  for (const binding of manifest.bindings.filter(row => row.sourceRef === "openstax-anatomy-physiology")) {
    const matches = manifest.publisherElements.filter(element => element.elementId === binding.publisherElementId)
    assert.equal(matches.length, 1, `Unique publisher element: ${binding.id}`)
    const element = matches[0]
    assert.match(element.file, /^m[0-9]+\.cnxml$/)
    assert.match(manifest.publisherRevision, /^[a-f0-9]{40}$/)
    const moduleId = element.file.slice(0, -6)
    const expected = `https://github.com/openstax/osbooks-anatomy-physiology/blob/${manifest.publisherRevision}/modules/${moduleId}/index.cnxml#L${element.startLine}-L${element.endLine}`
    assert.equal(binding.sourceLocator, expected, `Publisher element locator: ${binding.id}`)
  }
}

/** A narrow source comparison is not clinical acceptance or full migration completion. */
export function auditMuscleActionEvidence(manifest, seed, readArtifact) {
  assert.equal(manifest.schemaVersion, 1)
  assert.equal(manifest.bindings.length, 7)
  assert.equal(manifest.clinicalAcceptanceComplete, false)
  assert.equal(manifest.wholeMigrationComplete, false)
  assert.equal(manifest.supplementalFrontalis.bibliographyOnly, true)
  assert.equal(manifest.supplementalFrontalis.articleTextOrMediaBundled, false)
  assert.equal(manifest.supplementalFrontalis.licenseInferredFromBook, false)
  const files = new Map()
  for (const artifact of manifest.publisherArtifacts) {
    assert.match(artifact.file,/^[a-zA-Z0-9._-]+$/)
    const data = readArtifact(artifact.file)
    assert.equal(data.length,artifact.bytes,`Artifact size: ${artifact.file}`)
    assert.equal(sha(data),artifact.sha256,`Artifact digest: ${artifact.file}`)
    files.set(artifact.file,data)
  }
  assert.ok(files.get("historical-license.txt").toString().startsWith("Attribution 4.0 International"))
  const collection = files.get("historical-collection.xml").toString()
  assert.ok(collection.includes('document="m46484"') && collection.includes('document="m46482"'))
  for (const element of manifest.publisherElements) {
    const text = files.get(element.file).toString()
    const starts = [...text.matchAll(new RegExp(`<${element.kind}\\b[^>]*\\bid="${element.elementId}"`,"g"))]
    assert.equal(starts.length,1)
    const start = starts[0].index
    const end = text.indexOf(`</${element.kind}>`,start) + element.kind.length + 3
    assert.equal(sha(text.slice(start,end)),element.xmlSha256)
    assert.equal(text.slice(0,start).split("\n").length,element.startLine)
    assert.equal(text.slice(0,end).split("\n").length,element.endLine)
  }
  assertMuscleActionPublisherLocators(manifest)
  const pages = JSON.parse(files.get("applied-selected-pages.json"))
  assert.deepEqual(manifest.appliedPdfPages,{license:5,quadricepsIdentity:54,quadricepsAction:55,movementQuestions:62,movementAnswers:166})
  assert.ok(pages[5].replace(/\s+/g,"").includes("creativecommons.org/licenses/by/4.0"))
  assert.ok(pages[62].includes("Flex the thigh") && pages[62].includes("Extend the leg"))
  assert.ok(pages[166].toLowerCase().includes("rectus femoris"))
  assert.ok(pages[55].toLowerCase().includes("extend the knee"))
  for (const [page,digest] of Object.entries(manifest.appliedPageTextSha256)) assert.equal(sha(pages[page]),digest,"PDF page-text digest changed")
  const metadata = JSON.parse(files.get("PMC9854514.1.json"))
  assert.equal(metadata.pmcid,"PMC9854514")
  assert.equal(metadata.doi,"10.3390/bioengineering10010067")
  assert.equal(metadata.license_code,"CC BY")
  assert.equal(metadata.is_retracted,false)
  const article = files.get("PMC9854514.1.xml").toString()
  assert.ok(article.includes("creativecommons.org/licenses/by/4.0"))
  assert.ok(article.includes("fine-tune the segmental balance"))
  const body = article.match(/<body\b[^>]*>([\s\S]*?)<\/body>/)?.[1]
  assert.ok(body)
  const paragraphs = [...body.matchAll(/<p(?:\s[^>]*)?>([\s\S]*?)<\/p>/g)]
  const plain = xml => xml.replace(/<[^>]*>/g, "").replace(/&#x([0-9a-f]+);/gi, (_,n)=>String.fromCodePoint(parseInt(n,16))).replace(/&#([0-9]+);/g,(_,n)=>String.fromCodePoint(Number(n))).replace(/&(lt|gt|quot|apos|amp);/g,(_,name)=>({lt:"<",gt:">",quot:'"',apos:"'",amp:"&"}[name]))
  for (const paragraph of manifest.primaryStudyBodyParagraphs) {
    assert.ok(article.includes(`id="${paragraph.sectionId}"`))
    assert.equal(sha(plain(paragraphs[paragraph.bodyParagraphIndex][1])),paragraph.textSha256,"Primary study paragraph changed")
  }
  assert.deepEqual(seed.sources.find(source => source.slug === manifest.newSource.slug),manifest.newSource)
  for (const binding of manifest.bindings) {
    const action = seed.muscleActions.find(row => row.id === binding.id)
    assert.ok(action)
    assert.equal(sha(action.description),binding.descriptionSha256)
    assert.equal(action.sourceRef,binding.sourceRef)
    const citation = seed.citations.find(row => row.id === binding.citationId)
    assert.ok(citation)
    assert.equal(citation.factSlug,action.id)
    assert.equal(citation.sourceRef,action.sourceRef)
    assert.equal(citation.reviewStatus,"reviewed")
    assert.equal(citation.sourceLocator,binding.sourceLocator)
  }
  const sources = new Map(seed.sources.map(source => [source.slug,source]))
  const missing = seed.muscleActions.filter(action => ["open_reuse","commercial_licensed"].includes(sources.get(action.sourceRef)?.usageScope) && !seed.citations.some(citation => citation.entityType==="muscle" && citation.entitySlug===action.muscle && citation.factType==="action" && citation.factSlug===action.id && citation.sourceRef===action.sourceRef && citation.reviewStatus==="reviewed"))
  return {state:"SEVEN_EXISTING_ACTIONS_EXACTLY_SOURCED",reviewedActions:7,retainedArtifacts:files.size,remainingUnboundReusableActions:missing.length,remainingAffectedMuscles:new Set(missing.map(action=>action.muscle)).size,clinicalAcceptanceComplete:false,wholeMigrationComplete:false,networkRequests:0}
}

/** Read only the caller's retained source-evidence directory. */
export async function runMuscleActionAudit(args) {
  assert.equal(args.length,2)
  assert.equal(args[0],"--artifact-root")
  const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..")
  const root = fs.realpathSync(args[1])
  const manifest = JSON.parse(fs.readFileSync(path.join(repo,"docs/source-evidence/anatomy-muscle-action-review-20261025.json")))
  const {ANATOMY_FOUNDATION_SEED:seed} = await import(pathToFileURL(path.join(repo,"lib/anatomy-foundation.ts")))
  const result = auditMuscleActionEvidence(manifest,seed,name=>{
    const file = path.join(root,name)
    assert.ok(file.startsWith(root+path.sep))
    const info = fs.lstatSync(file)
    assert.ok(info.isFile() && !info.isSymbolicLink() && fs.realpathSync(file).startsWith(root+path.sep))
    return fs.readFileSync(file)
  })
  console.log(JSON.stringify(result))
  return result
}
if (process.argv[1] && path.resolve(process.argv[1])===fileURLToPath(import.meta.url)) await runMuscleActionAudit(process.argv.slice(2))
