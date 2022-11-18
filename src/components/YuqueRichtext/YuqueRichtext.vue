<template>
  <view>
    <rich-text v-if="richtext" :nodes="richtext"></rich-text>
  </view>
</template>

<script>
export default {
  name: "YuqueRichtext",
  data() {
    return {};
  },
  props: ["richtext"],
};
</script>

<style>
.ne-codeblock.language-javascript,
.ne-codeblock.language-jsx,
.ne-codeblock.language-plain,
.ne-codeblock.language-yaml,
.ne-codeblock.language-java,
.ne-codeblock.language-json {
  color: #fff;
  white-space: pre;
  width: 90%;
  overflow-y: scroll;
  background: #000;
  padding: 20upx 30upx;
  border-radius: 13upx;
  margin: 5upx 0;
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
</style>
