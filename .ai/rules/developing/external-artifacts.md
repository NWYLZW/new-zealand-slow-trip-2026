---
kind: rule
id: developing.external-artifacts
scope: developing
triggers: [import-external-artifact, synchronize-remote-implementation]
outputs: [isolated-artifact-inventory, semantic-integration]
verification: [facts-and-implementation-are-reviewed-separately, current-decisions-are-preserved]
last_reviewed: 2026-08-03
---

# 外部产物同步与语义合并

在从线上网页、ZIP、旧静态站、其他分支/PR 或第三方生成物同步内容到本项目时阅读本页。

## 先把外部产物当输入，不当权威覆盖

- 记录来源、获取时间、版本/提交（若有）和用户希望同步的内容类型。
- 在隔离目录解包/抓取，先清单、尺寸、文件类型和敏感扫描；不直接覆盖工作树。
- 外部 HTML/JS、安装脚本和配置是不可信代码，先阅读再运行。
- 当前仓库的最新用户决策、数据 schema、隐私规则和已验证行为仍是整合基线。

## 建立差异映射

按语义比较，而不是只按文件名：

- 新事实/内容；
- 现有事实的更新；
- 纯视觉或组件实现；
- 媒体资产及其来源；
- 构建/部署配置；
- 过时、冲突或只适用于旧结构的内容。

对每项决定“采纳、改写适配、保留本地、归档或拒绝”，并说明冲突依据。

## 从网页本地化

- 先区分外层壳、iframe 最终内容、重定向和平台注入脚本；不要把白屏外壳当内容不存在。
- 保留实际内容和必要资源，移除 Cloudflare/统计/平台注入、绝对临时 URL 和在线运行时依赖。
- 入口直接渲染内容或使用稳定最终路径，避免本地继续复制线上嵌入故障。
- 核对图片、字体、链接和下载按钮均使用本地/base-aware 路径。

## 从 ZIP/旧项目同步

- 解包后先识别数据事实与旧 UI；优先把新事实迁入当前 schema，不回退到旧架构。
- 不覆盖当前组件拆分、URL 契约、审计或用户已认可设计，除非新产物明确更权威并经过验收。
- 媒体去重并重建来源清单；压缩包里出现的秘密、构建产物、依赖目录和系统文件不导入。
- 日期、住宿、活动等事实变化按影响矩阵同步，而不是复制整文件。

## 从分支/PR同步

- 比较 base、提交时间、目标和语义差异；自动 mergeable 只说明文本可合并。
- 对日期、选择、状态、数据来源做语义冲突检查，以用户最新确认和当前权威证据为准。
- 先在本地整合和验证，再决定 merge/cherry-pick/手工迁移；不因方便牺牲当前正确性。

## 验证

- 同步前后对比对象 ID/数量、关键事实、资源引用、构建入口和 Git diff。
- 运行对应审计与生产构建，并打开本地和 Pages base path 验证。
- 搜索平台注入、旧路径、绝对本地路径、秘密、死文件和重复资源。
- 用户要求先审样例时，只同步代表范围；确认后再全量，且保持最终范围不缩水。

## 关联规则

- 数据迁移：[`data-pipelines.md`](data-pipelines.md)
- 媒体：[`media-assets.md`](media-assets.md)
- Git 语义整合：[`../delivery/security-and-git.md`](../delivery/security-and-git.md)
