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
  padding: 20upx 30upx;
  border-radius: 13upx;
  margin: 5upx 0;
}
.ne-text {
  font-size: 35upx;
  line-height: 70upx;
  margin: 40upx 0;
}
.ne-p {
  font-size: 32upx;
  margin-top: 10rpx;
  padding: 0 10upx;
  line-height: 5upx!important;
}
.ne-image {
  margin: 10upx 0;
  width: 100% !important;
}
.lake-content h2 {
  font-size: 20px;
}
</style>
