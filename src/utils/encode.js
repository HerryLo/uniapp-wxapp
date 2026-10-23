const BASE64_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'

function utf8Bytes(text) {
  const bytes = []
  for (const ch of String(text)) {
    const code = ch.codePointAt(0)
    if (code < 0x80) {
      bytes.push(code)
    } else if (code < 0x800) {
      bytes.push(0xc0 | (code >> 6), 0x80 | (code & 63))
    } else if (code < 0x10000) {
      bytes.push(0xe0 | (code >> 12), 0x80 | ((code >> 6) & 63), 0x80 | (code & 63))
    } else {
      bytes.push(
        0xf0 | (code >> 18),
        0x80 | ((code >> 12) & 63),
        0x80 | ((code >> 6) & 63),
        0x80 | (code & 63),
      )
    }
  }
  return bytes
}

function utf8String(bytes) {
  let result = ''
  for (let i = 0; i < bytes.length;) {
    const first = bytes[i++]
    if (first < 0x80) {
      result += String.fromCodePoint(first)
    } else if ((first & 0xe0) === 0xc0) {
      result += String.fromCodePoint(((first & 0x1f) << 6) | (bytes[i++] & 0x3f))
    } else if ((first & 0xf0) === 0xe0) {
      result += String.fromCodePoint(
        ((first & 0x0f) << 12) | ((bytes[i++] & 0x3f) << 6) | (bytes[i++] & 0x3f),
      )
    } else if ((first & 0xf8) === 0xf0) {
      result += String.fromCodePoint(
        ((first & 0x07) << 18) |
        ((bytes[i++] & 0x3f) << 12) |
        ((bytes[i++] & 0x3f) << 6) |
        (bytes[i++] & 0x3f),
      )
    } else {
      throw new Error('invalid utf8')
    }
  }
  return result
}

export function base64Encode(text) {
  const bytes = utf8Bytes(text)
  let out = ''
  for (let i = 0; i < bytes.length; i += 3) {
    const b1 = bytes[i]
    const b2 = i + 1 < bytes.length ? bytes[i + 1] : 0
    const b3 = i + 2 < bytes.length ? bytes[i + 2] : 0
    out += BASE64_CHARS[b1 >> 2]
    out += BASE64_CHARS[((b1 & 3) << 4) | (b2 >> 4)]
    out += i + 1 < bytes.length ? BASE64_CHARS[((b2 & 15) << 2) | (b3 >> 6)] : '='
    out += i + 2 < bytes.length ? BASE64_CHARS[b3 & 63] : '='
  }
  return out
}

export function base64Decode(text) {
  const s = String(text).replace(/\s+/g, '')
  if (!/^[A-Za-z0-9+/]*={0,2}$/.test(s) || s.length % 4 !== 0) {
    return { error: '输入不是合法的 Base64' }
  }
  const bytes = []
  for (let i = 0; i < s.length; i += 4) {
    const chunk = s.slice(i, i + 4)
    const values = []
    for (const ch of chunk) {
      values.push(ch === '=' ? 0 : BASE64_CHARS.indexOf(ch))
    }
    bytes.push((values[0] << 2) | (values[1] >> 4))
    if (chunk[2] !== '=') bytes.push(((values[1] & 15) << 4) | (values[2] >> 2))
    if (chunk[3] !== '=') bytes.push(((values[2] & 3) << 6) | values[3])
  }
  try {
    return { text: utf8String(bytes) }
  } catch (e) {
    return { error: '输入不是合法的 Base64' }
  }
}

export function urlEncode(text) {
  return encodeURIComponent(String(text))
}

export function urlDecode(text) {
  try {
    return { text: decodeURIComponent(String(text)) }
  } catch (e) {
    return { error: '输入不是合法的 URL 编码' }
  }
}
