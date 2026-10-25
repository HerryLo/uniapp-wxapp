<template>
  <RecordPage
    kind="milk"
    emoji="🍼"
    title="喝奶"
    empty-text="今天还没有喝奶记录，点“添加”记一笔吧 🐣"
    @change="refreshMilk"
  >
    <template #stats="{ summary }">
      <view class="record-stats">
        <view class="record-stat">
          <text class="record-stat-value">{{ summary.milkCount }}</text>
          <text class="record-stat-label">喝奶次数</text>
        </view>
        <view class="record-stat">
          <text class="record-stat-value">{{ summary.milkAmount }}</text>
          <text class="record-stat-label">总奶量（ml）</text>
        </view>
      </view>
    </template>

    <template #extra>
      <view class="card">
        <view class="card-title">🍼 最近 7 天奶量</view>
        <view class="trend-list">
          <view v-for="item in recentMilkList" :key="item.date" class="trend-row">
            <text class="trend-date">{{ item.date === today ? '今天' : item.date.slice(5) }}</text>
            <text class="trend-amount" :class="{ empty: !item.hasMilkAmount }">
              {{ item.hasMilkAmount ? `${item.milkAmount} ml` : '未记录' }}
            </text>
            <text class="trend-count">{{ item.milkCount }} 次</text>
          </view>
        </view>
        <view v-if="showMilkChart" class="trend-chart">
          <text class="trend-chart-title">🍼 近 7 天奶量趋势</text>
          <LineChart :points="milkChart" unit="ml" :height="320" />
        </view>
      </view>
      <AdBanner />
    </template>
  </RecordPage>
</template>

<script setup>
import { computed, ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import AdBanner from '../../components/AdBanner.vue'
import LineChart from '../../components/baby/LineChart.vue'
import RecordPage from '../../components/baby/records/RecordPage.vue'
import { todayKey } from '../../utils/baby/date.js'
import { loadRecentMilkSummary, milkChartPoints } from '../../utils/baby/records.js'

const today = ref(todayKey())
const recentMilk = ref(loadRecentMilkSummary(7))
const recentMilkList = computed(() => [...recentMilk.value].reverse())
const milkChart = computed(() => milkChartPoints(recentMilk.value))
const showMilkChart = computed(
  () => recentMilk.value.filter((item) => item.hasMilkAmount).length > 3
)

function refreshMilk() {
  today.value = todayKey()
  recentMilk.value = loadRecentMilkSummary(7)
}

onShow(refreshMilk)
</script>
