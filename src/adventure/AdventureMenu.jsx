import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { usePrivateVault } from "../PrivateVaultContext";
import { getInstallState, requestInstallation, subscribeInstallState } from "../pwa/installState";
import { applyAppUpdate, checkForAppUpdate, getUpdateState, subscribeUpdateState } from "../pwa/updateState";
import { AppearanceIcon, BackIcon, CloseIcon, InstallIcon, LanguageIcon, LegacyIcon, LockIcon, MenuIcon,
  OrientationLandscapeIcon, OrientationPortraitIcon, OrientationSystemIcon, PaletteIcon, RefreshIcon, SettingsIcon } from "./SketchIcons";
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
const orientationOptions = [
  { id: "portrait", Icon: OrientationPortraitIcon },
  { id: "landscape", Icon: OrientationLandscapeIcon },
  { id: "system", Icon: OrientationSystemIcon },
];
const exitDuration = 320;
const privateEntryHoldDuration = 3000;

function isAppleMobileDevice() {
  const platform = navigator.platform ?? "";
  return /iPhone|iPad|iPod/i.test(navigator.userAgent)
    || (platform === "MacIntel" && navigator.maxTouchPoints > 1);
}

export function AdventureMenu({ open, screen = "menu", unlockOrigin = "menu", onScreenChange, onClose, onOpenLegacy }) {
  const { language, setLanguage, theme, setTheme, appearance, setAppearance,
    orientation, setOrientation } = useAdventurePreferences();
  const vault = usePrivateVault();
  const { prompt, installed } = useSyncExternalStore(subscribeInstallState, getInstallState);
  const updateState = useSyncExternalStore(subscribeUpdateState, getUpdateState);
  const dialogRef = useRef(null), triggerRef = useRef(null), backRef = useRef(null), settingsRef = useRef(null);
  const exitTimerRef = useRef(null), openFrameRef = useRef(null), completionRef = useRef(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  const [phase, setPhase] = useState("closed");
  const [installPending, setInstallPending] = useState(false);
  const [installHelp, setInstallHelp] = useState(false);
  const [installDismissed, setInstallDismissed] = useState(false);
  const [privateEntryVisible, setPrivateEntryVisible] = useState(false);
  const privateEntryTimerRef = useRef(null);
  const privateEntryPointerRef = useRef(null);
  const t = key => adventureLabel(key, language);
  const updateBusy = ["checking", "updating", "registering"].includes(updateState.status);
  const updateLabel = updateState.status === "available" ? "updateAvailable"
    : updateState.status === "checking" || updateState.status === "registering" ? "checkingUpdate"
      : updateState.status === "updating" ? "updatingApp" : "checkUpdate";
  const updateStatusKey = updateState.status === "available" ? "updateStatusAvailable"
    : updateState.status === "current" ? "updateStatusCurrent"
      : updateState.status === "checking" || updateState.status === "registering" ? "updateStatusChecking"
        : updateState.status === "updating" ? "updateStatusUpdating"
          : updateState.status === "offline" ? "updateStatusOffline"
            : updateState.status === "error" ? "updateStatusError" : "updateStatusUnchecked";
  const updateStatusTitleKey = updateState.status === "available" ? "updateStatusAvailableFull"
    : updateState.status === "current" ? "appCurrent"
      : updateState.status === "checking" || updateState.status === "registering" ? "checkingUpdate"
        : updateState.status === "updating" ? "updatingApp"
          : updateState.status === "offline" ? "updateOffline"
            : updateState.status === "error" ? "updateFailed" : "updateUnchecked";

  const clearPrivateEntryTimer = useCallback(() => {
    if (privateEntryTimerRef.current !== null) window.clearTimeout(privateEntryTimerRef.current);
    privateEntryTimerRef.current = null;
    privateEntryPointerRef.current = null;
  }, []);

  const startPrivateEntryTimer = useCallback(event => {
    if (screen !== "menu" || privateEntryTimerRef.current !== null) return;
    if (event?.pointerId !== undefined) {
      privateEntryPointerRef.current = {
        pointerId: event.pointerId,
        x: event.clientX,
        y: event.clientY,
        bounds: event.currentTarget.getBoundingClientRect(),
      };
    }
    privateEntryTimerRef.current = window.setTimeout(() => {
      privateEntryTimerRef.current = null;
      privateEntryPointerRef.current = null;
      setPrivateEntryVisible(true);
    }, privateEntryHoldDuration);
  }, [screen]);

  const movePrivateEntryPointer = useCallback(event => {
    const pointer = privateEntryPointerRef.current;
    if (!pointer || event.pointerId !== pointer.pointerId) return;
    const outside = event.clientX < pointer.bounds.left || event.clientX > pointer.bounds.right
      || event.clientY < pointer.bounds.top || event.clientY > pointer.bounds.bottom;
    if (outside || Math.hypot(event.clientX - pointer.x, event.clientY - pointer.y) > 12) clearPrivateEntryTimer();
  }, [clearPrivateEntryTimer]);

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
    clearPrivateEntryTimer();
    cancelAnimationFrame(openFrameRef.current);
    completionRef.current = { notify, after };
    setPhase("leaving");
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) finishExit();
    else exitTimerRef.current = setTimeout(finishExit, exitDuration);
  }, [clearPrivateEntryTimer, finishExit]);

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
    clearPrivateEntryTimer();
  }, [clearPrivateEntryTimer]);

  useEffect(() => {
    clearPrivateEntryTimer();
    if (!open) setPrivateEntryVisible(false);
  }, [clearPrivateEntryTimer, open, screen]);

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
    id="trip-adventure-menu" className="trip-adventure-menu" data-phase={phase} data-screen={screen}
    aria-labelledby="trip-adventure-menu-title"
    onCancel={event => { event.preventDefault(); event.stopPropagation(); screen === "menu" ? startExit(true) : goBack(); }}
    onKeyDownCapture={event => { if (event.key === "Escape") event.stopPropagation(); }}>
    <div className="trip-adventure-menu-inner">
      <header className="trip-adventure-menu-header">
        {screen === "menu" ? <button type="button" className="trip-adventure-menu-leading"
          aria-label={t("menuTitle")} title={t("menuTitle")}
          onPointerDown={startPrivateEntryTimer} onPointerUp={clearPrivateEntryTimer}
          onPointerMove={movePrivateEntryPointer} onPointerCancel={clearPrivateEntryTimer} onPointerLeave={clearPrivateEntryTimer}
          onContextMenu={event => event.preventDefault()}
          onKeyDown={event => {
            if ((event.key === "Enter" || event.key === " ") && !event.repeat) {
              event.preventDefault();
              startPrivateEntryTimer();
            }
          }}
          onKeyUp={event => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              clearPrivateEntryTimer();
            }
          }} onBlur={clearPrivateEntryTimer}><MenuIcon /></button>
          : <button ref={backRef} type="button" className="trip-adventure-menu-back"
            onClick={goBack} aria-label={t(screen === "unlock" && unlockOrigin === "external" ? "closeMenu" : "backToMenu")}
            title={t(screen === "unlock" && unlockOrigin === "external" ? "closeMenu" : "backToMenu")}><BackIcon /></button>}
        <h1 id="trip-adventure-menu-title"><PencilText>{t(titleKey)}</PencilText></h1>
        <button type="button" className="trip-adventure-menu-close"
          onClick={() => startExit(true)} aria-label={t("closeMenu")} title={t("closeMenu")}><CloseIcon /></button>
        <PanelDivider />
      </header>

      {screen === "settings" && <section className="trip-adventure-menu-settings" aria-label={t("settings")} tabIndex={0}>
        <div className="trip-adventure-menu-setting">
          <h2><LanguageIcon /><PencilText>{t("language")}</PencilText></h2>
          <div role="group" aria-label={t("language")} className="trip-adventure-menu-options">
            {["zh", "en"].map(id => <PencilSurface as="button" key={id} variant="action" clipContent
              className="trip-adventure-menu-option trip-adventure-menu-choice" aria-pressed={language === id}
              onClick={() => setLanguage(id)}><LanguageIcon />
              <span className="trip-adventure-menu-choice-label"><PencilText>{t(id === "zh" ? "chinese" : "english")}</PencilText></span>
            </PencilSurface>)}
          </div>
        </div>
        <div className="trip-adventure-menu-setting">
          <h2><PaletteIcon /><PencilText>{t("theme")}</PencilText></h2>
          <div role="group" aria-label={t("theme")} className="trip-adventure-menu-options trip-adventure-menu-themes">
            {themeIds.map(id => <PencilSurface as="button" key={id} variant="action" clipContent
              className="trip-adventure-menu-option trip-adventure-menu-choice trip-adventure-menu-theme" data-theme-choice={id}
              aria-pressed={theme === id} onClick={() => setTheme(id)}>
              <span className="trip-adventure-menu-choice-icon-slot" aria-hidden="true"><span className="trip-adventure-menu-swatch" /></span>
              <span className="trip-adventure-menu-choice-label"><PencilText>{t(id)}</PencilText></span>
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
        <div className="trip-adventure-menu-setting">
          <h2><OrientationSystemIcon /><PencilText>{t("orientation")}</PencilText></h2>
          <div role="group" aria-label={t("orientation")} className="trip-adventure-menu-options trip-adventure-menu-orientations">
            {orientationOptions.map(({ id, Icon }) => <PencilSurface as="button" key={id} variant="action" clipContent
              className="trip-adventure-menu-option trip-adventure-menu-choice trip-adventure-menu-orientation"
              aria-pressed={orientation === id} onClick={() => setOrientation(id)}>
              <Icon /><span className="trip-adventure-menu-choice-label"><PencilText>{t(id)}</PencilText></span>
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
        {vault.isConfigured && (vault.isUnlocked || privateEntryVisible) && <>
          <button type="button" className="trip-adventure-menu-link"
            onClick={() => {
              if (vault.isUnlocked) {
                vault.lock();
                setPrivateEntryVisible(false);
              } else onScreenChange?.("unlock", "menu");
            }}><LockIcon /><PencilText>{t(vault.isUnlocked ? "lockPrivate" : "unlock")}</PencilText></button>
          <div className="trip-adventure-menu-row-divider"><PanelDivider /></div>
        </>}
        <button type="button" className="trip-adventure-menu-link" disabled={installed || installPending}
          onClick={requestInstall}><InstallIcon /><PencilText>{t(installed ? "installed" : installPending ? "installing" : "install")}</PencilText></button>
        {installHelp && !installed && <div className="trip-adventure-menu-install-help" role="status">
          <strong><PencilText>{t("installHelp")}</PencilText></strong>
          {installDismissed && <p><PencilText>{t("installDismissed")}</PencilText></p>}
          <p><PencilText>{t(isAppleMobileDevice() ? "iosHelp" : "browserHelp")}</PencilText></p>
        </div>}
        <div className="trip-adventure-menu-row-divider"><PanelDivider /></div>
        <button type="button" className="trip-adventure-menu-link trip-adventure-menu-update-link" disabled={updateBusy}
          aria-label={`${t(updateLabel)}，${t(updateStatusTitleKey)}`}
          onClick={() => updateState.status === "available" ? applyAppUpdate() : checkForAppUpdate()}>
          <RefreshIcon /><span className="trip-adventure-menu-link-label"><PencilText>{t(updateLabel)}</PencilText></span>
          <span className={`trip-adventure-menu-update-status is-${updateState.status}`}
            title={t(updateStatusTitleKey)} aria-label={t(updateStatusTitleKey)} role="status" aria-live="polite">
            <PencilText>{t(updateStatusKey)}</PencilText>
          </span>
        </button>
        <div className="trip-adventure-menu-row-divider"><PanelDivider /></div>
        <button type="button" className="trip-adventure-menu-link"
          onClick={() => startExit(true, onOpenLegacy)} aria-label={t("openOldVersion")}>
          <LegacyIcon /><PencilText>{t("oldVersion")}</PencilText>
        </button>
      </nav>}
    </div>
  </PencilSurface>;
}
