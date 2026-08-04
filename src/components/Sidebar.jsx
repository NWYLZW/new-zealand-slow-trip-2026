import { useEffect, useRef, useState } from "react";
import {
  Box,
  Button,
  LinearProgress,
  Paper,
  Stack,
  Tab,
  Tabs,
  Typography,
} from "@mui/material";
import PrintIcon from "@mui/icons-material/Print";
import SaveAltIcon from "@mui/icons-material/SaveAlt";
import LanguageIcon from "@mui/icons-material/Language";
import { assetPath } from "../assets";
import { tabs } from "../tripData";
import { tabLabel } from "./tabIcons";
import { PrivateVaultDialog } from "./PrivateVaultAccess";

function unlockRequestedByUrl() {
  return new URL(window.location.href).searchParams.get("unlock") === "1";
}

function clearUnlockUrl() {
  const url = new URL(window.location.href);
  url.searchParams.delete("unlock");
  history.replaceState(history.state, "", url);
}

export function Sidebar({ className = "", onNavigate, tab, onTabChange, progress, language, onLanguageToggle }) {
  const isEnglish = language === "en";
  const unlockTimer = useRef(null);
  const unlockTriggered = useRef(false);
  const [privateDialogOpen, setPrivateDialogOpen] = useState(unlockRequestedByUrl);

  const cancelUnlockHold = () => {
    if (unlockTimer.current === null) return;
    window.clearTimeout(unlockTimer.current);
    unlockTimer.current = null;
  };

  const startUnlockHold = (event) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    cancelUnlockHold();
    unlockTriggered.current = false;
    try {
      event.currentTarget.setPointerCapture?.(event.pointerId);
    } catch {
      // Pointer capture is only an interaction aid; the hold still works without it.
    }
    unlockTimer.current = window.setTimeout(() => {
      unlockTimer.current = null;
      unlockTriggered.current = true;
      setPrivateDialogOpen(true);
      navigator.vibrate?.(20);
    }, 10_000);
  };

  const finishUnlockHold = (event) => {
    cancelUnlockHold();
    try {
      if (event.currentTarget.hasPointerCapture?.(event.pointerId)) {
        event.currentTarget.releasePointerCapture?.(event.pointerId);
      }
    } catch {
      // The pointer may already have been released by the browser.
    }
  };

  const suppressClickAfterUnlock = (event) => {
    if (!unlockTriggered.current || !event.currentTarget.contains(event.target)) return;
    event.preventDefault();
    event.stopPropagation();
    unlockTriggered.current = false;
  };

  useEffect(() => () => cancelUnlockHold(), []);

  useEffect(() => {
    const openFromUrl = () => {
      if (unlockRequestedByUrl()) setPrivateDialogOpen(true);
    };
    const openFromShortcut = (event) => {
      if ((event.metaKey || event.ctrlKey) && event.shiftKey && event.key.toLowerCase() === "l") {
        event.preventDefault();
        setPrivateDialogOpen(true);
      }
    };
    window.addEventListener("popstate", openFromUrl);
    window.addEventListener("keydown", openFromShortcut);
    return () => {
      window.removeEventListener("popstate", openFromUrl);
      window.removeEventListener("keydown", openFromShortcut);
    };
  }, []);

  const closePrivateDialog = () => {
    if (unlockRequestedByUrl()) clearUnlockUrl();
    setPrivateDialogOpen(false);
  };

  return (
    <Paper
      aria-label={isEnglish ? "Main navigation" : "主导航"}
      className={`sidebar ${className}`.trim()}
      component="nav"
      elevation={0}
      onClickCapture={suppressClickAfterUnlock}
      onPointerCancel={finishUnlockHold}
      onPointerDown={startUnlockHold}
      onPointerUp={finishUnlockHold}
    >
      <Tabs
        orientation="vertical"
        value={tab}
        onChange={(_, value) => {
          onTabChange(value);
          onNavigate?.();
        }}
        className="side-tabs"
      >
        {tabs.map((item) => (
          <Tab key={item.value} value={item.value} label={tabLabel(item, "label", language)} />
        ))}
      </Tabs>

      <Box className="sidebar-bottom">
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography variant="caption">{isEnglish ? "Booking progress" : "预订进度"}</Typography>
          <Typography variant="caption">{progress.done} / {progress.total}</Typography>
        </Stack>
        <LinearProgress variant="determinate" value={progress.percent} className="progress" />
        <Stack direction="row" spacing={1}>
          <Button fullWidth variant="outlined" startIcon={<PrintIcon />} onClick={() => window.print()}>
            {isEnglish ? "Print" : "打印"}
          </Button>
          <Button fullWidth variant="outlined" startIcon={<SaveAltIcon />} component="a" href={assetPath("")} download="2026-新西兰旅行攻略.html">
            {isEnglish ? "Save" : "保存"}
          </Button>
        </Stack>
        <Button className="language-switch" fullWidth variant="outlined" startIcon={<LanguageIcon />} onClick={onLanguageToggle}>
          {isEnglish ? "中文" : "English"}
        </Button>
      </Box>
      <PrivateVaultDialog onClose={closePrivateDialog} open={privateDialogOpen} />
    </Paper>
  );
}
