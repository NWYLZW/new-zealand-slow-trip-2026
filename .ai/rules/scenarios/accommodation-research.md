---
kind: scenario
id: scenario.accommodation-research
triggers: [accommodation-comparison, rate-or-availability-research, accommodation-image-research]
reading_order: [../research/evidence.md, ../research/accommodation.md, ../verification/quality-gates.md]
outputs: [qualified-candidate-set, reproducible-accommodation-evidence]
stop_conditions: [query-conditions-are-incomplete, browser-action-would-submit-or-purchase]
completion_gate: [evidence-status-is-explicit, accommodation-audits-pass]
last_reviewed: 2026-08-03
---

# 住宿调研与核价

适用于酒店、民宿、房型、价格、库存、政策或住宿图片的调研和数据更新。

## 阅读路径

1. 读 [`research/evidence.md`](../research/evidence.md)，统一日期、人数、币种、总价口径和证据等级。
2. 读 [`research/accommodation.md`](../research/accommodation.md)，完成资格筛选、状态建模和住宿专项检查。
3. 只有操作登录态或动态页面时，追加 [`research/browser-operations.md`](../research/browser-operations.md)。
4. 写入数据或页面后读 [`verification/quality-gates.md`](../verification/quality-gates.md)。

## 预期产出

- 不靠凑数的合格候选集，以及适配当前行程的主备建议；
- 带入住条件、来源、核验日、证据等级和真实状态的报价/库存记录；
- 图片能映射到正确住宿或房型，并有来源和语义边界。

## 停止与确认

- 日期、人数、房型硬约束或比较口径缺失且会改变结果时停止确认；
- 浏览器只读，遇到预订、付款或最终表单停止；
- 无权威库存结论时只能标记未知/不可复现，不能写售罄。

## 完成门槛

候选均通过资格和证据检查；相关住宿数据、视觉重复审计通过；动态事实明确核验条件和待刷新项。
