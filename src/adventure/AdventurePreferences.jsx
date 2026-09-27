import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { LanguageContext } from "../LanguageContext";
import { isAdventurePath } from "../siteNavigation";
import { applyOrientationPreference, orientationLockStillApplies, orientationPreferences } from "./orientationPreference";
import "./AdventureMenu.css";
import "./AdventureAppearance.css";

const languageKey = "nz-trip-language";
const themeKey = "nz-trip-adventure-theme";
const appearanceKey = "nz-trip-adventure-appearance";
const cameraFacingKey = "nz-trip-camera-facing";
const cameraAudioKey = "nz-trip-camera-audio";
const orientationKey = "nz-trip-adventure-orientation";

export const adventureThemes = {
  lake: { color: "#bddadb" },
  fern: { color: "#b9d0bb" },
  sunset: { color: "#e6d0b5" },
};

function readPreference(key, allowed, fallback) {
  try {
    const value = localStorage.getItem(key);
    return allowed.includes(value) ? value : fallback;
  } catch {
    return fallback;
  }
}

function savePreference(key, value) {
  try { localStorage.setItem(key, value); }
  catch { /* Storage can be disabled without making the controls inert. */ }
}

const AdventurePreferencesContext = createContext(null);

export function AdventurePreferencesProvider({ children }) {
  const [language, setLanguageState] = useState(() => readPreference(languageKey, ["zh", "en"], "zh"));
  const [theme, setThemeState] = useState(() => readPreference(themeKey, Object.keys(adventureThemes), "lake"));
  const [appearance, setAppearanceState] = useState(() => readPreference(appearanceKey, ["light", "dark", "system"], "system"));
  const [cameraFacing, setCameraFacingState] = useState(() => readPreference(cameraFacingKey, ["environment", "user"], "environment"));
  const [cameraAudio, setCameraAudioState] = useState(() => readPreference(cameraAudioKey, ["on", "off"], "on") === "on");
  const [orientation, setOrientationState] = useState(() => readPreference(orientationKey, orientationPreferences, "portrait"));
  const [orientationStatus, setOrientationStatus] = useState("idle");
  const [orientationRequest, setOrientationRequest] = useState(0);
  const orientationValueRef = useRef(orientation);
  const orientationRunRef = useRef(0);
  const orientationQueueRef = useRef(Promise.resolve());
  const [systemDark, setSystemDark] = useState(() => window.matchMedia("(prefers-color-scheme: dark)").matches);
  const resolvedAppearance = appearance === "system" ? (systemDark ? "dark" : "light") : appearance;

  const setLanguage = useCallback(value => setLanguageState(current => {
    const next = typeof value === "function" ? value(current) : value;
    return next === "en" ? "en" : "zh";
  }), []);
  const setTheme = useCallback(value => setThemeState(current => {
    const next = typeof value === "function" ? value(current) : value;
    return Object.hasOwn(adventureThemes, next) ? next : "lake";
  }), []);
  const setAppearance = useCallback(value => setAppearanceState(current => {
    const next = typeof value === "function" ? value(current) : value;
    return ["light", "dark", "system"].includes(next) ? next : "system";
  }), []);
  const setCameraFacing = useCallback(value => setCameraFacingState(value === "user" ? "user" : "environment"), []);
  const setCameraAudio = useCallback(value => setCameraAudioState(Boolean(value)), []);
  const setOrientation = useCallback(value => {
    const resolved = orientationPreferences.includes(value) ? value : "system";
    orientationValueRef.current = resolved;
    setOrientationState(resolved);
    setOrientationRequest(request => request + 1);
  }, []);

  useEffect(() => {
    savePreference(cameraFacingKey, cameraFacing);
    savePreference(cameraAudioKey, cameraAudio ? "on" : "off");
  }, [cameraFacing, cameraAudio]);

  useEffect(() => {
    orientationValueRef.current = orientation;
    savePreference(orientationKey, orientation);
    const apply = () => {
      const request = ++orientationRunRef.current;
      if (isAdventurePath()) setOrientationStatus("applying");
      orientationQueueRef.current = orientationQueueRef.current.catch(() => {}).then(async () => {
        if (request !== orientationRunRef.current) return;
        const onAdventure = isAdventurePath();
        const desired = onAdventure ? orientationValueRef.current : "system";
        const result = await applyOrientationPreference(desired);
        if (request !== orientationRunRef.current) return;
        if (!isAdventurePath()) {
          setOrientationStatus("idle");
          return;
        }
        setOrientationStatus(result.status);
      });
    };
    apply();
    const reapply = () => {
      if (document.visibilityState === "visible") apply();
    };
    const orientationApi = screen.orientation;
    document.addEventListener("visibilitychange", reapply);
    document.addEventListener("fullscreenchange", reapply);
    window.addEventListener("popstate", reapply);
    const verify = () => {
      if (!isAdventurePath() || orientationValueRef.current === "system") return;
      if (!orientationLockStillApplies(orientationValueRef.current)) setOrientationStatus("restricted");
    };
    orientationApi?.addEventListener?.("change", verify);
    return () => {
      orientationRunRef.current += 1;
      document.removeEventListener("visibilitychange", reapply);
      document.removeEventListener("fullscreenchange", reapply);
      window.removeEventListener("popstate", reapply);
      orientationApi?.removeEventListener?.("change", verify);
    };
  }, [orientation, orientationRequest]);

  useEffect(() => () => {
    orientationRunRef.current += 1;
    orientationQueueRef.current = orientationQueueRef.current.catch(() => {})
      .then(() => applyOrientationPreference("system"));
  }, []);

  useEffect(() => {
    savePreference(languageKey, language);
    savePreference(themeKey, theme);
    savePreference(appearanceKey, appearance);
    const apply = () => {
      if (!isAdventurePath()) return;
      document.documentElement.lang = language === "en" ? "en-NZ" : "zh-CN";
      document.documentElement.dataset.adventureTheme = theme;
      document.documentElement.dataset.adventureAppearance = resolvedAppearance;
      document.title = language === "en" ? "New Zealand Adventure Map" : "新西兰冒险地图";
      document.querySelector('meta[name="theme-color"]')?.setAttribute("content",
        resolvedAppearance === "dark" ? "#1b1b17" : adventureThemes[theme].color);
    };
    apply();
    // SiteRouter applies its page defaults on navigation. Reapply preferences afterward.
    const onNavigate = () => queueMicrotask(apply);
    window.addEventListener("popstate", onNavigate);
    return () => window.removeEventListener("popstate", onNavigate);
  }, [language, theme, appearance, resolvedAppearance]);

  useEffect(() => {
    const query = window.matchMedia("(prefers-color-scheme: dark)");
    const update = () => setSystemDark(query.matches);
    query.addEventListener?.("change", update);
    if (!query.addEventListener) query.addListener(update);
    return () => {
      query.removeEventListener?.("change", update);
      if (!query.removeEventListener) query.removeListener(update);
    };
  }, []);

  useEffect(() => {
    const sync = event => {
      if (event.key === languageKey) setLanguageState(readPreference(languageKey, ["zh", "en"], "zh"));
      if (event.key === themeKey) setThemeState(readPreference(themeKey, Object.keys(adventureThemes), "lake"));
      if (event.key === appearanceKey) setAppearanceState(readPreference(appearanceKey, ["light", "dark", "system"], "system"));
      if (event.key === cameraFacingKey) setCameraFacingState(readPreference(cameraFacingKey, ["environment", "user"], "environment"));
      if (event.key === cameraAudioKey) setCameraAudioState(readPreference(cameraAudioKey, ["on", "off"], "on") === "on");
      if (event.key === orientationKey) setOrientationState(readPreference(orientationKey, orientationPreferences, "portrait"));
    };
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, []);

  const value = useMemo(() => ({ language, setLanguage, theme, setTheme, appearance, setAppearance, resolvedAppearance,
    cameraFacing, setCameraFacing, cameraAudio, setCameraAudio, orientation, setOrientation, orientationStatus }),
    [language, setLanguage, theme, setTheme, appearance, setAppearance, resolvedAppearance,
      cameraFacing, setCameraFacing, cameraAudio, setCameraAudio, orientation, setOrientation, orientationStatus]);
  const languageValue = useMemo(() => ({ language, setLanguage }), [language, setLanguage]);

  return <AdventurePreferencesContext.Provider value={value}>
    <LanguageContext.Provider value={languageValue}>{children}</LanguageContext.Provider>
  </AdventurePreferencesContext.Provider>;
}

export function useAdventurePreferences() {
  const value = useContext(AdventurePreferencesContext);
  if (!value) throw new Error("useAdventurePreferences requires AdventurePreferencesProvider");
  return value;
}
