import { decodeHtmlUrl } from "./cleanup-html-url.mjs"

const isSpace = (character) => character === " " || character === "\t"
const asciiTrim = (value) => value.replace(/^[ \t\r\n]+|[ \t\r\n]+$/g, "")
const visualWidth = (value, column = 0) => {
  for (const character of value) column += character === "\t" ? 4 - column % 4 : 1
  return column
}
const escapable = /[!"#$%&'()*+,\-./:;<=>?@[\\\]^_`{|}~]/

function decodedEscape(text, cursor) {
  if (text[cursor] === "\\" && escapable.test(text[cursor + 1] ?? "")) {
    return { next: cursor + 2, value: text[cursor + 1] }
  }
  return { next: cursor + 1, value: text[cursor] }
}

function lineRows(text) {
  const rows = []
  for (let start = 0; start < text.length;) {
    let end = text.indexOf("\n", start)
    if (end < 0) end = text.length
    const contentEnd = end > start && text[end - 1] === "\r" ? end - 1 : end
    rows.push({ start, text: text.slice(start, contentEnd) })
    start = end + 1
  }
  return rows
}

/** Strip same-line block/list containers while retaining the raw destination offset. */
function containerBody(line) {
  let cursor = 0
  const tokens = []
  const indent = () => {
    let count = 0
    while (count < 3 && line[cursor] === " ") { cursor += 1; count += 1 }
  }
  indent()
  for (;;) {
    if (line[cursor] === ">") {
      tokens.push({ type: "quote" })
      cursor += 1
      if (isSpace(line[cursor])) cursor += 1
      indent()
      continue
    }
    const list = /^([-+*]|\d{1,9}[.)])([ \t]+)/.exec(line.slice(cursor))
    const listWidth = list ? visualWidth(list[2], list[1].length) : 0
    if (list && listWidth - list[1].length <= 4) {
      tokens.push({ interrupts: /^[-+*]$/.test(list[1]) || Number.parseInt(list[1], 10) === 1, type: "list", width: listWidth })
      cursor += list[0].length
      indent()
      continue
    }
    break
  }
  return { key: tokens.map((token) => token.type).join("/"), offset: cursor, startsAnyListItem: tokens.some((token) => token.type === "list"), startsListItem: tokens.some((token) => token.interrupts), text: line.slice(cursor), tokens }
}

/** A multiline definition remains inside every container opened on its first line. */
function continuationBody(line, prior) {
  let cursor = 0
  const indent = (limit, allowTabOvershoot = false) => {
    let count = 0
    while (count < limit && isSpace(line[cursor])) {
      const width = line[cursor] === "\t" ? 4 - count % 4 : 1
      if (!allowTabOvershoot && count + width > limit) break
      cursor += 1; count += width
    }
    return count
  }
  for (const token of prior.tokens) {
    if (token.type === "quote") {
      indent(3)
      if (line[cursor] !== ">") return null
      cursor += 1
      if (isSpace(line[cursor])) cursor += 1
    } else if (indent(token.width, true) < token.width) return null
  }
  indent(3)
  return { ...prior, offset: cursor, startsAnyListItem: false, startsListItem: false, text: line.slice(cursor) }
}

function labelEnd(text) {
  let cursor = 1
  let decoded = ""
  while (cursor < text.length) {
    if (text[cursor] === "]") return /[^ \t\r\n]/.test(decoded) && decoded.length <= 999
      ? { decoded, next: cursor + 1 } : null
    if (text[cursor] === "[" || text[cursor] === "\r") return null
    const part = decodedEscape(text, cursor)
    decoded += part.value
    cursor = part.next
  }
  return null
}

function angleDestination(text, cursor) {
  const start = cursor + 1
  let decoded = ""
  cursor = start
  while (cursor < text.length) {
    if (text[cursor] === ">") return { next: cursor + 1, rawStart: start, value: decoded }
    if (text[cursor] === "<" || text[cursor] === "\n" || text[cursor] === "\r") return null
    const part = decodedEscape(text, cursor)
    decoded += part.value
    cursor = part.next
  }
  return null
}

