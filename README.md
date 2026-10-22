# xiaohongshuXP | XP Studio v0.2（专业视觉流程）

> 专业的小红书美妆图文创作工作台，手机端优先，GitHub 项目状态可追踪，人工审核把关。

## 当前真实状态（2026-10-22）

**软件代码已写入：V0.2_VISUAL_CODE_WRITTEN / DEPLOYMENT_PENDING / LIVE_GITHUB_INTEGRATION_UNTESTED**

已完成：Node 22 API、手机端工作台、GitHub版本化读写接口、项目/选题/商品核验/5页文案、按页独立专业摄影指令、手机端本地5种中文后期排版PNG/JPG输出、1086×1448上传尺寸检查、八项人工视觉审核及最多三轮返修、SHA冲突控制、TXT/JSON导出和自动测试。

仍需完成：V0.2最新版CI结果确认、专用GitHub Token真实端到端写入验收、Railway/其他平台部署、正式AI文案与生图/编辑接口、实物图自动抠图及合成、自动视觉识别质检与ZIP导出。本仓库不包含“已经上线”的证明。

**不要把 `.env` 中的管理员密码、PAT、Session Secret 提交到 GitHub。** 软件不会从 ChatGPT GitHub 连接自动得到密钥。

## 快速开始

```bash
# Node 22+
npm run check
npm test
cp .env.example .env
# 编辑 .env：GITHUB_TOKEN、ADMIN_PASSWORD、SESSION_SECRET
node --env-file=.env server.mjs
# 浏览器打开 http://localhost:3000
```

具体操作、权限范围、线上部署要求与测试说明请阅读：[XP Studio v0.1 部署和验收](docs/XP-V0.1-部署与验收.md)。

## 视觉质量升级

- [V0.2专业生图、真实商品保真、分层排版与8项审核标准](docs/XP-V0.2-专业生图与排版标准.md)
- [专业镜头与差异化五页视觉指令模块](lib/visual-direction.mjs)
- [本地1086×1448五版式中文后期PNG渲染模块](lib/editorial-renderer.mjs)
- [服务端图片尺寸检查](lib/image-dimensions.mjs)

**重要：V0.2不能自己调用图像模型生成照片。** 工作台现在负责分镜、提示词、已有摄影底片的文字排版及审核；真实商品原图、授权人像参考与摄影底片仍需要从外部获得。

## 使用流程

```text
创建项目 → 添加5～10个真实选题 → 人工选定一个
→ 核验品牌/色号/规格/官方来源
→ 编辑5页原创文案/分镜 → 生成每页视觉提示词草稿
→ 先用外部模型获得摄影底片 → 手机端本地后期排版输出JPG或PNG → 同意后上传真实成品
→ 每页人工PASS/REWORK → 三轮阻塞由人裁决
→ 5/5 PASS → 正文复制和TXT/JSON交付
```

## 资料与母版

- [20个开源项目调研：优缺点与授权](research/2026-10-22-GitHub小红书开源项目20项调研.md)
- [整体系统架构与规划](design/XHS-XP-V1-系统架构与落地路线.md)
- [项目初始化模板](template/PROJECT_INIT.json)
- [聊天续做/新项目启动指令](template/START_PROMPT.md)
- [软件部署说明与局限](docs/XP-V0.1-部署与验收.md)
- [真实工作流状态机](lib/workflow.mjs)
- [手机端前端代码](public/app.js)
- [GitHub 服务端API](server.mjs)
- [基础测试](test/workflow.test.mjs)

## 合规与安全

- 不把AI输出伪装成真实消费体验、真实拍摄记录或已经人工核验的证据；
- 严禁冒用他人商品图片与未授权人像；公开仓库素材不可当作私密存储；
- 明确拒绝未经授权的模拟真人刷互动、批量代发与绕过平台风控；
- 所有“通过”只是工作台保存的**人工审核结论**，并非模型自动视觉识别结果。

## 下一阶段

先运行测试和真实 GitHub SHA 往返，再接入受控图片/生图服务与视觉QA，随后完成公网部署与手机端验收。
