import { useCallback, useEffect, useMemo, useState } from "react";
import { Box, Drawer, useMediaQuery } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { PageHeader } from "./components/PageHeader";
import { Sidebar } from "./components/Sidebar";
import { ActivitiesPanel } from "./components/panels/ActivitiesPanel";
import { BookingPanel } from "./components/panels/BookingPanel";
import { NorthPanel } from "./components/panels/NorthPanel";
import { NotesPanel } from "./components/panels/NotesPanel";
import { OverviewPanel } from "./components/panels/OverviewPanel";
import { SouthPanel } from "./components/panels/SouthPanel";
import { RentalCarPanel } from "./components/panels/RentalCarPanel";
import { tabText } from "./components/tabIcons";
import { activityBookingPlans, bookingItems, tabs } from "./tripData";
import { LanguageContext } from "./LanguageContext";
import { PrivateVaultProvider } from "./PrivateVaultContext";

const storageKey = "nz-trip-booking-react-v1";
const languageStorageKey = "nz-trip-language";
const popupSearchParams = ["compare", "hotel", "photo", "photoIndex", "stay", "event", "eventTab", "activity"];
const hotelPopupSearchParams = ["compare", "hotel", "photo", "photoIndex", "stay"];
const eventPopupSearchParams = ["event", "eventTab"];
const bookingItemIds = bookingItems.map(([id]) => id);
const comparisonLabels = {
  "auckland-city": ["奥克兰市中心", "Central Auckland"],
  queenstown: ["皇后镇", "Queenstown"],
  wanaka: ["瓦纳卡", "Wānaka"],
  "mount-cook": ["库克山及周边", "Aoraki / Mount Cook"],
  oamaru: ["奥马鲁", "Ōamaru"],
  christchurch: ["基督城", "Christchurch"],
};

function canonicalizePopupParams(tab) {
  const url = new URL(window.location.href);
  const originalUrl = url.toString();
  if (tab === "booking") {
    eventPopupSearchParams.forEach((param) => url.searchParams.delete(param));
    url.searchParams.delete("activity");
    if (!url.searchParams.has("compare") && !url.searchParams.has("stay")) ["hotel", "photo", "photoIndex"].forEach((param) => url.searchParams.delete(param));
  } else if (tab === "activities") {
    hotelPopupSearchParams.forEach((param) => url.searchParams.delete(param));
    eventPopupSearchParams.forEach((param) => url.searchParams.delete(param));
  } else if (["overview", "south", "north"].includes(tab)) {
    hotelPopupSearchParams.forEach((param) => url.searchParams.delete(param));
    url.searchParams.delete("activity");
    if (!url.searchParams.has("event")) url.searchParams.delete("eventTab");
  } else {
    popupSearchParams.forEach((param) => url.searchParams.delete(param));
  }
  url.hash = tab;
  if (url.toString() !== originalUrl) history.replaceState(history.state, "", url);
}

