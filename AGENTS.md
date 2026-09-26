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

## 冒险地图设计约定

适用于 `adventure.html` 与 `src/adventure/`，不把主站的旅行杂志风格套回此地图。以下是已确认基线；用户新的明确决定优先，变更时同步实现、测试和本节，不恢复历史版本的样式。

- **彩铅材质**：复用 `pencil/stroke.js` 的笔压、颗粒、断笔和多次描边；海岸、河湖、路线、标记、文字与图标须风格统一。禁止以均匀实线、纯色圆点或随机抖动冒充手绘；纹理使用稳定种子，不随悬停、拖动或逐帧重绘闪烁。
- **文字可读性**：地图与全部面板、提示、按钮文字统一复用 `mapHandwriting`、`mapLabel` / `PencilText`，保留 C 版重描彩铅，参数以 `pencil/palette.js` 的 `pencilLettering` 为准：`variation=.52, breaks=.18, outline=.96, fill=.34, grain=.45`。减弱效果或加深颜色时调整强度与对比，不去掉颗粒、描边或换普通字体；正文保留原生换行、选择和无障碍语义，按可见区域缓存绘制，不能整块面板截图化。
- **图标与按钮**：返回、任务、背包、相册、缩放、复位及面板关闭/前后箭头统一用 `PencilIcon`；工具按钮无常驻文案，通过悬停/键盘焦点提示、`aria-label` 和选中笔迹表达功能与状态。工具点击区域至少 44px，图标与容器尺寸固定；修改同类控件须全套检查，不能只改被圈出的一个。
- **站点标记**：使用缓存的彩铅涂绘与不规则描边，选中增加手绘外圈，不恢复 CSS 纯色圆点和规则阴影环；可见标记与透明点击区域分开，标签、连线不得遮挡相邻站点。
- **聚焦交互**：点击地点以绝对缩放 10 倍居中，不是每次乘 10；采用约 850ms 缓入缓出，禁止闪现。新地点、手动拖动/滚轮、复位和关闭应打断旧动画；尊重 `prefers-reduced-motion`，重复选择、刷新和 URL 恢复的终态一致。
- **性能与投影**：地形、海洋、路线和标注共享坐标及视图变换，不能只 CSS 放大截图。拖动/动画复用缓存，停稳后再补高精度局部绘制；不得逐帧重画全图或分配整张高倍率位图。验收实际中间帧、图层对齐及中断行为，不只检查最终位置。
- **地理层次**：保留林地、草地、农田、灌丛、裸地、冰雪、湿地与城镇的可辨差异，不能退化成仅森林/高山两色。海洋纹理及海域名称锚定地图、随地图移动；保留 200/1000/2000/4000 米海深分色、反经线处理与边缘过渡，禁止固定海洋背景或屏幕固定海域文字。
- **单一绘制来源**：河湖等重叠来源先在 `pencil/waterFeatures.js` 解析取舍，再由同一绘制链路输出；保留多部件与孔洞。替换旧版时删除旧运行时绘制、DOM 和死 CSS，不叠画、不仅隐藏；来源档案可保留但不得被运行时加载。
- **真实路线**：陆路使用本地路网快照和真实途经地点，保留道路顶点并与命中区域共用几何；禁止用旧控制点、直连或平滑曲线穿越地形。航线仅为示意，大巴汽车路网参考线不得称为运营商轨迹；无数据须明确标示退化，不能冒充 GPS、实时路况或导航。保留来源、采集日期与外部地图入口，不改行程事实。
- **来源展示**：不恢复地图底部常驻来源条；在背包“地图数据来源”和路线详情保留必要署名、许可及纠错入口。页面不实时调用公共路径规划服务，数据刷新走 `npm run fetch:adventure-roads`，变更来源时核对使用要求。
- **验收门禁**：地图相关变更按影响运行 `npm run test:adventure-pencil`、`npm run test:adventure-controls`、`npm run test:adventure-roads`、`npm run test:adventure-water`、`npm run test:adventure-text`，另跑构建、规则审计及 diff 检查。检查桌面/手机截图、非空像素、文字对比、重复图层、点击/键盘/触摸、动画中断与 URL 历史；旧截图或构建通过不能代替本轮验收。

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
