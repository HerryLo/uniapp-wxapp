<template>
  <view class="health-page">
    <Disclaimer
      text="疫苗清单仅作记录参考，不构成医疗建议，也不代表推荐接种。具体程序、费用和禁忌请咨询当地接种门诊。"
    />

    <view v-if="!age" class="card profile-tip">
      <view class="tip-text">完善宝宝出生日期后，可显示参考月龄和待接种提示。</view>
      <view class="tip-btn" @click="goSettings">去完善资料</view>
    </view>

    <view class="toolbar">
      <text class="page-note">按参考月龄排序，可勾选已接种并修改日期。</text>
      <view class="add-custom" @click="openCustom">+ 自定义疫苗</view>
    </view>

    <view v-for="group in groups" :key="group.type" class="card">
      <view class="group-head">
        <text class="group-title">{{ group.type }}疫苗</text>
        <text v-if="group.type === '二类'" class="self-paid-tag">自费自愿</text>
      </view>
      <view v-if="group.type === '二类'" class="group-note">
        二类疫苗为自费自愿接种，请咨询接种门诊。
      </view>

      <view v-for="item in group.items" :key="item.id" class="vaccine-item">
        <view class="vaccine-row" @click="toggle(item)">
          <view class="check" :class="{ checked: item.done }">{{ item.done ? '✓' : '' }}</view>
          <view class="vaccine-info">
            <view class="vaccine-name">
              {{ item.name }}
              <text v-if="item.type === '二类'" class="mini-tag">自费自愿</text>
            </view>
            <view class="vaccine-meta">参考月龄：{{ formatMonthAge(item.month) }}</view>
            <view v-if="statusOf(item).key === 'overdue'" class="overdue-note">
              请咨询接种门诊
            </view>
          </view>
          <text class="status" :class="statusOf(item).key">{{ statusOf(item).label }}</text>
        </view>
        <view v-if="item.done" class="date-row">
          <text class="date-label">接种日期</text>
          <picker
            mode="date"
            :value="item.date || today"
            @change="changeDate(item, $event.detail.value)"
          >
            <view class="date-field">{{ item.date || '选择日期' }} ›</view>
          </picker>
        </view>
        <view v-if="!item.builtin" class="custom-delete" @click="removeCustom(item)">
          删除自定义项
        </view>
      </view>
    </view>

    <view class="source-card">
      <view class="source-title">参考来源</view>
      <view class="source-line">{{ VACCINE_SOURCE.title }}</view>
      <view class="source-line">整理日期：{{ VACCINE_SOURCE.updatedAt }}</view>
      <view class="source-line">{{ VACCINE_SOURCE.note }}</view>
    </view>

    <view v-if="customOpen" class="form-mask" @click="customOpen = false">
      <view class="form-sheet" @click.stop>
        <view class="form-head">
          <text class="form-title">自定义疫苗</text>
          <text class="form-close" @click="customOpen = false">✕</text>
        </view>
        <view class="form-label">名称</view>
        <input class="input" v-model="custom.name" maxlength="30" placeholder="疫苗名称" />
        <view class="form-label">类型</view>
        <view class="chip-row">
          <view
            v-for="type in VACCINE_TYPES"
            :key="type"
            class="chip"
            :class="{ active: custom.type === type }"
            @click="custom.type = type"
          >{{ type }}</view>
        </view>
        <view v-if="custom.type === '二类'" class="form-tip">
          二类疫苗为自费自愿，请咨询接种门诊。
        </view>
        <view class="form-label">参考月龄（可选）</view>
        <input class="input" type="number" v-model="custom.month" placeholder="例如 6" />
        <view v-if="customError" class="form-error">{{ customError }}</view>
        <view class="btn-row">
          <view class="btn btn-primary" @click="saveCustom">添加</view>
          <view class="btn btn-ghost" @click="customOpen = false">取消</view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { computed, ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import Disclaimer from '../../components/baby/Disclaimer.vue'
import { VACCINE_SOURCE } from '../../data/vaccinePlan.js'
import { ageInfo, formatMonthAge, todayKey } from '../../utils/baby/date.js'
import { loadProfile } from '../../utils/baby/profile.js'
import {
  VACCINE_TYPES,
  addCustomVaccine,
  groupVaccines,
  loadVaccines,
  removeCustomVaccine,
  saveVaccines,
  setVaccineDone,
  vaccineStatus,
} from '../../utils/baby/vaccines.js'

const profile = ref(loadProfile())
const list = ref([])
const today = ref(todayKey())
const customOpen = ref(false)
const customError = ref('')
const custom = ref({ name: '', type: '一类', month: '' })

const age = computed(() => ageInfo(profile.value.birthDate))
const groups = computed(() => groupVaccines(list.value))

function refresh() {
  profile.value = loadProfile()
  list.value = loadVaccines()
  today.value = todayKey()
}

function statusOf(item) {
  return vaccineStatus(item, age.value ? age.value.totalMonths : null)
}

function persist(next) {
  if (!saveVaccines(next)) {
    uni.showToast({ title: '保存失败', icon: 'none' })
    return false
  }
  list.value = next
  return true
}

function toggle(item) {
  persist(setVaccineDone(list.value, item.id, !item.done, today.value))
}

function changeDate(item, date) {
  persist(setVaccineDone(list.value, item.id, true, date))
}

function openCustom() {
  custom.value = { name: '', type: '一类', month: '' }
  customError.value = ''
  customOpen.value = true
}

function saveCustom() {
  const res = addCustomVaccine(list.value, custom.value)
  if (!res.ok) {
    customError.value = res.error
    return
  }
  if (!persist(res.list)) return
  customOpen.value = false
  customError.value = ''
}

function removeCustom(item) {
  uni.showModal({
    title: '删除自定义疫苗',
    content: `确定删除「${item.name}」吗？`,
    success: (res) => {
      if (!res.confirm) return
      const result = removeCustomVaccine(list.value, item.id)
      if (!result.ok) {
        uni.showToast({ title: result.error, icon: 'none' })
        return
      }
      persist(result.list)
    },
  })
}

function goSettings() {
  uni.navigateTo({ url: '/package-baby/settings/index' })
}

onShow(refresh)
</script>

<style scoped>
.health-page {
  padding: 24rpx 32rpx 64rpx;
}
.profile-tip {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 24rpx;
}
.tip-text {
  flex: 1;
  margin-right: 20rpx;
  font-size: 26rpx;
  line-height: 1.6;
  color: var(--text-secondary);
}
.tip-btn {
  padding: 12rpx 24rpx;
  border-radius: 999rpx;
  background: var(--primary-strong);
  color: #FFFFFF;
  font-size: 24rpx;
  white-space: nowrap;
}
.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 24rpx;
}
.page-note {
  flex: 1;
  margin-right: 16rpx;
  font-size: 24rpx;
  line-height: 1.5;
  color: var(--text-secondary);
}
.add-custom {
  padding: 10rpx 22rpx;
  border-radius: 999rpx;
  border: 1rpx solid var(--primary-strong);
  color: var(--primary-strong);
  font-size: 24rpx;
  white-space: nowrap;
}
.group-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.group-title {
  font-size: 32rpx;
  font-weight: 600;
  color: var(--text);
}
.self-paid-tag,
.mini-tag {
  padding: 4rpx 12rpx;
  border-radius: 999rpx;
  background: #FFF1F3;
  color: var(--primary-strong);
  font-size: 20rpx;
}
.group-note {
  margin-top: 12rpx;
  font-size: 24rpx;
  line-height: 1.6;
  color: var(--text-secondary);
}
.vaccine-item {
  padding: 24rpx 0;
  border-bottom: 1rpx solid var(--border);
}
.vaccine-item:last-child {
  border-bottom: none;
}
.vaccine-row {
  display: flex;
  align-items: flex-start;
}
.check {
  width: 40rpx;
  height: 40rpx;
  margin-top: 4rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2rpx solid var(--border);
  border-radius: 12rpx;
  color: #FFFFFF;
  font-size: 24rpx;
}
.check.checked {
  background: var(--primary-strong);
  border-color: var(--primary-strong);
}
.vaccine-info {
  flex: 1;
  margin-left: 16rpx;
}
.vaccine-name {
  font-size: 28rpx;
  line-height: 1.5;
  color: var(--text);
}
.vaccine-meta {
  margin-top: 6rpx;
  font-size: 24rpx;
  color: var(--text-secondary);
}
.overdue-note {
  margin-top: 6rpx;
  font-size: 22rpx;
  color: var(--danger);
}
.status {
  margin-left: 12rpx;
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
.date-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 16rpx;
  padding-left: 56rpx;
}
.date-label {
  font-size: 24rpx;
  color: var(--text-secondary);
}
.date-field {
  padding: 8rpx 16rpx;
  border: 1rpx solid var(--border);
  border-radius: 12rpx;
  font-size: 24rpx;
  color: var(--text);
}
.custom-delete {
  margin-top: 12rpx;
  padding-left: 56rpx;
  font-size: 22rpx;
  color: var(--danger);
}
.source-card {
  margin-top: 32rpx;
  padding: 24rpx;
  background: #FFF1F3;
  border-radius: 24rpx;
}
.source-title {
  margin-bottom: 8rpx;
  font-size: 26rpx;
  font-weight: 600;
  color: var(--text);
}
.source-line {
  font-size: 22rpx;
  line-height: 1.7;
  color: var(--text-secondary);
}
.form-mask {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  z-index: 300;
  display: flex;
  align-items: flex-end;
  background: rgba(74, 74, 74, 0.45);
}
.form-sheet {
  width: 100%;
  padding: 32rpx 32rpx calc(32rpx + env(safe-area-inset-bottom));
  background: var(--surface);
  border-radius: 40rpx 40rpx 0 0;
}
.form-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24rpx;
}
.form-title {
  font-size: 32rpx;
  font-weight: 600;
  color: var(--text);
}
.form-close {
  padding: 8rpx 16rpx;
  font-size: 32rpx;
  color: var(--text-secondary);
}
.form-label {
  margin-top: 24rpx;
  margin-bottom: 12rpx;
  font-size: 28rpx;
  color: var(--text-secondary);
}
.form-tip {
  margin-top: 12rpx;
  font-size: 22rpx;
  color: var(--primary-strong);
}
.form-error {
  margin-top: 12rpx;
  font-size: 26rpx;
  color: var(--danger);
}
</style>
