<template>
  <view class="content">
    <view class="cardwrapper" @click="copyLink()">
      <view class="cardcontent">
        <view class="title">HerryLo的个人博客</view>
        <view class="subtitle"></view>
        <view class="desc">工作😁生活</view>
        <view class="desc">持续学习 持续分享</view>
      </view>
    </view>

    <slider-card :dataSource="dataList"></slider-card>

    <view class="numdesc">文档数</view>
    <view class="items_count">{{ dataDetail.items_count || "--" }}</view>

    <view class="numdesc">查看数</view>
    <view class="hits">{{ hits || "--" }}</view>
  </view>
</template>

<script>
import { getRepoDocsList, getRepos } from "../../service";
import { handleTime } from "../../utils/util";
import SliderCard from "../../components/SliderCard/SliderCard";
import { reposLink } from "../../utils/constant";

export default {
  data() {
    return {
      hits: 0,
      dataDetail: {},
      dataList: []
    };
  },
  onLoad() {
    this.getRepos();
    this.getHits();
  },
  methods: {
    async getHits() {
      try {
        const res = await getRepoDocsList({
          limit: 100,
          offset: 0,
        });
        let hits = 0;
        res.data.forEach((item) => {
          hits += item.hits;
        });
        this.dataList = res.data;
        this.hits = hits;
      } catch (e) {
        console.log(e);
      }
    },
    async getRepos() {
      try {
        const res = await getRepos();
        this.dataDetail = res.data;
        console.log(res);
      } catch (e) {
        console.log(e);
      }
    },
    copyLink() {
      const data = `${reposLink}`;
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
    handleTime,
  },
  components: { SliderCard },
  onShareAppMessage(res) {
    return {
      title: 'HerryLo的博客小程序',
      path: '/pages/index/index'
    }
  }
};
</script>

<style>
page {
  background: rgba(0, 160, 233, 0.14);
}

.content {
  width: 100vw;
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
  border: 1rpx solid rgba(0, 0, 0, 0.1);
  border-radius: 12rpx;
  padding: 30rpx 30rpx;
  /* display: flex;
  justify-content: flex-start;
  align-items: center; */
  cursor: pointer;
  /* flex: 1 1; */
  margin-top: 50rpx;
  box-shadow: 0 1rpx 3rpx rgba(0, 0, 0, 0.01), 0 0 6rpx rgba(0, 0, 0, 0.06),
    0 8rpx 16rpx rgba(0, 0, 0, 0.06);
  position: relative;
}

.cardwrapper .cardcontent {
  width: 550rpx;
  background: #fff;
  border-radius: 12rpx;
  padding: 30rpx 20rpx;
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
  margin-bottom: 6rpx;
  display: flex;
  align-items: center;
}

.cardcontent .title::before {
  content: "";
  display: inline-block;
  background-image: url("../../static/xing.png");
  width: 48rpx;
  height: 48rpx;
  background-size: 100%;
  background-position: 50%;
}

.subtitle {
  text-overflow: ellipsis;
  overflow: hidden;
  font-style: normal;
  font-weight: 600;
  font-size: 38rpx;
  color: #000;
  margin-bottom: 20rpx;
}

.cardcontent .desc {
  font-size: 28rpx;
  color: rgba(0, 0, 0, 0.8);
  max-width: 100%;
  white-space: nowrap;
  text-overflow: ellipsis;
  overflow: hidden;
  line-height: 50rpx;
}

.numdesc,
.items_count,
.hits {
  width: 100%;
  padding-left: 89rpx;
  box-sizing: border-box;
}
.numdesc {
  font-size: 25rpx;
  padding-top: 20rpx;
  color: #888;
}
.items_count {
  color: #666;
  font-size: 30rpx;
}
.hits {
  font-size: 32rpx;
  color: #666;
}
</style>