function useHashTab() {
  const readTab = () => tabs.some((item) => item.value === location.hash.slice(1)) ? location.hash.slice(1) : "overview";
  const [tab, setTab] = useState(readTab);
  const changeTab = (value) => {
    const url = new URL(window.location.href);
    popupSearchParams.forEach((param) => url.searchParams.delete(param));
    url.hash = value;
    setTab(value);
    history.pushState(null, "", url);
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

function eventLabelFromUrl(language) {
  const eventId = new URL(window.location.href).searchParams.get("event");
  if (!eventId) return null;
  const label = eventId.split("|").slice(1).join("|");
  return label || (language === "en" ? "Trip detail" : "行程详情");
}

function activityLabelFromUrl(language) {
  const activityId = new URL(window.location.href).searchParams.get("activity");
  if (!activityId) return null;
  const activity = activityBookingPlans.find(({ id }) => id === activityId);
  const item = bookingItems.find(([id]) => id === activityId);
  if (!item) return null;
  return language === "en" ? (activity?.titleEn ?? "Activity details") : item[1].replace(/ · .+$/, "");
}

function clearDetailUrl(tab) {
  const url = new URL(window.location.href);
  if (tab === "booking") ["compare", "hotel", "photo", "photoIndex", "stay"].forEach((param) => url.searchParams.delete(param));
  if (tab === "activities") url.searchParams.delete("activity");
  if (["overview", "south", "north"].includes(tab)) ["event", "eventTab"].forEach((param) => url.searchParams.delete(param));
  history.replaceState(history.state, "", url);
  window.dispatchEvent(new PopStateEvent("popstate", { state: history.state }));
}

export default function App() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [tab, setTab] = useHashTab();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [detail, setDetail] = useState(null);
  const [language, setLanguage] = useState(() => localStorage.getItem(languageStorageKey) === "en" ? "en" : "zh");
  const [checked, setChecked] = useState(() => {
    try {
      return { ...JSON.parse(localStorage.getItem(storageKey) || "{}"), "south-car": true };
    } catch {
      return { "south-car": true };
    }
  });
  const activeTab = tabs.find((item) => item.value === tab) ?? tabs[0];
  const parentTitle = tabText(activeTab, "label", language);
  const progress = useMemo(() => {
    const fixedConfirmedIds = new Set(["mount-cook"]);
    const done = bookingItemIds.filter((id) => fixedConfirmedIds.has(id) || Boolean(checked[id])).length;
    return { done, total: bookingItemIds.length, percent: Math.round((done / bookingItemIds.length) * 100) };
  }, [checked]);
  const updateDetail = useCallback((nextDetail) => setDetail(nextDetail), []);

  useEffect(() => localStorage.setItem(storageKey, JSON.stringify(checked)), [checked]);
  useEffect(() => {
    localStorage.setItem(languageStorageKey, language);
    document.documentElement.lang = language === "en" ? "en-NZ" : "zh-CN";
    document.title = language === "en" ? "2026 New Zealand relaxed travel itinerary" : "2026 新西兰松弛旅行攻略";
  }, [language]);
  useEffect(() => {
    setMobileNavOpen(false);
  }, [tab]);
  useEffect(() => {
    if (!isMobile) setMobileNavOpen(false);
  }, [isMobile]);

  const languageValue = useMemo(() => ({ language, setLanguage }), [language]);
  const toggleLanguage = () => setLanguage((current) => current === "zh" ? "en" : "zh");
  const closeDetail = () => detail?.onBack?.();
  const derivedDetailLabel = tab === "booking"
    ? comparisonLabels[new URL(window.location.href).searchParams.get("compare")]?.[language === "en" ? 1 : 0]
    : tab === "activities"
      ? activityLabelFromUrl(language)
      : ["overview", "south", "north"].includes(tab) ? eventLabelFromUrl(language) : null;
  const headerDetail = detail?.label
    ? detail
    : (derivedDetailLabel ? { label: derivedDetailLabel, onBack: () => clearDetailUrl(tab) } : null);
  const headerBreadcrumbs = headerDetail ? [
    {
      label: parentTitle,
      onClick: headerDetail.onRoot ?? headerDetail.onBack ?? closeDetail,
    },
    ...(headerDetail.ancestors ?? []),
    {
      current: true,
      label: headerDetail.label,
      onClick: () => {},
    },
  ] : undefined;
  const sidebar = (
    <Sidebar
      language={language}
      onLanguageToggle={toggleLanguage}
      onNavigate={() => setMobileNavOpen(false)}
      onTabChange={setTab}
      progress={progress}
      tab={tab}
    />
  );

  return (
    <LanguageContext.Provider value={languageValue}>
      <PrivateVaultProvider>
        <Box className="page-shell" data-detail={Boolean(headerDetail) || undefined} data-language={language} data-tab={tab}>
          <Box className="layout">
            {!isMobile && sidebar}
            <Box component="main" className="content">
              <PageHeader
                breadcrumbs={headerBreadcrumbs}
                icon={activeTab.icon}
                isEnglish={language === "en"}
                menuOpen={mobileNavOpen}
                onBack={headerDetail ? (headerDetail.onBack ?? closeDetail) : undefined}
                onMenu={isMobile ? () => setMobileNavOpen(true) : undefined}
                parentTitle={headerDetail ? parentTitle : undefined}
                title={headerDetail?.label ?? parentTitle}
              />
              <Box className="page-body">
                {tab === "overview" && <OverviewPanel onDetailChange={updateDetail} />}
                {tab === "south" && <SouthPanel onDetailChange={updateDetail} />}
                {tab === "north" && <NorthPanel onDetailChange={updateDetail} />}
                {tab === "car" && <RentalCarPanel />}
                {tab === "booking" && <BookingPanel checked={checked} onDetailChange={updateDetail} />}
                {tab === "activities" && <ActivitiesPanel checked={checked} onDetailChange={updateDetail} setChecked={setChecked} />}
                {tab === "notes" && <NotesPanel />}
              </Box>
            </Box>
          </Box>
          <Drawer
            anchor="left"
            id="mobile-navigation-drawer"
            ModalProps={{ keepMounted: true }}
            onClose={() => setMobileNavOpen(false)}
            open={mobileNavOpen}
          >
            {(isMobile || mobileNavOpen) && sidebar}
          </Drawer>
        </Box>
      </PrivateVaultProvider>
    </LanguageContext.Provider>
  );
}
