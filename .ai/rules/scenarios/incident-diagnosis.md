---
kind: scenario
id: scenario.incident-diagnosis
triggers: [build-or-page-failure, service-or-browser-timeout, audit-failure]
reading_order: [../working/diagnostics.md, ../verification/quality-gates.md]
outputs: [isolated-failure-layer, verified-recovery]
stop_conditions: [system-mutation-needs-authorization, failure-budget-is-exhausted]
completion_gate: [root-cause-has-evidence, original-symptom-and-adjacent-paths-pass]
last_reviewed: 2026-08-03
---

# 故障诊断与恢复

适用于白屏、构建/审计失败、服务停止、浏览器或工具超时、网页无数据等异常。

## 阅读路径

1. 读 [`working/diagnostics.md`](../working/diagnostics.md)，从输入到系统逐层隔离并区分观察、假设和证据。
2. 使用专业工具、巨量日志或截断输出时，追加 [`working/tool-use.md`](../working/tool-use.md)。
3. 只在定位到具体领域后追加一条专项规则；IAB 问题读 [`research/browser-operations.md`](../research/browser-operations.md)。
4. 修复后读 [`verification/quality-gates.md`](../verification/quality-gates.md)，复测原症状和相邻路径。

## 预期产出

- 被证据隔离的故障层、根因或当前最强假设；
- 最小修复、安全恢复路径和未采用的高风险动作；
- 原始症状消失的独立证据。

## 停止与确认

- 需要改系统进程、socket、临时目录或插件时停止并请求授权；
- 同一路径两次没有新证据时停止机械重试；
- 第三次仍为同一外部阻塞且无安全替代时准确报告阻塞。

## 完成门槛

根因结论有直接或两类独立证据，原症状与相邻功能通过；只有稳定、可复发的模式才进入长期规则。
