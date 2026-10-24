# 计算工具小程序

基于 uni-app + Vue 3 + Vite 的微信小程序工具箱，所有计算与数据均在本机完成，无后端依赖。

## 功能

- 增值税计算：含税/不含税双向换算，支持常用税率与自定义税率
- 单位换算：长度、重量、温度、存储、面积
- 文本处理：按行去重、大小写转换
- 编码工具：Base64、URL 编解码
- 进制转换：2–36 进制，支持负数与超大整数
- 时间戳转换：时间戳与日期时间双向转换
- JSON 格式化：格式化、压缩、校验
- 待办清单：本地存储、筛选排序、tab 徽标、系统日历提醒（仅微信小程序）

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

- `src/pages/tools/index.vue`：工具页与标签切换
- `src/pages/todo/index.vue`：待办清单
- `src/components/tools/*Panel.vue`：各工具面板
- `src/utils/*.js`：纯函数计算逻辑与本地存储
- `tests/*.test.js`：Vitest 单元测试

## 说明

- 所有数据仅保存在本机，清理小程序缓存或卸载后会丢失。
- 日历提醒依赖系统日历授权，修改或删除待办不会同步已写入的日历事件。
- 增值税计算结果仅供参考，不构成税务建议。

## License

[MIT](./LICENSE)
