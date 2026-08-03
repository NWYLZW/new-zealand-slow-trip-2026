# 开发架构与数据维护

在新增组件、拆分大文件、调整状态/URL 或修改数据模型时阅读本页。

## 先定位再修改

1. 读 [`../project/context.md`](../project/context.md) 的事实来源地图。
2. 用 `rg` 找所有消费者、英文镜像、审计和 CSS；不要只凭文件名判断影响范围。
3. 判断改动属于壳层、面板、复用组件、事实数据、研究数据还是样式。
4. 先沿用现有模型；只有现有结构无法表达真实状态时才扩展 schema，并同步审计。

## 组件边界

- `App.jsx` 只协调主面板、语言、全局状态、URL 和详情导航，不承载大段具体页面 UI。
- 页面级内容放 `src/components/panels/`；跨页面原语放 `src/components/`；日历公共原语放 `src/components/calendar/`。
- JSX 与 CSS 分文件。小范围样式放组件相邻 CSS；全站 token/壳层/响应式放 `src/styles/`。
- 优先使用项目已有 MUI、地图、日历、对话框和图标，不重复造同类控件；图标优先 Material Icons。
- 不用一次性正则或脚本盲改 JSX/模板字符串。大迁移拆成可审查的小补丁，每步构建或搜索残留。

## 数据边界

- 事实内容从 UI 中抽离。行程改 `tripData.js`/`RouteMap.jsx`，住宿改 `src/data/`，媒体和来源改对应 manifest。
- 大数据按地区或领域拆分，由聚合文件保持稳定 export。不要让单个区域集合重新膨胀为数千行总文件。
- 保持稳定 ID、`rateKey`、事件标题和 URL 参数；它们被 localStorage、审计、深链接和选择数据引用。
- 中英字段一对一维护。英文应独立自然表达，不把中文塞入 `*En` 字段或依赖运行时机器翻译。
- 资源统一使用本地文件和可追溯来源；注意 Vite/GitHub Pages base path，不写只在 `/` 根路径工作的地址。

## 状态与 URL

- hash 是主面板，query 是详情：`compare/hotel/photo/photoIndex`、`event/eventTab`、`activity` 等参数按当前面板规范化。
- 打开详情、切换详情 tab、图库索引、返回和浏览器历史应同步 URL；刷新相同 URL 必须恢复相同视图。
- 切换主面板时清理不属于该面板的参数，避免隐藏详情状态污染下一页。
- 静态生产页不假装能写 Git。共享默认值来自仓库 JSON，个人交互状态放 localStorage；需要写文件的本地开发接口必须严格限制目标文件和输入。

## 安全重构方法

1. 先记录现有 exports、消费者和审计覆盖。
2. 新建目标模块并保持原聚合入口兼容。
3. 移动一个领域后运行构建/审计，再继续下一块。
4. 删除临时迁移脚本和死代码；用 `rg` 确认旧路径、旧 class、旧数据键没有残留。
5. 不用 `reset`、`checkout` 或覆盖共享脏工作区；只修改任务范围内文件。

## 性能与降级

- 地图、图库和大型详情是重资源边界；优先稳定组件实例和局部状态，避免一次交互重建整页或整张地图。
- 图片本地化后控制尺寸/格式，保留足够比较细节，不把原始超大资源无条件打进首屏。
- 无 API key、外部地图失败或生产静态环境不支持写文件时提供真实可用的降级路径，不白屏、不假装功能已成功。
- chunk、图片和交互性能警告需评估实际影响；若影响首屏或移动端，使用按面板/详情懒加载和合理分包，而不是只调高警告阈值。
- 优化前先测量：区分网络、转换、渲染和控制工具延迟；不要用 CSS 缩放掩盖低分辨率数据问题。

## 完成标准

- 数据只有一个权威来源，UI 没有复制事实。
- 大组件/大数据保持清晰职责，JSX 与 CSS 分离。
- URL 深链接和 localStorage 兼容未被破坏。
- 对应审计和构建通过，真实交互已按 [`../verification/quality-gates.md`](../verification/quality-gates.md) 验证。

## 关联规则

- 视觉与交互：[`../design/interface.md`](../design/interface.md)
- 行程一致性：[`../travel/itinerary-data.md`](../travel/itinerary-data.md)
- 交付：[`../delivery/security-and-git.md`](../delivery/security-and-git.md)
