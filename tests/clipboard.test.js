import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { copyText } from '../src/utils/clipboard.js'

describe('clipboard', () => {
  beforeEach(() => {
    vi.stubGlobal('uni', {
      setClipboardData: vi.fn(),
      showToast: vi.fn(),
    })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('copies text and toasts on success', () => {
    expect(copyText('hello')).toBe(true)
    expect(uni.setClipboardData).toHaveBeenCalledWith(expect.objectContaining({ data: 'hello' }))
    const options = uni.setClipboardData.mock.calls[0][0]
    options.success()
    expect(uni.showToast).toHaveBeenCalledWith({ title: '已复制', icon: 'none' })
  })

  it('warns instead of copying when the value is empty', () => {
    expect(copyText('')).toBe(false)
    expect(copyText(null)).toBe(false)
    expect(uni.setClipboardData).not.toHaveBeenCalled()
    expect(uni.showToast).toHaveBeenCalledWith({ title: '暂无可复制结果', icon: 'none' })
  })

  it('allows a custom empty message', () => {
    copyText('', { emptyMessage: '没有内容' })
    expect(uni.showToast).toHaveBeenCalledWith({ title: '没有内容', icon: 'none' })
  })

  it('toasts when the clipboard write fails', () => {
    copyText('hello')
    const options = uni.setClipboardData.mock.calls[0][0]
    options.fail()
    expect(uni.showToast).toHaveBeenCalledWith({ title: '复制失败', icon: 'none' })
  })
})
