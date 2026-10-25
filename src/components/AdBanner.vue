<template>
  <!-- #ifdef MP-WEIXIN -->
  <view class="ad-slot">
    <ad-custom
      :unit-id="unitId"
      @load="adLoad"
      @error="adError"
      @close="adClose"
    />
  </view>
  <!-- #endif -->
</template>

<script setup>
defineProps({
  unitId: {
    type: String,
    default: 'adunit-a36ca84c0d70179a',
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
