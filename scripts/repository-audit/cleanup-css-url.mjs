const isCssWhitespace = (character) => /[\t\n\f\r ]/.test(character)
const isHex = (character) => /[0-9A-Fa-f]/.test(character)
const isDigit = (character) => /[0-9]/.test(character ?? "")
const isNameStart = (character) => Boolean(character) && (/[A-Za-z_]/.test(character) || character.codePointAt(0) >= 0x80)
const isName = (character) => isNameStart(character) || /[0-9-]/.test(character ?? "")
const isNewline = (character) => ["\n", "\r", "\f"].includes(character)
const isUrlEdgeWhitespace = (character) => Boolean(character) && character.charCodeAt(0) <= 0x20
const cssInputCharacter = (text, index) => text[index] === "\0"
  ? "�"
  : text.codePointAt(index) === undefined ? "" : String.fromCodePoint(text.codePointAt(index))

function cssScalar(codePoint) {
  return codePoint === 0 || codePoint > 0x10ffff || codePoint >= 0xd800 && codePoint <= 0xdfff
    ? 0xfffd
    : codePoint
}

function consumeEscape(text, start, quoted) {
  let cursor = start + 1
  if (cursor >= text.length) return { next: cursor, replacement: "", valid: false }
  if (["\n", "\r", "\f"].includes(text[cursor])) {
    if (text[cursor] === "\r" && text[cursor + 1] === "\n") cursor += 1
    return { next: cursor + 1, replacement: "", valid: quoted }
  }
  const digitsStart = cursor
  while (cursor < text.length && cursor - digitsStart < 6 && isHex(text[cursor])) cursor += 1
  if (cursor > digitsStart) {
    const codePoint = Number.parseInt(text.slice(digitsStart, cursor), 16)
    if (isCssWhitespace(text[cursor])) {
      if (text[cursor] === "\r" && text[cursor + 1] === "\n") cursor += 1
      cursor += 1
    }
    return { next: cursor, replacement: String.fromCodePoint(cssScalar(codePoint)), valid: true }
  }
  return { next: cursor + 1, replacement: cssInputCharacter(text, cursor), valid: true }
}

function startsIdentifier(text, start) {
  const first = cssInputCharacter(text, start)
  const second = cssInputCharacter(text, start + 1)
  if (isNameStart(first)) return true
  if (first === "-") return isNameStart(second) || second === "-" || second === "\\" && !isNewline(text[start + 2])
  return first === "\\" && second !== undefined && !isNewline(second)
}

/** Decode one complete CSS identifier so only the full `url` function token is accepted. */
function cssIdentifier(text, start) {
  const decoded = []
  let cursor = start
  let valid = true
  while (cursor < text.length) {
    const character = cssInputCharacter(text, cursor)
    if (isName(character)) {
      decoded.push(character)
      cursor += character.length
    } else if (text[cursor] === "\\" && !isNewline(text[cursor + 1])) {
      const escape = consumeEscape(text, cursor, false)
      decoded.push(escape.replacement)
      valid &&= escape.valid
      cursor = escape.next
    } else break
  }
  return { decoded: decoded.join(""), next: cursor, valid }
}

function startsNumber(text, start) {
  let cursor = start
  if (["+", "-"].includes(text[cursor])) cursor += 1
  return isDigit(text[cursor]) || text[cursor] === "." && isDigit(text[cursor + 1])
}

/** Consume a CSS number before its optional identifier-like dimension unit. */
function cssNumberEnd(text, start) {
  let cursor = start
  if (["+", "-"].includes(text[cursor])) cursor += 1
  while (isDigit(text[cursor])) cursor += 1
  if (text[cursor] === "." && isDigit(text[cursor + 1])) {
    cursor += 1
    while (isDigit(text[cursor])) cursor += 1
  }
  if (["e", "E"].includes(text[cursor])) {
    const exponent = ["+", "-"].includes(text[cursor + 1]) ? cursor + 2 : cursor + 1
    if (isDigit(text[exponent])) {
      cursor = exponent + 1
      while (isDigit(text[cursor])) cursor += 1
    }
  }
  return cursor
}

function skipOpaqueString(text, start) {
  const quote = text[start]
  for (let cursor = start + 1; cursor < text.length;) {
    if (text[cursor] === quote) return cursor + 1
    if (text[cursor] === "\\") cursor = consumeEscape(text, cursor, true).next
    else cursor += 1
  }
  return text.length
}

