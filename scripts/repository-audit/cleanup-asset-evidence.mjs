import { extname, posix } from "node:path"

import ts from "typescript"

import {
  auditError,
  classifyScope,
  compareText,
  requireTrackedTextIndex,
  sha256,
  validateCleanupPolicy,
} from "./cleanup-core.mjs"
import { isLiteralNode, scriptKind, sourceLocation } from "./cleanup-source.mjs"
import { stableJson } from "./core.mjs"

function compareLocation(left, right) {
  return (
    compareText(left.path ?? left.fromPath ?? "", right.path ?? right.fromPath ?? "") ||
    (left.line ?? 0) - (right.line ?? 0) || (left.column ?? 0) - (right.column ?? 0) ||
    compareText(left.kind ?? left.code ?? "", right.kind ?? right.code ?? "") ||
    compareText(left.literalSha256 ?? left.expressionSha256 ?? "", right.literalSha256 ?? right.expressionSha256 ?? "")
  )
}

function couldConstructAsset(expressionText, assetExtensions) {
  const lower = expressionText.toLowerCase()
  return (
    [...assetExtensions].some((extension) => lower.includes(extension)) ||
    /["'`](?:\.{1,2}\/|\/|public\/)/.test(expressionText)
  )
}

function collectTextLiterals(record, text, assetExtensions) {
  if ([".js", ".jsx", ".ts", ".tsx", ".mjs", ".cjs"].includes(record.extension)) {
    const sourceFile = ts.createSourceFile(record.path, text, ts.ScriptTarget.Latest, true, scriptKind(record.path))
    const literals = []
    const uncertainties = []
    const visit = (node) => {
      if (isLiteralNode(node)) literals.push({ value: node.text, ...sourceLocation(sourceFile, node) })
      const isOutermostConcatenation = (
        ts.isBinaryExpression(node) && node.operatorToken.kind === ts.SyntaxKind.PlusToken &&
        !(ts.isBinaryExpression(node.parent) && node.parent.operatorToken.kind === ts.SyntaxKind.PlusToken)
      )
      if (
        (ts.isTemplateExpression(node) || isOutermostConcatenation) &&
        couldConstructAsset(node.getText(sourceFile), assetExtensions)
      ) {
        uncertainties.push({
          code: "DYNAMIC_ASSET_EXPRESSION", path: record.path, ...sourceLocation(sourceFile, node),
          kind: ts.isTemplateExpression(node) ? "template" : "concatenation",
          expressionSha256: sha256(node.getText(sourceFile)),
        })
      }
      ts.forEachChild(node, visit)
    }
    visit(sourceFile)
    const errors = sourceFile.parseDiagnostics.length > 0
      ? [{ code: "SOURCE_PARSE_DIAGNOSTIC", path: record.path, count: sourceFile.parseDiagnostics.length }]
      : []
    return { literals, uncertainties, errors }
  }
  const literals = []
  const seen = new Set()
  const lineStarts = [0]
  for (let index = text.indexOf("\n"); index >= 0; index = text.indexOf("\n", index + 1)) lineStarts.push(index + 1)
  const sourceLocationAt = (offset) => {
    let low = 0
    let high = lineStarts.length
    while (low + 1 < high) {
      const middle = Math.floor((low + high) / 2)
      if (lineStarts[middle] <= offset) low = middle
      else high = middle
    }
    return { line: low + 1, column: offset - lineStarts[low] + 1 }
  }
  const addLiteral = (value, offset) => {
    const trimmed = value.trim()
    const start = offset + Math.max(0, value.indexOf(trimmed))
    const key = `${start}\0${trimmed}`
    if (!trimmed || seen.has(key)) return
    seen.add(key)
    literals.push({ value: trimmed, ...sourceLocationAt(start) })
  }
  const scan = (matcher) => {
    for (let match = matcher.exec(text); match; match = matcher.exec(text)) {
      const value = match.slice(1).find((candidate) => candidate !== undefined)
      if (value !== undefined) addLiteral(value, match.index + Math.max(0, match[0].indexOf(value)))
      if (match[0].length === 0) matcher.lastIndex += 1
    }
  }
  scan(/(?:url\(\s*)?["']([^"'\r\n)]+)["']\s*\)?|url\(\s*([^)\'"\s][^)]*)\s*\)/g)
  if (record.extension === ".md") scan(/!?\[[^\]\r\n]*\]\(\s*(?:<([^>\r\n]+)>|([^\s)]+))/g)
  if (record.extension === ".html") scan(/(?:src|href|poster)\s*=\s*([^\s"'=<>`]+)/gi)
  if ([".yaml", ".yml"].includes(record.extension)) scan(/^[ \t]*[^#\r\n:]+:[ \t]*([^\s#]+)[ \t]*(?:#.*)?$/gm)
  return { literals, uncertainties: [], errors: [] }
}

function normalizeContainedAssetPath(value) {
  const segments = []
  for (const segment of value.split("/")) {
    if (!segment || segment === ".") continue
    if (segment === "..") {
      if (segments.length === 0) return null
      segments.pop()
    } else segments.push(segment)
  }
  return segments.join("/")
}

function assetTarget(fromPath, literal, assetExtensions) {
  if (/^(?:[a-z][a-z0-9+.-]*:|#|\\\\)/i.test(literal)) return null
  const withoutSuffix = literal.split(/[?#]/, 1)[0].replaceAll("\\", "/")
  if (!assetExtensions.has(extname(withoutSuffix).toLowerCase())) return null
  let target
  if (withoutSuffix.startsWith("/")) {
    const publicPath = normalizeContainedAssetPath(withoutSuffix.slice(1))
    if (publicPath === null) return { invalid: true }
    target = `public/${publicPath}`
  } else if (withoutSuffix.startsWith("public/")) {
    const publicPath = normalizeContainedAssetPath(withoutSuffix.slice("public/".length))
    if (publicPath === null) return { invalid: true }
    target = `public/${publicPath}`
  } else if (withoutSuffix.includes("/")) {
    target = posix.normalize(posix.join(posix.dirname(fromPath), withoutSuffix))
  } else return null
  if (target === ".." || target.startsWith("../") || target.startsWith("/")) return { invalid: true }
  return { targetPath: target }
}

function assetBasename(literal, assetExtensions) {
  if (/^(?:[a-z][a-z0-9+.-]*:|#|\\)/i.test(literal)) return null
  const withoutSuffix = literal.split(/[?#]/, 1)[0].replaceAll("\\", "/")
  if (!assetExtensions.has(extname(withoutSuffix).toLowerCase())) return null
  if (withoutSuffix.includes("/") || withoutSuffix === "." || withoutSuffix === "..") return null
  return withoutSuffix
}

/** Build tracked-asset and literal-reference evidence without retaining literal contents. */
export function buildAssetEvidence(index, policy) {
  validateCleanupPolicy(policy)
  const { metadataByPath, textByPath, trackedPathSet } = requireTrackedTextIndex(index)
  const assetExtensions = new Set(policy.assetExtensions)
  const assets = index.trackedPaths
    .filter((path) => policy.assetRoots.some((root) => path.startsWith(root)) && assetExtensions.has(extname(path).toLowerCase()))
    .map((path) => {
      const metadata = metadataByPath.get(path)
      if (!metadata) throw auditError("CLEANUP_INDEX_INVALID")
      return { path, mode: metadata.mode, oid: metadata.oid, bytes: metadata.bytes, scope: classifyScope(path, policy) }
    })
  const assetPathsByBasename = new Map()
  for (const asset of assets) {
    const basename = posix.basename(asset.path)
    const paths = assetPathsByBasename.get(basename) ?? []
    paths.push(asset.path)
    assetPathsByBasename.set(basename, paths)
  }
  const references = []
  const basenameSignals = []
  const uncertainties = []
  const errors = []
  for (const record of index.records) {
    const rows = collectTextLiterals(record, textByPath.get(record.path), assetExtensions)
    uncertainties.push(...rows.uncertainties)
    errors.push(...rows.errors)
    for (const literal of rows.literals) {
      const resolution = assetTarget(record.path, literal.value, assetExtensions)
      if (resolution?.invalid) {
        errors.push({
          code: "UNRESOLVED_LITERAL_ASSET", fromPath: record.path, line: literal.line,
          column: literal.column, literalSha256: sha256(literal.value),
        })
        continue
      }
      if (!resolution) {
        const basename = assetBasename(literal.value, assetExtensions)
        const candidateTargetPaths = basename ? assetPathsByBasename.get(basename) ?? [] : []
        if (candidateTargetPaths.length > 0) {
          basenameSignals.push({
            fromPath: record.path, line: literal.line, column: literal.column,
            literalSha256: sha256(literal.value), candidateTargetPaths,
          })
        }
        continue
      }
      const row = {
        fromPath: record.path, line: literal.line, column: literal.column,
        literalSha256: sha256(literal.value), targetPath: resolution.targetPath,
      }
      references.push(row)
      if (!trackedPathSet.has(row.targetPath)) {
        errors.push({
          code: "UNRESOLVED_LITERAL_ASSET", fromPath: row.fromPath, line: row.line,
          column: row.column, literalSha256: row.literalSha256,
        })
      }
    }
  }
  return stableJson({
    schemaVersion: 1, assets, basenameSignals: basenameSignals.sort(compareLocation),
    references: references.sort(compareLocation), uncertainties: uncertainties.sort(compareLocation),
    errors: errors.sort(compareLocation),
  })
}
