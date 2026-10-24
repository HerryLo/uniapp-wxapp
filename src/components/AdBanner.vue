<template>
  <!-- #ifdef MP-WEIXIN -->
  <view class="ad-slot">
    <ad-custom
      unit-id="adunit-a36ca84c0d70179a"
      @load="adLoad"
      @error="adError"
      @close="adClose"
    />
  </view>
  <!-- #endif -->
</template>

<script setup>
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
