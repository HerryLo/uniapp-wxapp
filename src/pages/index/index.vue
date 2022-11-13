<template>
  <view class="content">
    <view class="cardwrapper">
      <view class="title">HerryLo的个人博客</view>
      <view class="subtitle">不是技术的生产者 只是技术的搬运工</view>
      <view class="desc">工作，生活</view>
      <view class="desc">前端、数据结构、网络、React框架、随笔分享</view>
    </view>
  </view>
</template>

<script>
import { getRepoDocsList } from "../../service";
export default {
  data() {
    return {
      dataList: [],
    };
  },
  onLoad() {
    this.repoDocsList();
  },
  methods: {
    async repoDocsList() {
      try {
        const res = await getRepoDocsList();
        console.log(res);
        this.dataList = res.data;
      } catch (e) {
        console.log(e);
      }
    },
  },
};
</script>

<style>
page {
  background: #eee;
}
.content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.logo {
  height: 200rpx;
  width: 200rpx;
  margin: 200rpx auto 50rpx auto;
}

.text-area {
  display: flex;
  justify-content: center;
}

.title {
  font-size: 36rpx;
  color: #8f8f94;
}

.cardwrapper {
  background: #fff;
  border: 1upx solid rgba(0, 0, 0, 0.05);
  border-radius: 12upx;
  padding: 120upx 50upx;
  /* display: flex;
  justify-content: flex-start;
  align-items: center; */
  cursor: pointer;
  /* flex: 1 1; */
  margin-top: 50upx;
  box-shadow: 0 1upx 3upx rgba(0, 0, 0, 0.01), 0 0 6upx rgba(0, 0, 0, 0.06),
    0 8upx 16upx rgba(0, 0, 0, 0.06);
  position: relative;
}
.title {
  max-width: 100%;
  white-space: nowrap;
  text-overflow: ellipsis;
  overflow: hidden;
  font-style: normal;
  font-weight: 600;
  font-size: 35upx;
  color: #000;
  margin-bottom: 6upx;
}
.subtitle {
  text-overflow: ellipsis;
  overflow: hidden;
  font-style: normal;
  font-weight: 600;
  font-size: 38upx;
  color: #000;
  margin-bottom: 20upx;
}
.desc {
  font-size: 28upx;
  color: rgba(0, 0, 0, 0.8);
  max-width: 100%;
  white-space: nowrap;
  text-overflow: ellipsis;
  overflow: hidden;
  line-height: 50upx;
}
</style>
