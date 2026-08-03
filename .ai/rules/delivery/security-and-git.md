---
kind: rule
id: delivery.security-and-git
scope: delivery
triggers: [handle-sensitive-information, commit-push-or-deploy]
outputs: [privacy-safe-change, traceable-delivery]
verification: [secrets-and-private-identifiers-are-absent, remote-and-deployment-state-are-verified]
last_reviewed: 2026-08-03
---

# 隐私、Git 与 GitHub Pages

只有在处理敏感信息、提交、推送或部署时阅读本页。

## 隐私边界

- 可公开：航班号、机场、日期、时刻、舱位、一般价格和公开政策。
- 不公开：姓名、证件号、PNR、电子票号、酒店/租车确认号、cookie、token、付款信息和私人联系方式。
- 用户截图只提取必要非敏感事实；不把原图、完整 OCR 或私人文件复制进 `public/`。
- 预订勾选和语言偏好保留 localStorage；不要未经授权上传个人交互状态。

## API key 与环境变量

- Google Maps 浏览器 key 不写入 Git。使用 `.env.local` 或 GitHub Actions Variable `VITE_GOOGLE_MAPS_API_KEY`。
- 浏览器端 key 构建后可见，必须在 Google Cloud 限制允许来源和 API；GitHub Secret 不能让前端 key 真正保密。
- `.env.example` 只放空占位和说明；提交前搜索常见 key/token/票号模式。

## Git 工作流

- 未经用户明确要求，不 commit、不 push、不创建仓库或 PR。
- 开始前和交付前检查分支、upstream、远端和脏工作区；此工作树可能处于 detached HEAD，不擅自切换/建分支。
- 保留无关改动，不用 `git reset --hard`、`git checkout --`、`git clean`、force push 或绕过 hooks。
- 不用宽泛 `git add .` 混入诊断文件、下载残片、`dist/`、日志或秘密；按审阅过的文件选择性暂存。
- 提交信息沿用 Conventional Commits 和仓库历史，例如 `feat(accommodation): ...`、`feat(ui): ...`、`docs(ai): ...`。
- 推送前先 fetch/检查远端差异，使用普通 push；需要 rebase、合并或 force-with-lease 时必须按实际冲突和用户授权处理。

## 远端重叠与语义整合

- 远端已有 PR/提交时先读其目标、diff 和当前可合并状态，再比较本地最新事实；不要只因远端较新就覆盖本地用户决定。
- 区分机械冲突和语义冲突：文件能自动合并不代表日期、选择、状态和证据没有互相矛盾。
- 以用户最新确认、当前权威数据和完整测试为准，选择 merge/rebase/手工整合；保留双方有效改动并明确淘汰过时内容。
- 不在脏工作区执行高风险历史改写；需要切分支、rebase 或 force-with-lease 时先说明影响并获得相应授权。
- 整合后重新跑全量门禁，不能沿用整合前任一分支的绿灯。

## GitHub Pages

- Vite base 必须保持 `/new-zealand-slow-trip-2026/`，资源路径需 base-aware。
- `.github/workflows/pages.yml` 使用 Node 20、`npm ci`、`npm run build` 和 Pages artifact；修改部署链路后检查 workflow 与本地构建一致。
- 地图无 key 时仍需可用退化体验和 Google Maps 外链，不能让整页白屏。
- 部署验证不仅看 Actions 绿灯：打开 Pages URL，检查直接深链接、资源、地图/图片和控制台。

## 推送前清单

1. 按 [`../verification/quality-gates.md`](../verification/quality-gates.md) 完成受影响门禁。
2. `git diff` 审查所有将提交内容；确认没有敏感数据和不相关文件。
3. 选择性暂存并再次查看 `git diff --cached`。
4. 提交后确认工作区状态和提交内容。
5. 普通 push，并核对 `origin/<branch>`、Actions 和 Pages（若相关）。
6. 向用户报告提交 hash、分支、远端、验证结果和仍存在的真实限制。

## 项目位置

用户常用真实目录遵循 `/Users/bytedance/projects/<远端账号小写>/<repo>`。当前远端账号是 `NWYLZW`；不要使用隔离环境的 `$HOME` 推导真实 home，优先读取真实 home 环境变量或系统账号并交叉验证。
