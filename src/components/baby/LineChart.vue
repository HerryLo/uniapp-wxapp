<template>
  <view class="chart-wrap" :style="{ height: `${height}rpx` }">
    <canvas type="2d" :id="canvasId" :canvas-id="canvasId" class="chart-canvas" />
  </view>
</template>

<script setup>
import { getCurrentInstance, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { parseLocalDate } from '../../utils/baby/date.js'

const props = defineProps({
  points: { type: Array, default: () => [] },
  unit: { type: String, default: '' },
  color: { type: String, default: '#E86F87' },
  height: { type: Number, default: 360 },
})

const instance = getCurrentInstance()
const canvasId = `baby-chart-${Math.random().toString(36).slice(2, 8)}`
const chartWidth = ref(0)
const chartHeight = ref(0)
const MAX_RETRIES = 3
const RETRY_DELAY = 100
let ctx = null
let initTimer = null
let retryTimer = null
let retryCount = 0

function clearRetry() {
  if (retryTimer) {
    clearTimeout(retryTimer)
    retryTimer = null
  }
}

function retryInit() {
  if (retryTimer || retryCount >= MAX_RETRIES) return
  retryCount += 1
  retryTimer = setTimeout(() => {
    retryTimer = null
    init()
  }, RETRY_DELAY)
}

function markReady() {
  retryCount = 0
  clearRetry()
}

function normalizedPoints() {
  return props.points
    .filter(
      (item) =>
        item &&
        typeof item.value === 'number' &&
        Number.isFinite(item.value) &&
        parseLocalDate(item.date)
    )
    .map((item) => ({ date: item.date, value: item.value }))
    .sort((a, b) => a.date.localeCompare(b.date))
}

function draw() {
  if (!ctx || !chartWidth.value || !chartHeight.value) return
  const width = chartWidth.value
  const height = chartHeight.value
  const points = normalizedPoints()
  ctx.clearRect(0, 0, width, height)
  if (!points.length) return

  const pad = { left: 46, right: 16, top: 18, bottom: 30 }
  const innerW = width - pad.left - pad.right
  const innerH = height - pad.top - pad.bottom
  if (innerW <= 0 || innerH <= 0) return

  const values = points.map((item) => item.value)
  let min = Math.min(...values)
  let max = Math.max(...values)
  if (min === max) {
    min -= 1
    max += 1
  }
  const span = max - min
  min -= span * 0.1
  max += span * 0.1

  const times = points.map((item) => parseLocalDate(item.date).getTime())
  const minTime = Math.min(...times)
  const maxTime = Math.max(...times)
  const xOf = (time) =>
    maxTime === minTime
      ? pad.left + innerW / 2
      : pad.left + ((time - minTime) / (maxTime - minTime)) * innerW
  const yOf = (value) => pad.top + innerH - ((value - min) / (max - min)) * innerH

  ctx.strokeStyle = '#FFE4E1'
  ctx.fillStyle = '#999999'
  ctx.lineWidth = 1
  ctx.font = '10px sans-serif'
  ctx.textAlign = 'right'
  ctx.textBaseline = 'middle'
  for (let i = 0; i <= 3; i += 1) {
    const value = min + ((max - min) * i) / 3
    const y = yOf(value)
    ctx.beginPath()
    ctx.moveTo(pad.left, y)
    ctx.lineTo(width - pad.right, y)
    ctx.stroke()
    ctx.fillText(`${Number(value.toFixed(1))}${props.unit}`, pad.left - 6, y)
  }

  ctx.strokeStyle = props.color
  ctx.lineWidth = 2
  ctx.lineJoin = 'round'
  ctx.lineCap = 'round'
  ctx.beginPath()
  points.forEach((item, index) => {
    const x = xOf(times[index])
    const y = yOf(item.value)
    if (index === 0) ctx.moveTo(x, y)
    else ctx.lineTo(x, y)
  })
  ctx.stroke()

  ctx.fillStyle = props.color
  points.forEach((item, index) => {
    ctx.beginPath()
    ctx.arc(xOf(times[index]), yOf(item.value), 3, 0, Math.PI * 2)
    ctx.fill()
  })

  ctx.fillStyle = '#888888'
  ctx.font = '10px sans-serif'
  ctx.textBaseline = 'top'
  ctx.textAlign = 'left'
  ctx.fillText(points[0].date.slice(5), pad.left, height - pad.bottom + 8)
  if (points.length > 1) {
    ctx.textAlign = 'right'
    ctx.fillText(
      points[points.length - 1].date.slice(5),
      width - pad.right,
      height - pad.bottom + 8
    )
  }
}

function initMpWeixin() {
  // #ifdef MP-WEIXIN
  const query = uni.createSelectorQuery().in(instance.proxy)
  query
    .select(`#${canvasId}`)
    .fields({ node: true, size: true })
    .exec((res) => {
      const info = res && res[0]
      if (!info || !info.node || !info.width || !info.height) {
        retryInit()
        return
      }
      const dpr = uni.getSystemInfoSync().pixelRatio || 1
      info.node.width = info.width * dpr
      info.node.height = info.height * dpr
      ctx = info.node.getContext('2d')
      ctx.scale(dpr, dpr)
      chartWidth.value = info.width
      chartHeight.value = info.height
      markReady()
      draw()
    })
  // #endif
}

function initH5() {
  // #ifdef H5
  let el = document.getElementById(canvasId)
  if (!el && instance.proxy && instance.proxy.$el) {
    el = instance.proxy.$el.querySelector('canvas')
  }
  if (el && el.tagName !== 'CANVAS') el = el.querySelector('canvas')
  if (!el) {
    retryInit()
    return
  }
  const rect = el.getBoundingClientRect()
  if (!rect.width || !rect.height) {
    retryInit()
    return
  }
  const dpr = window.devicePixelRatio || 1
  el.width = rect.width * dpr
  el.height = rect.height * dpr
  el.style.width = `${rect.width}px`
  el.style.height = `${rect.height}px`
  ctx = el.getContext('2d')
  ctx.scale(dpr, dpr)
  chartWidth.value = rect.width
  chartHeight.value = rect.height
  markReady()
  draw()
  // #endif
}

function init() {
  if (ctx) return
  initMpWeixin()
  initH5()
}

function redraw() {
  if (ctx) {
    draw()
    return
  }
  retryCount = 0
  clearRetry()
  init()
}

watch(
  () => props.points,
  () => nextTick(draw),
  { deep: true }
)

onMounted(() => {
  initTimer = setTimeout(() => {
    initTimer = null
    init()
  }, 50)
})

onUnmounted(() => {
  if (initTimer) {
    clearTimeout(initTimer)
    initTimer = null
  }
  clearRetry()
  ctx = null
})

defineExpose({ redraw })
</script>

<style scoped>
.chart-wrap {
  width: 100%;
}
.chart-canvas {
  width: 100%;
  height: 100%;
}
</style>
