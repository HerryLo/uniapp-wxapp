export const UNIT_GROUPS = {
  length: {
    label: '长度',
    units: [
      { key: 'mm', label: '毫米', factor: 0.001 },
      { key: 'cm', label: '厘米', factor: 0.01 },
      { key: 'm', label: '米', factor: 1 },
      { key: 'km', label: '千米', factor: 1000 },
      { key: 'inch', label: '英寸', factor: 0.0254 },
      { key: 'foot', label: '英尺', factor: 0.3048 },
      { key: 'mile', label: '英里', factor: 1609.344 },
    ],
  },
  weight: {
    label: '重量',
    units: [
      { key: 'g', label: '克', factor: 1 },
      { key: 'kg', label: '千克', factor: 1000 },
      { key: 't', label: '吨', factor: 1000000 },
      { key: 'jin', label: '斤', factor: 500 },
      { key: 'lb', label: '磅', factor: 453.59237 },
      { key: 'oz', label: '盎司', factor: 28.349523125 },
    ],
  },
  temperature: {
    label: '温度',
    units: [
      { key: 'c', label: '摄氏度' },
      { key: 'f', label: '华氏度' },
      { key: 'k', label: '开尔文' },
    ],
  },
  storage: {
    label: '存储',
    units: [
      { key: 'b', label: 'B', factor: 1 },
      { key: 'kb', label: 'KB', factor: 1024 },
      { key: 'mb', label: 'MB', factor: 1024 ** 2 },
      { key: 'gb', label: 'GB', factor: 1024 ** 3 },
      { key: 'tb', label: 'TB', factor: 1024 ** 4 },
    ],
  },
  area: {
    label: '面积',
    units: [
      { key: 'cm2', label: '平方厘米', factor: 0.0001 },
      { key: 'm2', label: '平方米', factor: 1 },
      { key: 'km2', label: '平方千米', factor: 1000000 },
      { key: 'mu', label: '亩', factor: 666.6666666666666 },
      { key: 'hectare', label: '公顷', factor: 10000 },
      { key: 'ft2', label: '平方英尺', factor: 0.09290304 },
    ],
  },
}

function toCelsius(groupKey, value, unitKey) {
  if (groupKey !== 'temperature') return null
  if (unitKey === 'c') return value
  if (unitKey === 'f') return ((value - 32) * 5) / 9
  if (unitKey === 'k') return value - 273.15
  return null
}

function fromCelsius(value, unitKey) {
  if (unitKey === 'c') return value
  if (unitKey === 'f') return (value * 9) / 5 + 32
  if (unitKey === 'k') return value + 273.15
  return null
}

export function convertUnit(groupKey, value, fromKey, toKey) {
  const group = UNIT_GROUPS[groupKey]
  if (!group) return null
  if (groupKey === 'temperature') {
    const celsius = toCelsius(groupKey, value, fromKey)
    if (celsius === null) return null
    return fromCelsius(celsius, toKey)
  }
  const from = group.units.find((u) => u.key === fromKey)
  const to = group.units.find((u) => u.key === toKey)
  if (!from || !to) return null
  return (value * from.factor) / to.factor
}

export function formatUnitValue(value) {
  if (!Number.isFinite(value)) return ''
  return String(Math.round(value * 1e6) / 1e6)
}
