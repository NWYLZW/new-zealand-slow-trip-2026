---
kind: scenario
id: scenario.long-running-work
triggers: [multi-session-task, resumable-batch-task, repeated-continue-request]
reading_order: [../working/requirements.md, ../working/long-running-tasks.md, ../verification/quality-gates.md]
outputs: [recoverable-ledgers, validated-batches]
stop_conditions: [scope-is-not-recoverable, repeated-external-blocker-has-no-safe-alternative]
completion_gate: [all-objects-have-terminal-status, final-gates-are-current]
last_reviewed: 2026-08-03
---

# 长任务与批量工作

适用于跨多轮、多日、上下文可能压缩，或需要逐对象批量处理的任务。

## 阅读路径

1. 读 [`working/requirements.md`](../working/requirements.md)，固定完整目标、非目标和授权。
2. 读 [`working/long-running-tasks.md`](../working/long-running-tasks.md)，建立范围、对象和验证三本账。
3. 确实需要并行时才追加 [`working/coordination.md`](../working/coordination.md)；批量 schema/导入时追加 [`developing/data-pipelines.md`](../developing/data-pipelines.md)。
4. 每批局部验证，收尾再读 [`verification/quality-gates.md`](../verification/quality-gates.md) 跑全量门禁。

## 预期产出

- 中断后能恢复的范围账、对象账、验证账和精确下一步；
- 每个对象区分未开始、证据不足、已写未验、局部通过、全量通过、阻塞或排除；
- 可独立审查和回退的原子批次。

## 停止与确认

- 现有状态无法还原完整范围或授权时先恢复契约；
- 同一路径连续重试不产生新证据时换假设或停止；
- 样例尚未校准时不扩散到全量。

## 完成门槛

所有对象都有可解释的终态，旧验证未被后续改动作废，一次性残片已清理，可复用检查进入脚本或规则。
