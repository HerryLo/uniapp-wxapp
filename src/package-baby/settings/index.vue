<template>
  <view class="settings-page">
    <view class="card form-card">
      <view class="card-title">宝宝资料</view>
      <view class="label">昵称</view>
      <input class="input" v-model="form.name" maxlength="20" placeholder="宝宝昵称" />
      <view class="label">出生日期</view>
      <picker mode="date" :value="form.birthDate" @change="form.birthDate = $event.detail.value">
        <view class="picker-field">
          <text>{{ form.birthDate || '请选择出生日期' }}</text>
          <text class="picker-arrow">›</text>
        </view>
      </picker>
      <view class="label">性别</view>
      <view class="chip-row">
        <view
          class="chip"
          :class="{ active: form.gender === 'boy' }"
          @click="form.gender = 'boy'"
        >男宝</view>
        <view
          class="chip"
          :class="{ active: form.gender === 'girl' }"
          @click="form.gender = 'girl'"
        >女宝</view>
      </view>
      <view v-if="profileError" class="error">{{ profileError }}</view>
      <view class="btn-row">
        <view class="btn btn-primary" @click="save">保存资料</view>
      </view>
    </view>

    <view class="card">
      <view class="card-title">数据管理</view>
      <view class="row" @click="exportData">
        <view class="row-body">
          <view class="row-title">导出数据</view>
          <view class="row-desc">生成 JSON 备份，可保存到聊天或复制到剪贴板</view>
        </view>
        <text class="row-arrow">›</text>
      </view>
      <view class="row" @click="restore">
        <view class="row-body">
          <view class="row-title">恢复数据</view>
          <view class="row-desc">从备份文件恢复，恢复前会自动备份当前数据</view>
        </view>
        <text class="row-arrow">›</text>
      </view>
      <view class="row danger" @click="clearData">
        <view class="row-body">
          <view class="row-title">清空宝宝数据</view>
          <view class="row-desc">删除资料、记录和备份，不可恢复</view>
        </view>
        <text class="row-arrow">›</text>
      </view>
    </view>

    <view class="card">
      <view class="row" @click="openAbout">
        <view class="row-body">
          <view class="row-title">关于与免责声明</view>
        </view>
        <text class="row-arrow">›</text>
      </view>
    </view>

    <view class="note">
      <view>数据仅保存在本机，不会上传服务器，也不会申请定位权限。</view>
      <view>清理小程序缓存或卸载小程序会丢失本机数据，请定期导出备份。</view>
      <view>备份文件包含宝宝资料和健康记录，请妥善保管。</view>
    </view>

    <view v-if="pasteOpen" class="form-mask" @click="pasteOpen = false">
      <view class="form-sheet" @click.stop>
        <view class="form-head">
          <text class="form-title">粘贴备份 JSON</text>
          <text class="form-close" @click="pasteOpen = false">✕</text>
        </view>
        <textarea
          class="textarea"
          v-model="importText"
          placeholder="在这里粘贴导出的 JSON 内容"
        />
        <view class="btn-row">
          <view class="btn btn-primary" @click="applyPaste">导入</view>
          <view class="btn btn-ghost" @click="pasteOpen = false">取消</view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { copyText } from '../../utils/clipboard.js'
import { loadProfile, saveProfile } from '../../utils/baby/profile.js'
import {
  MAX_IMPORT_BYTES,
  buildExportPayload,
  clearBabyData,
  exportFileName,
  restoreData,
  validateImportPayload,
} from '../../utils/baby/backup.js'

const form = ref({ name: '宝宝', birthDate: '', gender: 'boy' })
const profileError = ref('')
const pasteOpen = ref(false)
const importText = ref('')

function refresh() {
  const profile = loadProfile()
  form.value = {
    name: profile.name,
    birthDate: profile.birthDate,
    gender: profile.gender,
  }
  profileError.value = ''
}

function save() {
  const res = saveProfile(form.value)
  if (!res.ok) {
    profileError.value = res.error
    return
  }
  profileError.value = ''
  refresh()
  uni.showToast({ title: '已保存', icon: 'none' })
}

