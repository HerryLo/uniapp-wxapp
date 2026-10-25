<template>
  <!-- #ifdef MP-WEIXIN -->
  <view class="ad-slot">
    <ad-custom
      v-if="unit === 'tools'"
      unit-id="adunit-74c204c0dcb6cc73"
      @load="adLoad"
      @error="adError"
      @close="adClose"
    />
    <ad-custom
      v-else
      unit-id="adunit-a36ca84c0d70179a"
      @load="adLoad"
      @error="adError"
      @close="adClose"
    />
  </view>
  <!-- #endif -->
</template>

<script setup>
defineProps({
  unit: {
    type: String,
    default: 'baby',
  },
})

function adLoad() {}

function adError(event) {
  console.warn('ad-custom error', event)
}

function adClose() {}
</script>

<style scoped>
.ad-slot {
  margin-top: 32rpx;
}
</style>
