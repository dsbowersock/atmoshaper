import {readFile,writeFile} from 'node:fs/promises'
import {readGit,isGitAncestor,readGitDiffPaths,reachableReviewedBlobs,assertCliReceiptIdentity,validateCompletedCliReceipt} from './coderabbit-coverage-proof.mjs'

const folder='output/coderabbit-coverage'
const source='d7e30e022d825d9f26ed37bd6636f11bae1e8314'
const history=JSON.parse(await readFile(`${folder}/review-history.json`,'utf8'))
const issues=JSON.parse(await readFile(`${folder}/issue-history.json`,'utf8'))
const prs=JSON.parse((await readFile(`${folder}/raw-prs.json`,'utf8')).replace(/^\uFEFF/,''))

/** Read Git objects without checkout, network access or repository mutation. */
function git(args,optional=false){
  return readGit(args,{optional})
}
const trees=new Map()
/** Exact Git blobs distinguish reviewed content from later edits to the same path. */
function tree(commit){
  if(trees.has(commit))return trees.get(commit)
  const raw=git(['ls-tree','-r','--format=%(objectname)%x09%(path)',commit],true)
  const value=raw===null?null:new Map(raw.trim().split('\n').filter(Boolean).map(line=>{const at=line.indexOf('\t');return [line.slice(at+1),line.slice(0,at)]}))
  trees.set(commit,value);return value
}
/** Only substantive file-selection receipts count. Skipped checks, bot presence
 * and empty review submissions do not establish source coverage. */
function receipts(record){
  const comments=issues.find(item=>item.pr===record.pr)?.comments??[]
  return [...(record.data?.reviews??[]),...comments].filter(review=>['coderabbitai','coderabbitai[bot]'].includes(review.author?.login??review.user?.login)).flatMap(review=>{
    // Mutable walkthrough comments can list files before the service finishes.
    // A zero-finding completion may update that comment instead of submitting a
    // PR review. Accept explicit finished/risk coverage, never file selection alone.
    const body=review.body??''
    const status=/<!-- recent_review_status_start -->([\s\S]*?)<!-- recent_review_status_end -->/.exec(body)?.[1]
    if(status&&!/No actionable comments were generated in the recent review\./.test(status))return []
    if(/<!-- review_in_progress|Review skipped|Rate limit exceeded/i.test(body))return []
    const isSubmission=Boolean(review.submitted_at&&['COMMENTED','APPROVED','CHANGES_REQUESTED'].includes(review.state))
    const finished=comments.some(comment=>['coderabbitai','coderabbitai[bot]'].includes(comment.author?.login??comment.user?.login)&&/Review finished\./.test(comment.body??'')&&Date.parse(comment.updated_at??comment.created_at)>=Date.parse(review.updated_at??review.created_at))
    const range=/\bbetween ([a-f0-9]{40}) and ([a-f0-9]{40})/.exec(body)
    const selected=/Files selected for processing(?::\s*|\s*\()(\d+)\)?\s*(?:<\/strong>)?<\/summary>([\s\S]*?)<\/details>/.exec(body)
    if(!range||!selected)return []
    const risk=/<!-- final_review_risk_coverage:({[^\n]+}) -->/.exec(body)
    const coverage=risk?JSON.parse(risk[1]):null
    const reviewedHead=coverage?.kind==='reviewed'&&coverage.sourceCommitId===range[2]&&coverage.coveredCommitId===range[2]
    // Older zero-finding receipts predate risk/status metadata. Their explicit
    // outcome must be inside the same completed recent-review block as the range.
    const legacyBlock=/<!-- recent_review_start -->([\s\S]*?)<!-- recent_review_end -->/.exec(body)?.[1]
    const legacyComplete=!status&&legacyBlock?.includes(range[0])&&/No actionable comments were generated/.test(legacyBlock)
    if(!isSubmission&&!(status&&finished)&&!reviewedHead&&!legacyComplete)return []
    const paths=[...selected[2].matchAll(/^\* `([^`]+)`/gm)].map(match=>match[1])
    const unavailable=new Set([...review.body.matchAll(/Files not fully reviewed[^<]*<\/summary>([\s\S]*?)<\/details>/g)].flatMap(match=>[...match[1].matchAll(/^\*\s+`?([^`\n]+)`?\s*$/gm)].map(row=>row[1].trim())))
    return [{pr:record.pr,id:review.id,at:review.submitted_at??review.updated_at??review.created_at,base:range[1],head:range[2],selected:Number(selected[1]),parsed:paths.length,paths:paths.filter(path=>!unavailable.has(path)),unavailable:[...unavailable]}]
  })
}
/** Admit only completed CLI ranges with their raw outcome, exact Git diff and
 * frozen source tree. The ledger alone is not proof of a successful review. */
