/**
 * 微信小程序版本更新：新版本下载完成后弹窗并强制重启。
 *
 * 依赖注入 manager / showModal 便于单测；不传时分别使用
 * wx.getUpdateManager() 和 uni.showModal。
 */
export function setupUpdateManager(options = {}) {
  const manager = options.manager || getWechatUpdateManager()
  if (!manager) return false

  const showModal =
    options.showModal || ((modalOptions) => uni.showModal(modalOptions))
  let handled = false

  manager.onUpdateReady(() => {
    if (handled) return
    handled = true
    showModal({
      title: '发现新版本',
      content: '新版本已下载完成，需要重启小程序后生效。',
      showCancel: false,
      confirmText: '立即重启',
      success: () => manager.applyUpdate(),
    })
  })

  manager.onUpdateFailed(() => {
    if (handled) return
    handled = true
    showModal({
      title: '更新失败',
      content: '新版本下载失败，请关闭小程序后重新打开再试。',
      showCancel: false,
      confirmText: '知道了',
    })
  })

  return true
}

function getWechatUpdateManager() {
  if (typeof wx === 'undefined' || typeof wx.getUpdateManager !== 'function') {
    return null
  }
  return wx.getUpdateManager()
}
