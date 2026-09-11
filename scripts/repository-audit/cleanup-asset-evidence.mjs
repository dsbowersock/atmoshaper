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

/** Mask Markdown examples without moving source offsets; only destinations outside them gain URL proof. */
function markdownDestinationText(text) {
  const blank = (value) => value.replace(/[^\r\n]/g, " ")
  let fence = null
  const containers = []
  const withoutBlocks = text.replace(/[^\n]*\n|[^\n]+$/g, (line) => {
    if (!line.trim()) return line
    // Container indentation is semantic, but only the original line is returned or masked, preserving offsets.
    let column = 0
    const expanded = line.replace(/[^\t]|\t/g, (character) => {
      const width = character === "\t" ? 4 - column % 4 : 1
      column += width
      return character === "\t" ? " ".repeat(width) : character
    })
    const prefix = () => new RegExp(`^${containers.join("")}`)
    while (containers.length && !prefix().test(expanded)) {
      containers.pop()
      // Fenced blocks cannot lazily continue after their enclosing list/blockquote ends.
      fence = null
    }
    let body = expanded.replace(prefix(), "")
    if (!fence) {
      for (;;) {
        const quote = body.match(/^ {0,3}> ?/)
        // Five or more spaces leave four code-indentation spaces after the marker's single padding space.
        const list = body.match(/^ {0,3}(?:[-+*]|\d{1,9}[.)])(?: {1,4}(?=\S)| (?= {4})| *(?=\r?\n?$))/)
        const container = quote ?? list
        if (!container) break
        const width = list && !body.slice(list[0].length).trim() ? list[0].trimEnd().length + 1 : container[0].length
        containers.push(quote ? " {0,3}> ?" : ` {${width}}`)
        body = body.slice(container[0].length)
      }
    }
    const marker = body.match(/^ {0,3}(`{3,}|~{3,})([^\r\n]*)/)
    if (fence) {
      if (marker && marker[1][0] === fence[0] && marker[1].length >= fence.length && !marker[2].trim()) fence = null
      return blank(line)
    }
    if (marker && (marker[1][0] === "~" || !marker[2].includes("`"))) {
      fence = marker[1]
      return blank(line)
    }
    return /^ {4}/.test(body) ? blank(line) : line
  })
  return withoutBlocks.replace(/<!--[\s\S]*?(?:-->|$)|(?<!`)(`+)[\s\S]*?\1(?!`)/g, blank)
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
  const seen = new Map()
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
  const addLiteral = (value, offset, ownerRelativeUrl) => {
    const trimmed = value.trim()
    const start = offset + Math.max(0, value.indexOf(trimmed))
    const key = `${start}\0${trimmed}`
    if (!trimmed) return
    const prior = seen.get(key)
    if (prior) { prior.ownerRelativeUrl ||= ownerRelativeUrl; return }
    const literal = { value: trimmed, ownerRelativeUrl, ...sourceLocationAt(start) }
    seen.set(key, literal)
    literals.push(literal)
  }
  const scan = (matcher, sourceText = text, ownerRelativeUrl = false) => {
    for (let match = matcher.exec(sourceText); match; match = matcher.exec(sourceText)) {
      const value = match.slice(1).find((candidate) => candidate !== undefined)
      if (value !== undefined) addLiteral(value, match.index + Math.max(0, match[0].indexOf(value)), ownerRelativeUrl)
      if (match[0].length === 0) matcher.lastIndex += 1
    }
  }
  // Consume comments and non-URL strings as whole tokens so their url(...) examples cannot prove ownership.
  // An unterminated quote (including a trailing escape) remains opaque through EOF.
  if (record.extension === ".css") {
    scan(/\/\*[\s\S]*?(?:\*\/|$)|"(?:\\(?:[\s\S]|$)|[^"\\])*(?:"|$)|'(?:\\(?:[\s\S]|$)|[^'\\])*(?:'|$)|(?<![\w-])url\(\s*(?:"([^"\\\r\n]*)"|'([^'\\\r\n]*)'|([^\s"'()\\]+))\s*\)/gi, text, true)
  }
  if (record.extension === ".md") {
    scan(/(?<!\\)!?\[[^\]\r\n]*\]\(\s*(?:<([^>\r\n]+)>|([^\s)]+))(?:\s+(?:"[^"\r\n]*"|'[^'\r\n]*'|\([^\r\n)]*\)))?\s*\)/g, markdownDestinationText(text), true)
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

function assetTarget(fromPath, literal, assetExtensions, ownerRelativeUrl = false) {
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
  } else if (withoutSuffix.includes("/") || ownerRelativeUrl) {
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
      const resolution = assetTarget(record.path, literal.value, assetExtensions, literal.ownerRelativeUrl)
      // Legacy scans retain examples as evidence, but a slash alone cannot prove CSS/Markdown URL context.
      const unprovenUrlContext = [".css", ".md"].includes(record.extension) && !literal.ownerRelativeUrl
      if (resolution?.invalid || (resolution && unprovenUrlContext)) {
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
