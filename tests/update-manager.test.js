import { describe, it, expect, vi } from 'vitest'
import { setupUpdateManager } from '../src/utils/update.js'

function createFakeManager() {
  const handlers = {}
  return {
    onUpdateReady: vi.fn((callback) => {
      handlers.ready = callback
    }),
    onUpdateFailed: vi.fn((callback) => {
      handlers.failed = callback
    }),
    applyUpdate: vi.fn(),
    fireReady: () => handlers.ready(),
    fireFailed: () => handlers.failed(),
  }
}

describe('setupUpdateManager', () => {
  it('returns false when no update manager is available', () => {
    expect(setupUpdateManager({ manager: null })).toBe(false)
  })

  it('registers both update handlers', () => {
    const manager = createFakeManager()
    const showModal = vi.fn()
    expect(setupUpdateManager({ manager, showModal })).toBe(true)
    expect(manager.onUpdateReady).toHaveBeenCalledTimes(1)
    expect(manager.onUpdateFailed).toHaveBeenCalledTimes(1)
  })

  it('forces a restart after showing the update modal', () => {
    const manager = createFakeManager()
    const showModal = vi.fn()
    setupUpdateManager({ manager, showModal })
    manager.fireReady()

    expect(showModal).toHaveBeenCalledTimes(1)
    expect(showModal.mock.calls[0][0]).toMatchObject({
      title: '发现新版本',
      showCancel: false,
      confirmText: '立即重启',
    })
    expect(manager.applyUpdate).not.toHaveBeenCalled()

    showModal.mock.calls[0][0].success()
    expect(manager.applyUpdate).toHaveBeenCalledTimes(1)
  })

  it('only asks once even if the ready event repeats', () => {
    const manager = createFakeManager()
    const showModal = vi.fn()
    setupUpdateManager({ manager, showModal })
    manager.fireReady()
    manager.fireReady()
    expect(showModal).toHaveBeenCalledTimes(1)
  })

  it('explains a failed download instead of restarting', () => {
    const manager = createFakeManager()
    const showModal = vi.fn()
    setupUpdateManager({ manager, showModal })
    manager.fireFailed()

    expect(showModal.mock.calls[0][0]).toMatchObject({
      title: '更新失败',
      showCancel: false,
    })
    expect(manager.applyUpdate).not.toHaveBeenCalled()
  })
})
