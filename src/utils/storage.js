let warned = false

function warnCorruptOnce() {
  if (warned) return
  warned = true
  if (typeof uni !== 'undefined' && typeof uni.showToast === 'function') {
    uni.showToast({ title: '部分本地数据损坏，已跳过', icon: 'none' })
  }
}

export function readStorage(key, fallback) {
  try {
    const raw = uni.getStorageSync(key)
    if (raw === '' || raw === null || raw === undefined) return fallback
    return typeof raw === 'string' ? JSON.parse(raw) : raw
  } catch (e) {
    warnCorruptOnce()
    return fallback
  }
}

export function writeStorage(key, value) {
  try {
    uni.setStorageSync(key, JSON.stringify(value))
    return true
  } catch (e) {
    return false
  }
}

export function removeStorage(key) {
  try {
    uni.removeStorageSync(key)
    return true
  } catch (e) {
    return false
  }
}
