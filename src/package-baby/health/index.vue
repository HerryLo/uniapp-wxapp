<template>
  <BabyPage active="health">
    <view class="health-page">
      <view v-if="!age" class="card profile-tip">
      <view class="tip-text">完善宝宝出生日期后，可显示参考月龄和待接种提示。</view>
      <view class="tip-btn" @click="goSettings">去完善资料</view>
    </view>

    <view class="toolbar">
      <text class="page-note">按参考月龄排序，可勾选已接种并修改日期。</text>
      <view class="add-custom" @click="openCustom">+ 自定义疫苗</view>
    </view>

    <view class="table-tip">左右滑动查看完整表格</view>

    <scroll-view scroll-x class="table-scroll">
      <view class="vaccine-table">
        <view v-for="group in groups" :key="group.type" class="group-block">
          <view class="group-head">
            <text class="group-title">{{ group.type === '一类' ? '🛡' : '💉' }} {{ group.type }}疫苗</text>
            <text v-if="group.type === '二类'" class="self-paid-tag">自费自愿</text>
          </view>
          <view v-if="group.type === '二类'" class="group-note">
            二类疫苗为自费自愿接种，请咨询接种门诊。如不计划接种，可单项或批量标记为暂不接种。
          </view>
          <view
            v-if="group.type === '二类' && pendingOptional(group).length"
            class="batch-row"
          >
            <view
              class="batch-btn"
              :class="{ restore: allOptionalSkipped(group) }"
              @click="toggleAllOptional(group)"
            >{{ allOptionalSkipped(group) ? '↺ 全部恢复参考' : '全部暂不接种' }}</view>
          </view>

          <view class="table-row table-header">
            <view class="cell col-check">接种</view>
            <view class="cell col-name">疫苗名称</view>
            <view class="cell col-month">参考月龄</view>
            <view class="cell col-status">状态</view>
            <view class="cell col-date">接种日期</view>
            <view class="cell col-action">操作</view>
          </view>

          <view v-for="item in group.items" :key="item.id" class="table-row">
            <view class="cell col-check" @click="toggle(item)">
              <view class="check" :class="{ checked: item.done }">{{ item.done ? '✓' : '' }}</view>
            </view>
            <view class="cell col-name">
              <view class="vaccine-name">
                {{ item.name }}
                <text v-if="item.type === '二类'" class="mini-tag">自费自愿</text>
              </view>
              <view v-if="statusOf(item).key === 'overdue'" class="overdue-note">
                请咨询接种门诊
              </view>
              <view
                v-if="item.type === '二类' && !item.done"
                class="skip-btn"
                :class="{ skipped: item.skipped }"
                @click.stop="toggleSkip(item)"
              >{{ item.skipped ? '↺ 恢复参考' : '暂不接种' }}</view>
            </view>
            <view class="cell col-month">{{ formatMonthAge(item.month) }}</view>
            <view class="cell col-status">
              <text class="status" :class="statusOf(item).key">{{ statusOf(item).label }}</text>
            </view>
            <view class="cell col-date">
              <picker
                v-if="item.done"
                mode="date"
                :value="item.date || today"
                @change="changeDate(item, $event.detail.value)"
              >
                <view class="date-field">{{ item.date || '选择日期' }} ›</view>
              </picker>
              <text v-else class="date-empty">—</text>
            </view>
            <view class="cell col-action">
              <text v-if="!item.builtin" class="custom-delete" @click.stop="removeCustom(item)">删除</text>
              <text v-else class="action-none">—</text>
            </view>
          </view>
        </view>
      </view>
    </scroll-view>

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
  </BabyPage>
</template>

