<template>
  <view>
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
import { handleTime } from "../../utils/util";

export default {
  data() {
    return {
      dataList: this.dataList
    };
  },
  onLoad() {
    console.log(this.dataList);
  },
  props: ["dataList"],
  methods: {
    handleTime,
  },
};
</script>

<style>

.cardlist {
  background-color: #fff;
  padding: 20upx 30upx;
  border-bottom: 1upx solid rgba(0, 0, 0, 0.05);
  /* border: 1upx solid #9f9b44; */
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
  background-color: rgb(0, 160, 233, 9%);
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
