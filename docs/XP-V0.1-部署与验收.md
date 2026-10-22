# XP Studio V0.1 | 安装、运行与验收

## 已实现（非演示假数据）
- 手机端响应式工作台、项目切换、候选选题、商品事实人工确认门、5页文案、每页图片链接或公开仓库上传、逐页审核、3轮返修阻塞、人工解除、项目 JSON/TXT 导出；
- Node 22 原生 HTTP API；通过 GitHub Contents API 保留 JSON 与图片版本；SHA 乐观锁避免多人覆盖写入；会话密码与服务端 PAT 分离；不需要付费 AI API 即可运行；
- 自动化单测和服务端最小烟测由 `npm test` 运行。

## 尚未实现
- 未接入任何 AI 文案、生图、真实热点接口；也不提供平台自动发布或自动回复；
- 不支持图层编辑、自动图片 ZIP、一键部署以及多租户；
- 图片审核结果属于人工确认记录，不表示系统已自动识别错字/商品细节；
- 若官方平台规则调整，发布流程应当重新核对。

## 本地启动
1. 安装 Node.js 22 或更新版本，下载本仓库。
2. 为目标 GitHub 仓库创建**细粒度 GitHub Personal Access Token**，仅授权本仓库 Contents Read/Write；不要将 Token 写入 GitHub。
3. 将 `.env.example` 复制为 `.env`，设置 `GITHUB_TOKEN`、`ADMIN_PASSWORD` 和至少24字符的 `SESSION_SECRET`。
4. 在项目目录运行 `npm test` 和 `npm run check`。
5. 运行 `node --env-file=.env server.mjs`，浏览器访问 `http://localhost:3000`。
6. 创建项目后检查 GitHub 的 `data/projects/<project-id>/project.json` 是否真实存在。尝试刷新和换设备登录查看。
7. 上传图片前请确认仓库类型：**公开仓库的图片文件任何人均可看到，且删除当前文件不等于消除 Git 历史。敏感人物照片、私人未发布素材不适合上传公开仓库。**

## 部署到 Railway / 其他 Node 平台
- 构建：无外部 npm 依赖；启动命令 `npm start`；监听 `process.env.PORT`。
- 部署的服务端变量：`GITHUB_REPOS=1464356758/xiaohongshuXP`、`GITHUB_TOKEN`、`ADMIN_PASSWORD`、`SESSION_SECRET`、`NODE_ENV=production`。
- 只使用 HTTPS 公网域名，**不要**把服务端 GitHub Token 放入前端脚本或浏览器 localStorage。
- 若多个仓库可选，`GITHUB_REPOS=owner/repo1,owner/repo2`，服务端会严格验证允许名单。
- 在 Railway/其他平台设置变量之后，首次访问网页用 `ADMIN_PASSWORD` 登录。ChatGPT 的 GitHub 连接权限**不会自动转化为你的网站 Token**。
- 建议为实际部署添加访问速率限制、平台日志监控、备份、额外 IP 白名单。当前版本是单管理员 MVP，并非面向公共注册的商用多租户系统。

## 验收标准
- `npm test`：五页结构、事实确认门、单页审核状态变化、最多3轮返修、人工裁决、鉴权和来源限制通过。
- `npm run check`：Node JS 语法检查通过。
- 使用合法 GitHub Token 时：新建项目并回读SHA、复制/导出、上传公开素材、重新审核、重启后读取全部数据。
- 未拿到真实部署凭证之前，**不能宣称已经上线公网**。

## 数据结构
项目实体参见 `lib/workflow.mjs`。唯一事实源是 `data/projects/<id>/project.json`，其中存储候选选题、商品事实、5页文案/生图指令、图片URL、审核状态、历史、版本号。仓库 commit history 保留历史版本。

## 复用参考
本 MVP 是全新独立实现，不把第三方代码整库复制。架构理念参考了 ZJU-REAL/Easel、EthanYoQ/agent-xiaohongshu-workbench、NimaChu/xhs-imagen 和 xuboboo/xiaohongshu-viral-note-agent-skill；原仓库及许可证详见研究报告。

## 下一迭代优先项
1. AI模型接口适配（每次真实调用单次扣费、请求幂等、费用审计）；
2. 受控的美妆产品官方素材引用与人物锚点，私有素材存储；
3. 确定性尺寸/文字越界自动检查与可复现图片渲染；
4. 用户确认的候选选题与数据回看。