function exportData() {
  const text = JSON.stringify(buildExportPayload(), null, 2)
  // #ifdef MP-WEIXIN
  const fileName = exportFileName()
  try {
    const filePath = `${wx.env.USER_DATA_PATH}/${fileName}`
    wx.getFileSystemManager().writeFileSync(filePath, text, 'utf8')
    if (typeof wx.shareFileMessage === 'function') {
      wx.shareFileMessage({ filePath, fileName, fail: () => copyText(text) })
      return
    }
  } catch (e) {
    // 文件导出失败时降级为剪贴板
  }
  copyText(text)
  // #endif
  // #ifndef MP-WEIXIN
  copyText(text)
  // #endif
}

function restore() {
  // #ifdef MP-WEIXIN
  if (typeof wx.chooseMessageFile === 'function') {
    wx.chooseMessageFile({
      count: 1,
      type: 'file',
      extension: ['json'],
      success: (res) => {
        const file = res.tempFiles && res.tempFiles[0]
        if (!file) return
        if (file.size > MAX_IMPORT_BYTES) {
          uni.showToast({ title: '文件超过 2MB 限制', icon: 'none' })
          return
        }
        try {
          const text = wx.getFileSystemManager().readFileSync(file.path, 'utf8')
          applyImport(text)
        } catch (e) {
          uni.showToast({ title: '读取文件失败', icon: 'none' })
        }
      },
      fail: () => uni.showToast({ title: '未选择文件', icon: 'none' }),
    })
    return
  }
  // #endif
  pasteOpen.value = true
}

function applyPaste() {
  if (!importText.value.trim()) {
    uni.showToast({ title: '请粘贴备份内容', icon: 'none' })
    return
  }
  const text = importText.value
  pasteOpen.value = false
  importText.value = ''
  applyImport(text)
}

function applyImport(text) {
  const check = validateImportPayload(text)
  if (!check.ok) {
    uni.showModal({ title: '导入失败', content: check.error, showCancel: false })
    return
  }
  uni.showModal({
    title: '恢复数据',
    content: '将覆盖当前宝宝数据，导入前会自动备份当前数据。是否继续？',
    success: (res) => {
      if (!res.confirm) return
      const result = restoreData(check.payload.data)
      if (!result.ok) {
        uni.showModal({ title: '恢复失败', content: result.error, showCancel: false })
        return
      }
      refresh()
      uni.showToast({ title: '已恢复', icon: 'none' })
    },
  })
}

function clearData() {
  uni.showModal({
    title: '清空宝宝数据',
    content:
      '宝宝资料、所有记录、成长数据、疫苗记录和备份都会被删除且不可恢复。工具相关数据不受影响。',
    confirmText: '清空',
    confirmColor: '#D9485F',
    success: (res) => {
      if (!res.confirm) return
      if (!clearBabyData()) {
        uni.showToast({ title: '清空失败', icon: 'none' })
        return
      }
      refresh()
      uni.showToast({ title: '已清空', icon: 'none' })
    },
  })
}

function openAbout() {
  uni.navigateTo({ url: '/pages/about/about' })
}

onShow(refresh)
</script>

<style scoped>
.settings-page {
  padding: 24rpx 32rpx 64rpx;
}
.form-card {
  margin-top: 0;
}
.row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24rpx 0;
  border-bottom: 1rpx solid var(--border);
}
.row:last-child {
  border-bottom: none;
}
.row-body {
  flex: 1;
}
.row-title {
  font-size: 30rpx;
  color: var(--text);
}
.row-desc {
  margin-top: 6rpx;
  font-size: 24rpx;
  line-height: 1.5;
  color: var(--text-secondary);
}
.row-arrow {
  margin-left: 16rpx;
  font-size: 32rpx;
  color: var(--text-secondary);
}
.danger .row-title {
  color: var(--danger);
}
.note {
  margin-top: 32rpx;
  font-size: 24rpx;
  line-height: 1.8;
  color: var(--text-secondary);
}
.form-mask {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  z-index: 300;
  display: flex;
  align-items: flex-end;
  background: rgba(74, 74, 74, 0.45);
}
.form-sheet {
  width: 100%;
  padding: 32rpx 32rpx calc(32rpx + env(safe-area-inset-bottom));
  background: var(--surface);
  border-radius: 40rpx 40rpx 0 0;
}
.form-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24rpx;
}
.form-title {
  font-size: 32rpx;
  font-weight: 600;
  color: var(--text);
}
.form-close {
  padding: 8rpx 16rpx;
  font-size: 32rpx;
  color: var(--text-secondary);
}
</style>
