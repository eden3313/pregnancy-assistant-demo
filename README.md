# 孕期助手 MVP Demo

这是基于 PRD 实现的移动端优先网页 demo，核心功能包括：

- Tab 1：孕周状态、宝宝状态描述、下次产检任务、近期建议。
- Tab 2：三餐与补剂时间排程器，支持起床、早餐、午餐、晚餐、睡觉时间调整，提供每餐搭配建议并导出 `.ics` 日历。
- Tab 3：药盒/产检报告图片上传、预览、实时解析状态、取消/重试、结果核对与会话归档；内置的报告演示样例依据用户提供的早孕超声报告去身份化整理，展示超声所见、测量值、报告原文提示与医生问题。

三餐内容是均衡搭配示例，参考 [NHS 孕期健康饮食建议](https://www.nhs.uk/best-start-in-life/pregnancy/healthy-eating-in-pregnancy/)。页面不会根据示例自动判断个人饮食是否合适；过敏、糖代谢异常或其他饮食限制应按医生或营养师建议调整。

## 本地运行

首次进入先填写独立的孕期资料页面：末次月经第一天、单胎/双胎/多胎、高危因素及当前用药。提交后按实际日期生成孕周、估算预产期、发育描述和就诊准备。资料保存在此浏览器的 localStorage，可通过“我的资料”修改或页尾清除；不同浏览器、不同访问域名的资料互不共享。报告图片和报告归档仍仅保留在当前会话。

孕周计算采用末次月经起算、预产期加 280 天的一般估算；多胎/高危信息用于提示个体化随访，不生成处方。辅助生殖、月经不规律或已有超声校正时，以医生确认的孕周为准。参考：[ACOG 预产期估算](https://www.acog.org/clinical/clinical-guidance/committee-opinion/articles/2017/05/methods-for-estimating-the-due-date)。

视觉使用用户提供的黏土风格参考图作为页首素材，文件位于 `public/images/clay-garden.png`；统一样式在 `src/theme.css`。

```bash
npm install
npm run dev
```

需要 Node.js 22.12+。该命令同时启动前端与本地 API，默认页面为 http://127.0.0.1:5173，API 为 http://127.0.0.1:8787。页面端口被占用时自动选择下一个，具体以终端输出为准。

### 配置真实图片解析

将 `.env.example` 复制为同目录的 `.env.local`，填写 `OPENAI_API_KEY`，再重启 `npm run dev`。密钥只在后端读取，不使用 `VITE_` 前缀。`OPENAI_MODEL` 可改为账号可用且支持图像输入与结构化输出的模型，默认 `gpt-4.1-mini`。

未配置密钥时，上传解析会明确报错；点击“查看演示样例”可体验两种固定样例，不会声称识别了上传图片。图片上限 6 MB，支持 JPEG、PNG、WebP。图片只在用户提交时发送到 OpenAI，本地服务不落盘；请求设置 `store: false`，服务商的数据处理政策仍适用。

如果电脑通过本地 HTTP 代理访问 OpenAI，在 `.env.local` 设置 `OPENAI_PROXY_URL=http://127.0.0.1:你的代理端口` 后重启。该代理仅用于后端的 OpenAI 请求；无需代理时留空。

### API

- `GET /api/health`：返回服务状态和密钥是否已配置，不返回密钥。
- `POST /api/parse-report`：JSON 请求 `{ "kind": "report" | "medicine", "imageDataUrl": "data:image/png;base64,..." }`。
- 演示请求：`{ "kind": "report" | "medicine", "demo": true }`。
- 响应是逐行 JSON（`application/x-ndjson`），依次返回 `status` 事件和 `result` 或 `error` 事件。HTTP 200 后也可能收到解析错误，客户端必须处理 `error` 事件。
- `npm run dev:api` 可单独运行本地后端；生产环境由同一个 Node 服务托管构建后的页面和 `/api`。

## 上线 Web Demo

仓库已包含 `render.yaml`，可将前端和报告解析 API 部署为同一个 Render Web Service：

1. 登录 Render，选择 **New > Blueprint**，连接本 GitHub 仓库。
2. 选择 `main` 分支并部署 Blueprint；Render 会执行 `npm ci && npm run build`。
3. 在环境变量提示中填写 `OPENAI_API_KEY`，不要把真实密钥写入代码或提交到 GitHub。
4. 部署完成后使用 Render 提供的 `https://*.onrender.com` 地址访问；`/api/health` 可检查后端是否运行及密钥是否已配置。

生产服务使用 Render 提供的 `PORT` 并监听 `0.0.0.0`，同时托管 `dist` 页面和 `/api`，因此浏览器不会接触 API Key。免费服务可能在空闲后休眠，首次访问会有冷启动等待。公开演示前应使用新生成的 API Key，并给该 Key 设置用量限制。

## 微信小程序

**当前v1.1.0已重新接入在线图片识别。** 旧的“仅本地审核包”和`future-features/`说明属于此前版本；当前启用步骤、数据流向与上传前条件以 [v1.1.0发布说明](docs/wechat/v1.1.0-release.md) 为准。配置 `miniprogram/config.ts` 的真实HTTPS域名并完成生产检查后才能上传可用的AI版本。

### 第二版：大小示意与服用要求排程

- “今日”的大小类比配有九组本地 PNG 插画，随当前孕周切换；图片为趣味示意，不按实际比例绘制。
- 首次建档与“我的资料”的用药记录可填写药名和服用要求，点击“识别要求并安排时间”，核对弹窗后保存资料。
- 支持明确时间表达，例如“早饭前30分钟吃”“午餐后半小时”“随早餐”“每日20:00”。药名仅用于记录，不查药、不推断剂量或服用要求；识别在本地运行，不新增外部数据传输。
- 仅写“饭前”或“早餐前”时，要求补充餐次或时间间隔；复杂、按需、多次或跨天要求需人工确认，多次服用分别添加记录。
- 计算使用今日三餐时间，未设置时为07:30、12:30、18:30。生成的是固定每日时间，后续修改三餐时间需重新识别确认。原文保留在日程备注；不是后台推送通知。
- v1.1.0新增“日程 → 拍照识别药品与服用要求”和“记录 → 拍照整理报告文字”入口；API Key只在后端读取，识别结果核对后保存。上传新版开发包不会改变此前已提交的1.0.1代码包。

原生微信小程序源码位于 `miniprogram/`，与 Web Demo 共用 Node 后端，但使用独立的受限接口 `POST /api/extract-report`。该接口仅返回 OCR 原文、原文摘要和通用术语释义，不返回医学判断或建议。

导入前先将 `miniprogram/config.ts` 中的占位地址替换为自有 HTTPS API 域名，然后在微信开发者工具中导入整个 `miniprogram` 文件夹并填写 AppID。真实 AppID、AppSecret 和 API Key 都不得提交到仓库。完整步骤见 `docs/wechat/release-checklist.md`。

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
