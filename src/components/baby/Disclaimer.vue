<template>
  <view class="disclaimer-box">
    <text class="disclaimer-title">💡 温馨提示</text>
    <text class="disclaimer-text">{{ text }}</text>
    <text class="disclaimer-privacy">
      涉及个人隐私，所有数据仅存储在本地，不上传、不登录。删除小程序或卸载微信后，本地数据将全部消失，请定期在「我的 - 数据管理」中导出备份。
    </text>
  </view>
</template>

<script setup>
defineProps({
  text: {
    type: String,
    default: '仅用于家庭记录，不构成医疗建议。如有健康疑问，请咨询医生或接种门诊。',
  },
})
</script>

<style scoped>
.disclaimer-box {
  margin-top: 32rpx;
  padding: 24rpx 28rpx;
  background: var(--cream);
  border: 1rpx solid var(--border);
  border-radius: 32rpx;
}
.disclaimer-title {
  display: block;
  margin-bottom: 8rpx;
  font-size: 26rpx;
  font-weight: 600;
  color: var(--text);
}
.disclaimer-text {
  display: block;
  font-size: 24rpx;
  line-height: 1.7;
  color: var(--text-secondary);
}
.disclaimer-privacy {
  display: block;
  margin-top: 12rpx;
  font-size: 24rpx;
  line-height: 1.7;
  color: var(--text-secondary);
}
</style>
