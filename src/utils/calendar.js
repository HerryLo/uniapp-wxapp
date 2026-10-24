export function canAddCalendar() {
  // #ifdef MP-WEIXIN
  return typeof wx !== 'undefined' && typeof wx.addPhoneCalendar === 'function'
  // #endif
  // #ifndef MP-WEIXIN
  return false
  // #endif
}

export function addTodoToCalendar({ title, dueAt, description = '来自工具箱待办清单' }) {
  // #ifdef MP-WEIXIN
  return new Promise((resolve, reject) => {
    wx.addPhoneCalendar({
      title: `待办：${title}`,
      startTime: Math.floor(dueAt / 1000),
      endTime: Math.floor(dueAt / 1000) + 1800,
      alarm: true,
      alarmOffset: 0,
      description,
      success: resolve,
      fail: reject,
    })
  })
  // #endif
  // #ifndef MP-WEIXIN
  return Promise.reject(new Error('仅微信小程序支持日历提醒'))
  // #endif
}
