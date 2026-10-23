const DIGITS = '0123456789abcdefghijklmnopqrstuvwxyz'
const MAX_LENGTH = 512

export function parseRadix(input, base) {
  const s = String(input).trim()
  if (!s) return { error: '请输入数值' }
  let sign = 1n
  let body = s
  if (body[0] === '-') {
    sign = -1n
    body = body.slice(1)
  } else if (body[0] === '+') {
    body = body.slice(1)
  }
  if (!body) return { error: '请输入数值' }
  if (body.includes('.')) return { error: '暂不支持小数' }
  if (body.length > MAX_LENGTH) return { error: '输入过长' }
  const bigBase = BigInt(base)
  let value = 0n
  for (const ch of body.toLowerCase()) {
    const digit = DIGITS.indexOf(ch)
    if (digit < 0 || digit >= base) {
      return { error: `输入包含非 ${base} 进制字符` }
    }
    value = value * bigBase + BigInt(digit)
  }
  return { value: sign * value }
}

export function convertRadix(input, base) {
  const parsed = parseRadix(input, base)
  if (parsed.error) return parsed
  const value = parsed.value
  return {
    bin: value.toString(2),
    oct: value.toString(8),
    dec: value.toString(10),
    hex: value.toString(16).toUpperCase(),
  }
}
