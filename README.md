# xiaohongshuXP | XP Studio v0.1

> 专业的小红书美妆图文创作工作台，手机端优先，GitHub 项目状态可追踪，人工审核把关。

## 当前真实状态（2026-10-22）

**软件源代码已落仓：MVP_CODE_WRITTEN / DEPLOYMENT_PENDING / LIVE_GITHUB_INTEGRATION_UNTESTED**

已完成：纯 Node.js 22 服务端 API、管理员登录、手机端内容工作台、GitHub Contents API 读写、项目初始化、选题和商品核验、5页文案与视觉提示词、图片 URL 与明确同意后上传、逐页审核及最多三轮返修、GitHub版本SHA冲突控制、TXT/JSON导出、基础测试脚本。

仍需完成：GitHub Actions 或本地真实 Node 22 测试执行、使用专用 GitHub Token 的真实写入回读验收、Railway/其他平台部署、正式 AI 文案/生图接口、自动排版质检与ZIP导出。本仓库不包含“已经上线”的证明。

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

## 使用流程

```text
创建项目 → 添加5～10个真实选题 → 人工选定一个
→ 核验品牌/色号/规格/官方来源
→ 编辑5页原创文案/分镜 → 生成每页视觉提示词草稿
→ 关联合法图片链接或同意公开上传
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
