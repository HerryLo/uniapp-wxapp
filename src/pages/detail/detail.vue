<template>
  <view class="detailwrapper">
    <view class="copytext" @click="copyLink()">语雀原文链接</view>
    <rich-text v-if="nodes" :nodes="nodes"></rich-text>
  </view>
</template>

<script>
import { getDocsDetail } from "../../service";
import { reposLink } from '../../utils/constant';

export default {
  data() {
    return {
      nodes: ``,
      slug: "",
    };
  },
  onLoad(option) {
    const { slug } = option;
    this.getDocsDetail(slug);
  },
  methods: {
    async getDocsDetail(slug) {
      if (!slug) return false;
      try {
        this.slug = slug;
        const res = await getDocsDetail({ slug });
        console.log(res);
        this.nodes = res.data.body_html.replace("<!doctype html>", "");
      } catch (e) {
        console.log(e);
      }
    },
    copyLink() {
      const data = `${reposLink}/${this.slug}`;
      uni.setClipboardData({
        data,
        success: () => {
          uni.showToast({
            title: "链接复制成功",
            duration: 2000,
          });
        },
      });
    },
  },
};
</script>

<style>
page {
  background: rgba(0, 160, 233, 0.14);
}
.detailwrapper {
  padding: 10upx 20upx;
  font-size: 32rpx;
}
.copytext {
  color: #0400ff;
  margin: 10rpx 0;
}
.ne-codeblock.language-javascript,
.ne-codeblock.language-jsx,
.ne-codeblock.language-plain,
.ne-codeblock.language-yaml {
  white-space: pre;
  width: 90%;
  overflow-y: scroll;
  background: #26262626;
  padding: 20upx 30upx;
  border-radius: 13upx;
}
.ne-text {
  font-size: 32upx;
  line-height: 70upx;
  margin-top: 10upx;
}
.ne-p {
  font-size: 32upx;
  margin-top: 10rpx;
}
.ne-image {
  margin: 10upx 0;
  width: 100% !important;
}
.lake-content {
  border: none;
}
</style>
