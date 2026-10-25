<template>
  <view class="tools-page">
    <view class="tools-body">
      <VatPanel v-show="active === 'vat'" />
      <UnitPanel v-show="active === 'unit'" />
      <TextPanel v-show="active === 'text'" />
      <RadixPanel v-show="active === 'radix'" />

      <AdBanner unit-id="adunit-74c204c0dcb6cc73" />
      <view class="footer-links">
        <view class="about-link" @click="openAbout">关于与免责声明</view>
        <ShareButton class="share-entry" />
      </view>
    </view>

    <view class="tools-fab" @click="toolsOpen = true">
      <view class="grid-icon">
        <view class="grid-cell"></view>
        <view class="grid-cell"></view>
        <view class="grid-cell"></view>
        <view class="grid-cell"></view>
      </view>
    </view>

    <view v-if="toolsOpen" class="sheet-mask" @click="toolsOpen = false">
      <view class="sheet" @click.stop>
        <view class="sheet-head">
          <text class="sheet-title">全部工具</text>
          <text class="sheet-close" @click="toolsOpen = false">✕</text>
        </view>
        <view class="tool-grid">
          <view
            v-for="tool in tools"
            :key="tool.key"
            class="tool-cell"
            :class="{ active: active === tool.key }"
            @click="pickTool(tool.key)"
          >
            <text class="tool-name">{{ tool.name }}</text>
            <text class="tool-desc">{{ tool.desc }}</text>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { onLoad, onShareAppMessage, onShareTimeline } from '@dcloudio/uni-app'
import AdBanner from '../../components/AdBanner.vue'
import ShareButton from '../../components/ShareButton.vue'
import VatPanel from '../../components/tools/VatPanel.vue'
import UnitPanel from '../../components/tools/UnitPanel.vue'
import TextPanel from '../../components/tools/TextPanel.vue'
import RadixPanel from '../../components/tools/RadixPanel.vue'

const tools = [
  { key: 'vat', name: '增值税', desc: '含税 / 不含税' },
  { key: 'unit', name: '单位换算', desc: '长度 / 重量 / 温度' },
  { key: 'text', name: '文本处理', desc: '去重 / 大小写' },
  { key: 'radix', name: '进制转换', desc: '2–36 进制' },
]

const active = ref('vat')
const toolsOpen = ref(false)

onLoad((options) => {
  if (options && tools.some((tool) => tool.key === options.tool)) {
    active.value = options.tool
  }
  // #ifdef MP-WEIXIN
  uni.showShareMenu({ menus: ['shareAppMessage', 'shareTimeline'] })
  // #endif
})

onShareAppMessage(() => ({
  title: '垣计算 · 日常计算工具箱',
  path: `/pages/tools/index?tool=${active.value}`,
  imageUrl: '/static/logo.png',
}))

onShareTimeline(() => ({
  title: '垣计算 · 日常计算工具箱',
  query: `tool=${active.value}`,
  imageUrl: '/static/logo.png',
}))

function pickTool(key) {
  active.value = key
  toolsOpen.value = false
}

function openAbout() {
  uni.navigateTo({ url: '/pages/about/about' })
}
</script>

<style>
.tools-page {
  padding: 24rpx 0 48rpx;
}

.tools-fab {
  position: fixed;
  right: 32rpx;
  bottom: calc(32rpx + env(safe-area-inset-bottom));
  z-index: 150;
  width: 96rpx;
  height: 96rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: var(--primary-strong);
  box-shadow: 0 8rpx 24rpx rgba(232, 111, 135, 0.35);
}

.tools-fab .grid-icon {
  width: 36rpx;
  height: 36rpx;
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-content: space-between;
}

.tools-fab .grid-cell {
  width: 14rpx;
  height: 14rpx;
  border-radius: 3rpx;
  background: #FFFFFF;
}

.footer-links {
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 48rpx 32rpx 0;
}
.about-link {
  padding: 12rpx 0;
  font-size: 26rpx;
  color: var(--text-secondary);
}
.share-entry {
  margin-left: 24rpx;
}

.sheet-mask {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  z-index: 200;
  display: flex;
  align-items: flex-end;
  background: rgba(17, 24, 39, 0.45);
}

.sheet {
  width: 100%;
  padding: 32rpx 32rpx calc(32rpx + env(safe-area-inset-bottom));
  box-sizing: border-box;
  background: var(--surface);
  border-radius: 32rpx 32rpx 0 0;
  animation: sheet-up 0.2s ease-out;
}

@keyframes sheet-up {
  from {
    transform: translateY(100%);
  }
  to {
    transform: translateY(0);
  }
}

.sheet-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24rpx;
}

.sheet-title {
  font-size: 32rpx;
  font-weight: 600;
  color: var(--text);
}

.sheet-close {
  padding: 8rpx 16rpx;
  font-size: 32rpx;
  color: var(--text-secondary);
}

.tool-grid {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
}

.tool-cell {
  width: calc(50% - 10rpx);
  margin-bottom: 20rpx;
  padding: 24rpx;
  box-sizing: border-box;
  background: #FFF9F5;
  border: 2rpx solid transparent;
  border-radius: 24rpx;
}

.tool-cell.active {
  background: var(--primary-soft);
  border-color: var(--primary);
}

.tool-name {
  display: block;
  font-size: 30rpx;
  font-weight: 600;
  color: var(--text);
}

.tool-desc {
  display: block;
  margin-top: 8rpx;
  font-size: 24rpx;
  color: var(--text-secondary);
}
</style>
