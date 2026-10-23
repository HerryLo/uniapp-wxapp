<script>
export default {
  onLaunch() {},
}
</script>

<style>
page {
  --bg: #F7F8FA;
  --surface: #FFFFFF;
  --primary: #4361EE;
  --primary-soft: #EEF2FF;
  --text: #1F2937;
  --text-secondary: #6B7280;
  --border: #E5E7EB;
  --danger: #EF4444;
  --success: #10B981;
  background-color: var(--bg);
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
  font-size: 30rpx;
  font-weight: 600;
  color: var(--text);
}

.panel-desc {
  margin-top: 8rpx;
  font-size: 24rpx;
  color: var(--text-secondary);
  line-height: 1.6;
}

.card {
  margin-top: 24rpx;
  background: var(--surface);
  border-radius: 24rpx;
  padding: 32rpx;
  box-shadow: 0 8rpx 24rpx rgba(31, 41, 55, 0.06);
}

.label {
  margin-top: 24rpx;
  margin-bottom: 12rpx;
  font-size: 26rpx;
  color: var(--text-secondary);
}

.input {
  width: 100%;
  height: 80rpx;
  padding: 0 20rpx;
  background: #FFFFFF;
  border: 1rpx solid var(--border);
  border-radius: 16rpx;
  font-size: 28rpx;
  color: var(--text);
}

.textarea {
  width: 100%;
  min-height: 200rpx;
  padding: 20rpx;
  background: #FFFFFF;
  border: 1rpx solid var(--border);
  border-radius: 16rpx;
  font-size: 28rpx;
  line-height: 1.6;
  color: var(--text);
}

.picker-field {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 80rpx;
  padding: 0 20rpx;
  background: #FFFFFF;
  border: 1rpx solid var(--border);
  border-radius: 16rpx;
  font-size: 28rpx;
}

.picker-arrow {
  color: var(--text-secondary);
  font-size: 28rpx;
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
  background: #F3F4F6;
  color: var(--text-secondary);
  font-size: 26rpx;
}

.chip.active {
  background: var(--primary-soft);
  color: var(--primary);
  font-weight: 600;
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
  border-radius: 16rpx;
  font-size: 28rpx;
}

.btn-primary {
  background: var(--primary);
  color: #FFFFFF;
}

.btn-ghost {
  background: #FFFFFF;
  border: 1rpx solid var(--primary);
  color: var(--primary);
}

.btn:active {
  opacity: 0.8;
}

.result-box {
  margin-top: 24rpx;
  padding: 24rpx;
  background: #F9FAFB;
  border-radius: 16rpx;
}

.result-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8rpx 0;
}

.result-label {
  font-size: 26rpx;
  color: var(--text-secondary);
}

.result-value {
  font-family: "SF Mono", Menlo, Consolas, monospace;
  font-size: 30rpx;
  font-weight: 600;
  color: var(--text);
  word-break: break-all;
}

.error {
  margin-top: 20rpx;
  font-size: 24rpx;
  color: var(--danger);
}

.empty-tip {
  margin-top: 24rpx;
  font-size: 24rpx;
  color: var(--text-secondary);
}

.disclaimer {
  margin-top: 24rpx;
  font-size: 22rpx;
  line-height: 1.6;
  color: var(--text-secondary);
}

.stats {
  display: flex;
  margin-top: 16rpx;
  font-size: 24rpx;
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
  font-size: 26rpx;
  color: var(--text);
}
</style>
