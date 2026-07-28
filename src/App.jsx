import { useEffect, useMemo, useState } from "react";
import { Box, Button, Container, Divider, Paper, Tab, Tabs, useMediaQuery } from "@mui/material";
import LanguageIcon from "@mui/icons-material/Language";
import { useTheme } from "@mui/material/styles";
import { Sidebar } from "./components/Sidebar";
import { BookingPanel } from "./components/panels/BookingPanel";
import { NorthPanel } from "./components/panels/NorthPanel";
import { NotesPanel } from "./components/panels/NotesPanel";
import { OverviewPanel } from "./components/panels/OverviewPanel";
import { SouthPanel } from "./components/panels/SouthPanel";
import { RentalCarPanel } from "./components/panels/RentalCarPanel";
import { tabLabel } from "./components/tabIcons";
import { bookingItems, tabs } from "./tripData";
import { LanguageContext } from "./LanguageContext";

const storageKey = "nz-trip-booking-react-v1";
const languageStorageKey = "nz-trip-language";
const popupSearchParams = ["compare", "hotel", "photo", "photoIndex", "event", "eventTab"];
const hotelPopupSearchParams = ["compare", "hotel", "photo", "photoIndex"];
const eventPopupSearchParams = ["event", "eventTab"];

function canonicalizePopupParams(tab) {
  const url = new URL(window.location.href);
  const originalUrl = url.toString();

  if (tab === "booking") {
    eventPopupSearchParams.forEach((param) => url.searchParams.delete(param));
    if (!url.searchParams.has("compare")) {
      ["hotel", "photo", "photoIndex"].forEach((param) => url.searchParams.delete(param));
    }
  } else if (["overview", "south", "north"].includes(tab)) {
    hotelPopupSearchParams.forEach((param) => url.searchParams.delete(param));
    if (!url.searchParams.has("event")) url.searchParams.delete("eventTab");
  } else {
    popupSearchParams.forEach((param) => url.searchParams.delete(param));
  }

  url.hash = tab;
  if (url.toString() !== originalUrl) history.replaceState(history.state, "", url);
}

function useHashTab() {
  const readTab = () => tabs.some((tab) => tab.value === location.hash.slice(1))
    ? location.hash.slice(1)
    : "overview";
  const initial = readTab();
  const [tab, setTab] = useState(initial);

  const changeTab = (value) => {
    const url = new URL(window.location.href);
    popupSearchParams.forEach((param) => url.searchParams.delete(param));
    url.hash = value;
    setTab(value);
    history.pushState(null, "", url);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  useEffect(() => {
    const syncTabFromUrl = () => {
      const nextTab = readTab();
      setTab(nextTab);
      canonicalizePopupParams(nextTab);
    };
    syncTabFromUrl();
    window.addEventListener("hashchange", syncTabFromUrl);
    window.addEventListener("popstate", syncTabFromUrl);
    return () => {
      window.removeEventListener("hashchange", syncTabFromUrl);
      window.removeEventListener("popstate", syncTabFromUrl);
    };
  }, []);

  return [tab, changeTab];
}

export default function App() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [tab, setTab] = useHashTab();
  const [language, setLanguage] = useState(() => localStorage.getItem(languageStorageKey) === "en" ? "en" : "zh");
  const [checked, setChecked] = useState(() => {
    try {
      return {
        ...JSON.parse(localStorage.getItem(storageKey) || "{}"),
        "south-car": true,
      };
    } catch {
      return { "south-car": true };
    }
  });
  const progress = useMemo(() => {
    const done = Object.values(checked).filter(Boolean).length;
    return {
      done,
      total: bookingItems.length,
      percent: Math.round((done / bookingItems.length) * 100),
    };
  }, [checked]);

  useEffect(() => {
    localStorage.setItem(languageStorageKey, language);
    document.documentElement.lang = language === "en" ? "en-NZ" : "zh-CN";
    document.title = language === "en" ? "2026 New Zealand relaxed travel itinerary" : "2026 新西兰松弛旅行攻略";
  }, [language]);

  const languageValue = useMemo(() => ({ language, setLanguage }), [language]);
  const toggleLanguage = () => setLanguage((current) => current === "zh" ? "en" : "zh");

  return (
    <LanguageContext.Provider value={languageValue}>
      <Box className="page-shell" data-language={language} data-tab={tab}>
        <Container maxWidth={false} className="layout">
          {!isMobile && <Sidebar tab={tab} onTabChange={setTab} progress={progress} language={language} onLanguageToggle={toggleLanguage} />}
          <Box component="main" className="content">
            {tab === "overview" && <OverviewPanel />}
            {tab === "south" && <SouthPanel />}
            {tab === "north" && <NorthPanel />}
            {tab === "car" && <RentalCarPanel />}
            {tab === "booking" && (
              <BookingPanel checked={checked} setChecked={setChecked} storageKey={storageKey} />
            )}
            {tab === "notes" && <NotesPanel />}
          </Box>
        </Container>

        {isMobile && (
          <>
            <Divider />
            <Button className="mobile-language-switch" onClick={toggleLanguage} startIcon={<LanguageIcon />} variant="contained">
              {language === "zh" ? "English" : "中文"}
            </Button>
            <Paper className="mobile-nav" elevation={8}>
              <Tabs value={tab} onChange={(_, value) => setTab(value)} variant="scrollable" scrollButtons={false}>
                {tabs.map((item) => <Tab key={item.value} value={item.value} label={tabLabel(item, "short", language)} />)}
              </Tabs>
            </Paper>
          </>
        )}
      </Box>
    </LanguageContext.Provider>
  );
}
