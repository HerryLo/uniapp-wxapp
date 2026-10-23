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
  padding: 20rpx 30rpx;
  border-radius: 13rpx;
  margin: 5rpx 0;
}
.ne-text {
  font-size: 32rpx;
  line-height: 70rpx;
  margin-top: 10rpx;
}
.ne-p {
  font-size: 32rpx;
  margin-top: 10rpx;
}
.ne-image {
  margin: 10rpx 0;
  width: 100% !important;
}
</style>
