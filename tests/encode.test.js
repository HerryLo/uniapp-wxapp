import { describe, it, expect } from 'vitest'
import { base64Encode, base64Decode, urlEncode, urlDecode } from '../src/utils/encode.js'

describe('encode', () => {
  it('base64 encodes ASCII and UTF-8', () => {
    expect(base64Encode('hello')).toBe('aGVsbG8=')
    expect(base64Encode('你好')).toBe('5L2g5aW9')
    expect(base64Encode('😀')).toBe('8J+YgA==')
  })

  it('base64 decodes ASCII and UTF-8', () => {
    expect(base64Decode('aGVsbG8=')).toEqual({ text: 'hello' })
    expect(base64Decode('5L2g5aW9')).toEqual({ text: '你好' })
    expect(base64Decode('8J+YgA==')).toEqual({ text: '😀' })
  })

  it('rejects invalid base64', () => {
    expect(base64Decode('!!!')).toEqual({ error: '输入不是合法的 Base64' })
    expect(base64Decode('abc')).toEqual({ error: '输入不是合法的 Base64' })
    expect(base64Decode('5L0=')).toEqual({ error: '输入不是合法的 Base64' })
    expect(base64Decode('wIA=')).toEqual({ error: '输入不是合法的 Base64' })
    expect(base64Decode('7aCA')).toEqual({ error: '输入不是合法的 Base64' })
  })

  it('url encodes and decodes', () => {
    expect(urlEncode('a b&c')).toBe('a%20b%26c')
    expect(urlDecode('a%20b%26c')).toEqual({ text: 'a b&c' })
    expect(urlDecode('%E4%BD')).toEqual({ error: '输入不是合法的 URL 编码' })
  })
})
