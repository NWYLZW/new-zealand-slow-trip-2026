import { Component, lazy, startTransition, Suspense, useEffect, useMemo, useState } from "react";
import { useAdventurePreferences } from "./AdventurePreferences";
import { GameIconButton } from "./GameIconButton";
import { CloseIcon, MenuIcon, ResetIcon } from "./SketchIcons";
import { PencilSurface } from "./pencil/PencilSurface";
import "./AdventureDeferredFeature.css";

const featureLoadTimeout = 15000;

function loadWithTimeout(load) {
  return new Promise((resolve, reject) => {
    const timer = window.setTimeout(() => reject(new Error("Feature loading timed out")), featureLoadTimeout);
    Promise.resolve().then(load).then(result => {
      window.clearTimeout(timer);
      resolve(result);
    }, error => {
      window.clearTimeout(timer);
      reject(error);
    });
  });
}

class FeatureBoundary extends Component {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

function FeatureStatus({ kind, failed, onRetry, onClose, onOpenMenu, hidden }) {
  const { language } = useAdventurePreferences();
  const text = (zh, en) => language === "en" ? en : zh;
  const label = kind === "map" ? text("地图", "Map")
    : kind === "calendar" ? text("日历", "Calendar") : kind === "nearby" ? text("附近信息", "Nearby") : text("面板", "Panel");
  if (kind === "nearby" && (!failed || hidden)) return null;
  const Message = kind === "nearby" ? PencilSurface : "div";
  return <section className={`trip-feature-status trip-feature-status--${kind}${kind === "panel" ? " trip-panel" : ""}`}
    aria-label={label} aria-hidden={hidden || undefined} inert={hidden ? "" : undefined}>
    {onClose && <div className="trip-feature-status-actions">
      <GameIconButton label={text("菜单", "Menu")} onClick={onOpenMenu}><MenuIcon /></GameIconButton>
      <GameIconButton label={text("关闭", "Close")} onClick={onClose}><CloseIcon /></GameIconButton>
    </div>}
    <Message {...(kind === "nearby" ? { variant: "wash" } : {})}
      className={`trip-feature-status-message${kind === "nearby" ? " trip-nearby-surface" : ""}`} role={failed ? "alert" : "status"}>
      {failed ? <>
        <span>{text(`${label}加载失败`, `${label} could not load`)}</span>
        <GameIconButton label={text("重新加载", "Retry loading")} onClick={onRetry}><ResetIcon /></GameIconButton>
      </> : <><span className="site-spinner" aria-hidden="true" /><span>{text(`正在加载${label}`, `Loading ${label.toLowerCase()}`)}</span></>}
    </Message>
  </section>;
}

export function AdventureDeferredFeature({ load, kind, defer = false, componentProps, onClose, onOpenMenu }) {
  const [ready, setReady] = useState(!defer);
  const [attempt, setAttempt] = useState(0);
  const Feature = useMemo(() => lazy(() => loadWithTimeout(load)), [load, attempt]);
  useEffect(() => {
    if (!defer) return;
    let secondFrame = 0, idle = 0, timer = 0;
    // Two frames let the toolbar paint before even requesting the map module.
    const firstFrame = requestAnimationFrame(() => {
      secondFrame = requestAnimationFrame(() => {
        const show = () => startTransition(() => setReady(true));
        if (window.requestIdleCallback) idle = window.requestIdleCallback(show, { timeout: 1200 });
        else timer = window.setTimeout(show, 0);
      });
    });
    return () => {
      cancelAnimationFrame(firstFrame);
      cancelAnimationFrame(secondFrame);
      if (idle) window.cancelIdleCallback(idle);
      clearTimeout(timer);
    };
  }, [defer]);
  const statusProps = { kind, onClose, onOpenMenu,
    hidden: componentProps?.["aria-hidden"] || componentProps?.obscured,
    onRetry: () => setAttempt(value => value + 1) };
  return <FeatureBoundary key={attempt} fallback={<FeatureStatus {...statusProps} failed />}>
    <Suspense fallback={<FeatureStatus {...statusProps} />}>
      {ready ? <Feature {...componentProps} /> : <FeatureStatus {...statusProps} />}
    </Suspense>
  </FeatureBoundary>;
}
