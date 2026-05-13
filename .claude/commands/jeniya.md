使用 Jeniya 中转 API 为用户生成图像。

## 前置检查

1. 读取项目根目录 `.env` 文件，查找 `JENIYA_API_KEY`
2. 如果未找到该 Key，询问用户是否拥有 Jeniya 中转 API Key：
   - 如果有，请用户提供 Key，然后写入 `.env`（格式：`JENIYA_API_KEY=xxx`）
   - 如果没有，告知用户需要先获取 Key，终止流程
3. 如果 `.env` 文件不存在，先创建再写入

## 生成图像

根据用户描述生成图像，调用以下 API：

```
POST https://jeniya.cn/v1/images/generations
```

请求头：
- `Content-Type: application/json`
- `Authorization: Bearer {JENIYA_API_KEY}`

请求体参数：
- `prompt`（必填）：用户的图像描述，最大 1000 字符
- `n`（必填）：生成数量，默认 1
- `size`（必填）：图像尺寸，默认 `auto`，可选 `1024x1024`、`1536x1024`（横版）、`1024x1536`（竖版）
- `model`（可选）：模型名，默认 `gpt-image-1.5`

使用 curl 发送请求，示例：
```bash
curl -s -X POST https://jeniya.cn/v1/images/generations \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $JENIYA_API_KEY" \
  -d '{"prompt":"用户描述","n":1,"size":"auto","model":"gpt-image-1.5"}'
```

## 保存结果

1. 在项目根目录创建 `jeniya_resource/image/` 目录（如不存在）
2. 从响应中提取图片 URL 或 base64 数据
3. 下载图片并保存到 `jeniya_resource/image/` 目录
4. 文件命名格式：`{时间戳}_{prompt前10字符}.png`
5. 告知用户图片已保存的路径

## 错误处理

- **401/403**：告知用户 API Key 可能无效或已过期，请检查 Key
- **429**：告知用户请求过于频繁或额度不足，请确认账户余额
- **500**：服务端错误，建议稍后重试
- **其他**：展示具体错误信息，帮助用户排查

## 参数

$ARGUMENTS
