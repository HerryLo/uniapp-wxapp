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
.ne-codeblock.language-json,
.ne-codeblock.language-bash {
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
  font-size: 35rpx;
  line-height: 70rpx;
  margin: 40rpx 0;
}
.ne-p {
  font-size: 32rpx;
  margin-top: 10rpx;
  padding: 0 10rpx;
  line-height: 5rpx!important;
}
.ne-image {
  margin: 10rpx 0;
  width: 100% !important;
}
.lake-content h2 {
  font-size: 20px;
}
</style>
