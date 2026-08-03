# New Zealand Slow Trip 2026

这是 2026 年新西兰双人旅行的 React + Vite 决策与执行站点，不是通用旅游模板。页面同时承载行程、交通、住宿与活动选择、证据来源和本地确认状态。

## 开始工作

1. 先读本文件，再按任务进入 [`.ai/rules/README.md`](.ai/rules/README.md) 的对应规则；不要一次加载所有规则。
2. 先检查 `git status --short --branch`，保留已有改动。没有用户明确授权时不提交、不推送。
3. 事实来源以当前代码和审计为准：行程看 `src/tripData.js`、`src/components/RouteMap.jsx`、`src/englishTripData.js`；住宿看 `src/data/`；社交攻略看 `src/socialGuides*.js`；图片来源看 `src/eventMedia.js` 与 `src/data/accommodationImageSources.js`。
4. 使用 npm（存在 `package-lock.json`）。本地入口为 `npm start`，默认 `http://127.0.0.1:4173/new-zealand-slow-trip-2026/`；生产构建为 `npm run build`。
5. 非微小任务先把需求整理为目标、非目标、硬约束、证据标准、影响面和验收项；长期任务还要维护可恢复的进度账本，不能只靠对话记忆推进。

## 始终遵守

- 不编造或推断价格、库存、税费、床型、早餐、停车、取消、付款、评分、评价数、路线时间、图片归属或帖子内容。未知就明确标为未知、待查或不可复现。
- “没有取得可复现报价”不等于“售罄”；只有目标日期和人数下的权威来源明确无房，才能写无房。
- 不把旧报价、搜索摘要、单晚价或单人票面冒充当前整段住宿/双人订单结论；动态事实必须附日期、条件、来源和置信状态。
- 不把 Motel/普通酒店包装成民宿，不为凑数量加入弱候选；推荐必须解释为什么适合这趟行程，也要写清取舍。
- 不把截图中的 PNR、电子票号、证件号、姓名、确认号等敏感信息写入源码、文档、日志、提交或公开页面。
- 浏览器调研只读：不预订、不付款、不提交最终表单。用户指定 IAB 时只使用 IAB；不得复制 cookie、伪造登录态或改用隐藏浏览器绕过要求。
- 不通过杀进程、删除 socket、修改系统临时状态等侵入式方式“修复”浏览器控制；诊断失败时保留证据、纠正假设并给出受支持的恢复步骤。
- 登录态浏览器与批量调研默认单线程推进；不要启动大量 agent 同时操作 IAB、动态网站或共享数据文件，避免会话和写入互相干扰。
- JSX、CSS 和大型数据分开维护；优先复用现有 MUI、地图、日历和对话框原语，不把所有实现重新塞回 `App.jsx` 或单一数据文件。
- 用户不喜欢无意义标语、重复说明、过大的 hero、独立图例卡和装饰性信息。界面应直接服务“现在去哪、何时做、为什么选、下一步是什么”。
- 用户给出的最新订单或行程决定优先于旧计划；更新时同步中英数据、地图、日历、住宿日期、预订项和状态，不能只改可见文案。
- 不以“构建通过”替代任务验收。数据改动跑对应审计，交互改动在真实浏览器验证目标路径、响应式布局、URL 恢复和控制台。
- 工具报错、超时或 agent 失败不自动等于产品失败；先隔离故障层，用独立证据判断代码、数据、服务和工具状态。
- 先做一个端到端垂直样例来校准 schema、UI、证据和验收，再批量扩展；样例阶段未获确认时不要擅自扩散到全量。

## 任务路由

- 需求建模、授权边界、范围变化与验收：[`working/requirements.md`](.ai/rules/working/requirements.md)
- 候选比较、权衡、主备方案与建议表达：[`working/decision-making.md`](.ai/rules/working/decision-making.md)
- 长任务、断点恢复、进度账本与汇报：[`working/long-running-tasks.md`](.ai/rules/working/long-running-tasks.md)
- 故障分层、假设验证与工具恢复：[`working/diagnostics.md`](.ai/rules/working/diagnostics.md)
- 工具选择、长命令、输出截断与不可信内容：[`working/tool-use.md`](.ai/rules/working/tool-use.md)
- 并发/agent 使用与共享工作区协调：[`working/coordination.md`](.ai/rules/working/coordination.md)
- 截图批注、视觉评审、用户纠错与反馈闭环：[`working/feedback-loop.md`](.ai/rules/working/feedback-loop.md)
- 仓库结构、开发方式、数据拆分：[`developing/architecture.md`](.ai/rules/developing/architecture.md)
- 来源数据、schema、派生数据与迁移：[`developing/data-pipelines.md`](.ai/rules/developing/data-pipelines.md)
- 从网页、ZIP、旧项目或远端分支同步成果：[`developing/external-artifacts.md`](.ai/rules/developing/external-artifacts.md)
- 图片/视频的来源、语义、许可、优化与去重：[`developing/media-assets.md`](.ai/rules/developing/media-assets.md)
- 旅行 UI、地图、日历、弹窗与响应式：[`design/interface.md`](.ai/rules/design/interface.md)
- 中英文案、官方专名、格式和回退：[`design/localization.md`](.ai/rules/design/localization.md)
- 行程、航班、租车、活动事实更新：[`travel/itinerary-data.md`](.ai/rules/travel/itinerary-data.md)
- 通用证据等级与分析写法：[`research/evidence.md`](.ai/rules/research/evidence.md)
- 酒店/民宿、房型、报价与图片调研：[`research/accommodation.md`](.ai/rules/research/accommodation.md)
- 小红书等社交攻略核验：[`research/social-guides.md`](.ai/rules/research/social-guides.md)
- IAB、登录态网站和安全浏览器操作：[`research/browser-operations.md`](.ai/rules/research/browser-operations.md)
- 测试、审计与浏览器验收：[`verification/quality-gates.md`](.ai/rules/verification/quality-gates.md)
- 隐私、GitHub Pages、提交和推送：[`delivery/security-and-git.md`](.ai/rules/delivery/security-and-git.md)
- 经验提炼、规则维护与防止知识腐化：[`knowledge/maintenance.md`](.ai/rules/knowledge/maintenance.md)
- 历史经验覆盖与权威规则映射：[`knowledge/experience-catalog.md`](.ai/rules/knowledge/experience-catalog.md)

## 最小验证

- 普通代码改动：`npm run build`、`npm run audit:ai-rules`、`git diff --check`。
- 住宿数据/图片：再跑 `npm run audit:accommodation`、`npm run audit:accommodation-visuals`。
- 行程事件/媒体：再跑 `npm run audit:event-media`。
- 社交攻略：再跑 `npm run audit:social-guides`。
- 触及多个域或准备交付：运行上述全套，并按受影响页面做浏览器验收。

完整命令、状态定义和验收清单见 [`.ai/rules/verification/quality-gates.md`](.ai/rules/verification/quality-gates.md)。
