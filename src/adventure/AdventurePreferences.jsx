import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { LanguageContext } from "../LanguageContext";
import { isAdventurePath } from "../siteNavigation";
import "./AdventureMenu.css";
import "./AdventureAppearance.css";

const languageKey = "nz-trip-language";
const themeKey = "nz-trip-adventure-theme";
const appearanceKey = "nz-trip-adventure-appearance";
const cameraFacingKey = "nz-trip-camera-facing";
const cameraAudioKey = "nz-trip-camera-audio";

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

  useEffect(() => {
    savePreference(cameraFacingKey, cameraFacing);
    savePreference(cameraAudioKey, cameraAudio ? "on" : "off");
  }, [cameraFacing, cameraAudio]);

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
    };
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, []);

  const value = useMemo(() => ({ language, setLanguage, theme, setTheme, appearance, setAppearance, resolvedAppearance,
    cameraFacing, setCameraFacing, cameraAudio, setCameraAudio }),
    [language, setLanguage, theme, setTheme, appearance, setAppearance, resolvedAppearance,
      cameraFacing, setCameraFacing, cameraAudio, setCameraAudio]);
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
