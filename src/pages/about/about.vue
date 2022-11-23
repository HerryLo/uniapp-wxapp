<template>
  <view class="wrapper">
    <view class="flex-center">
      <view class="gh_wxcode"></view>
    </view>
    <view class="title">关于项目</view>
    <view class="indent60"
      >之前一直想构建个人博客小程序，但是懒，不想维护接口服务，想直接用现成，又无。开始只是基于Github
      Pages + vuepress开发<text class="a" @click="copyText(blogLink)">个人网站</text>。</view
    >
    <view class="indent60"
      >最近在使用语雀，觉得非常的方便，所以文章都转移到了上面，居然发现语雀有提供API接口，使用每个用户（基于
      Token 关联到的账户），5000
      次/小时，可以获取到我上传的语雀文档数据，那就动手了！</view
    >
    <view class="indent60"
      >经过一周修修改改，一个勉强能看的小程序就正式上线了。目前只有文章查看功能，无法评论、搜索功能，后续也会将这个功能补上，不过具体什么时候，就不知道了！！</view
    >
    <view class="indent60"
      >本小程序是基于uniapp +
      语雀API构建完成，目前项目是开源状态。接口详见<text
        class="a"
        @click="copyText(yuqueLink)"
        > 语雀API文档</text
      >。</view
    >
    <view class="title">更多项目</view>
    <!-- <view class="indent60">相关链接：</view> -->
    <view>
      <view
        class="indent60 abefore"
        v-for="item in adoutLinks"
        v-bind:key="item.name"
        @click="copyText(item)"
        >{{ item.name }}</view
      >
    </view>

    <view class="title">联系</view>
    <view class="indent60">有疑问的同学也可私信我：<text class="a" @click="copyText(email)"
        >我的个人邮箱</text
      ></view>
  </view>
</template>

<script>
export default {
  data() {
    return {
      email: "herryloyopai@163.com",
      yuqueLink: "https://www.yuque.com/yuque/developer/api",
      blogLink: "https://herrylo.github.io/front",
      adoutLinks: [
        { name: "垃圾分类小程序跳转", link: "pages/index/index", appId: "wx6a0b834a3839e80d" },
        { name: "此项目GitHub地址", link: "https://github.com/HerryLo/uniapp-wxapp" },
        { name: "个人博客网站", link: "https://herrylo.github.io/front" },
        { name: "语雀文档", link: "https://www.yuque.com/yopai/pp6bv5" }
      ],
    };
  },
  methods: {
    copyText(data) {
      const { link, appId } = data;
      if(appId) {
        uni.navigateToMiniProgram({
          appId: appId,
          path: link
        })
      }else {
        uni.setClipboardData({
          data: link,
          success: () => {
            uni.showToast({
              title: "复制成功",
              duration: 1500,
            });
          },
        });
      }
    },
  },
};
</script>

<style>
page {
  background: rgba(0, 160, 233, 0.14);
  height: auto;
}
.title {
  font-size: 40upx;
  line-height: 80upx;
  color: #000;
}
.flex-center {
  display: flex;
  align-content: center;
  justify-content: center;
}
.gh_wxcode {
  width: 120upx;
  height: 120upx;
  border-radius: 50%;
  background-image: url("../../static/img.png");
  background-size: 100% 100%;
  background-position: 50%;
  margin-top: 30upx;
  margin-bottom: 40upx;
}
.wrapper {
  font-size: 30upx;
  padding: 10upx 30upx;
  line-height: 60upx;
  color: #666;
}
.indent60 {
  text-indent: 60upx;
}
.indent100 {
  text-indent: 100upx;
}
.a,
.abefore {
  color: #2eadc1;
}
.abefore:before {
  content: "";
  display: inline-block;
  width: 4px;
  height: 4px;
  border-radius: 4px;
  background-color: #8a8f8d;
  margin-right: 10upx;
  margin-left: 29upx;
}
</style>