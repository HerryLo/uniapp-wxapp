# 宝宝记录与工具箱

基于 uni-app + Vue 3 + Vite 的本地优先小程序：宝宝记录 + 日常计算工具。所有数据与计算均在本机完成，无后端依赖。

## 功能

### 宝宝（Tab）

- 宝宝资料：昵称、出生日期、性别与月龄
- 日常记录：喝奶、睡眠、排便，今日统计
- 生长曲线：身高体重记录与 canvas 折线图
- 疫苗参考：一类 / 二类参考清单、已接种标记、自定义疫苗
- 成长手记：里程碑、每日心情、育儿心得
- 数据管理：JSON 导出 / 恢复 / 清空

### 工具（Tab）

- 增值税计算：含税/不含税双向换算，支持常用税率与自定义税率
- 单位换算：长度、重量、温度、存储、面积
- 文本处理：按行去重、大小写转换
- 进制转换：2–36 进制，支持负数与超大整数

工具页右下角的悬浮按钮打开「全部工具」抽屉，默认展示增值税。

## 运行

```bash
yarn install

# 微信小程序开发
yarn dev:mp-weixin

# H5 开发（仅用于本地调试）
yarn dev:h5

# 单元测试
yarn test
```

微信小程序：使用微信开发者工具导入 `dist/dev/mp-weixin`。发布前请先将 `src/manifest.json` 中的 appid 改为自己的小程序 appid。

## 构建

```bash
yarn build:mp-weixin
yarn build:h5
```

## 目录结构

- `src/pages/tools/index.vue`：工具页与「全部工具」抽屉
- `src/pages/baby/index.vue`：宝宝首页
- `src/package-baby/records/index.vue`：日常记录
- `src/package-baby/growth/index.vue`：生长曲线
- `src/package-baby/health/index.vue`：疫苗参考
- `src/package-baby/journal/index.vue`：成长手记
- `src/package-baby/settings/index.vue`：数据与设置
- `src/components/baby/*`：宝宝模块组件
- `src/data/*`：疫苗与参考里程碑数据
- `src/utils/baby/*`：宝宝模块纯逻辑与本地存储
- `tests/*.test.js`：Vitest 单元测试

## 说明

- 宝宝资料与记录只保存在本机，不登录、不上云、不申请定位权限。
- 清理小程序缓存或卸载小程序会丢失本机数据，请定期在「数据与设置」中导出备份。
- 宝宝记录与疫苗参考仅用于家庭记录，不构成医疗建议、诊断或接种推荐；具体健康问题请咨询医生，疫苗安排以当地接种门诊为准。
- 广告出现在工具页、宝宝首页和日常记录页。
- 旧待办数据 key `tools.todos.v1` 不再使用，但不会被自动删除。

## License

[MIT](./LICENSE)
