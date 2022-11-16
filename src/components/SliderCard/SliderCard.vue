<template>
  <view class="sildercard">
    <scroll-view
      class="scroll-view_H"
      scroll-x="true"
      @scroll="scroll"
      scroll-left="0"
    >
      <view class="scroll-cardwrapper">
        <view
          class="scroll-view-item_H uni-bg"
          v-for="item in dataList"
          v-bind:key="item"
        >
          <view class="title" :style="{ color: item.color }">{{
            item.title
          }}</view>
          <view
            class="desc"
            v-for="data1 in item.dataList"
            v-bind:key="data1.name"
            @click="clickCard(data1)"
            >{{data1.name}}</view>
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<script>
export default {
  name: "SliderCard",
  data() {
    return {
      scrollTop: 0,
      old: {
        scrollTop: 0,
      },
      dataList: [
        {
          title: "最近发布",
          color: "rgba(0, 160, 233, 0.6)",
          dataList: [
            { name: "2022前端开发知识归纳", slug: "lwxh4l" },
            { name: "React底层运行简记", slug: "pu72zq" },
          ],
        },
        {
          title: "技术",
          color: "rgba(86,81, 3, 58%)",
          dataList: [
            { name: "2022前端开发知识归纳", slug: "lwxh4l" },
            { name: "GitHub Action一键部署", slug: "xxxnrz" },
            { name: "React底层运行简记", slug: "pu72zq" },
            { name: "JavaScript设计模式", slug: "mtu8xy" },
          ],
        },
        {
          title: "随想",
          color: "#64004ec4",
          dataList: [
            { name: "《乡土中国》阅读小计", slug: "uxnd1e" },
            { name: "卷二——资本的流通过程", slug: "nd9u6n" },
            { name: "卷一——资本的生产过程", slug: "ndevek" },
          ],
        },
        {
          title: "生活",
          color: "rgba(130,120,0,65%)",
          dataList: [{ name: "如何阅读一本书 思维导图", slug: "dif0g5" }],
        },
      ],
    };
  },
  onLoad() {
    console.log(this.dataSource);
  },
  props: ["dataSource"],
  methods: {
    clickCard(item) {
      const { slug } = item;
      uni.navigateTo({
        url: `/pages/detail/detail?slug=${slug}`,
      });
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
  padding-top: 60upx;
  padding-left: 43rpx;
}
.scroll-cardwrapper {
  display:flex;
  align-items: center;
}
.scroll-view_H {
  white-space: nowrap;
  width: 100%;
  height: 400upx;
  box-sizing: border-box;
  border-radius: 20upx;
}
.scroll-view-item_H {
  display: inline-block;
      width: 46%;
  height: 350upx;
  font-size: 36upx;
  margin-right: 30upx;
  border-radius: 20upx;
  background: #fff;
  color: #000;
  box-shadow: 0 1upx 3upx rgba(0, 0, 0, 0.01), 0 0 6upx rgba(0, 0, 0, 0.02),
    0 8upx 16upx rgba(0, 0, 0, 0.02);
  border: 1upx solid rgba(0, 0, 0, 0.03);
      flex: 1 0 auto;
}
.title {
  font-size: 45upx;
  text-align: left;
  height: 120upx;
  line-height: 120upx;
  padding-left: 30upx;
}
.desc:before {
  content: "";
  display: inline-block;
  width: 4px;
  height: 4px;
  border-radius: 4px;
  background-color: #8a8f8d;
  margin-right: 10upx;
  margin-left: 29upx;
}
.desc {
  display: flex;
  align-items: center;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 24upx;
  color: #8a8f8d;
  margin-bottom: 20rpx;
}
</style>
