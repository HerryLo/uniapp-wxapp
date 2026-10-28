<template>
  <view class="mine-page">
    <view class="identity-card">
      <view class="identity-avatar">👤</view>
      <view class="identity-body">
        <view class="identity-title">本地模式</view>
        <view class="identity-desc">数据仅保存在本机</view>
      </view>
      <view class="identity-tag">未登录</view>
    </view>

    <view class="card sync-card">
      <view class="card-title">☁️ 数据同步</view>
      <view class="sync-status">当前为本机存储</view>
      <view class="sync-desc">
        云端同步即将上线，届时可在多台设备间同步宝宝记录。
      </view>
      <view class="sync-btn" @click="syncSoon">即将上线</view>
    </view>

    <view class="card">
      <view class="card-title">🧰 工具箱</view>
      <view
        v-for="tool in tools"
        :key="tool.key"
        class="tool-row"
        @click="openTool(tool.key)"
      >
        <text class="tool-emoji">{{ tool.emoji }}</text>
        <view class="tool-body">
          <view class="tool-name">{{ tool.name }}</view>
          <view class="tool-desc">{{ tool.desc }}</view>
        </view>
        <text class="row-arrow">›</text>
      </view>
    </view>

    <view class="card">
      <view class="row" @click="openProfile">
        <view class="row-body">
          <view class="row-title">👶 宝宝资料</view>
          <view class="row-desc">头像、昵称与出生日期</view>
        </view>
        <text class="row-arrow">›</text>
      </view>
      <view class="row" @click="openData">
        <view class="row-body">
          <view class="row-title">📦 数据管理</view>
          <view class="row-desc">导出备份、恢复与清空</view>
        </view>
        <text class="row-arrow">›</text>
      </view>
      <view class="row" @click="openAbout">
        <view class="row-body">
          <view class="row-title">ℹ️ 关于与免责声明</view>
        </view>
        <text class="row-arrow">›</text>
      </view>
    </view>

    <view class="note">宝宝资料与记录只保存在本机，不登录、不上传。</view>
  </view>
</template>

<script setup>
import { onLoad, onShareAppMessage, onShareTimeline } from '@dcloudio/uni-app'
import { buildShareTitle, SHARE_IMAGE } from '../../utils/shareTitle.js'

const tools = [
  { key: 'vat', emoji: '🧮', name: '增值税', desc: '含税 / 不含税' },
  { key: 'unit', emoji: '📐', name: '单位换算', desc: '长度 / 重量 / 温度' },
  { key: 'text', emoji: '✂️', name: '文本处理', desc: '去重 / 大小写' },
  { key: 'radix', emoji: '🔢', name: '进制转换', desc: '2–36 进制' },
]

function openTool(key) {
  uni.navigateTo({ url: `/pages/tools/index?tool=${key}` })
}

function openProfile() {
  uni.navigateTo({ url: '/package-baby/settings/index' })
}

function openData() {
  uni.navigateTo({ url: '/package-baby/settings/data' })
}

function openAbout() {
  uni.navigateTo({ url: '/pages/about/about' })
}

function syncSoon() {
  uni.showToast({ title: '数据同步即将上线', icon: 'none' })
}

onLoad(() => {
  // #ifdef MP-WEIXIN
  uni.showShareMenu({ menus: ['shareAppMessage', 'shareTimeline'] })
  // #endif
})

onShareAppMessage(() => ({
  title: buildShareTitle('宝宝记录与计算工具箱'),
  path: '/pages/mine/index',
  imageUrl: SHARE_IMAGE,
}))

onShareTimeline(() => ({
  title: buildShareTitle('宝宝记录与计算工具箱'),
  imageUrl: SHARE_IMAGE,
}))
</script>

<style scoped>
.mine-page {
  padding: 24rpx 32rpx 64rpx;
}
.identity-card {
  display: flex;
  align-items: center;
  padding: 32rpx;
  background: linear-gradient(135deg, #FFE4E1, #FFB6C1);
  border-radius: 48rpx;
  box-shadow: 0 10rpx 30rpx rgba(255, 143, 163, 0.18);
}
.identity-avatar {
  width: 96rpx;
  height: 96rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: #FFFFFF;
  font-size: 52rpx;
}
.identity-body {
  flex: 1;
  margin-left: 24rpx;
}
.identity-title {
  font-size: 34rpx;
  font-weight: 700;
  color: var(--text);
}
.identity-desc {
  margin-top: 8rpx;
  font-size: 24rpx;
  color: #7A5B60;
}
.identity-tag {
  padding: 8rpx 20rpx;
  border-radius: 999rpx;
  background: rgba(255, 255, 255, 0.72);
  color: var(--primary-strong);
  font-size: 22rpx;
  white-space: nowrap;
}
.sync-card {
  margin-top: 24rpx;
}
.sync-status {
  margin-top: 16rpx;
  font-size: 28rpx;
  font-weight: 600;
  color: var(--text);
}
.sync-desc {
  margin-top: 8rpx;
  font-size: 24rpx;
  line-height: 1.6;
  color: var(--text-secondary);
}
.sync-btn {
  margin-top: 20rpx;
  padding: 18rpx 0;
  border-radius: 999rpx;
  background: #FFF1F3;
  color: var(--text-secondary);
  font-size: 26rpx;
  text-align: center;
}
.tool-row,
.row {
  display: flex;
  align-items: center;
  padding: 24rpx 0;
  border-bottom: 1rpx solid var(--border);
}
.tool-row:last-child,
.row:last-child {
  border-bottom: none;
}
.tool-emoji {
  width: 56rpx;
  font-size: 36rpx;
}
.tool-body,
.row-body {
  flex: 1;
}
.tool-name,
.row-title {
  font-size: 30rpx;
  color: var(--text);
}
.tool-desc,
.row-desc {
  margin-top: 6rpx;
  font-size: 24rpx;
  color: var(--text-secondary);
}
.row-arrow {
  margin-left: 16rpx;
  font-size: 32rpx;
  color: var(--text-secondary);
}
.note {
  margin-top: 32rpx;
  text-align: center;
  font-size: 24rpx;
  line-height: 1.7;
  color: var(--text-secondary);
}
</style>
