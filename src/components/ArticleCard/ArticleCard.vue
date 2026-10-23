<template>
  <view style="margin-bottom:20rpx;">
    <view
      class="cardlist"
      v-for="item in dataList"
      v-bind:key="item.id"
      @click="clickCard(item)"
    >
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
import { handleTime } from "../../utils/util";

export default {
  data() {
    return {
    };
  },
  onLoad() {
    console.log(this.dataList);
  },
  props: ["dataList"],
  methods: {
    clickCard(item) {
      const { slug } = item
      uni.navigateTo({
        url: `/pages/detail/detail?slug=${slug}`,
      });
    },
    handleTime,
  },
};
</script>

<style>
.cardlist {
  background-color: #fff;
  padding: 20rpx 30rpx;
  border-bottom: 1rpx solid rgba(0, 0, 0, 0.05);
  /* border: 1rpx solid #9f9b44; */
  margin-top: 30rpx;
  display: flex;
  justify-content: flex-start;
  border-radius: 15rpx;
}

.cardlist .icon {
  flex: 0 0 auto;
  background-size: cover;
  width: 140rpx;
  height: 140rpx;
  background-color: rgb(0, 160, 233, 9%);
  border: 1rpx solid #009fe967;
  border-radius: 15rpx;
  margin-right: 10rpx;
  background-image: url("../../static/qyz.png");
}

.rightwrapper {
  position: relative;
}

.rightwrapper .title {
  font-size: 35rpx;
  margin-top: 8rpx;
  width: 450rpx;
  max-width: 100%;
  white-space: nowrap;
  text-overflow: ellipsis;
  overflow: hidden;
}

.rightwrapper .desc {
  width: 440rpx;
  font-size: 23rpx;
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
  left: 2rpx;
  bottom: 0rpx;
  display: flex;
}

.rightwrapper .look {
  font-size: 23rpx;
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
  width: 28rpx;
  height: 28rpx;
  margin-right: 5rpx;
}

.rightwrapper .time {
  position: absolute;
  right: 2rpx;
  bottom: 0rpx;
  font-size: 23rpx;
  color: rgba(102, 102, 102, 0.502);
}
</style>
