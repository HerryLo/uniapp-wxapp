<template>
  <view class="sildercard" style="margin-bottom: 20rpx">
    <scroll-view
      class="scroll-view_H"
      scroll-x="true"
      @scroll="scroll"
      scroll-left="0"
    >
      <view id="demo1" class="scroll-view-item_H uni-bg-red">A</view>
      <view id="demo2" class="scroll-view-item_H uni-bg-green">B</view>
      <view id="demo3" class="scroll-view-item_H uni-bg-blue">C</view>
    </scroll-view>
  </view>
</template>

<script>
export default {
    name: 'SliderCard',
  data() {
    return {
      scrollTop: 0,
      old: {
        scrollTop: 0,
      },
    };
  },
  onLoad() {
    console.log(this.dataList);
  },
  props: ["dataList"],
  methods: {
    clickCard() {
      //   const { slug } = item
      //   uni.navigateTo({
      //     url: `/pages/detail/detail?slug=${slug}`,
      //   });
    },
    upper: function (e) {
      console.log(e);
    },
    lower: function (e) {
      console.log(e);
    },
    scroll: function (e) {
      console.log(e);
      this.old.scrollTop = e.detail.scrollTop;
    },
    goTop: function (e) {
      // 解决view层不同步的问题
      this.scrollTop = this.old.scrollTop;
      this.$nextTick(function () {
        this.scrollTop = 0;
      });
      uni.showToast({
        icon: "none",
        title: "纵向滚动 scrollTop 值已被修改为 0",
      });
    },
  },
};
</script>

<style>
.sildercard {
  width: 100vw;
    box-sizing: border-box;
    padding-top: 20rpx;
    padding-left: 60rpx;
}
.scroll-view_H {
        white-space: nowrap;
    width: 100%;
    height: 400rpx;
    /* padding-right: 82rpx; */
    box-sizing: border-box;
    border-radius: 20rpx;
}
.scroll-view-item_H {
  display: inline-block;
  width: 62%;
  height: 100%;
  line-height: 400rpx;
  text-align: center;
  font-size: 36rpx;
  margin-right: 30rpx;
  border-radius: 20rpx;
}
.uni-bg-red {
  background: #f76260;
}
.uni-bg-green {
  background: #09bb07;
  color: #fff;
}
.uni-bg-blue {
  background: #007aff;
  color: #fff;
}
</style>
