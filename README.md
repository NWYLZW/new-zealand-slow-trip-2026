# 2026 新西兰南北岛松弛旅行攻略

这是一个 React + Vite + MUI 项目，用来保存和继续维护你们 2026 年 9 月 28 日至 10 月 11 日的新西兰双人旅行计划。

## 本地打开

安装依赖后启动本地开发服务：

```bash
npm install
npm start
```

然后打开 `http://127.0.0.1:4173/new-zealand-slow-trip-2026/`。

默认入口 `/new-zealand-slow-trip-2026/` 为新版冒险地图，旧版攻略页面保留在 `/new-zealand-slow-trip-2026/v1`，从地图菜单的「老版本」进入。两版共用同一 React 入口、路径路由与 PWA；旧 `/adventure`、`adventure.html` 链接自动归一到默认入口并保留查询参数。构建自动生成 GitHub Pages 路径入口，不需额外服务器重写。运行 `npm run build` 后用 `npm run test:unified-pwa` 验证深链接和离线切换。

构建生产版本：

```bash
npm run build
```

## GitHub Pages

项目已按仓库名配置 Vite base path：`/new-zealand-slow-trip-2026/`。推送到 GitHub 后，`.github/workflows/pages.yml` 会自动构建并发布到 GitHub Pages。

## 安装为应用

生产构建是可安装的 PWA。可从地图菜单的「安装到设备」或浏览器的安装入口添加。安装后默认打开地图，使用新版彩铅地图白底图标；网页标签图标保持透明。

应用快捷入口按「当日日程、当日酒店、相机、行程总览、酒店总览」排序。系统可能只显示前几项，两种总览仍可从站内任务和背包进入。「当日」在每次启动快捷入口时按设备当前日期解析，换酒店当天打开当晚住宿，不将退房日算作续住；不在旅行日期内或当天无住宿时回到相应总览。日期在打开后固定为普通深链接，不会在后续导航中意外跳回今天。

图标及快捷入口的已安装版本更新由浏览器/系统管理，网页刷新不代表桌面图标立即更新。重新安装前先导出需要保留的本地媒体；从生产地址安装，不使用本地开发地址。图标生成说明见 `public/icons/README.md`，快捷入口检查为 `node scripts/test-adventure-shortcuts.mjs`（先构建）。

Service Worker 会预缓存应用壳，并按需缓存已经打开过的行程图片和 OpenStreetMap 地图瓦片；不会把整个图片库一次性下载。发布新版本后应用会自动更新。

## 地图

默认页面使用 Leaflet + OpenStreetMap，不需要密钥。拖拽、滚轮缩放、分段路线、航线虚线、编号和点位提示都在同一个地图实例中完成，不会在每次操作后重新加载整张地图。「在 Google 地图打开完整路线」按钮仍可用。

如果要让页面内的自驾段按 Google 真实道路绘制，需要启用 Google Maps JavaScript API 与 Directions API，并在本地创建 `.env.local`：

```bash
VITE_GOOGLE_MAPS_API_KEY=
```

GitHub Pages 构建会读取仓库变量 `VITE_GOOGLE_MAPS_API_KEY`（Settings → Secrets and variables → Actions → Variables）。这是浏览器端 key，构建后访客可以看到；请在 Google Cloud Console 中只允许：

- 网站来源：`http://127.0.0.1:4173/*`、`https://nwylzw.github.io/new-zealand-slow-trip-2026/*`
- API：Maps JavaScript API、Directions API

不要把 key 直接提交到 GitHub。

## 项目内容

- `src/App.jsx`：页面组件，集成了 MUI Tabs、Card、Accordion、Timeline、Chip 等现成组件。
- `src/tripData.js`：结构化行程数据，后续改行程主要改这里。
- `src/eventMedia.js`：事件弹窗的地点/路线、图片来源、官方入口和参考攻略链接。
- `src/styles.css`：旅行杂志风格的样式。
- `public/images/`：页面用到的本地图片资源。

预订清单的勾选状态保存在当前浏览器的 `localStorage` 中，不会上传任何个人信息。

## 维护建议

- 修改行程内容：优先编辑 `src/tripData.js`。
- 替换图片：把同名图片放进 `public/images/` 目录即可。
- 打印或导出 PDF：打开页面后点击左侧「打印 / PDF」。

## 图片来源与许可

以下新增弹窗图片来自 Wikimedia Commons，并已在弹窗内提供可点击的原始页面署名：

- `queenstown.webp`：Gadfium，Public Domain。
- `aoraki.webp`：mhx，CC BY-SA 2.0。
- `auckland.webp`：Entropy1963，Public Domain。
- `hobbiton.webp`：Jackie.lck，CC BY 2.0。
- `rotorua.webp`：Marks6651，CC BY 4.0。
- `aoraki-helicopter.jpg`：David Wipf，CC BY 2.0。
- `aoraki-night.jpg`：Aleks Dahlberg，CC0。
- `auckland-airport.jpg`：G B_NZ，CC BY-SA 2.0。
- `walter-peak.jpg`：Bernard Spragg. NZ，CC0。
- `wanaka.jpg`：Bernard Spragg. NZ，CC0。
- `glenorchy.jpg`：Vishal Makwana，CC BY 2.0。
- `crown-range.jpg`：Donovan Govan，CC BY-SA 3.0。
- `tekapo.jpg`：Bernard Spragg. NZ，CC0。
- `christchurch.jpg`：Michal Klajban，CC BY-SA 4.0。
- `malaysia-airlines.jpg`：S5A-0043，CC BY 4.0。

事件弹窗中的小红书和 Facebook 入口明确指向关键词搜索结果；只有在能核验公开、稳定的具体帖子时，才会标成单篇参考攻略。

国际机票页面只保存航段、时间、舱位、出票状态和价格等行程信息。姓名、证件号、PNR 与电子票号不会写入本项目或 GitHub Pages。
