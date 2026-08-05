# 安全修复记录

## 修复日期
2026-07-29

## 问题描述
`site/config` 公开 API 接口暴露了敏感配置信息：
- `wechat_secret`: 微信小程序 AppSecret
- `wechat_appid`: 微信小程序 AppID

这些信息不应该通过公开 API 返回，可能导致安全风险。

## 修复方案

### 服务端修复（已实施）
**文件**: `/home/wwwroot/tcm.rowen.cc/modules/site.php`

在 `config` action 中添加敏感键过滤：

```php
case 'config':
    // 敏感配置键列表（公开接口不返回）
    $sensitiveKeys = [
        'wechat_secret',
        'wechat_appid',
        'app_secret',
        'api_key',
        'secret',
        'password',
        'token',
        'private_key'
    ];
    
    $list = $db->query('SELECT config_key, config_value FROM site_config ORDER BY id');
    $config = [];
    foreach ($list as $item) {
        // 跳过敏感配置
        if (in_array($item['config_key'], $sensitiveKeys)) {
            continue;
        }
        $config[$item['config_key']] = $item['config_value'];
    }
    Core\Response::success('获取成功', $config);
    break;
```

### 前端修复（已实施）
**文件**: `src/utils/api.ts`

修复了 `require` 在 Vite 环境中不可用的问题：
- 将 `require('../manifest.json')` 改为 ES module `import`

## 验证结果

### 修复前
```json
{
  "wechat_appid": "wx29d96a18fb27b5ec",
  "wechat_secret": "a58f6c49e0f6e941606135963d5f5858",
  "wechat_enabled": "1",
  "app_name": "岐闻小识",
  ...
}
```

### 修复后
```json
{
  "wechat_enabled": "1",
  "app_name": "岐闻小识",
  "tab_home": "首页",
  ...
}
```

## 影响范围
- ✅ 公开 API 不再返回敏感信息
- ✅ 管理后台接口不受影响（需要认证）
- ✅ 登录功能正常工作
- ✅ 小程序配置正常加载

## 备份文件
原文件已备份至：`/home/wwwroot/tcm.rowen.cc/modules/site.php.bak`
