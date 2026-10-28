export const SHARE_BRAND = '垣计算'
export const SHARE_IMAGE = '/static/垣计算-分享默认图.png'

const TOOL_TITLES = {
  vat: '增值税计算器',
  unit: '单位换算',
  text: '文本处理',
  radix: '进制转换',
}

/**
 * 生成分享标题：具体页面名在前，品牌名在后
 * @param {string} label 页面或结果标题
 */
export function buildShareTitle(label) {
  const text = typeof label === 'string' ? label.trim() : ''
  return `${text || '本地优先的宝宝记录工具'}｜${SHARE_BRAND}`
}

/**
 * 生成工具页导航栏标题
 * @param {string} key 工具 key
 */
export function toolNavTitle(key) {
  return TOOL_TITLES[key] || '日常计算工具箱'
}

/**
 * 生成工具页分享标题
 * @param {string} key 工具 key
 */
export function toolShareTitle(key) {
  return buildShareTitle(toolNavTitle(key))
}
