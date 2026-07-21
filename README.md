# 2026 新西兰南北岛松弛旅行攻略

这是一个 React + Vite + MUI 项目，用来保存和继续维护你们 2026 年 9 月 28 日至 10 月 11 日的新西兰双人旅行计划。

## 本地打开

安装依赖后启动本地开发服务：

```bash
npm install
npm start
```

然后打开 `http://127.0.0.1:4173/`。

构建生产版本：

```bash
npm run build
```

## GitHub Pages

项目已按仓库名配置 Vite base path：`/new-zealand-slow-trip-2026/`。推送到 GitHub 后，`.github/workflows/pages.yml` 会自动构建并发布到 GitHub Pages。

## Google Maps

默认页面会用 Google Maps 路线预览和「在 Google 地图打开完整路线」按钮，不需要提交任何密钥。

如果你之后想在页面里显示自定义 marker、hover 信息窗和路线图，可以在本地创建 `.env.local`：

```bash
VITE_GOOGLE_MAPS_API_KEY=
```

真实 key 不要提交到 GitHub。

## 项目内容

- `src/App.jsx`：页面组件，集成了 MUI Tabs、Card、Accordion、Timeline、Chip 等现成组件。
- `src/tripData.js`：结构化行程数据，后续改行程主要改这里。
- `src/styles.css`：旅行杂志风格的样式。
- `public/images/`：页面用到的本地图片资源。

预订清单的勾选状态保存在当前浏览器的 `localStorage` 中，不会上传任何个人信息。

## 维护建议

- 修改行程内容：优先编辑 `src/tripData.js`。
- 替换图片：把同名图片放进 `public/images/` 目录即可。
- 打印或导出 PDF：打开页面后点击左侧「打印 / PDF」。
