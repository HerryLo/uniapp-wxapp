<template>
  <view class="content">
    <view class="tabwrapper">
      <view
        v-for="(item, index) in tabList"
        v-bind:key="index"
        :class="{ item: true, active: index == currentIndex }"
        @click="handleSwitchTab(index)"
        >{{ item }}</view
      >
    </view>
    <view class="marginheight"></view>
    <!-- 文章列表卡片 -->
    <article-card
      v-if="currentList.length"
      v-bind:dataList="currentList"
    ></article-card>
  </view>
</template>

<script>
import { getRepoDocsList } from "../../service";
import { handleTime } from "../../utils/util";
import ArticleCard from "../../components/ArticleCard/ArticleCard";

export default {
  data() {
    return {
      dataList: [],
      currentList: [],
      currentIndex: 0,
      tabList: ["最近发布", "技术", "随笔"],
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
        this.judgeCurrentList(this.currentIndex);
      } catch (e) {
        console.log(e);
      }
    },
    handleSwitchTab(index) {
      this.currentIndex = index;
      // this.$nextTick(() => {
      this.judgeCurrentList(index);
      // });
    },
    judgeCurrentList(index) {
      const currentTime = new Date();
      const currentYear = currentTime.getFullYear();
      const recents = [currentYear, currentYear - 1];
      const telTags = [
        "React",
        "react",
        "设计",
        "Javascript",
        "JavaScript",
        "小程序",
        "js",
        "原理",
        "源码",
        "数据结构",
        "设计模式",
        "扩展-",
        "this",
        "图解",
        "网络协议",
        "前端",
        "ES6",
        "开发"
      ];
      const arrTemp = [];
      this.dataList.forEach((item) => {
        const time = new Date(item.created_at);
        const year = time.getFullYear();
        const title = item.title;
        const isTags = telTags.find((item1) => title.includes(item1));
        if (index == 0 && recents.includes(year)) {
          arrTemp.push(item);
        } else if (index == 1 && isTags) {
          arrTemp.push(item);
        } else if (index == 2 && !isTags) {
          arrTemp.push(item);
        }
      });
      console.log('currentList', arrTemp)
      this.currentList = arrTemp;
    },
    handleTime,
  },
  components: { ArticleCard },
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
.marginheight {
  height: 90upx;
}
.tabwrapper {
  width: 100vw;
  height: 90upx;
  display: flex;
  align-items: center;
  background: #fff559;
  position: fixed;
  top: 0;
  left: 0;
  z-index: 10;
  justify-content: center;
}
.tabwrapper .item {
  width: 140upx;
  padding: 14upx 20upx;
  text-align: center;
  font-size: 28upx;
  color: rgb(39, 35, 35);
  background: #fff;
  background-color: #fff;
  border-radius: 4upx;
  margin: 0 30upx;
}
.tabwrapper .item.active {
  color: rgb(39, 35, 35);
  background: rgba(0, 160, 233, 0.2);
}
</style>
