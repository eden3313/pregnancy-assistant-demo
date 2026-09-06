# 孕期助手 MVP Demo

这是基于 PRD 实现的移动端优先网页 demo，核心功能包括：

- Tab 1：孕周状态、宝宝状态描述、下次产检任务、近期建议。
- Tab 2：补剂时间排程器，支持常见补剂选择、起床/睡觉时间调整、原因展示和 `.ics` 日历导出。
- Tab 3：药盒/产检报告图片上传、预览、实时解析状态、取消/重试、结果核对与会话归档；报告保留原始单位及参考区间，药盒展示成分、规格、包装用法及注意事项。

## 本地运行

```bash
npm install
npm run dev
```

需要 Node.js 22.12+。该命令同时启动前端与本地 API，默认页面为 http://127.0.0.1:5173，API 为 http://127.0.0.1:8787。页面端口被占用时自动选择下一个，具体以终端输出为准。

### 配置真实图片解析

将 `.env.example` 复制为同目录的 `.env.local`，填写 `OPENAI_API_KEY`，再重启 `npm run dev`。密钥只在后端读取，不使用 `VITE_` 前缀。`OPENAI_MODEL` 可改为账号可用且支持图像输入与结构化输出的模型，默认 `gpt-4.1-mini`。

未配置密钥时，上传解析会明确报错；点击“查看演示样例”可体验两种固定样例，不会声称识别了上传图片。图片上限 6 MB，支持 JPEG、PNG、WebP。图片只在用户提交时发送到 OpenAI，本地服务不落盘；请求设置 `store: false`，服务商的数据处理政策仍适用。

### API

- `GET /api/health`：返回服务状态和密钥是否已配置，不返回密钥。
- `POST /api/parse-report`：JSON 请求 `{ "kind": "report" | "medicine", "imageDataUrl": "data:image/png;base64,..." }`。
- 演示请求：`{ "kind": "report" | "medicine", "demo": true }`。
- 响应是逐行 JSON（`application/x-ndjson`），依次返回 `status` 事件和 `result` 或 `error` 事件。HTTP 200 后也可能收到解析错误，客户端必须处理 `error` 事件。
- `npm run dev:api` 可单独运行后端。服务绑定回环地址，只用于本地演示，尚未实现公网认证、用户隔离或部署。

归档保存在页面会话中，切换 Tab 保留，刷新会清空。Hb 仅在单位明确为 g/L 或 g/dL 时加入趋势。示例与真实识别有明确来源标记。药盒不会自动改变补剂排程或用药剂量。

实现参考：[OpenAI 图片输入](https://developers.openai.com/api/docs/guides/images-vision)、[结构化输出](https://developers.openai.com/api/docs/guides/structured-outputs)。

## 验证

```bash
npm test
npm run build
```

## 代码结构

- `src/data`：demo 种子数据。
- `src/lib`：孕周计算、补剂排程、报告分析、日历导出等纯业务逻辑。
- `src/components`：三个 tab 和趋势图等页面组件。
- `src/styles.css`：全局样式和响应式布局。
- `server/parser.mjs`：图片校验、OpenAI 调用和结构化结果校验。
- `server/index.mjs`：本地 HTTP API 和逐行状态响应。
- `scripts/dev.mjs`：前后端一键启动。
- `src/lib/imageApi.ts`：图片读取与流式响应消费。

`.gitignore` 已排除密钥、构建输出和依赖目录；提交 GitHub 时包含 `.env.example`，不要包含 `.env.local` 或真实报告图片。

## 合规边界

页面文案以“记录整理”和“就诊准备”为主，不输出诊断、处方或风险判断。所有内容不能替代医师意见。
