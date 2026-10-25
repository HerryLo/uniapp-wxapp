<template>
  <BabyPage active="home">
    <view class="baby-page">
      <view class="profile-card">
      <view class="avatar">👶</view>
      <view class="profile-info">
        <view class="profile-name">{{ profile.name }}</view>
        <view v-if="age" class="profile-age">
          {{ age.text }} · {{ profile.gender === 'girl' ? '女宝' : '男宝' }}
        </view>
        <view v-else class="profile-age">还没有填写出生日期</view>
      </view>
      <view class="profile-edit" @click="goSettings">{{ age ? '编辑' : '去设置' }}</view>
    </view>

    <view class="card">
      <view class="card-title">🍼 今日记录</view>
      <view class="today-grid">
        <view class="today-cell">
          <text class="today-value">{{ summary.milkCount }}</text>
          <text class="today-label">喝奶次数</text>
        </view>
        <view class="today-cell">
          <text class="today-value">{{ (summary.sleepMinutes / 60).toFixed(1) }}</text>
          <text class="today-label">睡眠小时</text>
        </view>
        <view class="today-cell">
          <text class="today-value">{{ summary.diaperCount }}</text>
          <text class="today-label">排便次数</text>
        </view>
      </view>
    </view>

    <view class="card">
      <view class="card-title">💉 下一条一类疫苗参考</view>
      <view v-if="nextVaccineItem" class="vaccine-preview">
        <view>
          <view class="preview-name">{{ nextVaccineItem.name }}</view>
          <view class="preview-meta">
            参考月龄：{{ formatMonthAge(nextVaccineItem.month) }}
          </view>
        </view>
        <text class="status" :class="nextStatus.key">{{ nextStatus.label }}</text>
      </view>
      <view v-else-if="!age" class="empty-tip">完善出生日期后显示参考疫苗</view>
      <view v-else class="empty-tip">一类疫苗已按参考程序完成</view>
      <view class="card-link" @click="goPage('/package-baby/health/index')">
        查看疫苗参考 ›
      </view>
    </view>

    <view class="card">
      <view class="card-title">📈 最近生长</view>
      <view v-if="latest" class="growth-preview">
        <view>
          <view class="preview-name">{{ latest.date }}</view>
          <view class="preview-meta">{{ latest.height }} cm · {{ latest.weight }} kg</view>
        </view>
        <text class="card-link inline" @click="goPage('/package-baby/growth/index')">
          查看曲线 ›
        </text>
      </view>
      <view v-else class="empty-tip">还没有身高体重记录</view>
    </view>

      <ShareButton class="share-entry" />

      <Disclaimer />
      <AdBanner />
    </view>
  </BabyPage>
</template>

<script setup>
import { computed, ref } from 'vue'
import {
  onLoad,
  onShareAppMessage,
  onShareTimeline,
  onShow,
} from '@dcloudio/uni-app'
import AdBanner from '../../components/AdBanner.vue'
import ShareButton from '../../components/ShareButton.vue'
import BabyPage from '../../components/baby/BabyPage.vue'
import Disclaimer from '../../components/baby/Disclaimer.vue'
import { ageInfo, formatMonthAge, todayKey } from '../../utils/baby/date.js'
import { latestGrowth, loadGrowth } from '../../utils/baby/growth.js'
import { loadProfile } from '../../utils/baby/profile.js'
import { loadDay, summarizeDay } from '../../utils/baby/records.js'
import { loadVaccines, nextVaccine, vaccineStatus } from '../../utils/baby/vaccines.js'

const profile = ref(loadProfile())
const today = ref(todayKey())
const summary = ref(summarizeDay(loadDay(today.value)))
const latest = ref(null)
const nextVaccineItem = ref(null)

const age = computed(() => ageInfo(profile.value.birthDate))
const nextStatus = computed(() =>
  nextVaccineItem.value
    ? vaccineStatus(nextVaccineItem.value, age.value ? age.value.totalMonths : null)
    : { key: 'pending', label: '' }
)

