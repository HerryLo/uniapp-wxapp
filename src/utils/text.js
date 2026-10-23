export function dedupeLines(text, options = {}) {
  const ignoreCase = !!options.ignoreCase
  const trim = !!options.trim
  const seen = new Set()
  const out = []
  for (let line of String(text).split(/\r?\n/)) {
    if (trim) line = line.trim()
    if (line.trim() === '') continue
    const key = ignoreCase ? line.toLowerCase() : line
    if (seen.has(key)) continue
    seen.add(key)
    out.push(line)
  }
  return out.join('\n')
}

export function toUpperCaseText(text) {
  return String(text).toUpperCase()
}

export function toLowerCaseText(text) {
  return String(text).toLowerCase()
}

export function toTitleCaseText(text) {
  return String(text)
    .toLowerCase()
    .replace(/(^|\s)([a-z])/g, (match, space, letter) => space + letter.toUpperCase())
}

export function countText(text) {
  const s = String(text)
  if (!s) return { lines: 0, chars: 0 }
  return {
    lines: s.split(/\r?\n/).length,
    chars: s.replace(/\r?\n/g, '').length,
  }
}
