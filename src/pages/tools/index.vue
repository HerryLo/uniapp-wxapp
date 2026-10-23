<template>
  <view class="tools-page">
    <view class="tabs">
      <view
        v-for="tab in tabs"
        :key="tab.key"
        class="tab"
        :class="{ active: active === tab.key }"
        @click="active = tab.key"
      >
        <text class="tab-text">{{ tab.label }}</text>
        <view class="tab-line"></view>
      </view>
    </view>

    <VatPanel v-show="active === 'vat'" />
    <UnitPanel v-show="active === 'unit'" />
    <TextPanel v-show="active === 'text'" />
    <EncodePanel v-show="active === 'encode'" />
    <RadixPanel v-show="active === 'radix'" />
    <TimestampPanel v-show="active === 'timestamp'" />
    <JsonPanel v-show="active === 'json'" />

    <view class="about-link" @click="openAbout">关于与免责声明</view>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { onLoad, onShareAppMessage } from '@dcloudio/uni-app'
import VatPanel from '../../components/tools/VatPanel.vue'
import UnitPanel from '../../components/tools/UnitPanel.vue'
import TextPanel from '../../components/tools/TextPanel.vue'
import EncodePanel from '../../components/tools/EncodePanel.vue'
import RadixPanel from '../../components/tools/RadixPanel.vue'
import TimestampPanel from '../../components/tools/TimestampPanel.vue'
import JsonPanel from '../../components/tools/JsonPanel.vue'

const tabs = [
  { key: 'vat', label: '增值税' },
  { key: 'unit', label: '单位换算' },
  { key: 'text', label: '文本处理' },
  { key: 'encode', label: '编码' },
  { key: 'radix', label: '进制' },
  { key: 'timestamp', label: '时间戳' },
  { key: 'json', label: 'JSON' },
]

const active = ref('vat')

onLoad((options) => {
  if (options && tabs.some((tab) => tab.key === options.tool)) {
    active.value = options.tool
  }
})

onShareAppMessage(() => ({
  title: '计算工具箱',
  path: `/pages/tools/index?tool=${active.value}`,
}))

function openAbout() {
  uni.navigateTo({ url: '/pages/about/about' })
}
</script>

<style>
.tools-page {
  padding-bottom: 48rpx;
}

.tabs {
  position: sticky;
  top: 0;
  z-index: 10;
  display: flex;
  background: var(--surface);
  border-bottom: 1rpx solid var(--border);
}

.tab {
  flex: 1;
  height: 88rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.tab-text {
  font-size: 24rpx;
  color: var(--text-secondary);
  white-space: nowrap;
}

.tab-line {
  width: 32rpx;
  height: 4rpx;
  margin-top: 8rpx;
  border-radius: 2rpx;
  background: transparent;
}

.tab.active .tab-text {
  color: var(--primary);
  font-weight: 600;
}

.tab.active .tab-line {
  background: var(--primary);
}

.about-link {
  margin: 48rpx 32rpx 0;
  padding: 24rpx 0;
  text-align: center;
  font-size: 24rpx;
  color: var(--text-secondary);
}
</style>
