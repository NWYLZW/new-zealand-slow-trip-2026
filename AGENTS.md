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

- 功能、代码或数据变更：[`scenarios/change-and-implementation.md`](.ai/rules/scenarios/change-and-implementation.md)
- 住宿调研、核价与图片：[`scenarios/accommodation-research.md`](.ai/rules/scenarios/accommodation-research.md)
- 截图批注、视觉或交互返工：[`scenarios/ui-feedback.md`](.ai/rules/scenarios/ui-feedback.md)
- 跨多轮/多日批量任务：[`scenarios/long-running-work.md`](.ai/rules/scenarios/long-running-work.md)
- 报错、白屏、超时或工具异常：[`scenarios/incident-diagnosis.md`](.ai/rules/scenarios/incident-diagnosis.md)
- commit、push、部署或敏感信息：[`scenarios/delivery.md`](.ai/rules/scenarios/delivery.md)
- 其他专项任务或需要组合规则：进入 [`.ai/rules/README.md`](.ai/rules/README.md#专项规则) 选择一条主规则。

## 最小验证

- 普通代码改动：`npm run build`、`npm run audit:ai-rules`、`git diff --check`。
- 住宿数据/图片：再跑 `npm run audit:accommodation`、`npm run audit:accommodation-visuals`。
- 行程事件/媒体：再跑 `npm run audit:event-media`。
- 社交攻略：再跑 `npm run audit:social-guides`。
- 触及多个域或准备交付：运行上述全套，并按受影响页面做浏览器验收。

完整命令、状态定义和验收清单见 [`.ai/rules/verification/quality-gates.md`](.ai/rules/verification/quality-gates.md)。
