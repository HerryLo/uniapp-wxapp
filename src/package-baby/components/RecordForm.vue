<template>
  <view v-if="visible" class="form-mask" @click="$emit('close')">
    <view class="form-sheet" @click.stop>
      <view class="form-head">
        <text class="form-title">{{ title }}</text>
        <text class="form-close" @click="$emit('close')">✕</text>
      </view>

      <view v-if="error" class="form-error">{{ error }}</view>

      <template v-if="kind === 'milk'">
        <view class="form-label">时间</view>
        <view class="form-row">
          <picker mode="date" :value="date" @change="date = $event.detail.value">
            <view class="form-picker">{{ date }}</view>
          </picker>
          <picker mode="time" :value="time" @change="time = $event.detail.value">
            <view class="form-picker">{{ time }}</view>
          </picker>
        </view>
        <view class="form-label">类型</view>
        <view class="chip-row">
          <view
            v-for="item in milkTypes"
            :key="item"
            class="chip"
            :class="{ active: milkType === item }"
            @click="milkType = item"
          >{{ item }}</view>
        </view>
        <view class="form-label">奶量（ml，可选）</view>
        <input class="input" type="number" v-model="amount" placeholder="例如 120" />
      </template>

      <template v-else-if="kind === 'sleep'">
        <view class="form-label">开始</view>
        <view class="form-row">
          <picker
            mode="date"
            :value="sleepStartDate"
            @change="sleepStartDate = $event.detail.value"
          >
            <view class="form-picker">{{ sleepStartDate }}</view>
          </picker>
          <picker
            mode="time"
            :value="sleepStartTime"
            @change="sleepStartTime = $event.detail.value"
          >
            <view class="form-picker">{{ sleepStartTime }}</view>
          </picker>
        </view>
        <view class="form-label">结束</view>
        <view class="form-row">
          <picker
            mode="date"
            :value="sleepEndDate"
            @change="sleepEndDate = $event.detail.value"
          >
            <view class="form-picker">{{ sleepEndDate }}</view>
          </picker>
          <picker
            mode="time"
            :value="sleepEndTime"
            @change="sleepEndTime = $event.detail.value"
          >
            <view class="form-picker">{{ sleepEndTime }}</view>
          </picker>
        </view>
      </template>

      <template v-else-if="kind === 'food'">
        <view class="form-label">时间</view>
        <view class="form-row">
          <picker mode="date" :value="date" @change="date = $event.detail.value">
            <view class="form-picker">{{ date }}</view>
          </picker>
          <picker mode="time" :value="time" @change="time = $event.detail.value">
            <view class="form-picker">{{ time }}</view>
          </picker>
        </view>
        <view class="form-label">食物名称</view>
        <input class="input" v-model="foodName" maxlength="30" placeholder="例如 米糊" />
        <view class="form-label">份量（可选）</view>
        <input class="input" v-model="foodAmount" maxlength="20" placeholder="例如 半碗" />
        <view class="form-label">进食反应</view>
        <view class="chip-row">
          <view
            v-for="item in FOOD_REACTIONS"
            :key="item"
            class="chip"
            :class="{ active: foodReaction === item }"
            @click="foodReaction = item"
          >{{ item }}</view>
        </view>
        <view v-if="foodReaction === '异常'" class="form-tip">
          如出现持续异常反应，请咨询儿科医生。
        </view>
        <view class="form-label">备注（可选）</view>
        <textarea
          class="textarea"
          v-model="foodNote"
          maxlength="200"
          placeholder="记录进食情况"
        />
      </template>

      <template v-else-if="kind === 'medicine' || kind === 'supplement'">
        <view class="form-label">时间</view>
        <view class="form-row">
          <picker mode="date" :value="date" @change="date = $event.detail.value">
            <view class="form-picker">{{ date }}</view>
          </picker>
          <picker mode="time" :value="time" @change="time = $event.detail.value">
            <view class="form-picker">{{ time }}</view>
          </picker>
        </view>
        <view class="form-label">
          {{ kind === 'medicine' ? '药品名称（自定义）' : '补剂名称（自定义）' }}
        </view>
        <input
          class="input"
          v-model="customName"
          maxlength="30"
          :placeholder="kind === 'medicine' ? '输入药品名称' : '输入补剂名称'"
        />
        <view class="form-label">用量（可选，自行填写）</view>
        <input class="input" v-model="customAmount" maxlength="20" placeholder="例如 5 ml" />
        <view class="form-label">备注（可选）</view>
        <textarea
          class="textarea"
          v-model="customNote"
          maxlength="200"
          :placeholder="kind === 'medicine' ? '记录用药情况' : '记录补剂情况'"
        />
        <view class="form-tip">
          {{ kind === 'medicine'
            ? '仅记录用户输入，不提供用药建议，请遵医嘱。'
            : '仅记录用户输入，不提供补剂建议，请遵医嘱。' }}
        </view>
      </template>

      <template v-else>
        <view class="form-label">时间</view>
        <view class="form-row">
          <picker mode="date" :value="date" @change="date = $event.detail.value">
            <view class="form-picker">{{ date }}</view>
          </picker>
          <picker mode="time" :value="time" @change="time = $event.detail.value">
            <view class="form-picker">{{ time }}</view>
          </picker>
        </view>
        <view class="form-label">类型</view>
        <view class="chip-row">
          <view
            v-for="item in diaperTypes"
            :key="item"
            class="chip"
            :class="{ active: diaperType === item }"
            @click="diaperType = item"
          >{{ item }}</view>
        </view>
        <view class="form-label">颜色</view>
        <view class="chip-row">
          <view
            v-for="item in diaperColors"
            :key="item"
            class="chip"
            :class="{ active: diaperColor === item }"
            @click="diaperColor = item"
          >{{ item }}</view>
        </view>
        <template v-if="diaperType !== '小便'">
          <view class="form-label">形状</view>
          <view class="chip-row">
            <view
              v-for="item in DIAPER_SHAPES"
              :key="item"
              class="chip"
              :class="{ active: diaperShape === item }"
              @click="diaperShape = item"
            >{{ item }}</view>
          </view>
        </template>
        <view class="form-label">备注（可选）</view>
        <textarea
          class="textarea"
          v-model="diaperNote"
          maxlength="200"
          placeholder="记录排便情况"
        />
      </template>

      <view class="btn-row">
        <view class="btn btn-primary" @click="submit">保存</view>
        <view class="btn btn-ghost" @click="$emit('close')">取消</view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { formatDateTime, todayKey } from '../../utils/baby/date.js'
