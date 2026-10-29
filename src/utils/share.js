import { onShareAppMessage, onShareTimeline } from '@dcloudio/uni-app'
import { buildShareTitle, SHARE_IMAGE } from './shareTitle.js'

/**
 * 为页面注册分享（好友 + 朋友圈）
 * @param {string} label 分享标题里的页面名
 * @param {string} path 分享落地路径
 */
export function useBabyShare(label, path) {
  onShareAppMessage(() => ({
    title: buildShareTitle(label),
    path,
    imageUrl: SHARE_IMAGE,
  }))
  onShareTimeline(() => ({
    title: buildShareTitle(label),
    imageUrl: SHARE_IMAGE,
  }))
}
