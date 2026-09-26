import { Component, lazy, Suspense, useSyncExternalStore } from "react";
import { isAdventurePath, normalizeSiteUrl } from "./siteNavigation";

const ItineraryPage = lazy(() => import("./ItineraryPage"));
const AdventurePage = lazy(() => import("./adventure/AdventurePage").then((module) => ({ default: module.AdventurePage })));

export function prepareSitePage() {
  normalizeSiteUrl();
  const page = isAdventurePath() ? "adventure" : "itinerary";
  if (document.body.dataset.tripPage === page) return;
  document.body.dataset.tripPage = page;
  document.title = page === "adventure" ? "新西兰冒险地图" : "2026 新西兰松弛旅行攻略";
  document.documentElement.lang = "zh-CN";
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", page === "adventure" ? "#bddadb" : "#123f36");
}

function subscribe(listener) {
  const onNavigate = () => { prepareSitePage(); listener(); };
  window.addEventListener("popstate", onNavigate);
  return () => window.removeEventListener("popstate", onNavigate);
}
const snapshot = () => isAdventurePath() ? "adventure" : "itinerary";

class PageBoundary extends Component {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() {
    if (this.state.failed) return <main className="site-loading" role="alert">
      <p>页面暂时无法加载</p>
      <button type="button" onClick={() => location.reload()}>重新加载</button>
    </main>;
    return this.props.children;
  }
}

export function SiteRouter() {
  const page = useSyncExternalStore(subscribe, snapshot);
  return <PageBoundary key={page}>
    <Suspense fallback={<main className="site-loading" role="status" aria-label="正在加载"><span className="site-spinner" /></main>}>
      {page === "adventure" ? <AdventurePage /> : <ItineraryPage />}
    </Suspense>
  </PageBoundary>;
}
