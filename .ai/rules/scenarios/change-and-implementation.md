---
kind: scenario
id: scenario.change-and-implementation
triggers: [new-feature, code-or-data-change, cross-consumer-update]
reading_order: [../working/requirements.md, ../verification/quality-gates.md]
outputs: [scoped-change, acceptance-evidence]
stop_conditions: [material-product-choice-is-unknown, external-write-is-not-authorized]
completion_gate: [requirements-are-mapped, affected-domain-gates-pass]
last_reviewed: 2026-08-03
---

# 功能、代码与数据变更

适用于新增功能、修改代码/数据，或一个事实需要同步多个消费者的任务。

## 阅读路径

1. 先读 [`working/requirements.md`](../working/requirements.md)，明确目标、非目标、授权和验收证据。
2. 首次接手或事实入口不清时，追加 [`project/context.md`](../project/context.md)。
3. 从 [专项规则索引](../README.md#专项规则) 只选当前主改动对应的一条规则；涉及模块边界读架构，涉及 schema/批量数据读数据管线。
4. 实现后读 [`verification/quality-gates.md`](../verification/quality-gates.md)，选择受影响门禁。

## 预期产出

- 范围、影响面和验收项能逐项映射到实现或证据；
- 事实变更已同步到中英、地图、日历、预订、URL/状态等实际消费者；
- 验证结果与剩余风险可复现。

## 停止与确认

- 会产生明显不同产品结果的选择无法从现有证据判断时停止确认；
- 需要预订、付款、提交外部表单、创建外部资源、commit 或 push 时，先确认当前任务已有对应授权；
- 用户要求先看样例时，样例未确认前不批量扩散。

## 完成门槛

显式要求全部有实现/证据对应，专项审计与代表性用户路径通过，且没有把局部完成写成全量完成。
