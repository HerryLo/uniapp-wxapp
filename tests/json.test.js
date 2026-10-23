import { describe, it, expect } from 'vitest'
import { formatJson, minifyJson, validateJson } from '../src/utils/json.js'

describe('json', () => {
  it('formats with two spaces', () => {
    expect(formatJson('{"a":1}')).toEqual({ text: '{\n  "a": 1\n}' })
    expect(formatJson('')).toEqual({ error: '请输入 JSON 内容' })
  })

  it('minifies', () => {
    expect(minifyJson('{ "a": 1, "b": [2] }')).toEqual({ text: '{"a":1,"b":[2]}' })
  })

  it('validates', () => {
    expect(validateJson('{"a":1}')).toEqual({ ok: true })
    expect(validateJson('{bad').error.startsWith('JSON 格式错误：')).toBe(true)
  })
})
