# xiaohongshuXP｜建议架构 V1（研究方案，非已实现软件）

> 依据 [20项项目研究](../research/2026-10-22-GitHub小红书开源项目20项调研.md)。本文件是设计草案，不宣称已有可运行软件。

## 定位

手机优先、GitHub唯一事实源、多模型可替换的专业小红书美妆图文生产工作台。核心是“人审主导的高质量内容生产”，不是平台自动托管。保留固定 PERSONA-001，默认5页3:4图片，1086×1448可设为目标尺寸，最高三轮定向返修。支持后续其他账号的初始化模板。

## MVP主链

1. 项目初始化：仓库URL + 平台 + 账号画像 + 人物参考授权 + 目标模板；初始化后写入 project.json 和 persona-manifest.json。
2. R01选题：按用户授权或公开合规信息检索候选，给5-10个选题、证据链接、原创角度、风险，用户选择1个。
3. R02商品事实核验：锁定SKU/色号/规格/真实商品图、价格日期、证据和不能写的宣称；遇事实冲突先停。
4. R03内容编排：5页分镜，文案、每页卖点、版式、视觉人物分配；用户确认产品和主题。
5. R04出图：人物锚点绑定、产品图素材优先、按页调用模型，保留request_id；输出图片+提示词+元数据。
6. R05图文审核：主观人工审核+客观尺寸/溢出/链接与证据核对；单页失败只重做单页，最多三轮。
7. R06交付：5/5通过后冻结版本；生成图片ZIP、封面、可复制标题、正文、标签与导出说明。
8. 发布与复盘：用户自己检查和发布；记录可授权提供的后台数据与归因结论；不做自动评论和私信模拟真人。

## 核心实体

- project：repo、账号、platform、content_ids、stage、active_task、state_revision、created_at。
- topic_candidate：id、来源、时间、原创角度、可信度、风险、decision。
- product_claim：claim、source_url、source_date、evidence_image_hash、verification_status。
- persona_anchor：authorised_sources、face_ratio、mole_side、hair、no_mirror、identity_qa。
- content_pack：5页storyboard、title、caption、tags、prompts、images、page_size、versions。
- audit：page、issue_type、severity、evidence、repair_target、revision、pass_or_fail。
- model_call：unique_request_id、provider、model、input_hash、output_hash、estimated_cost、actual_cost_if_available、status。

## 拟议仓库结构

    /README.md
    /research/
    /design/
    /template/PROJECT_INIT.json
    /template/START_PROMPT.md
    /data/projects/<project_id>/state.json
    /data/projects/<project_id>/task-queue.json
    /data/projects/<project_id>/product-proof.json
    /data/projects/<project_id>/persona-manifest.json
    /data/projects/<project_id>/content/<content_id>/storyboard.json
    /data/projects/<project_id>/content/<content_id>/audit.json
    /data/projects/<project_id>/content/<content_id>/asset-manifest.json

## 手机端技术选型建议

前端 Next.js/React PWA（移动端优先，5张缩略图审核、复制按钮、重修按钮、当前角色/任务/费用）；后端轻量 FastAPI或Node服务；GitHub API用于文本状态与交接；敏感凭据交给服务端安全存储而非前端或仓库；图像使用有权限的对象存储，记录hash到仓库。提供本地无API的HTML/CSS排版备用引擎，便于降低出图成本。

## 质量保证与安全

- 内容核实和主观评分分开，不能“机器给出95分”就自动PASS。
- 固定图像长宽及主体一致性检查，错漏商品信息优先于画面美观。
- 审核失败只重做有问题页；同一request_id失败不自动双重提交。
- 必须显示模型真实费用与生成页次、重试原因；超过预算需用户确认。
- 不保存网站Cookie到GitHub；不提供规避小红书自动化风控的功能；发布由用户完成。
- 对商业引用的第三方代码逐个保留 LICENSE/NOTICE；使用GPL组件时单独法务检查。

## 开发优先级（尚未开始编码）

P0：手机工作台骨架、GitHub读写与状态回读、选题确认门、商品核验、文案卡片、5页PNG导出、审核与返修。

P1：固定人物写实一致性、可插拔AI模型、付费成本审计、真实商品素材资产管理。

P2：授权数据复盘、跨项目母版复制、专业图层编辑/多端导出、权限管理。

**验收定义**：至少完成一条真实5页美妆笔记从选题到人工发布包的全链路，每次状态更改GitHub回读一致、素材哈希可核对、失败可恢复、费用可追溯、浏览器重启后不会丢进度。