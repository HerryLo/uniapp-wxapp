export const RATE_PRESETS = [13, 9, 6, 5, 3, 1]

const MAX_AMOUNT_CENTS = 100000000000

export function toCents(input) {
  const s = String(input).trim()
  if (!/^\d+(\.\d*)?$/.test(s)) return null
  const [intPart, fracPart = ''] = s.split('.')
  const frac = (fracPart + '000').slice(0, 3)
  let cents = Number(intPart) * 100 + Number(frac.slice(0, 2))
  if (Number(frac[2]) >= 5) cents += 1
  if (!Number.isSafeInteger(cents)) return null
  return cents
}

export function toBasisPoints(input) {
  const s = String(input).trim()
  if (!/^\d+(\.\d{0,2})?$/.test(s)) return null
  const [intPart, fracPart = ''] = s.split('.')
  const bp = Number(intPart) * 100 + Number((fracPart + '00').slice(0, 2))
  return bp > 10000 ? null : bp
}

export function validateAmount(input) {
  if (String(input).trim() === '') return { error: '请输入金额' }
  const cents = toCents(input)
  if (cents === null) return { error: '请输入有效数字' }
  if (cents <= 0) return { error: '金额必须大于 0' }
  if (cents > MAX_AMOUNT_CENTS) return { error: '金额过大' }
  return { cents }
}

export function validateRate(input) {
  if (String(input).trim() === '') return { error: '请输入税率' }
  const bp = toBasisPoints(input)
  if (bp === null || bp > 10000) return { error: '请输入 0–100 的税率' }
  return { bp }
}

export function calcVat(amountCents, bp, mode) {
  if (mode === 'included') {
    const netCents = Math.round((amountCents * 10000) / (10000 + bp))
    return { netCents, taxCents: amountCents - netCents, grossCents: amountCents }
  }
  const taxCents = Math.round((amountCents * bp) / 10000)
  return { netCents: amountCents, taxCents, grossCents: amountCents + taxCents }
}

export function formatCents(cents) {
  return (cents / 100).toFixed(2)
}

export function formatVatText({ net, tax, gross }) {
  return `不含税金额：${net}\n税额：${tax}\n价税合计：${gross}`
}
