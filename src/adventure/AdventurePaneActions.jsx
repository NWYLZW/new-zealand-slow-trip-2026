import { useLanguage } from "../LanguageContext";
import { CloseIcon, FullscreenExitIcon, FullscreenIcon, MenuIcon } from "./SketchIcons";

export function AdventurePaneActions({ fullscreen, automaticFullscreen = false, onToggleFullscreen, onOpenMenu, onClose, calendar = false }) {
  const { language } = useLanguage();
  const text = (zh, en) => language === "en" ? en : zh;
  const expandLabel = fullscreen ? text("退出全屏", "Exit full screen")
    : calendar ? text("全屏日历", "Expand calendar") : text("全屏面板", "Expand panel");
  const closeLabel = calendar ? text("关闭日历", "Close calendar") : text("关闭面板", "Close panel");
  const ExpandIcon = fullscreen ? FullscreenExitIcon : FullscreenIcon;
  return <>
    {fullscreen && <button type="button" className="trip-route-header-action trip-pane-menu"
      title={text("菜单", "Menu")} aria-label={text("菜单", "Menu")}
      aria-haspopup="dialog" aria-controls="trip-adventure-menu" onClick={onOpenMenu}><MenuIcon /></button>}
    {!automaticFullscreen && <button type="button" className="trip-route-header-action trip-pane-expand" title={expandLabel}
      aria-label={expandLabel} aria-pressed={fullscreen} onClick={onToggleFullscreen}><ExpandIcon /></button>}
    <button type="button" className="trip-close trip-adventure-calendar-close" title={closeLabel}
      aria-label={closeLabel} onClick={onClose}><CloseIcon /></button>
  </>;
}