function refresh() {
  profile.value = loadProfile()
  today.value = todayKey()
  summary.value = summarizeDay(loadDay(today.value))
  latest.value = latestGrowth(loadGrowth())
  nextVaccineItem.value = nextVaccine(
    loadVaccines(),
    age.value ? age.value.totalMonths : null,
    { type: '一类' }
  )
}

function goPage(url) {
  uni.navigateTo({ url })
}

function goSettings() {
  uni.navigateTo({ url: '/package-baby/settings/index' })
}

onLoad(() => {
  // #ifdef MP-WEIXIN
  uni.showShareMenu({ menus: ['shareAppMessage', 'shareTimeline'] })
  // #endif
})

onShow(refresh)

onShareAppMessage(() => ({
  title: '垣计算 · 记录宝宝成长',
  path: '/pages/baby/index',
  imageUrl: '/static/logo.png',
}))

onShareTimeline(() => ({
  title: '垣计算 · 记录宝宝成长',
  imageUrl: '/static/logo.png',
}))
</script>

<style scoped>
.baby-page {
  padding: 24rpx 32rpx 64rpx;
}
.share-entry {
  display: flex;
  width: 100%;
  margin-top: 24rpx;
}
.profile-card {
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: center;
  padding: 32rpx;
  background: linear-gradient(135deg, #FFE4E1, #FFB6C1);
  border-radius: 48rpx;
}
.profile-card > view {
  position: relative;
  z-index: 1;
}
.profile-card::before {
  content: '';
  position: absolute;
  top: -70rpx;
  right: -50rpx;
  width: 190rpx;
  height: 190rpx;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.35);
}
.profile-card::after {
  content: '';
  position: absolute;
  bottom: -40rpx;
  right: 120rpx;
  width: 100rpx;
  height: 100rpx;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.25);
}
.avatar {
  width: 96rpx;
  height: 96rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: #FFFFFF;
  font-size: 52rpx;
}
.profile-info {
  flex: 1;
  margin-left: 24rpx;
}
.profile-name {
  font-size: 36rpx;
  font-weight: 700;
  color: var(--text);
}
.profile-age {
  margin-top: 8rpx;
  font-size: 26rpx;
  color: #7A5B60;
}
.profile-edit {
  padding: 12rpx 24rpx;
  border-radius: 999rpx;
  background: #FFFFFF;
  color: var(--primary-strong);
  font-size: 24rpx;
  white-space: nowrap;
}
.today-grid {
  display: flex;
  justify-content: space-between;
  margin-top: 20rpx;
}
.today-cell {
  width: 31%;
  padding: 20rpx 8rpx;
  border-radius: 28rpx;
  text-align: center;
  background: #FFF1F3;
}
.today-cell:nth-child(2) {
  background: #F0FAF4;
}
.today-cell:nth-child(3) {
  background: #FFFAE6;
}
.today-value {
  display: block;
  font-size: 40rpx;
  font-weight: 700;
  color: var(--primary-strong);
}
.today-label {
  display: block;
  margin-top: 6rpx;
  font-size: 24rpx;
  color: var(--text-secondary);
}
.vaccine-preview,
.growth-preview {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 20rpx;
}
.preview-name {
  font-size: 30rpx;
  font-weight: 600;
  color: var(--text);
}
.preview-meta {
  margin-top: 6rpx;
  font-size: 24rpx;
  color: var(--text-secondary);
}
.status {
  margin-left: 16rpx;
  font-size: 22rpx;
  white-space: nowrap;
}
.status.done {
  color: var(--success);
}
.status.due {
  color: var(--primary-strong);
}
.status.overdue {
  color: var(--danger);
}
.status.pending {
  color: var(--text-secondary);
}
.card-link {
  margin-top: 20rpx;
  text-align: right;
  font-size: 24rpx;
  color: var(--primary-strong);
}
.card-link.inline {
  margin-top: 0;
  white-space: nowrap;
}
</style>
