# 宝宝数据远程同步预留设计

日期：2026-10-25
状态：只预留插槽，不实现远程请求

## 目标

宝宝数据目前全部保存在本地。后续如果接入服务端，需要在不重写现有页面的前提下支持：

- 本地继续作为读写来源
- 登录后上传本机快照
- 其他设备下载快照恢复
- 网络异常时不影响本地使用

## 已预留的三个插槽

### 1. 存储驱动

`src/utils/storage.js` 新增：

```js
setStorageDriver(driver)
getStorageDriver()
```

驱动接口：

```js
{
  get(key),
  set(key, value),
  remove(key),
  keys?()
}
```

默认实现仍然使用 `uni.getStorageSync` 等本地 API。未来可以替换为「远程缓存 + 本地兜底」的驱动，现有业务模块不需要改。

`storageKeys()` 统一封装 key 枚举，供备份和记录月份索引使用。

### 2. 写入变更事件

`src/utils/storage.js` 新增：

```js
onStorageChange(listener)
```

在 `writeStorage` / `removeStorage` 成功后发出：

```js
{ type: 'write' | 'remove', key }
```

未来同步服务可以订阅事件，标记 dirty 或加入同步队列。监听器异常不会影响本地写入。

### 3. 快照同步薄层

`src/package-baby/utils/sync.js` 新增：

```js
SYNC_SNAPSHOT_KIND
SYNC_SCHEMA_VERSION
createSyncSnapshot(now?)
applySyncSnapshot(payload, now?)
```

- `createSyncSnapshot()` 复用 `buildExportPayload()`，生成带 `kind`、`schemaVersion` 的完整快照
- `applySyncSnapshot()` 校验后复用 `restoreData()` 恢复
- 不发起网络请求，只定义云端传输和恢复契约
- 同时兼容原始导出 JSON 和版本化快照

## 未来接入流程

1. 用户在设置页开启云同步并登录
2. 上传：`createSyncSnapshot()` → POST 到服务端
3. 下载：GET 最新快照 → `applySyncSnapshot()`
4. 冲突策略先采用「更新时间较新的快照覆盖」
5. 失败时保留本地数据，提示稍后重试

## 暂不实现

- 不把本地读写改成异步
- 不引入增量同步、软删除、同步队列
- 不新增登录、网络请求或云存储依赖
- 不改现有 UI

## 验证

- 存储驱动替换、事件订阅/退订、写入失败不触发事件
- 快照生成包含资料、记录、生长、疫苗、手记、心情、妈妈记录、旅行
- 快照恢复、原始导出兼容、非法 kind/version 拒绝
- 现有测试和双端构建保持通过
