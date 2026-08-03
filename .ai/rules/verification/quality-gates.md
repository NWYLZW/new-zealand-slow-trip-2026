# 质量门禁与完成审计

实现完成后按受影响范围阅读本页。命令通过只是证据的一部分，不能替代视觉和事实验收。

## 先建立验收矩阵

把用户要求逐条映射为：

- 权威代码/数据文件；
- 自动检查；
- 浏览器场景；
- 完成证据。

对每项判断“已证明 / 被反证 / 证据不足 / 缺失”。证据不足按未完成处理，不用“看起来可以”收尾。

## 自动检查

### 基线

```bash
npm run build
npm run audit:ai-rules
git diff --check
```

### 住宿数据或酒店图片

```bash
npm run audit:accommodation
npm run audit:accommodation-visuals
npm run report:accommodation-recheck
```

`report` 可保留待刷新项，但必须与任务声称的完成范围一致；审计通过不代表所有动态报价已经更新。

### 行程事件和媒体

```bash
npm run audit:event-media
```

### 社交攻略

```bash
npm run audit:social-guides
```

### 全量交付

```bash
npm run audit:accommodation
npm run audit:accommodation-visuals
npm run audit:event-media
npm run audit:social-guides
npm run audit:ai-rules
npm run build
git diff --check
```

警告需逐条分类为已知非阻断、任务引入或必须修复；不要只报告 exit code 0。

## 浏览器验收

### 所有 UI 改动

- 本地 URL 返回 200，页面没有白屏和 console error。
- 桌面与约 436px 手机宽度无横向滚动。
- 目标元素真正删除/修改，而不是被 CSS 临时隐藏。
- 交互可键盘操作，焦点、ARIA 和外链行为合理。

### 地图/日历

- 点位、标签和路线与当前数据一致。
- 缩放/拖动后底图精度和 SVG/Polyline 投影同步；复位恢复初始状态。
- 月历七列对齐，跨月、连续住宿、地区选择和事件点击正确。

### 深链接/详情

- 直接打开带 query/hash 的 URL 能恢复详情和 tab。
- 打开、切换、关闭、浏览器前进/后退不会留下陈旧参数。
- 酒店 marker、列表、详情、图库和面包屑互相同步。

### 数据页面

- 抽查显示值与数据对象、来源和状态一致。
- “待查 / 不可复现 / 旧报价 / 无房”视觉和文案可区分。
- 图片属于正确对象/房型，来源可打开，无破图和明显重复。

## 变更审查

- `git status --short --branch`：确认任务文件和意外未跟踪资源。
- `git diff --stat` 与 `git diff`：检查范围、秘密、生成物、死代码和一次性脚本。
- 用 `rg` 搜索旧文案、旧 class、旧 URL 参数、被替换的数据键和敏感字段。
- 不删除或还原不属于当前任务的用户改动。

## 完成定义

只有以下全部成立才能声称完成：

1. 用户每条显式要求都有权威证据；
2. 事实状态和来源正确，没有把未知包装成已完成；
3. 自动检查覆盖受影响契约并通过；
4. 真实浏览器覆盖受影响交互、URL 和响应式场景；
5. 没有遗留必须工作、意外文件、秘密或未说明的阻断问题。

## 关联规则

- 架构：[`../developing/architecture.md`](../developing/architecture.md)
- 设计：[`../design/interface.md`](../design/interface.md)
- Git/发布：[`../delivery/security-and-git.md`](../delivery/security-and-git.md)
