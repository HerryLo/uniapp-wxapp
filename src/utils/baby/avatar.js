export const MAX_AVATAR_CHARS = 300 * 1024

const AVATAR_PATTERN = /^data:image\/(jpeg|png|webp);base64,/

export function isValidAvatar(value) {
  if (value === '' || value == null) return true
  if (typeof value !== 'string') return false
  if (value.trim() === '') return false
  if (value.length > MAX_AVATAR_CHARS) return false
  return AVATAR_PATTERN.test(value)
}

export function avatarErrorMessage(value) {
  return typeof value === 'string' && value.length > MAX_AVATAR_CHARS
    ? '头像图片过大，请换一张'
    : '头像格式不正确'
}

export function chooseAvatarImage(options = {}) {
  const sourceType = Array.isArray(options.sourceType)
    ? options.sourceType
    : ['album', 'camera']
  return new Promise((resolve) => {
    uni.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType,
      success: (res) => {
        const path = res.tempFilePaths && res.tempFilePaths[0]
        if (!path) {
          resolve({ ok: false, error: '未选择图片' })
          return
        }
        const file = res.tempFiles && res.tempFiles[0]
        compressToDataUrl(path, file)
          .then((dataUrl) => {
            if (typeof dataUrl !== 'string' || !dataUrl) {
              resolve({ ok: false, error: '图片处理失败，请重试' })
              return
            }
            if (dataUrl.length > MAX_AVATAR_CHARS) {
              resolve({ ok: false, error: '图片过大，请换一张' })
              return
            }
            if (!isValidAvatar(dataUrl)) {
              resolve({ ok: false, error: '图片格式不支持，请换一张' })
              return
            }
            resolve({ ok: true, dataUrl })
          })
          .catch(() => resolve({ ok: false, error: '图片处理失败，请重试' }))
      },
      fail: () => resolve({ ok: false, error: '未选择图片' }),
    })
  })
}

function compressToDataUrl(path, file) {
  // #ifdef MP-WEIXIN
  return compressMpToDataUrl(path, 70, 400).then((dataUrl) =>
    isValidAvatar(dataUrl) ? dataUrl : compressMpToDataUrl(path, 60, 320)
  )
  // #endif

  // #ifdef H5
  return resizeImageInH5(path).catch(() => readImageFileAsDataUrl(file))
  // #endif

  return Promise.reject(new Error('unsupported platform'))
}

// #ifdef MP-WEIXIN
function compressMpToDataUrl(path, quality, compressedWidth) {
  return new Promise((resolve, reject) => {
    const read = (source) => {
      try {
        const base64 = wx.getFileSystemManager().readFileSync(source, 'base64')
        const ext = /\.png$/i.test(source)
          ? 'png'
          : /\.webp$/i.test(source)
            ? 'webp'
            : 'jpeg'
        resolve(`data:image/${ext};base64,${base64}`)
      } catch (e) {
        reject(e)
      }
    }
    if (typeof wx !== 'undefined' && typeof wx.compressImage === 'function') {
      wx.compressImage({
        src: path,
        quality,
        compressedWidth,
        success: (res) => read(res.tempFilePath),
        fail: () => read(path),
      })
      return
    }
    read(path)
  })
}
// #endif

// #ifdef H5
function readImageFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const blob = file && (file.file || file)
    if (typeof FileReader === 'undefined' || !blob) {
      reject(new Error('image read failed'))
      return
    }
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = () => reject(new Error('image read failed'))
    try {
      reader.readAsDataURL(blob)
    } catch (e) {
      reject(e)
    }
  })
}
// #endif

// #ifdef H5
function resizeImageInH5(path) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      const maxSide = 400
      const scale = Math.min(1, maxSide / Math.max(img.width, img.height))
      const width = Math.max(1, Math.round(img.width * scale))
      const height = Math.max(1, Math.round(img.height * scale))
      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')
      ctx.drawImage(img, 0, 0, width, height)
      resolve(canvas.toDataURL('image/jpeg', 0.7))
    }
    img.onerror = () => reject(new Error('image load failed'))
    img.src = path
  })
}
// #endif
