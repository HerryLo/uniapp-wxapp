<template>
  <view class="content">
    <view class="cardwrapper">
      <view class="cardcontent">
        <view class="title">HerryLo的个人博客</view>
        <view class="subtitle"></view>
        <view class="desc">工作😁生活</view>
        <view class="desc">持续学习 持续分享</view>
      </view>
    </view>

    <!-- 文章列表卡片 -->
    <article-card
      v-if="dataList.length"
      v-bind:dataList="dataList"
    ></article-card>
  </view>
</template>

<script>
import { getRepoDocsList } from "../../service";
import { handleTime } from "../../utils/util";
import ArticleCard from '../../components/ArticleCard/ArticleCard'

export default {
  data() {
    return {
      dataList: [],
    };
  },
  onLoad() {
    this.repoDocsList();
  },
  methods: {
    async repoDocsList() {
      try {
        const res = await getRepoDocsList({
          limit: 100,
          offset: 0,
        });
        this.dataList = res.data;
        console.log(res);
        this.dataList = res.data;
      } catch (e) {
        console.log(e);
      }
    },
    handleTime,
  },
  components: { ArticleCard }
};
</script>

<style>
page {
  background: rgba(0, 160, 233, 0.14);
}

.content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.logo {
  height: 200rpx;
  width: 200rpx;
  margin: 200rpx auto 50rpx auto;
}

.text-area {
  display: flex;
  justify-content: center;
}

.title {
  font-size: 36rpx;
  font-weight: 800;
}

.cardwrapper {
  background: #fff;
  border: 1upx solid rgba(0, 0, 0, 0.1);
  border-radius: 12upx;
  padding: 30upx 30upx;
  /* display: flex;
  justify-content: flex-start;
  align-items: center; */
  cursor: pointer;
  /* flex: 1 1; */
  margin-top: 50upx;
  box-shadow: 0 1upx 3upx rgba(0, 0, 0, 0.01), 0 0 6upx rgba(0, 0, 0, 0.06),
    0 8upx 16upx rgba(0, 0, 0, 0.06);
  position: relative;
}

.cardwrapper .cardcontent {
  width: 550rpx;
  background: #fff;
  border-radius: 12upx;
  padding: 30upx 20upx;
  box-shadow: 0 1rpx 3rpx rgba(0, 0, 0, 0.01), 0 0 6rpx rgba(0, 0, 0, 0.1),
    0 8rpx 16rpx rgba(0, 0, 0, 0.2);
}

.cardcontent .title {
  font-family: cursive;
  max-width: 100%;
  white-space: nowrap;
  text-overflow: ellipsis;
  overflow: hidden;
  font-style: normal;
  font-weight: 600;
  font-size: 37rpx;
  color: #000;
  margin-bottom: 6upx;
  display: flex;
  align-items: center;
}

.cardcontent .title::before {
  content: "";
  display: inline-block;
  background-image: url("../../static/xing.png");
  width: 48upx;
  height: 48upx;
  background-size: 100%;
  background-position: 50%;
}

.subtitle {
  text-overflow: ellipsis;
  overflow: hidden;
  font-style: normal;
  font-weight: 600;
  font-size: 38upx;
  color: #000;
  margin-bottom: 20upx;
}

.cardcontent .desc {
  font-size: 28upx;
  color: rgba(0, 0, 0, 0.8);
  max-width: 100%;
  white-space: nowrap;
  text-overflow: ellipsis;
  overflow: hidden;
  line-height: 50upx;
}
</style>
