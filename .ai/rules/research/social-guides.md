---
kind: rule
id: research.social-guides
scope: research
triggers: [research-social-guides, update-post-evidence]
outputs: [post-level-guide-record, balanced-actionable-summary]
verification: [real-posts-are-verified, media-and-claims-map-to-source]
last_reviewed: 2026-08-03
---

# 社交攻略调研

在新增或更新小红书等真实体验证据时阅读本页，并先遵守 [`evidence.md`](evidence.md)。

## 项目标准

- 当前活动日历中的每个事件至少 5 条合格小红书原帖。
- 每个事件同时包含正向经验和负面/避坑经验。
- 每条必须逐帖打开核验，不接受搜索结果页、关键词入口、泛化摘要或虚构作者。
- 直链必须是稳定的 `/explore/{noteId}`；同一事件不得重复 noteId。
- 卡片保留作者、真实标题、双语摘要/提醒、立场、核验标记和原帖媒体。

上述数量和格式以 `scripts/audit-social-guides.mjs` 为可执行契约。

## 搜索与选择

1. 从日历事件意图出发搜索，不只用景点名：加入停车、排队、自驾、雨天、坑、取消、时间等决策词。
2. 候选必须具体服务当前事件，例如皇后镇停车经验不能拿来填库克山观星。
3. 同一帖只有在确实对多个相邻事件分别有独立价值时才复用；避免全站重复造成假丰富。
4. 先覆盖风险较高的环节：转机、停车、长途自驾、天气活动、夜间项目和热门门票。

## 核验记录

- 在已登录 IAB 中打开具体帖子，确认 URL、作者、标题、正文/画面支持所写结论。
- `positive` 写可复制经验；`pitfall` 写真实限制、失败条件或规避方式，不把一般提醒硬标负面。
- 摘要是忠实转述，不扩张为帖子未表达的安全、价格或政策事实。
- 中英文摘要独立自然，保留新西兰专名和实际语境。

## 媒体

- 使用原帖图片或视频封面，本地化并记录来源；禁止浏览器窗口截图、搜索结果截图、占位图或加载失败回退。
- 媒体必须真实可加载，不能把另一帖/另一地点的图贴到当前卡片。
- 视频明确标识；图片 alt 和来源说明准确。

## 与官方事实的边界

- 社交攻略用于体验、动线和避坑，不作为票价、营业时间、取消政策、库存或道路法规的唯一来源。
- 关键政策用官方来源复核；帖子与官方冲突时保留体验差异，但以官方当前规则为准。
- 搜索入口可以作为 UI 的额外探索链接，但不能计入“已核验帖子”。

## 完成标准

- `npm run audit:social-guides` 通过。
- 抽查正向/避坑卡片能打开正确原帖，作者、标题、媒体和摘要一致。
- 事件详情移动端无溢出，媒体失败不会破坏布局。

## 关联规则

- IAB 操作：[`browser-operations.md`](browser-operations.md)
- 事件数据：[`../travel/itinerary-data.md`](../travel/itinerary-data.md)
- 验证：[`../verification/quality-gates.md`](../verification/quality-gates.md)
