<template>
  <view class="content">
    <view class="cardwrapper">
      <view class="cardcontent">
        <view class="title">HerryLo的个人博客</view>
        <view class="subtitle"></view>
        <view class="desc">工作😁生活</view>
        <view class="desc">持续学习 持续分享</view>
      </view>
    </view>

    <view class="cardlist" v-for="item in dataList" v-bind:key="item.id">
      <view
        v-if="item.cover"
        class="icon"
        :style="{
          backgroundImage: `url(${item.cover})`,
        }"
      >
      </view>
      <view v-else class="icon"></view>
      <view class="rightwrapper">
        <view class="title">{{ item.title }}</view>
        <view class="desc">{{ item.description }}</view>
        <view class="countwrapper">
          <view class="look">
            <view class="lookicon"></view>
            {{ item.hits }}
          </view>
        </view>
        <view class="time">{{ handleTime(item.created_at) }}</view>
      </view>
    </view>
  </view>
</template>

<script>
import { getRepoDocsList } from "../../service";
import { handleTime } from "../../utils/util";

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
        const res = await getRepoDocsList({
          limit: 100,
          offset: 0,
        });
        this.dataList = res.data;
        console.log(res);
        this.dataList = res.data;
      } catch (e) {
        console.log(e);
      }
    },
    handleTime,
  },
};
</script>

<style>
page {
  background: rgba(0, 160, 233, 0.14);
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
  font-weight: 800;
}

.cardwrapper {
  background: #fff;
  border: 1upx solid rgba(0, 0, 0, 0.1);
  border-radius: 12upx;
  padding: 30upx 30upx;
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

.cardwrapper .cardcontent {
  width: 550rpx;
  background: #fff;
  border-radius: 12upx;
  padding: 30upx 20upx;
  box-shadow: 0 1rpx 3rpx rgba(0, 0, 0, 0.01), 0 0 6rpx rgba(0, 0, 0, 0.1),
    0 8rpx 16rpx rgba(0, 0, 0, 0.2);
}

.cardcontent .title {
  font-family: cursive;
  max-width: 100%;
  white-space: nowrap;
  text-overflow: ellipsis;
  overflow: hidden;
  font-style: normal;
  font-weight: 600;
  font-size: 37rpx;
  color: #000;
  margin-bottom: 6upx;
  display: flex;
  align-items: center;
}

.cardcontent .title::before {
  content: "";
  display: inline-block;
  background-image: url("../../static/xing.png");
  width: 48upx;
  height: 48upx;
  background-size: 100%;
  background-position: 50%;
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

.cardcontent .desc {
  font-size: 28upx;
  color: rgba(0, 0, 0, 0.8);
  max-width: 100%;
  white-space: nowrap;
  text-overflow: ellipsis;
  overflow: hidden;
  line-height: 50upx;
}

.cardlist {
  background-color: #fff;
  padding: 20upx 30upx;
  border-bottom: 1upx solid rgba(0, 0, 0, 0.05);
  /* border: 1upx solid #9f9b44; */
  width: 80%;
  margin-top: 30upx;
  display: flex;
  justify-content: flex-start;
  border-radius: 15upx;
}

.cardlist .icon {
  flex: 0 0 auto;
  background-size: cover;
  width: 140upx;
  height: 140upx;
  background-color: #00a0e9;
  border: 1upx solid #009fe967;
  border-radius: 15upx;
  margin-right: 10upx;
  background-image: url("../../static/qyz.png");
}

.rightwrapper {
  position: relative;
}

.rightwrapper .title {
  font-size: 35upx;
  margin-top: 8upx;
  width: 450upx;
  max-width: 100%;
  white-space: nowrap;
  text-overflow: ellipsis;
  overflow: hidden;
}

.rightwrapper .desc {
  width: 440rpx;
  font-size: 23upx;
  white-space: nowrap;
  text-overflow: -o-ellipsis-lastline;
  overflow: hidden;
  text-overflow: ellipsis;
  /* display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2; */
  /* -webkit-box-orient: vertical; */
  /* white-space: normal; */
  line-height: 42rpx;
  color: #666666;
}

.countwrapper {
  position: absolute;
  left: 2upx;
  bottom: 0upx;
  display: flex;
}

.rightwrapper .look {
  font-size: 23upx;
  color: rgba(102, 102, 102, 0.502);
  display: flex;
  align-items: center;
}

.rightwrapper .look .lookicon {
  content: "";
  display: inline-block;
  background-image: url(../../static/look.png);
  background-size: 100%;
  background-position: 50%;
  background-repeat: no-repeat;
  width: 28upx;
  height: 28upx;
  margin-right: 5upx;
}

.rightwrapper .time {
  position: absolute;
  right: 2upx;
  bottom: 0upx;
  font-size: 23upx;
  color: rgba(102, 102, 102, 0.502);
}
</style>
