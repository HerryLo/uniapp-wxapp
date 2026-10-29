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
      <view v-if="showMilkChart" class="card">
        <view class="card-title">🍼 近 7 天奶量趋势</view>
        <view class="trend-chart">
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
import LineChart from '../components/LineChart.vue'
import RecordPage from '../components/records/RecordPage.vue'
import { loadRecentMilkSummary, milkChartPoints } from '../../utils/baby/records.js'
import { useBabyShare } from '../../utils/share.js'

useBabyShare('宝宝喝奶记录', '/package-baby/records/milk')

const recentMilk = ref(loadRecentMilkSummary(7))
const milkChart = computed(() => milkChartPoints(recentMilk.value))
const showMilkChart = computed(
  () => recentMilk.value.filter((item) => item.hasMilkAmount).length > 3
)

function refreshMilk() {
  recentMilk.value = loadRecentMilkSummary(7)
}

onShow(refreshMilk)
</script>
