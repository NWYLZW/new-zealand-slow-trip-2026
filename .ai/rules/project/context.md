---
kind: rule
id: project.context
scope: project
triggers: [first-repository-task, unclear-fact-source-or-boundary]
outputs: [repository-responsibility-map, authoritative-source-selection]
verification: [current-code-and-scripts-support-the-map, dynamic-facts-are-not-copied]
last_reviewed: 2026-08-03
---

# 项目上下文与目录地图

在首次接手、任务范围不清或需要判断事实来源时阅读本页。

## 产品定位

这是两人 2026 年新西兰旅行的长期维护站点，包含：

- 南北岛行程、月历与地图路线；
- 国际/国内航班、租车和活动预订信息；
- 按真实入住段比较酒店、公寓、民宿和 B&B；
- 官方、平台和社交攻略证据；
- 中英文呈现、可分享的深链接、本地确认状态；
- GitHub Pages 静态发布。

它是决策工具，不是宣传落地页。完整性指每个决定都有可追溯来源、状态和取舍，不是堆叠更多卡片。

## 技术边界

- React 18 + Vite 6；入口 `src/main.jsx`，壳层 `src/App.jsx`。
- MUI 负责通用控件；Leaflet/React Leaflet 负责地图；Google Maps 仅在配置 key 或外链场景使用。
- URL hash 表示主面板；query 参数表示酒店、事件、活动和图片详情。深链接、前进/后退和关闭恢复属于产品契约。
- `localStorage` 保存语言、预订勾选等浏览器私有状态；共享选择种子位于 `src/data/hotel-selections.json`。
- GitHub Pages base 为 `/new-zealand-slow-trip-2026/`；本地资源通过 `assetPath()` 或现有 base-aware 路径处理。

## 事实来源地图

| 领域 | 权威入口 |
| --- | --- |
| 主导航、状态协调、深链接 | `src/App.jsx` |
| 行程日、航班、租车、预订项 | `src/tripData.js` |
| 地图路线、日历事件、事件详情 URL | `src/components/RouteMap.jsx`、`src/routeI18n.js` |
| 英文补充字段 | `src/englishTripData.js` 与各数据对象的 `*En` 字段 |
| 住宿入住段与区域集合 | `src/data/regionalHotels.js`、`src/data/aucklandCityHotels.js` |
| 住宿明细 | `src/data/regional/*.js`、`src/data/*AdditionalHotels.js` |
| 酒店图片来源 | `src/data/accommodationImageSources.js`、住宿 photo 对象 |
| 事件图片与链接 | `src/eventMedia.js`、`src/eventLinks.js` |
| 社交攻略 | `src/socialGuides*.js` |
| UI 样式 | 组件相邻 CSS、`src/styles/*.css` |
| 数据契约 | `scripts/audit-*.mjs` |
| 部署 | `.github/workflows/pages.yml`、`vite.config.js` |

## 易错点

- 同一事实可能同时影响中文、英文、地图、日历、预订和住宿日期；只改一处会产生静默冲突。
- 历史数据中可能保留归档候选。归档不是当前可选项，不应被 UI 或审计误当成当前行程。
- 动态报价会过期。数据状态与核验日期比“有没有数字”更重要。
- 静态站无法在生产环境直接写回仓库文件。浏览器状态与共享仓库状态必须显式区分。

## 关联规则

- 实现边界：[`../developing/architecture.md`](../developing/architecture.md)
- 事实更新：[`../travel/itinerary-data.md`](../travel/itinerary-data.md)
- 验证：[`../verification/quality-gates.md`](../verification/quality-gates.md)