function bareDestination(text, cursor) {
  const start = cursor
  let decoded = ""
  let depth = 0
  while (cursor < text.length) {
    const character = text[cursor]
    if (isSpace(character)) break
    if (character === "<" || character.charCodeAt(0) < 0x20) return null
    if (character === "(" && depth < 32) { depth += 1; decoded += character; cursor += 1; continue }
    if (character === ")") {
      if (depth === 0) break
      depth -= 1; decoded += character; cursor += 1; continue
    }
    const part = decodedEscape(text, cursor)
    decoded += part.value
    cursor = part.next
  }
  return decoded && depth === 0 ? { next: cursor, rawStart: start, value: decoded } : null
}

function titleStatus(text) {
  const value = asciiTrim(text)
  if (!value) return "absent"
  const close = value[0] === "(" ? ")" : value[0]
  if (!["\"", "'", "("].includes(value[0])) return "invalid"
  for (let cursor = 1; cursor < value.length;) {
    if (value[0] === "(" && value[cursor] === "(") return "invalid"
    if (value[cursor] === close) return cursor === value.length - 1 ? "complete" : "invalid"
    cursor = decodedEscape(value, cursor).next
  }
  return "incomplete"
}

function decodedDestination(destination) {
  let ambiguous = false
  const value = destination.value.replace(/&(?:#[xX]?[A-Za-z0-9]+|[A-Za-z0-9]+);/g, (reference) => {
    const decoded = decodeHtmlUrl(reference)
    ambiguous ||= decoded.ambiguous.some(Boolean)
    return decoded.value
  })
  return { ...destination, ambiguous, value }
}

function normalizedLabel(value) {
  return value.replace(/^[ \t\r\n]+|[ \t\r\n]+$/g, "").replace(/[ \t\r\n]+/g, " ").toUpperCase().toLowerCase()
}

function interruptsParagraph(text, closesSetext) {
  const value = asciiTrim(text)
  return /^#{1,6}(?:[ \t]+|$)/.test(value) ||
    /^(?:(?:\*[ \t]*){3,}|(?:-[ \t]*){3,}|(?:_[ \t]*){3,})$/.test(value) ||
    closesSetext && /^=+[ \t]*$/.test(value)
}

function containerInterrupts(previous, body) {
  const prior = previous ? previous.split("/") : []
  let shared = 0
  while (shared < prior.length && prior[shared] === body.tokens[shared]?.type) shared += 1
  return body.tokens.slice(shared).some((token) => token.type === "quote" || token.interrupts)
}

function htmlBlockEnd(text) {
  const rawTag = /^<(script|pre|style|textarea)(?:[ \t>]|$)/i.exec(text)
  if (rawTag) return new RegExp(`</${rawTag[1]}[ \\t\\r\\n]*>`, "i")
  if (text.startsWith("<!--")) return /-->/
  if (text.startsWith("<?")) return /\?>/
  if (text.startsWith("<![CDATA[")) return /\]\]>/
  if (/^<![A-Z]/.test(text)) return />/
  return null
}

/** Continue a label only through lines that remain in its original container. */
function continuedLabel(lines, index, body) {
  let combined = body.text
  for (let lineIndex = index + 1; lineIndex < lines.length && combined.length <= 999; lineIndex += 1) {
    const continuation = continuationBody(lines[lineIndex].text, body)
    if (!continuation || !continuation.text) return null
    const lineStart = combined.length + 1
    combined += `\n${continuation.text}`
    const label = labelEnd(combined)
    if (label) return { body: continuation, label: { decoded: label.decoded, next: label.next - lineStart }, lineIndex }
    if (continuation.text.includes("]") || combined.slice(1).includes("[")) return null
  }
  return null
}

