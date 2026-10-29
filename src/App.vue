<script>
import { setupUpdateManager } from './utils/update.js'

export default {
  onLaunch() {
    // 小程序端：新版本下载完成后弹窗强制重启，保证客户端是最新版本
    // #ifdef MP-WEIXIN
    setupUpdateManager()
    // #endif
  },
}
</script>

<style>
page {
  --bg: #FFF9F5;
  --surface: #FFFFFF;
  --primary: #FF8FA3;
  --primary-strong: #E86F87;
  --primary-soft: #FFE4E1;
  --text: #4A4A4A;
  --text-secondary: #888888;
  --border: #FFE4E1;
  --danger: #D9485F;
  --success: #3E9B6B;
  --accent: #B5E4CA;
  --accent-warm: #FFD93D;
  --peach: #FFB6C1;
  --cream: #FFFDFC;
  background-color: var(--bg);
  background-image: linear-gradient(180deg, #FFF3F5 0%, #FFF9F5 320rpx);
  color: var(--text);
  font-size: 28rpx;
  font-family: -apple-system, BlinkMacSystemFont, "Helvetica Neue", "PingFang SC", "Microsoft YaHei", sans-serif;
}

view,
text,
input,
textarea,
picker {
  box-sizing: border-box;
}

.panel {
  padding: 32rpx 32rpx 48rpx;
}

.panel-title {
  font-size: 34rpx;
  font-weight: 600;
  color: var(--text);
}

.panel-desc {
  margin-top: 8rpx;
  font-size: 26rpx;
  color: var(--text-secondary);
  line-height: 1.6;
}

.card {
  margin-top: 24rpx;
  background: var(--surface);
  border-radius: 48rpx;
  padding: 32rpx;
  border: 1rpx solid rgba(255, 228, 225, 0.9);
  box-shadow: 0 10rpx 30rpx rgba(255, 143, 163, 0.14);
}

.card-title {
  font-size: 32rpx;
  font-weight: 600;
  color: var(--text);
}

.label {
  margin-top: 24rpx;
  margin-bottom: 12rpx;
  font-size: 28rpx;
  color: var(--text-secondary);
}

.input {
  width: 100%;
  height: 80rpx;
  padding: 0 20rpx;
  background: var(--cream);
  border: 1rpx solid var(--border);
  border-radius: 28rpx;
  font-size: 30rpx;
  color: var(--text);
}

.textarea {
  width: 100%;
  min-height: 200rpx;
  padding: 20rpx;
  background: var(--cream);
  border: 1rpx solid var(--border);
  border-radius: 28rpx;
  font-size: 30rpx;
  line-height: 1.6;
  color: var(--text);
}

.picker-field {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 80rpx;
  padding: 0 20rpx;
  background: var(--cream);
  border: 1rpx solid var(--border);
  border-radius: 28rpx;
  font-size: 30rpx;
}

.picker-arrow {
  color: var(--text-secondary);
  font-size: 30rpx;
}

.chip-row {
  display: flex;
  flex-wrap: wrap;
  margin-top: 16rpx;
  margin-right: -16rpx;
}

.chip {
  margin-right: 16rpx;
  margin-bottom: 16rpx;
  padding: 10rpx 24rpx;
  border-radius: 999rpx;
  background: #FFF1F3;
  color: var(--text-secondary);
  font-size: 28rpx;
  transition: transform 0.12s ease, opacity 0.12s ease;
}

.chip.active {
  background: linear-gradient(135deg, #FFE4E1, #FFD6DE);
  color: var(--primary-strong);
  font-weight: 600;
}

.chip:active {
  transform: scale(0.97);
  opacity: 0.9;
}

.btn-row {
  display: flex;
  justify-content: space-between;
  margin-top: 32rpx;
}

.btn {
  width: 48%;
  height: 80rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 999rpx;
  font-size: 30rpx;
  transition: transform 0.12s ease, opacity 0.12s ease;
}

.btn-primary {
  background: linear-gradient(135deg, #FF9FB1, var(--primary-strong));
  color: #FFFFFF;
  box-shadow: 0 8rpx 20rpx rgba(232, 111, 135, 0.25);
}

.btn-ghost {
  background: #FFFFFF;
  border: 1rpx solid var(--primary-strong);
  color: var(--primary-strong);
}

.btn:active {
  transform: scale(0.97);
  opacity: 0.9;
}

.result-box {
  margin-top: 24rpx;
  padding: 24rpx;
  background: var(--cream);
  border: 1rpx solid var(--border);
  border-radius: 32rpx;
}

.result-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8rpx 0;
}

.result-label {
  font-size: 28rpx;
  color: var(--text-secondary);
}

.result-value {
  font-family: "SF Mono", Menlo, Consolas, monospace;
  font-size: 32rpx;
  font-weight: 600;
  color: var(--text);
  word-break: break-all;
}

.error {
  margin-top: 20rpx;
  font-size: 26rpx;
  color: var(--danger);
}

.empty-tip {
  margin-top: 24rpx;
  text-align: center;
  font-size: 26rpx;
  line-height: 1.7;
  color: var(--text-secondary);
}

.record-stats {
  display: flex;
  margin-top: 20rpx;
}
.record-stat {
  flex: 1;
  padding: 20rpx 8rpx;
  border-radius: 28rpx;
  text-align: center;
  background: #FFF1F3;
}
.record-stat + .record-stat {
  margin-left: 12rpx;
  background: #F0FAF4;
}
.record-stat-value {
  display: block;
  font-size: 36rpx;
  font-weight: 700;
  color: var(--primary-strong);
}
.record-stat-label {
  display: block;
  margin-top: 6rpx;
  font-size: 22rpx;
  color: var(--text-secondary);
}
.record-stat-value.is-text {
  font-size: 26rpx;
  word-break: break-all;
}
.trend-chart {
  margin-top: 24rpx;
  padding-top: 24rpx;
  border-top: 1rpx solid var(--border);
}

.disclaimer {
  margin-top: 24rpx;
  font-size: 24rpx;
  line-height: 1.6;
  color: var(--text-secondary);
}

.stats {
  display: flex;
  margin-top: 16rpx;
  font-size: 26rpx;
  color: var(--text-secondary);
}

.stats text {
  margin-right: 24rpx;
}

.switch-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 16rpx;
}

.switch-label {
  font-size: 28rpx;
  color: var(--text);
}

.value-copy {
  display: flex;
  align-items: center;
}

.copy-link {
  margin-left: 16rpx;
  font-size: 24rpx;
  color: var(--primary-strong);
}
</style>
