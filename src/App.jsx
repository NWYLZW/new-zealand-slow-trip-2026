import { useMemo, useState } from "react";
import { Box, Chip, Container, Divider, Paper, Stack, Tab, Tabs, useMediaQuery } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { Sidebar } from "./components/Sidebar";
import { BookingPanel } from "./components/panels/BookingPanel";
import { NorthPanel } from "./components/panels/NorthPanel";
import { NotesPanel } from "./components/panels/NotesPanel";
import { OverviewPanel } from "./components/panels/OverviewPanel";
import { SouthPanel } from "./components/panels/SouthPanel";
import { bookingItems, tabs } from "./tripData";

const storageKey = "nz-trip-booking-react-v1";

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
  const [checked, setChecked] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(storageKey) || "{}");
    } catch {
      return {};
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

  return (
    <Box className="page-shell">
      <Container maxWidth={false} className="layout">
        {!isMobile && <Sidebar tab={tab} onTabChange={setTab} progress={progress} />}
        <Box component="main" className="content">
          <Stack direction="row" justifyContent="flex-end" alignItems="center" className="topbar">
            <Stack direction="row" spacing={1}>
              {["13天", "南北岛", "自驾 + 飞机"].map((item) => <Chip key={item} label={item} />)}
            </Stack>
          </Stack>

          {tab === "overview" && <OverviewPanel onJumpNorth={() => setTab("north")} />}
          {tab === "south" && <SouthPanel />}
          {tab === "north" && <NorthPanel />}
          {tab === "booking" && (
            <BookingPanel checked={checked} setChecked={setChecked} storageKey={storageKey} />
          )}
          {tab === "notes" && <NotesPanel />}
        </Box>
      </Container>

      {isMobile && (
        <>
          <Divider />
          <Paper className="mobile-nav" elevation={8}>
            <Tabs value={tab} onChange={(_, value) => setTab(value)} variant="fullWidth">
              {tabs.map((item) => <Tab key={item.value} value={item.value} label={item.short} />)}
            </Tabs>
          </Paper>
        </>
      )}
    </Box>
  );
}
