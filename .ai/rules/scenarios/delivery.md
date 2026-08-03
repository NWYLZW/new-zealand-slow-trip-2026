---
kind: scenario
id: scenario.delivery
triggers: [commit-or-push, deployment, sensitive-information]
reading_order: [../working/requirements.md, ../verification/quality-gates.md, ../delivery/security-and-git.md]
outputs: [privacy-safe-commit, verified-remote-delivery]
stop_conditions: [write-authorization-is-absent, remote-overlap-needs-semantic-resolution]
completion_gate: [reviewed-diff-is-pushed, remote-and-deployment-state-are-reported]
last_reviewed: 2026-08-03
---

# 提交、推送与发布

适用于处理敏感信息、commit、push、GitHub Pages 或远端语义整合。

## 阅读路径

1. 读 [`working/requirements.md`](../working/requirements.md)，确认本轮外部写入授权及范围。
2. 读 [`verification/quality-gates.md`](../verification/quality-gates.md)，完成受影响域门禁并审查 diff。
3. 读 [`delivery/security-and-git.md`](../delivery/security-and-git.md)，检查隐私、分支、upstream、远端重叠和部署。

## 预期产出

- 只包含当前任务文件且没有秘密/私人标识的可审查提交；
- 普通 push 后可追踪的分支、提交、远端和部署状态；
- 验证结果与剩余限制的自包含报告。

## 停止与确认

- 当前任务没有明确 commit/push/部署授权时停止；
- 远端存在语义冲突、需要 rebase、force-with-lease 或绕过 hook 时先说明影响；
- 检查失败时不继续提交，先修复或报告阻塞。

## 完成门槛

选择性暂存内容已复核，必要门禁通过，普通 push 成功，并确认远端分支；涉及 Pages 时再验证部署与真实入口。