/** Parse definitions only where a CommonMark block definition can begin; code is pre-masked by the caller. */
export function markdownReferenceDefinitions(text) {
  const lines = lineRows(text)
  const definitions = []
  const labels = new Set()
  let paragraphContainer = null, activeList = null, rawHtmlEnd = null, rawHtmlContainer = null
  for (let index = 0; index < lines.length; index += 1) {
    const row = lines[index]
    const parsedBody = containerBody(row.text)
    let body = activeList && !parsedBody.startsAnyListItem ? continuationBody(row.text, activeList) ?? parsedBody : parsedBody
    if (rawHtmlEnd) {
      const rawBody = rawHtmlContainer.key === parsedBody.key ? parsedBody : continuationBody(row.text, rawHtmlContainer)
      if (rawBody) {
        if (rawHtmlEnd.test(rawBody.text)) { rawHtmlEnd = null; rawHtmlContainer = null }
        continue
      }
      rawHtmlEnd = null; rawHtmlContainer = null
    }
    const openedHtmlEnd = htmlBlockEnd(body.text)
    if (openedHtmlEnd) {
      if (!openedHtmlEnd.test(body.text.slice(1))) { rawHtmlEnd = openedHtmlEnd; rawHtmlContainer = body }
      paragraphContainer = null; continue
    }
    if (!asciiTrim(body.text)) { paragraphContainer = null; continue }
    if (activeList && body === parsedBody) activeList = null
    if (interruptsParagraph(body.text, paragraphContainer === body.key)) { paragraphContainer = null; continue }
    if (paragraphContainer !== null && (paragraphContainer === body.key
      ? !body.startsAnyListItem : !containerInterrupts(paragraphContainer, body))) {
      paragraphContainer = body.key
      continue
    }
    if (parsedBody.startsAnyListItem) activeList = parsedBody
    let definitionBody = body
    let definitionLineIndex = index
    let label = body.text[0] === "[" ? labelEnd(body.text) : null
    if (!label && body.text[0] === "[") {
      const continued = continuedLabel(lines, index, body)
      if (continued) {
        ({ body: definitionBody, label, lineIndex: definitionLineIndex } = continued)
        index = definitionLineIndex
      }
    }
    if (!label || definitionBody.text[label.next] !== ":") { paragraphContainer = body.key; continue }
    let destinationBody = definitionBody
    let destinationLineIndex = definitionLineIndex
    let cursor = label.next + 1
    while (isSpace(destinationBody.text[cursor])) cursor += 1
    if (cursor === destinationBody.text.length) {
      const next = lines[index + 1]
      if (!next) { paragraphContainer = body.key; continue }
      const lazyBody = containerBody(next.text)
      const compatibleLazy = body.tokens.length && lazyBody.tokens.length <= body.tokens.length && lazyBody.tokens.every((token, tokenIndex) => token.type === body.tokens[tokenIndex].type)
      destinationBody = continuationBody(next.text, body) ?? (compatibleLazy ? lazyBody : null)
      if (!destinationBody) { paragraphContainer = body.key; continue }
      destinationLineIndex = index + 1
      cursor = 0
      while (isSpace(destinationBody.text[cursor])) cursor += 1
      index += 1
    }
    const destination = destinationBody.text[cursor] === "<"
      ? angleDestination(destinationBody.text, cursor)
      : bareDestination(destinationBody.text, cursor)
    if (!destination) { paragraphContainer = body.key; continue }
    let remainder = destinationBody.text.slice(destination.next)
    if (remainder && !isSpace(remainder[0])) { paragraphContainer = body.key; continue }
    remainder = asciiTrim(remainder)
    if (!remainder && lines[index + 1]) {
      const titleBody = continuationBody(lines[index + 1].text, body)
      let title = asciiTrim(titleBody?.text ?? "")
      let titleIndex = index + 1
      if (["\"", "'", "("].includes(title[0])) {
        while (titleStatus(title) === "incomplete" && lines[titleIndex + 1]) {
          const continuation = asciiTrim(continuationBody(lines[titleIndex + 1].text, body)?.text ?? "")
          if (!continuation) break
          title += `\n${continuation}`; titleIndex += 1
        }
        if (titleStatus(title) === "complete") { remainder = title; index = titleIndex }
      }
    }
    while (titleStatus(remainder) === "incomplete" && lines[index + 1]) {
      const continuation = asciiTrim(continuationBody(lines[index + 1].text, body)?.text ?? "")
      if (!continuation) break
      remainder += `\n${continuation}`; index += 1
    }
    if (remainder && titleStatus(remainder) !== "complete") { paragraphContainer = body.key; continue }
    const normalized = normalizedLabel(decodedDestination({ value: label.decoded }).value)
    if (!labels.has(normalized)) {
      labels.add(normalized)
      const decoded = decodedDestination(destination)
      definitions.push({
        ambiguous: decoded.ambiguous,
        offset: lines[destinationLineIndex].start + destinationBody.offset + destination.rawStart,
        value: decoded.value,
      })
    }
    paragraphContainer = null
  }
  return definitions
}
