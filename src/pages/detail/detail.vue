<template>
  <view class="detailwrapper">
    <rich-text v-if="nodes" :nodes="nodes"></rich-text>
  </view>
</template>

<script>
import { getDocsDetail } from "../../service";

export default {
  data() {
    return {
      nodes: ``,
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
        const res = await getDocsDetail({ slug });
        console.log(res);
        this.nodes = res.data.body_html.replace('<!doctype html>', '');
      } catch (e) {
        console.log(e);
      }
    },
  },
};
</script>

<style>
.detailwrapper {
  padding: 10upx 20upx;
  font-size: 32rpx;
}
.ne-codeblock.language-javascript,
.ne-codeblock.language-jsx,
.ne-codeblock.language-plain {
  white-space:pre;
  width: 90%;
  overflow-y: scroll;
  background: #26262626;
  padding: 20upx 30upx;
  border-radius: 13upx;
}
.ne-text {
  line-height: 70upx;
  margin-top: 10upx;
}
.ne-p {
  font-size: 35upx;
  margin-top: 10rpx;
}
.ne-image {
  margin: 10upx 0;
  width: 100% !important;
}
</style>
