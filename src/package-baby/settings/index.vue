<template>
  <BabyPage active="settings">
    <view class="settings-page">
      <view class="card form-card">
        <view class="card-title">👶 宝宝资料</view>
        <view class="avatar-row" @click="editAvatar">
          <image
            v-if="form.avatar"
            class="avatar-preview"
            :src="form.avatar"
            mode="aspectFill"
          />
          <view v-else class="avatar-preview avatar-placeholder">👶</view>
          <view class="avatar-meta">
            <view class="avatar-title">宝宝头像</view>
            <view class="avatar-desc">点击更换或移除</view>
          </view>
          <text class="row-arrow">›</text>
        </view>
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

      <view class="note">
        <view>数据仅保存在本机，不会上传服务器，也不会申请定位权限。</view>
        <view>清理小程序缓存或卸载小程序会丢失本机数据，请在「我的 - 数据管理」中定期导出备份。</view>
      </view>
    </view>
  </BabyPage>
</template>

<script setup>
import { ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import BabyPage from '../../components/baby/BabyPage.vue'
import { chooseAvatarImage } from '../../utils/baby/avatar.js'
import { loadProfile, saveProfile } from '../../utils/baby/profile.js'

const form = ref({ name: '宝宝', birthDate: '', gender: 'boy', avatar: '' })
const profileError = ref('')

function refresh() {
  const profile = loadProfile()
  form.value = {
    name: profile.name,
    birthDate: profile.birthDate,
    gender: profile.gender,
    avatar: profile.avatar,
  }
  profileError.value = ''
}

function editAvatar() {
  uni.showActionSheet({
    itemList: ['从相册选择', '拍照', '移除头像'],
    success: async (res) => {
      if (res.tapIndex === 2) {
        form.value.avatar = ''
        return
      }
      const picked = await chooseAvatarImage({
        sourceType: res.tapIndex === 1 ? ['camera'] : ['album'],
      })
      if (!picked.ok) {
        if (picked.error !== '未选择图片') {
          uni.showToast({ title: picked.error, icon: 'none' })
        }
        return
      }
      form.value.avatar = picked.dataUrl
    },
  })
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
  uni.switchTab({ url: '/pages/baby/index' })
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
.avatar-row {
  display: flex;
  align-items: center;
  padding: 8rpx 0 24rpx;
  border-bottom: 1rpx solid var(--border);
}
.avatar-preview {
  width: 104rpx;
  height: 104rpx;
  border-radius: 50%;
  background: #FFF1F3;
}
.avatar-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 52rpx;
}
.avatar-meta {
  flex: 1;
  margin-left: 20rpx;
}
.avatar-title {
  font-size: 30rpx;
  color: var(--text);
}
.avatar-desc {
  margin-top: 6rpx;
  font-size: 24rpx;
  color: var(--text-secondary);
}
.row-arrow {
  margin-left: 16rpx;
  font-size: 32rpx;
  color: var(--text-secondary);
}
.note {
  margin-top: 32rpx;
  font-size: 24rpx;
  line-height: 1.8;
  color: var(--text-secondary);
}
</style>
