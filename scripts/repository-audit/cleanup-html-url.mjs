import htmlNamedReferences from "./cleanup-html-named-references.json" with { type: "json" }

const C1_REPLACEMENTS = [
  8364, 0, 8218, 402, 8222, 8230, 8224, 8225, 710, 8240, 352, 8249, 338, 0, 381, 0,
  0, 8216, 8217, 8220, 8221, 8226, 8211, 8212, 732, 8482, 353, 8250, 339, 0, 382, 376,
]
const MAX_NAMED_REFERENCE_LENGTH = Math.max(...Object.keys(htmlNamedReferences).map((name) => name.length))

function replacementCodePoint(codePoint) {
  if (codePoint === 0 || codePoint > 0x10ffff || codePoint >= 0xd800 && codePoint <= 0xdfff) return 0xfffd
  if (codePoint >= 0x80 && codePoint <= 0x9f) return C1_REPLACEMENTS[codePoint - 0x80] || codePoint
  return codePoint
}

function namedReference(value, start) {
  const limit = Math.min(value.length, start + MAX_NAMED_REFERENCE_LENGTH)
  for (let end = limit; end > start; end -= 1) {
    const name = value.slice(start, end)
    if (!Object.hasOwn(htmlNamedReferences, name)) continue
    if (!name.endsWith(";") && /[A-Za-z0-9=]/.test(value[end] ?? "")) return null
    return { consumed: name.length + 1, replacement: htmlNamedReferences[name] }
  }
  return null
}

/** Decode WHATWG HTML attribute references while mapping decoded UTF-16 units to raw offsets. */
export function decodeHtmlUrl(value) {
  const decoded = []
  const rawOffsets = []
  const ambiguous = []
  const append = (text, rawOffset, unsafe = false) => {
    for (const character of text) {
      decoded.push(character)
      for (let index = 0; index < character.length; index += 1) {
        rawOffsets.push(rawOffset)
        ambiguous.push(unsafe)
      }
    }
  }
  for (let cursor = 0; cursor < value.length;) {
    if (value[cursor] !== "&") { append(value[cursor], cursor); cursor += 1; continue }
    const numeric = value.slice(cursor).match(/^&#(?:[xX]([0-9a-fA-F]+)|([0-9]+));?/)
    if (numeric) {
      const codePoint = Number.parseInt(numeric[1] ?? numeric[2], numeric[1] ? 16 : 10)
      append(String.fromCodePoint(replacementCodePoint(codePoint)), cursor)
      cursor += numeric[0].length
      continue
    }
    const named = namedReference(value, cursor + 1)
    if (named) {
      append(named.replacement, cursor)
      cursor += named.consumed
      continue
    }
    const remainder = value.slice(cursor)
    const malformedNumeric = /^&#[xX]?[0-9A-Za-z]*;/.test(remainder)
    const unknownNamed = /^&[A-Za-z0-9]+;/.test(remainder)
    const unsafe = malformedNumeric || unknownNamed
    append("&", cursor, unsafe)
    cursor += 1
  }
  return { value: decoded.join(""), rawOffsets, ambiguous }
}
