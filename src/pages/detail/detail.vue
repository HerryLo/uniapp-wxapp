<template>
  <view class="detailwrapper">
    <view class="copytext" @click="copyLink()">语雀原文链接</view>
    <yuque-richtext :richtext="nodes"></yuque-richtext>
    <!-- <rich-text v-if="nodes" :nodes="nodes"></rich-text> -->
  </view>
</template>

<script>
import { getDocsDetail } from "@/service";
import { reposLink } from '@/utils/constant';
import YuqueRichtext from '@/components/YuqueRichtext/YuqueRichtext';

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
  components: { YuqueRichtext }
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
</style>
