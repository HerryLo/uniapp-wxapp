<template>
  <view class="panel">
    <view class="panel-title">单位换算</view>
    <view class="panel-desc">选择类别与单位，输入数值实时换算</view>

    <view class="card">
      <view class="chip-row">
        <view
          v-for="(group, key) in UNIT_GROUPS"
          :key="key"
          class="chip"
          :class="{ active: groupKey === key }"
          @click="selectGroup(key)"
        >{{ group.label }}</view>
      </view>

      <view class="label">数值</view>
      <input
        class="input"
        :type="groupKey === 'temperature' ? 'text' : 'digit'"
        v-model="value"
        placeholder="请输入数值"
      />

      <view class="label">从</view>
      <picker mode="selector" :range="unitLabels" :value="fromIndex" @change="fromIndex = Number($event.detail.value)">
        <view class="picker-field">
          <text>{{ unitLabels[fromIndex] }}</text>
          <text class="picker-arrow">›</text>
        </view>
      </picker>

      <view class="label">到</view>
      <picker mode="selector" :range="unitLabels" :value="toIndex" @change="toIndex = Number($event.detail.value)">
        <view class="picker-field">
          <text>{{ unitLabels[toIndex] }}</text>
          <text class="picker-arrow">›</text>
        </view>
      </picker>

      <view class="btn-row">
        <view class="btn btn-ghost" @click="swap">互换单位</view>
      </view>

      <view v-if="state.error" class="error">{{ state.error }}</view>
      <view v-else-if="state.empty" class="empty-tip">输入数值后自动换算</view>
      <view v-else class="result-box">
        <view class="result-row">
          <text class="result-label">{{ value }} {{ unitLabels[fromIndex] }} =</text>
          <text class="result-value">{{ state.text }}</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { UNIT_GROUPS, convertUnit, formatUnitValue } from '../../utils/units.js'

const groupKey = ref('length')
const value = ref('')
const fromIndex = ref(0)
const toIndex = ref(1)

const units = computed(() => UNIT_GROUPS[groupKey.value].units)
const unitLabels = computed(() => units.value.map((unit) => unit.label))

const state = computed(() => {
  if (!value.value.trim()) return { empty: true }
  const num = Number(value.value)
  if (!Number.isFinite(num)) return { error: '请输入有效数字' }
  const fromUnit = units.value[fromIndex.value]
  const toUnit = units.value[toIndex.value]
  const result = convertUnit(groupKey.value, num, fromUnit.key, toUnit.key)
  if (result === null) return { error: '无法换算' }
  return { text: `${formatUnitValue(result)} ${toUnit.label}` }
})

function selectGroup(key) {
  groupKey.value = key
  fromIndex.value = 0
  toIndex.value = 1
}

function swap() {
  const temp = fromIndex.value
  fromIndex.value = toIndex.value
  toIndex.value = temp
}
</script>