<script setup>
import { computed, ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import BabyPage from '../../components/baby/BabyPage.vue'
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
  setOptionalVaccinesSkipped,
  setVaccineDone,
  setVaccineSkipped,
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

function pendingOptional(group) {
  return group.items.filter((item) => item.type === '二类' && !item.done)
}

function allOptionalSkipped(group) {
  const pending = pendingOptional(group)
  return pending.length > 0 && pending.every((item) => item.skipped)
}

function toggleAllOptional(group) {
  const pending = pendingOptional(group)
  if (!pending.length) return
  if (allOptionalSkipped(group)) {
    if (persist(setOptionalVaccinesSkipped(list.value, false))) {
      uni.showToast({ title: '已恢复', icon: 'none' })
    }
    return
  }
  uni.showModal({
    title: '全部暂不接种',
    content: `确定将 ${pending.length} 项未接种的二类疫苗全部标记为暂不接种吗？之后可恢复。`,
    success: (res) => {
      if (!res.confirm) return
      if (persist(setOptionalVaccinesSkipped(list.value, true))) {
        uni.showToast({ title: '已更新', icon: 'none' })
      }
    },
  })
}

function toggleSkip(item) {
  if (item.skipped) {
    persist(setVaccineSkipped(list.value, item.id, false))
    return
  }
  uni.showModal({
    title: '暂不接种',
    content: `确定将「${item.name}」标记为暂不接种吗？之后可恢复参考。`,
    success: (res) => {
      if (!res.confirm) return
      persist(setVaccineSkipped(list.value, item.id, true))
    },
  })
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
.table-tip {
  margin-top: 24rpx;
  font-size: 22rpx;
  color: var(--text-secondary);
}
.table-scroll {
  width: 100%;
  margin-top: 12rpx;
  white-space: nowrap;
}
.vaccine-table {
  display: flex;
  flex-direction: column;
}
.group-block {
  width: 1020rpx;
  box-sizing: border-box;
  padding: 24rpx;
  background: var(--surface);
  border-radius: 40rpx;
  box-shadow: 0 8rpx 24rpx rgba(255, 143, 163, 0.12);
}
.group-block + .group-block {
  margin-top: 24rpx;
}
.table-row {
  display: flex;
  align-items: stretch;
  border-bottom: 1rpx solid var(--border);
}
.group-block .table-row:last-child {
  border-bottom: none;
}
.cell {
  display: flex;
  align-items: center;
  box-sizing: border-box;
  padding: 20rpx 12rpx;
  font-size: 24rpx;
  color: var(--text);
  white-space: normal;
  word-break: break-all;
}
.table-header .cell {
  padding: 16rpx 12rpx;
  background: #FFF1F3;
  font-size: 22rpx;
  font-weight: 600;
  color: var(--text-secondary);
}
.table-header .col-check {
  border-radius: 16rpx 0 0 16rpx;
}
.table-header .col-action {
  border-radius: 0 16rpx 16rpx 0;
}
.col-check {
  width: 72rpx;
  justify-content: center;
}
.col-name {
  width: 300rpx;
  flex-direction: column;
  align-items: flex-start;
}
.col-month {
  width: 140rpx;
}
.col-status {
  width: 160rpx;
}
.col-date {
  width: 200rpx;
}
.col-action {
  width: 100rpx;
  justify-content: center;
}
.check {
  width: 40rpx;
  height: 40rpx;
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
.vaccine-name {
  font-size: 26rpx;
  line-height: 1.4;
  color: var(--text);
}
.vaccine-name .mini-tag {
  display: inline-block;
  margin-left: 6rpx;
  vertical-align: middle;
}
.overdue-note {
  margin-top: 6rpx;
  font-size: 20rpx;
  color: var(--danger);
}
.status {
  font-size: 22rpx;
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
.status.skipped {
  color: var(--text-secondary);
}
.skip-btn {
  align-self: flex-start;
  margin-top: 10rpx;
  padding: 6rpx 18rpx;
  border: 1rpx solid var(--primary-strong);
  border-radius: 999rpx;
  background: #FFF1F3;
  color: var(--primary-strong);
  font-size: 22rpx;
  line-height: 1.4;
}
.skip-btn.skipped {
  border-color: var(--border);
  background: #FFFFFF;
  color: var(--text-secondary);
}
.skip-btn:active {
  opacity: 0.75;
}
.batch-row {
  display: flex;
  margin-top: 12rpx;
}
.batch-btn {
  padding: 8rpx 20rpx;
  border: 1rpx solid var(--primary-strong);
  border-radius: 999rpx;
  background: #FFF1F3;
  color: var(--primary-strong);
  font-size: 22rpx;
  line-height: 1.4;
}
.batch-btn.restore {
  border-color: var(--border);
  background: #FFFFFF;
  color: var(--text-secondary);
}
.batch-btn:active {
  opacity: 0.75;
}
.date-field {
  padding: 8rpx 12rpx;
  border: 1rpx solid var(--border);
  border-radius: 12rpx;
  font-size: 22rpx;
  color: var(--text);
  white-space: nowrap;
}
.date-empty,
.action-none {
  font-size: 22rpx;
  color: var(--text-secondary);
}
.custom-delete {
  font-size: 22rpx;
  color: var(--danger);
}
.source-card {
  margin-top: 32rpx;
  padding: 24rpx;
  background: #FFF1F3;
  border-radius: 32rpx;
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
