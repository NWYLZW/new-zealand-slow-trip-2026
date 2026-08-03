---
kind: scenario
id: scenario.ui-feedback
triggers: [screenshot-annotation, visual-review, interaction-feedback]
reading_order: [../working/feedback-loop.md, ../design/interface.md, ../verification/quality-gates.md]
outputs: [feedback-change-matrix, verified-ui-fix]
stop_conditions: [feedback-conflicts, change-would-alter-approved-product-language]
completion_gate: [all-feedback-items-have-evidence, representative-viewports-pass]
last_reviewed: 2026-08-03
---

# UI 反馈闭环

适用于截图批注、选中元素评论、视觉返工、交互问题和用户纠错。

## 阅读路径

1. 读 [`working/feedback-loop.md`](../working/feedback-loop.md)，还原上下文并建立逐项反馈矩阵。
2. 读 [`design/interface.md`](../design/interface.md)，把局部批注转成一致的界面原则。
3. 修改公共组件、URL 或状态边界时，追加 [`developing/architecture.md`](../developing/architecture.md)。
4. 读 [`verification/quality-gates.md`](../verification/quality-gates.md)，在原 viewport/URL 和代表尺寸验收。

## 预期产出

- 每条反馈都有根因、修改位置、同类检查、验证证据和状态；
- 公共根因在组件族层面修复，不留下死 DOM、死 CSS 或空白；
- 视觉、交互、深链接和响应式行为共同成立。

## 停止与确认

- 多条反馈相互冲突时先明确取舍；
- 修改会改变其他已认可页面或整体视觉语言时先报告影响；
- 最新纠正与进行中的工作相反时，停止旧路径并检查残留。

## 完成门槛

反馈矩阵逐项闭环，目标页面与相邻场景通过真实浏览器验收，源码、DOM 和截图证据一致。
