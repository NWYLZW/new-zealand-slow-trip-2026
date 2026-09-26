import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { getInstallState, requestInstallation, subscribeInstallState } from "../pwa/installState";
import { AppearanceIcon, BackIcon, CloseIcon, InstallIcon, LanguageIcon, LegacyIcon, LockIcon, MenuIcon, PaletteIcon, SettingsIcon } from "./SketchIcons";
import { adventureLabel } from "./adventureLabels";
import { adventureThemes, useAdventurePreferences } from "./AdventurePreferences";
import { AdventureUnlockView } from "./AdventureUnlockView";
import { AdventureAppearancePreview } from "./AdventureAppearancePreview";
import { PanelDivider } from "./pencil/PanelDivider";
import { PencilSurface } from "./pencil/PencilSurface";
import { PencilText } from "./pencil/PencilText";
import "./AdventureMenu.css";

const themeIds = Object.keys(adventureThemes);
const appearanceIds = ["light", "dark", "system"];
const exitDuration = 320;

function isAppleMobileDevice() {
  const platform = navigator.platform ?? "";
  return /iPhone|iPad|iPod/i.test(navigator.userAgent)
    || (platform === "MacIntel" && navigator.maxTouchPoints > 1);
}

export function AdventureMenu({ open, screen = "menu", unlockOrigin = "menu", onScreenChange, onClose, onOpenLegacy }) {
  const { language, setLanguage, theme, setTheme, appearance, setAppearance } = useAdventurePreferences();
  const { prompt, installed } = useSyncExternalStore(subscribeInstallState, getInstallState);
  const dialogRef = useRef(null), triggerRef = useRef(null), backRef = useRef(null), settingsRef = useRef(null);
  const exitTimerRef = useRef(null), openFrameRef = useRef(null), completionRef = useRef(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  const [phase, setPhase] = useState("closed");
  const [installPending, setInstallPending] = useState(false);
  const [installHelp, setInstallHelp] = useState(false);
  const [installDismissed, setInstallDismissed] = useState(false);
  const t = key => adventureLabel(key, language);

  const finishExit = useCallback(() => {
    clearTimeout(exitTimerRef.current);
    exitTimerRef.current = null;
    const dialog = dialogRef.current;
    if (dialog?.open) dialog.close();
    setPhase("closed");
    triggerRef.current?.focus?.({ preventScroll: true });
    const completion = completionRef.current;
    completionRef.current = null;
    setInstallHelp(false);
    setInstallDismissed(false);
    if (completion?.notify) onCloseRef.current?.();
    completion?.after?.();
  }, []);

  const startExit = useCallback((notify = false, after) => {
    const dialog = dialogRef.current;
    if (!dialog?.open || exitTimerRef.current) return;
    cancelAnimationFrame(openFrameRef.current);
    completionRef.current = { notify, after };
    setPhase("leaving");
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) finishExit();
    else exitTimerRef.current = setTimeout(finishExit, exitDuration);
  }, [finishExit]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (open) {
      clearTimeout(exitTimerRef.current);
      exitTimerRef.current = null;
      completionRef.current = null;
      cancelAnimationFrame(openFrameRef.current);
      if (!dialog.open) {
        triggerRef.current = document.activeElement;
        setPhase("entering");
        dialog.showModal();
      }
      openFrameRef.current = requestAnimationFrame(() => {
        openFrameRef.current = requestAnimationFrame(() => setPhase("open"));
      });
    } else if (dialog.open) {
      startExit(false);
    }
    return () => cancelAnimationFrame(openFrameRef.current);
  }, [open, startExit]);

  useEffect(() => () => {
    clearTimeout(exitTimerRef.current);
    cancelAnimationFrame(openFrameRef.current);
  }, []);

  useEffect(() => {
    if (!open || phase === "leaving") return;
    const frame = requestAnimationFrame(() => {
      if (screen === "menu") settingsRef.current?.focus({ preventScroll: true });
      else backRef.current?.focus({ preventScroll: true });
    });
    return () => cancelAnimationFrame(frame);
  }, [open, screen, phase]);

  const goBack = () => {
    if (screen === "settings" || (screen === "unlock" && unlockOrigin === "menu")) onScreenChange?.("menu");
    else startExit(true);
  };

  const requestInstall = async () => {
    if (installed || installPending) return;
    if (!prompt) {
      setInstallHelp(true);
      return;
    }
    setInstallPending(true);
    setInstallDismissed(false);
    try {
      await requestInstallation();
      if (!getInstallState().installed) {
        setInstallDismissed(true);
        setInstallHelp(true);
      }
    } catch {
      setInstallHelp(true);
    } finally {
      setInstallPending(false);
    }
  };

  const onUnlockSuccess = () => {
    if (unlockOrigin === "external") startExit(true);
    else onScreenChange?.("menu");
  };

  const titleKey = screen === "settings" ? "settings" : screen === "unlock" ? "unlock" : "menuTitle";

  return <PencilSurface as="dialog" variant="full" ref={dialogRef}
    id="trip-adventure-menu" className="trip-adventure-menu" data-phase={phase}
    aria-labelledby="trip-adventure-menu-title"
    onCancel={event => { event.preventDefault(); event.stopPropagation(); screen === "menu" ? startExit(true) : goBack(); }}
    onKeyDownCapture={event => { if (event.key === "Escape") event.stopPropagation(); }}>
    <div className="trip-adventure-menu-inner">
      <header className="trip-adventure-menu-header">
        {screen === "menu" ? <span className="trip-adventure-menu-leading" aria-hidden="true"><MenuIcon /></span>
          : <button ref={backRef} type="button" className="trip-adventure-menu-back"
            onClick={goBack} aria-label={t(screen === "unlock" && unlockOrigin === "external" ? "closeMenu" : "backToMenu")}
            title={t(screen === "unlock" && unlockOrigin === "external" ? "closeMenu" : "backToMenu")}><BackIcon /></button>}
        <h1 id="trip-adventure-menu-title"><PencilText>{t(titleKey)}</PencilText></h1>
        <button type="button" className="trip-adventure-menu-close"
          onClick={() => startExit(true)} aria-label={t("closeMenu")} title={t("closeMenu")}><CloseIcon /></button>
        <PanelDivider />
      </header>

      {screen === "settings" && <section className="trip-adventure-menu-settings" aria-label={t("settings")}>
        <div className="trip-adventure-menu-setting">
          <h2><LanguageIcon /><PencilText>{t("language")}</PencilText></h2>
          <div role="group" aria-label={t("language")} className="trip-adventure-menu-options">
            {["zh", "en"].map(id => <PencilSurface as="button" key={id} variant={language === id ? "action" : "quiet"}
              className="trip-adventure-menu-option" aria-pressed={language === id}
              onClick={() => setLanguage(id)}><PencilText>{t(id === "zh" ? "chinese" : "english")}</PencilText></PencilSurface>)}
          </div>
        </div>
        <div className="trip-adventure-menu-setting">
          <h2><PaletteIcon /><PencilText>{t("theme")}</PencilText></h2>
          <div role="group" aria-label={t("theme")} className="trip-adventure-menu-options trip-adventure-menu-themes">
            {themeIds.map(id => <PencilSurface as="button" key={id} variant={theme === id ? "action" : "quiet"}
              className="trip-adventure-menu-option trip-adventure-menu-theme" data-theme-choice={id}
              aria-pressed={theme === id} onClick={() => setTheme(id)}>
              <span className="trip-adventure-menu-swatch" aria-hidden="true" /><PencilText>{t(id)}</PencilText>
            </PencilSurface>)}
          </div>
        </div>
        <div className="trip-adventure-menu-setting">
          <h2><AppearanceIcon /><PencilText>{t("appearance")}</PencilText></h2>
          <div role="group" aria-label={t("appearance")} className="trip-adventure-menu-appearances">
            {appearanceIds.map(id => <PencilSurface as="button" key={id} variant={appearance === id ? "action" : "quiet"}
              className="trip-adventure-menu-option trip-adventure-menu-appearance" aria-pressed={appearance === id}
              onClick={() => setAppearance(id)}>
              <AdventureAppearancePreview appearance={id} theme={theme} />
              <PencilText>{t(id)}</PencilText>
            </PencilSurface>)}
          </div>
        </div>
      </section>}

      {screen === "unlock" && <AdventureUnlockView active={open && phase !== "leaving"}
        language={language} onSuccess={onUnlockSuccess} />}

      {screen === "menu" && <nav className="trip-adventure-menu-links" aria-label={t("menu")}>
        <button ref={settingsRef} type="button" className="trip-adventure-menu-link"
          onClick={() => onScreenChange?.("settings")}><SettingsIcon /><PencilText>{t("settings")}</PencilText></button>
        <div className="trip-adventure-menu-row-divider"><PanelDivider /></div>
        <button type="button" className="trip-adventure-menu-link"
          onClick={() => onScreenChange?.("unlock", "menu")}><LockIcon /><PencilText>{t("unlock")}</PencilText></button>
        <div className="trip-adventure-menu-row-divider"><PanelDivider /></div>
        <button type="button" className="trip-adventure-menu-link" disabled={installed || installPending}
          onClick={requestInstall}><InstallIcon /><PencilText>{t(installed ? "installed" : installPending ? "installing" : "install")}</PencilText></button>
        {installHelp && !installed && <div className="trip-adventure-menu-install-help" role="status">
          <strong><PencilText>{t("installHelp")}</PencilText></strong>
          {installDismissed && <p><PencilText>{t("installDismissed")}</PencilText></p>}
          <p><PencilText>{t(isAppleMobileDevice() ? "iosHelp" : "browserHelp")}</PencilText></p>
        </div>}
        <div className="trip-adventure-menu-row-divider"><PanelDivider /></div>
        <button type="button" className="trip-adventure-menu-link"
          onClick={() => startExit(true, onOpenLegacy)} aria-label={t("openOldVersion")}>
          <LegacyIcon /><PencilText>{t("oldVersion")}</PencilText>
        </button>
      </nav>}
    </div>
  </PencilSurface>;
}
