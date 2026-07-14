# 岐黄小识 FastAdmin 插件

## 插件信息

- **名称**：tcm（岐黄小识·中医知识库）
- **版本**：1.0.0
- **描述**：中医经方、药物、穴位、医案知识库及AI问诊系统

## 安装状态

### 已完成

1. **数据库表创建**
   - `fa_tcm_formula` - 经方表
   - `fa_tcm_herb` - 药物表
   - `fa_tcm_acupoint` - 穴位表
   - `fa_tcm_case` - 医案表
   - `fa_tcm_consultation` - AI问诊记录表
   - `fa_tcm_diagnosis_rule` - 六经辨证规则表

2. **插件文件上传**
   - 控制器：`/addons/tcm/controller/api/`
   - 模型：`/addons/tcm/model/`
   - 安装脚本：`/addons/tcm/install.sql`
   - 插件配置：`/addons/tcm/info.ini`

3. **插件注册**
   - 已在 `fa_addon` 表中注册

### API 端点

插件提供以下 API 端点：

| 端点 | 方法 | 说明 |
|------|------|------|
| `/addons/tcm/formula/index` | GET | 获取方剂列表 |
| `/addons/tcm/formula/detail` | GET | 获取方剂详情 |
| `/addons/tcm/formula/search` | GET | 搜索方剂 |
| `/addons/tcm/herb/index` | GET | 获取药物列表 |
| `/addons/tcm/herb/detail` | GET | 获取药物详情 |
| `/addons/tcm/herb/search` | GET | 搜索药物 |
| `/addons/tcm/acupoint/index` | GET | 获取穴位列表 |
| `/addons/tcm/acupoint/detail` | GET | 获取穴位详情 |
| `/addons/tcm/acupoint/search` | GET | 搜索穴位 |
| `/addons/tcm/case/index` | GET | 获取医案列表 |
| `/addons/tcm/case/detail` | GET | 获取医案详情 |
| `/addons/tcm/case/search` | GET | 搜索医案 |
| `/addons/tcm/diagnosis/consult` | POST | AI问诊 |
| `/addons/tcm/diagnosis/identify` | POST | 六经辨证 |
| `/addons/tcm/diagnosis/history` | GET | 获取问诊历史 |

## 后续配置

### 1. 启用插件

登录 FastAdmin 后台 → 插件管理 → 找到"岐黄小识·中医知识库" → 点击启用

### 2. 导入数据

将本地 JSON 数据导入到数据库表中：

```bash
# 导入方剂数据
mysql -u rowen_cc -p rowen_cc < import_formulas.sql

# 导入药物数据
mysql -u rowen_cc -p rowen_cc < import_herbs.sql

# 导入穴位数据
mysql -u rowen_cc -p rowen_cc < import_acupoints.sql

# 导入医案数据
mysql -u rowen_cc -p rowen_cc < import_cases.sql
```

### 3. AI 问诊配置

AI 问诊功能需要配置大模型 API：

```php
// 在插件配置中设置
'ai_config' => [
    'api_key' => 'your-api-key',
    'model' => 'gpt-3.5-turbo',
    'endpoint' => 'https://api.openai.com/v1/chat/completions',
]
```

## 小程序对接

在小程序中调用 API：

```javascript
// 获取方剂列表
const res = await uni.request({
  url: 'https://rowen.cc/addons/tcm/formula/index',
  data: { meridian: '太阳', page: 1, limit: 20 }
})

// AI 问诊
const res = await uni.request({
  url: 'https://rowen.cc/addons/tcm/diagnosis/consult',
  method: 'POST',
  data: { symptoms: '发热，恶寒，头痛，无汗' }
})
```

## 文件结构

```
addons/tcm/
├── controller/
│   └── api/
│       ├── Formula.php      # 经方接口
│       ├── Herb.php         # 药物接口
│       ├── Acupoint.php     # 穴位接口
│       ├── Case.php         # 医案接口
│       └── Diagnosis.php    # AI问诊接口
├── model/
│   ├── Formula.php
│   ├── Herb.php
│   ├── Acupoint.php
│   ├── CaseModel.php
│   ├── Consultation.php
│   └── DiagnosisRule.php
├── install.sql              # 数据库安装脚本
├── info.ini                 # 插件信息
└── Tcm.php                  # 插件主类
```
