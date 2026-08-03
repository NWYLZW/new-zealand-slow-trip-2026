# 项目规则索引

本目录是 `AGENTS.md` 的渐进式披露层。常见任务优先进入场景阅读包；场景只编排规则，不复制规则正文。没有匹配场景时再选择一条专项主规则。

## 读取顺序

1. 先读仓库根 [`AGENTS.md`](../../AGENTS.md)。
2. 优先从“常见场景”选择一个阅读包；没有匹配项时从“专项规则”选择一份主规则。
3. 只按场景的有序路径或主规则的“关联规则”继续读取。
4. 实现完成后读取 [`verification/quality-gates.md`](verification/quality-gates.md)。只有提交、推送、部署或处理敏感信息时才读交付规则。

## 常见场景

| 当前任务 | 阅读包 |
| --- | --- |
| 新功能、代码/数据修改、跨消费者同步 | [`scenarios/change-and-implementation.md`](scenarios/change-and-implementation.md) |
| 住宿比较、核价、库存、政策或图片调研 | [`scenarios/accommodation-research.md`](scenarios/accommodation-research.md) |
| 截图批注、视觉评审、交互反馈或纠错 | [`scenarios/ui-feedback.md`](scenarios/ui-feedback.md) |
| 跨多轮/多日批量工作、需要断点恢复 | [`scenarios/long-running-work.md`](scenarios/long-running-work.md) |
| 构建/页面/服务/浏览器/工具异常 | [`scenarios/incident-diagnosis.md`](scenarios/incident-diagnosis.md) |
| 敏感信息、commit、push 或部署 | [`scenarios/delivery.md`](scenarios/delivery.md) |

## 专项规则

| 当前任务 | 主规则 | 通常追加 |
| --- | --- | --- |
| 首次接手仓库、范围不清、需要定位事实来源 | [`project/context.md`](project/context.md) | 需求、对应领域规则 |
| 新需求、模糊需求、用户反馈或范围改变 | [`working/requirements.md`](working/requirements.md) | 项目上下文、对应领域规则 |
| 比较多个方案、做推荐、设计主备路径 | [`working/decision-making.md`](working/decision-making.md) | 证据、对应领域规则 |
| 跨多轮/多日批量任务、需要“继续”推进 | [`working/long-running-tasks.md`](working/long-running-tasks.md) | 协调、验证 |
| 报错、白屏、超时、服务/IAB/工具异常 | [`working/diagnostics.md`](working/diagnostics.md) | 浏览器或对应技术规则 |
| 调用专业工具、读取巨量日志、运行长命令或处理截断输出 | [`working/tool-use.md`](working/tool-use.md) | 诊断、长任务 |
| 决定是否分 agent、并行研究或合并多人结果 | [`working/coordination.md`](working/coordination.md) | 长任务、验证 |
| 处理截图批注、选中元素评论、视觉返工或用户纠错 | [`working/feedback-loop.md`](working/feedback-loop.md) | 需求、设计、验证 |
| 新组件、数据拆分、修模块边界 | [`developing/architecture.md`](developing/architecture.md) | 设计、验证 |
| 新增数据源、调整 schema、批量导入或迁移 | [`developing/data-pipelines.md`](developing/data-pipelines.md) | 证据、验证 |
| 从线上站点、ZIP、旧项目或远端分支同步内容 | [`developing/external-artifacts.md`](developing/external-artifacts.md) | 数据管线、Git、验证 |
| 新增/替换图片视频、处理来源许可或重复资产 | [`developing/media-assets.md`](developing/media-assets.md) | 数据管线、验证 |
| 调整样式、交互、地图、日历、弹窗、移动端 | [`design/interface.md`](design/interface.md) | 架构、验证 |
| 新增或修正中英文、专名、日期货币格式 | [`design/localization.md`](design/localization.md) | 架构、验证 |
| 更新日期、航班、租车、住宿段或活动 | [`travel/itinerary-data.md`](travel/itinerary-data.md) | 证据、验证 |
| 判断来源可信度、写调研结论 | [`research/evidence.md`](research/evidence.md) | 对应专项规则 |
| 调研酒店、民宿、房型、价格、库存或图片 | [`research/accommodation.md`](research/accommodation.md) | 证据、浏览器、验证 |
| 调研小红书真实帖子或事件攻略 | [`research/social-guides.md`](research/social-guides.md) | 证据、浏览器、验证 |
| 操作登录态 IAB、处理网页风控/动态页 | [`research/browser-operations.md`](research/browser-operations.md) | 证据、对应专项规则 |
| 检查改动是否完成 | [`verification/quality-gates.md`](verification/quality-gates.md) | 受影响域规则 |
| Git、GitHub Pages、密钥、隐私或推送 | [`delivery/security-and-git.md`](delivery/security-and-git.md) | 验证 |
| 从事故/返工/长期协作中沉淀仓库经验 | [`knowledge/maintenance.md`](knowledge/maintenance.md) | 被更新的领域规则 |
| 检查历史经验是否已覆盖、找到权威规则 | [`knowledge/experience-catalog.md`](knowledge/experience-catalog.md) | 对应权威规则 |

## 文档边界

- `AGENTS.md`：所有任务都必须知道的短规则、入口和最小门禁。
- `scenarios/`：高频任务的有序阅读包，只定义触发、路径、产出、停止点和完成门槛。
- `project/context.md`：产品定位、目录地图、稳定事实边界；初次接手或范围不清时读取。
- 专项规则：具体工作法、证据模型和验收标准。
- `.ai/docs/`：AI 信息架构、路线图和设计决策；不作为每次任务的必读执行规则。
- 当前行程、价格、候选数量等可变事实不复制到规则中；从源码、审计和实时来源读取。
- `working/`：跨领域执行方法，解决范围、进度、诊断和协调问题。
- `knowledge/`：规定什么经验值得沉淀、放在哪里、如何防止陈旧。

## 维护原则

- 只沉淀下次大概率复用的经验，不记录一次性命令噪声、临时 PID、过期 URL 或未经证实的故障归因。
- 一条规则只保留一个权威位置；根文件用链接路由，不复制全文。
- 每个规则/场景保留可审计元数据；字段契约和演进计划见 [`../docs/渐进式披露与长期知识沉淀方案.md`](../docs/渐进式披露与长期知识沉淀方案.md)。
- 项目结构、审计命令或数据状态发生变化时，同步更新对应规则和索引。
- 新规则优先归入现有分类；只有形成独立职责、证据模型或验证门槛时才新增文件。
