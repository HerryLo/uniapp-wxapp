let warned = false
let storageDriver = null
const listeners = new Set()

function defaultDriver() {
  return {
    get: (key) => uni.getStorageSync(key),
    set: (key, value) => uni.setStorageSync(key, value),
    remove: (key) => uni.removeStorageSync(key),
    keys: () => {
      const info = uni.getStorageInfoSync()
      return info && Array.isArray(info.keys) ? info.keys : []
    },
  }
}

function currentDriver() {
  return storageDriver || defaultDriver()
}

export function setStorageDriver(driver) {
  if (driver != null) {
    for (const method of ['get', 'set', 'remove']) {
      if (typeof driver[method] !== 'function') {
        throw new Error(`storage driver is missing ${method}()`)
      }
    }
  }
  storageDriver = driver
}

export function getStorageDriver() {
  return storageDriver
}

export function onStorageChange(listener) {
  if (typeof listener !== 'function') return () => {}
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

function emitChange(event) {
  for (const listener of [...listeners]) {
    try {
      listener(event)
    } catch (e) {
      // 同步监听器不应影响本地写入
    }
  }
}

function warnCorruptOnce() {
  if (warned) return
  warned = true
  if (typeof uni !== 'undefined' && typeof uni.showToast === 'function') {
    uni.showToast({ title: '部分本地数据损坏，已跳过', icon: 'none' })
  }
}

export function storageKeys() {
  try {
    const driver = currentDriver()
    if (typeof driver.keys === 'function') return driver.keys()
    return []
  } catch (e) {
    return []
  }
}

export function readStorage(key, fallback) {
  try {
    const raw = currentDriver().get(key)
    if (raw === '' || raw === null || raw === undefined) return fallback
    return typeof raw === 'string' ? JSON.parse(raw) : raw
  } catch (e) {
    warnCorruptOnce()
    return fallback
  }
}

export function writeStorage(key, value) {
  try {
    currentDriver().set(key, JSON.stringify(value))
    emitChange({ type: 'write', key })
    return true
  } catch (e) {
    return false
  }
}

export function removeStorage(key) {
  try {
    currentDriver().remove(key)
    emitChange({ type: 'remove', key })
    return true
  } catch (e) {
    return false
  }
}
