<template>
  <view class="about">
    <view class="hero">
      <image class="logo" src="../../static/logo.png" mode="aspectFit" />
      <view class="app-name">工具箱</view>
      <view class="version">v1.0.0</view>
    </view>

    <view class="card">
      <view class="section-title">功能</view>
      <view class="text">增值税计算 · 单位换算 · 文本处理 · 进制转换</view>
      <view class="text">待办清单</view>
    </view>

    <view class="card">
      <view class="section-title">免责声明</view>
      <view class="text">所有计算均在本地完成，结果仅供参考，不构成税务、财务或其他专业建议。</view>
    </view>

    <view class="card">
      <view class="section-title">开源</view>
      <view class="text link" @click="copyRepo">github.com/HerryLo/uniapp-wxapp</view>
    </view>
  </view>
</template>

<script setup>
import { copyText } from '../../utils/clipboard.js'

const repo = 'https://github.com/HerryLo/uniapp-wxapp'

function copyRepo() {
  copyText(repo)
}
</script>

<style scoped>
.about {
  padding: 32rpx 32rpx 64rpx;
}

.hero {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 32rpx 0 16rpx;
}

.logo {
  width: 120rpx;
  height: 120rpx;
  border-radius: 24rpx;
}

.app-name {
  margin-top: 20rpx;
  font-size: 36rpx;
  font-weight: 600;
  color: var(--text);
}

.version {
  margin-top: 8rpx;
  font-size: 26rpx;
  color: var(--text-secondary);
}

.section-title {
  margin-bottom: 12rpx;
  font-size: 30rpx;
  font-weight: 600;
  color: var(--text);
}

.text {
  font-size: 28rpx;
  line-height: 1.8;
  color: var(--text-secondary);
}

.link {
  color: var(--primary);
}
</style>