async function cliReceipts(){
  let records
  try{records=JSON.parse(await readFile(`${folder}/completed-retrospective-reviews.json`,'utf8'))}
  catch(error){if(error.code==='ENOENT')return [];throw error}
  if(!Array.isArray(records))throw new Error('Invalid retrospective receipt ledger')
  const result=[]
  for(const record of records){
    assertCliReceiptIdentity(record,source)
    const meta=JSON.parse(await readFile(`${folder}/${record.log.replace(/\.ndjson$/,'-attempt.json')}`,'utf8'))
    const events=(await readFile(`${folder}/${record.log}`,'utf8')).split(/\r?\n/).map(line=>line.trim()).filter(line=>line.startsWith('{')).map(line=>JSON.parse(line))
    result.push(validateCompletedCliReceipt(record,meta,events,{source,paths:readGitDiffPaths(record.base,record.head),headTree:git(['rev-parse',`${record.head}^{tree}`]).trim(),sourceTree:git(['rev-parse',`${source}^{tree}`]).trim()}))
  }
  return result
}
const retrospective=await cliReceipts()
const proof=[...new Map([...history.reviews.flatMap(receipts),...retrospective].map(item=>[JSON.stringify([item.pr,item.base,item.head,item.paths]),item])).values()]
const current=tree(source),reviewed=new Map()
if(!current)throw new Error('Frozen source tree is unavailable')
const inheritedRoots=git(['rev-list','--max-parents=0',source]).trim().split('\n').filter(Boolean)
if(inheritedRoots.length!==1)throw new Error('The inherited bootstrap baseline is ambiguous')
const bootstrap=tree(inheritedRoots[0])
if(!bootstrap)throw new Error('The inherited bootstrap tree is unavailable')
const transitions=new Map()
for(const receipt of proof){const files=tree(receipt.head),before=tree(receipt.base);if(!files||!before||receipt.selected!==receipt.parsed)continue
  for(const path of receipt.paths){const blob=files.get(path)??null
    const edges=transitions.get(path)??[]
    edges.push({from:before.get(path)??null,to:blob});transitions.set(path,edges)
    if(!blob)continue
    const previous=reviewed.get(path)
    // This human-readable receipt hint is not a coverage decision. Only the
    // complete reviewed range chain below can certify post-baseline changes.
    const matches=blob===current.get(path),previousMatches=previous?.blob===current.get(path)
    if(!previous||(matches&&!previousMatches)||(matches===previousMatches&&Date.parse(receipt.at)>Date.parse(previous.at)))reviewed.set(path,{...receipt,paths:undefined,blob})
  }
}
const shipped=prs.filter(pr=>pr.merged_at&&pr.merge_commit_sha&&isGitAncestor(pr.merge_commit_sha,source)).sort((a,b)=>Date.parse(a.merged_at)-Date.parse(b.merged_at))
const touched=new Map(),rows=[]
for(const pr of shipped){
  const paths=readGitDiffPaths(`${pr.merge_commit_sha}^1`,pr.merge_commit_sha)
  const hasRabbit=proof.some(item=>item.pr===pr.number)
  rows.push({pr:pr.number,title:pr.title,head:pr.head.sha,merge:pr.merge_commit_sha,files:paths.length,substantiveRabbitSubmission:hasRabbit,parsedReceipts:proof.filter(item=>item.pr===pr.number).length})
  for(const path of paths){if(!current.has(path))continue;const entry=touched.get(path)??{path,prs:[],firstBase:`${pr.merge_commit_sha}^1`};entry.prs.push(pr.number);touched.set(path,entry)}
}
/** Runtime, tests and executable/configuration source are reviewed separately
 * from prose history, binary assets and generated catalog/lock data. */
