<script>
export default {
  onLaunch() {},
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
  border-radius: 40rpx;
  padding: 32rpx;
  box-shadow: 0 8rpx 24rpx rgba(255, 143, 163, 0.12);
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
  background: #FFFFFF;
  border: 1rpx solid var(--border);
  border-radius: 24rpx;
  font-size: 30rpx;
  color: var(--text);
}

.textarea {
  width: 100%;
  min-height: 200rpx;
  padding: 20rpx;
  background: #FFFFFF;
  border: 1rpx solid var(--border);
  border-radius: 24rpx;
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
  background: #FFFFFF;
  border: 1rpx solid var(--border);
  border-radius: 24rpx;
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
}

.chip.active {
  background: var(--primary-soft);
  color: var(--primary-strong);
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
  border-radius: 24rpx;
  font-size: 30rpx;
}

.btn-primary {
  background: var(--primary-strong);
  color: #FFFFFF;
}

.btn-ghost {
  background: #FFFFFF;
  border: 1rpx solid var(--primary-strong);
  color: var(--primary-strong);
}

.btn:active {
  opacity: 0.8;
}

.result-box {
  margin-top: 24rpx;
  padding: 24rpx;
  background: #FFF9F5;
  border-radius: 16rpx;
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
  font-size: 26rpx;
  color: var(--text-secondary);
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