import { DIAPER_SHAPES, FOOD_REACTIONS } from '../../utils/baby/records.js'

const props = defineProps({
  visible: { type: Boolean, default: false },
  kind: { type: String, default: 'milk' },
  date: { type: String, default: () => todayKey() },
  error: { type: String, default: '' },
})

const emit = defineEmits(['close', 'submit'])

const milkTypes = ['母乳', '配方奶', '混合']
const diaperTypes = ['大便', '小便', '都有']
const diaperColors = ['正常', '绿色', '黑色', '白色', '带血']

const date = ref(props.date)
const time = ref('')
const milkType = ref('母乳')
const amount = ref('')
const sleepStartDate = ref('')
const sleepStartTime = ref('')
const sleepEndDate = ref('')
const sleepEndTime = ref('')
const diaperType = ref('小便')
const diaperColor = ref('正常')
const diaperShape = ref('糊状')
const diaperNote = ref('')
const foodName = ref('')
const foodAmount = ref('')
const foodReaction = ref('一般')
const foodNote = ref('')
const customName = ref('')
const customAmount = ref('')
const customNote = ref('')

const title = computed(() => {
  if (props.kind === 'sleep') return '😴 记录睡眠'
  if (props.kind === 'diaper') return '💧 记录排便'
  if (props.kind === 'food') return '🍚 记录辅食'
  if (props.kind === 'medicine') return '💊 记录用药'
  if (props.kind === 'supplement') return '🌿 记录补剂'
  return '🍼 记录喝奶'
})

function reset() {
  const now = new Date()
  const start = formatDateTime(now)
  const end = formatDateTime(new Date(now.getTime() + 60 * 60000))
  date.value = props.date || todayKey()
  time.value = start.slice(11, 16)
  milkType.value = '母乳'
  amount.value = ''
  sleepStartDate.value = start.slice(0, 10)
  sleepStartTime.value = start.slice(11, 16)
  sleepEndDate.value = end.slice(0, 10)
  sleepEndTime.value = end.slice(11, 16)
  diaperType.value = '小便'
  diaperColor.value = '正常'
  diaperShape.value = '糊状'
  diaperNote.value = ''
  foodName.value = ''
  foodAmount.value = ''
  foodReaction.value = '一般'
  foodNote.value = ''
  customName.value = ''
  customAmount.value = ''
  customNote.value = ''
}

watch(
  () => props.visible,
  (visible) => {
    if (visible) reset()
  }
)

watch(
  () => props.kind,
  () => {
    if (props.visible) reset()
  }
)

watch(
  () => props.date,
  (value) => {
    if (props.visible) date.value = value
  }
)

reset()

function submit() {
  if (props.kind === 'milk') {
    emit('submit', {
      time: `${date.value} ${time.value}`,
      type: milkType.value,
      amount: amount.value === '' ? null : amount.value,
    })
    return
  }
  if (props.kind === 'sleep') {
    emit('submit', {
      start: `${sleepStartDate.value} ${sleepStartTime.value}`,
      end: `${sleepEndDate.value} ${sleepEndTime.value}`,
    })
    return
  }
  if (props.kind === 'food') {
    emit('submit', {
      time: `${date.value} ${time.value}`,
      name: foodName.value,
      amount: foodAmount.value,
      reaction: foodReaction.value,
      note: foodNote.value,
    })
    return
  }
  if (props.kind === 'medicine' || props.kind === 'supplement') {
    emit('submit', {
      time: `${date.value} ${time.value}`,
      name: customName.value,
      amount: customAmount.value,
      note: customNote.value,
    })
    return
  }
  emit('submit', {
    time: `${date.value} ${time.value}`,
    type: diaperType.value,
    color: diaperColor.value,
    shape: diaperType.value === '小便' ? '' : diaperShape.value,
    note: diaperNote.value,
  })
}
</script>

<style scoped>
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
  max-height: 86vh;
  overflow-y: auto;
  padding: 32rpx 32rpx calc(32rpx + env(safe-area-inset-bottom));
  background: var(--surface);
  border-radius: 48rpx 48rpx 0 0;
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
.form-label {
  margin-top: 24rpx;
  margin-bottom: 12rpx;
  font-size: 28rpx;
  color: var(--text-secondary);
}
.form-row {
  display: flex;
  justify-content: space-between;
}
.form-row picker {
  width: 48%;
}
.form-picker {
  height: 80rpx;
  display: flex;
  align-items: center;
  padding: 0 20rpx;
  background: var(--cream);
  border: 1rpx solid var(--border);
  border-radius: 28rpx;
  font-size: 30rpx;
  color: var(--text);
}
.form-error {
  margin-top: 8rpx;
  font-size: 26rpx;
  color: var(--danger);
}
.form-tip {
  margin-top: 12rpx;
  font-size: 22rpx;
  line-height: 1.6;
  color: var(--primary-strong);
}
</style>