function category(path){
  if(/(?:^|\/)package-lock\.json$|^data\/|^public\/.*\.json$|^scripts\/repository-audit\/(?:brand-reference-baseline|cleanup-html-named-references)\.json$|\.(?:glb|png|jpg|webp|mp3|woff2?|ttf|pdf|ico)$/.test(path))return 'data-or-asset'
  if(path.endsWith('.md')||path.startsWith('docs/')||/(?:^|\/)(?:LICENSE|DSEG-LICENSE\.txt|CC0\.txt|OFL\.txt|third-party-notices\.txt)$/.test(path))return 'documentation'
  // Build inputs and audit policy are executable configuration too: extension-
  // only matching would miss the backup Dockerfile and its secret-exclusion rules.
  if(/\.(?:[cm]?[jt]sx?|css|scss|py|ps1|sh|ya?ml|prisma|json|html)$/.test(path)||/(?:^|\/)(?:Dockerfile|\.dockerignore|\.gitattributes|\.gitignore|\.env\.example)$/.test(path))return path.startsWith('tests/')?'test':'runtime-or-config'
  return 'other'
}
const paths=[...touched.values()].map(entry=>{
  const inherited=tree(entry.firstBase)
  if(!inherited)throw new Error('A required pre-change baseline is unavailable')
  const seed=inherited.get(entry.path)??null
  // A nested PR's first parent can already contain unreviewed branch work.
  // Its seed is safe only if it equals the actual inherited bootstrap content.
  if(seed!==(bootstrap.get(entry.path)??null))throw new Error('A PR baseline contains post-bootstrap changes; widen its range before reporting coverage')
  const covered=reachableReviewedBlobs(seed,transitions.get(entry.path)??[]).has(current.get(entry.path))
  // Start any backfill at the inherited pre-change version, not a possibly
  // partial recent review. This covers all surviving post-bootstrap changes.
  return {...entry,category:category(entry.path),covered,seedBlob:seed,review:reviewed.get(entry.path)??null,baseline:entry.firstBase}
})
const gaps=paths.filter(path=>!path.covered&&['runtime-or-config','test'].includes(path.category))
// A new source/configuration format cannot silently disappear from the audit.
// License notices are classified explicitly above; other unknown paths need review.
if(paths.some(path=>path.category==='other'))throw new Error('Unclassified shipped paths remain; classify them before reporting coverage')
const inherited=[...current.keys()].filter(path=>!touched.has(path)&&['runtime-or-config','test'].includes(category(path)))
/** Fixed cohorts cover each gap once; later findings cannot silently expand this
 * initial pass or turn it into an automatic review/rewrite loop. */
function cohort(path){
  if(/business|planner|launch-checklist/i.test(path))return 'business-planners'
  if(/wellness|body-|\/body\/|movement|rom-|exercise|feelings/i.test(path))return 'wellness-and-body'
  if(/calendar|auth\.ts|stripe|commerce|refund|membership|account|entitlement/i.test(path))return 'accounts-calendar-payments'
  return 'operations-and-shared-ui'
}
const batches=[]
if(retrospective.length){
  const group=[...gaps].sort((a,b)=>a.path.localeCompare(b.path))
  for(let offset=0;offset<group.length;offset+=70)batches.push({id:`range-proof-backfill-${1+offset/70}`,source,paths:group.slice(offset,offset+70).map(item=>({path:item.path,baseline:item.baseline,blob:current.get(item.path)}))})
}else for(const name of ['accounts-calendar-payments','wellness-and-body','business-planners','operations-and-shared-ui']){
  const group=gaps.filter(item=>cohort(item.path)===name).sort((a,b)=>a.path.localeCompare(b.path))
  for(let offset=0;offset<group.length;offset+=70)batches.push({id:`${name}-${1+offset/70}`,source,paths:group.slice(offset,offset+70).map(item=>({path:item.path,baseline:item.baseline,blob:current.get(item.path)}))})
}
if(new Set(batches.flatMap(batch=>batch.paths.map(item=>item.path))).size!==gaps.length)throw new Error('Incomplete or duplicate review scope')
const result={source,inheritedBootstrap:inheritedRoots[0],capturedAt:new Date().toISOString(),shippedPullRequests:rows.sort((a,b)=>a.pr-b.pr),receipts:proof,paths,gaps,inheritedOutsidePrDiffs:inherited,batches,summary:{shippedPrs:shipped.length,substantiveFileReceipts:proof.length,pathsTouched:paths.length,coveredCurrentBlobs:paths.filter(path=>path.covered).length,coveredCodeAndTestPaths:paths.filter(path=>path.covered&&['runtime-or-config','test'].includes(path.category)).length,uncoveredCodeAndTestPaths:gaps.length,inheritedCodeAndTestPaths:inherited.length,reviewBatches:batches.length}}
await writeFile(`${folder}/coverage.json`,JSON.stringify(result,null,2))
await writeFile(`${folder}/batches.json`,JSON.stringify(batches,null,2))
console.log(JSON.stringify(result.summary,null,2))
console.log(JSON.stringify(rows.filter(row=>!row.substantiveRabbitSubmission),null,2))
