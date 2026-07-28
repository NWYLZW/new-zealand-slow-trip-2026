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

function useHashTab() {
  const initial = tabs.some((tab) => tab.value === location.hash.slice(1))
    ? location.hash.slice(1)
    : "overview";
  const [tab, setTab] = useState(initial);

  const changeTab = (value) => {
    setTab(value);
    history.pushState(null, "", `#${value}`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

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
