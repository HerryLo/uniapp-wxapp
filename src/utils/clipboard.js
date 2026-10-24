export function copyText(text, options = {}) {
  const value = text == null ? '' : String(text)
  if (!value) {
    uni.showToast({ title: options.emptyMessage || '暂无可复制结果', icon: 'none' })
    return false
  }
  uni.setClipboardData({
    data: value,
    success: () => uni.showToast({ title: '已复制', icon: 'none' }),
    fail: () => uni.showToast({ title: '复制失败', icon: 'none' }),
  })
  return true
}
