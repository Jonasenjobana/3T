---
name: jeniya
description: 使用 Jeniya 中转 API 生成图像，支持 gpt-image-1.5 模型
---

# Jeniya 图像生成 Skill

根据用户的文字描述生成图像，使用 Jeniya 中转 API（兼容 OpenAI 图片生成接口）。

## 前置步骤

### 1. 检查 API Key

- 检查项目根目录是否存在 `.env` 文件
- 如果存在，检查是否包含 `JENIYA_API_KEY` 字段
- 如果不存在 `JENIYA_API_KEY`，询问用户是否拥有 Jeniya 中转 API Key，并请用户提供
- 如果用户没有 Key，告知用户需要先获取 Jeniya 中转 API Key 才能使用此功能

### 2. 写入 .env

- 如果项目根目录没有 `.env` 文件，则创建
- 如果已有 `.env`，追加或更新对应条目
- 格式：`JENIYA_API_KEY=用户提供的key`

**重要**：`.env` 文件应被 `.gitignore` 忽略，确保不会泄露密钥。如果项目 `.gitignore` 中尚未包含 `.env`，需要添加。

## 生成图像

### API 调用方式

```
POST https://jeniya.cn/v1/images/generations
```

### 请求头

| 参数 | 值 |
|---|---|
| Content-Type | application/json |
| Accept | application/json |
| Authorization | Bearer {JENIYA_API_KEY} |

### 请求体

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| prompt | string | 是 | 图像的文本描述，最大 1000 字符 |
| n | integer | 是 | 生成图像数量，1-10 之间 |
| size | string | 是 | 图像尺寸，可选值见下方 |
| model | string | 否 | 模型名称，默认 "gpt-image-1.5" |

**size 可选值**（gpt-image-1.5）：
- `1024x1024` — 正方形
- `1536x1024` — 横版
- `1024x1536` — 竖版
- `auto` — 默认值

### 请求示例

```json
{
  "prompt": "a cute cat sitting on a windowsill",
  "n": 1,
  "size": "1024x1024",
  "model": "gpt-image-1.5"
}
```

### 调用流程

1. 从 `.env` 读取 `JENIYA_API_KEY` 作为 token
2. 根据用户需求构建请求体（prompt 由用户提供，n 默认 1，size 默认 "auto"）
3. 使用 curl 或 Node.js 发送 POST 请求
4. 解析响应获取图片数据

## 保存结果

- 图片保存到项目根目录 `jeniya_resource/image/` 目录下
- 如果目录不存在则创建
- 文件命名格式：`{prompt前20字符}_{时间戳}.png`

## 错误处理

如果 API 调用失败，需要告知用户可能的原因：

- **401/403**：API Key 无效或已过期，请用户检查 Key 是否正确
- **429**：请求频率过高或额度不足，请用户确认账户余额
- **500**：服务端错误，建议稍后重试
- **其他错误**：展示具体错误信息，帮助用户排查

## 使用示例

用户说"帮我生成一张可爱猫咪的图片"时：

1. 确认 `.env` 中有 `JENIYA_API_KEY`
2. 以 "a cute cat" 作为 prompt 调用 API
3. 将生成的图片保存到 `jeniya_resource/image/` 目录
4. 告知用户图片已生成并说明保存路径