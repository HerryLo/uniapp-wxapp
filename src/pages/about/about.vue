<template>
  <view class="about">
    <view class="hero">
      <image class="logo" src="../../static/logo.png" mode="aspectFit" />
      <view class="app-name">垣计算</view>
      <view class="version">v1.1.0</view>
    </view>

    <view class="card">
      <view class="section-title">功能</view>
      <view class="text">宝宝记录：日常记录 · 生长曲线 · 疫苗参考 · 成长手记</view>
      <view class="text">工具箱：增值税计算 · 单位换算 · 文本处理 · 进制转换</view>
    </view>

    <view class="card">
      <view class="section-title">免责声明</view>
      <view class="text">
        所有计算均在本地完成，结果仅供参考，不构成税务、财务或其他专业建议。
      </view>
      <view class="text">
        宝宝记录与疫苗参考仅用于家庭记录，不构成医疗建议、诊断或接种推荐。具体健康问题请咨询医生；疫苗程序、费用和禁忌请以当地接种门诊安排为准。
      </view>
    </view>

    <view class="card">
      <view class="section-title">隐私说明</view>
      <view class="text">宝宝资料和记录只保存在本机，不登录、不上传、不申请定位权限。</view>
      <view class="text">导出与恢复由用户主动发起，备份文件请自行妥善保管。</view>
      <view class="text">清理小程序缓存或卸载小程序会丢失本机数据。</view>
    </view>

    <view class="card">
      <view class="section-title">开源</view>
      <view class="text link" @click="copyRepo">github.com/HerryLo/uniapp-wxapp</view>
    </view>
  </view>
</template>

<script setup>
import { copyText } from '../../utils/clipboard.js'

const repo = 'https://github.com/HerryLo/uniapp-wxapp'

function copyRepo() {
  copyText(repo)
}
</script>

<style scoped>
.about {
  padding: 32rpx 32rpx 64rpx;
}
.hero {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 32rpx 0 16rpx;
}
.logo {
  width: 120rpx;
  height: 120rpx;
  border-radius: 24rpx;
}
.app-name {
  margin-top: 20rpx;
  font-size: 36rpx;
  font-weight: 600;
  color: var(--text);
}
.version {
  margin-top: 8rpx;
  font-size: 26rpx;
  color: var(--text-secondary);
}
.section-title {
  margin-bottom: 12rpx;
  font-size: 30rpx;
  font-weight: 600;
  color: var(--text);
}
.text {
  font-size: 28rpx;
  line-height: 1.8;
  color: var(--text-secondary);
}
.text + .text {
  margin-top: 12rpx;
}
.link {
  color: var(--primary-strong);
}
</style>