function skipToUrlEnd(text, start) {
  let cursor = start
  while (cursor < text.length && text[cursor] !== ")") {
    if (["\"", "'"].includes(text[cursor])) cursor = skipOpaqueString(text, cursor)
    else if (text[cursor] === "\\") cursor = consumeEscape(text, cursor, false).next
    else cursor += 1
  }
  return Math.min(text.length, cursor + 1)
}

function cssUrlToken(text, openParen) {
  let cursor = openParen + 1
  while (isCssWhitespace(text[cursor])) cursor += 1
  const quote = ["\"", "'"].includes(text[cursor]) ? text[cursor++] : null
  const initialOffset = cursor
  const decoded = []
  const rawOffsets = []
  let ambiguous = false
  const append = (replacement, rawOffset) => {
    decoded.push(replacement)
    for (let index = 0; index < replacement.length; index += 1) rawOffsets.push(rawOffset)
  }
  const finish = (end, resume) => {
    const rawValue = decoded.join("")
    const value = []
    const offsets = []
    for (let index = 0; index < rawValue.length; index += 1) {
      if (["\t", "\n", "\r"].includes(rawValue[index])) continue
      value.push(rawValue[index])
      offsets.push(rawOffsets[index])
    }
    const joined = value.join("")
    let start = 0
    let finish = joined.length
    while (start < finish && isUrlEdgeWhitespace(joined[start])) start += 1
    while (finish > start && isUrlEdgeWhitespace(joined[finish - 1])) finish -= 1
    return {
      ambiguous, end, offset: offsets[start] ?? initialOffset,
      resume, value: joined.slice(start, finish),
    }
  }
  while (cursor < text.length) {
    const character = text[cursor]
    if (character === "\\") {
      const escape = consumeEscape(text, cursor, Boolean(quote))
      append(escape.replacement, cursor)
      ambiguous ||= !escape.valid
      cursor = escape.next
      continue
    }
    if (quote ? character === quote : character === ")") {
      const end = cursor
      cursor += 1
      if (quote) {
        while (isCssWhitespace(text[cursor])) cursor += 1
        if (text[cursor] !== ")") {
          ambiguous = true
          return finish(end, skipToUrlEnd(text, cursor))
        }
        cursor += 1
      }
      return finish(end, cursor)
    }
    if (!quote && isCssWhitespace(character)) {
      const end = cursor
      while (isCssWhitespace(text[cursor])) cursor += 1
      if (text[cursor] === ")") return finish(end, cursor + 1)
      ambiguous = true
      return finish(end, skipToUrlEnd(text, cursor))
    }
    if (!quote && ["\"", "'", "("].includes(character)) ambiguous = true
    if (quote && ["\n", "\r", "\f"].includes(character)) ambiguous = true
    if (text.startsWith("/*", cursor)) ambiguous = true
    const decodedCharacter = cssInputCharacter(text, cursor)
    append(decodedCharacter, cursor)
    cursor += decodedCharacter.length
  }
  ambiguous = true
  return finish(cursor, cursor)
}

/** Tokenize live CSS url() values and decode escapes without exposing raw literals. */
export function cssUrlTokens(text) {
  const rows = []
  for (let cursor = 0; cursor < text.length;) {
    if (text.startsWith("/*", cursor)) {
      const end = text.indexOf("*/", cursor + 2)
      cursor = end < 0 ? text.length : end + 2
      continue
    }
    if (["\"", "'"].includes(text[cursor])) {
      cursor = skipOpaqueString(text, cursor)
      continue
    }
    if (startsNumber(text, cursor)) {
      cursor = cssNumberEnd(text, cursor)
      if (startsIdentifier(text, cursor)) cursor = cssIdentifier(text, cursor).next
      continue
    }
    if (
      text[cursor] === "@" && startsIdentifier(text, cursor + 1) ||
      text[cursor] === "#" && (isName(cssInputCharacter(text, cursor + 1)) || startsIdentifier(text, cursor + 1))
    ) {
      cursor = cssIdentifier(text, cursor + 1).next
      continue
    }
    if (startsIdentifier(text, cursor) && !isName(cssInputCharacter(text, cursor - 1))) {
      const identifier = cssIdentifier(text, cursor)
      if (identifier.valid && identifier.decoded.toLowerCase() === "url" && text[identifier.next] === "(") {
        const token = cssUrlToken(text, identifier.next)
        rows.push({ value: token.value, offset: token.offset, end: token.end, ambiguous: token.ambiguous })
        cursor = token.resume
        continue
      }
      cursor = identifier.next
      continue
    }
    cursor += 1
  }
  return rows
}
