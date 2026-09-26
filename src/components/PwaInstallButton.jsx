import { useState, useSyncExternalStore } from "react";
import { getInstallState, subscribeInstallState, requestInstallation } from "../pwa/installState";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
  Typography,
} from "@mui/material";
import AddToHomeScreenIcon from "@mui/icons-material/AddToHomeScreen";
import CloseIcon from "@mui/icons-material/Close";
import InstallMobileIcon from "@mui/icons-material/InstallMobile";
import IosShareIcon from "@mui/icons-material/IosShare";

function isAppleMobileDevice() {
  const platform = navigator.platform ?? "";
  return /iPhone|iPad|iPod/i.test(navigator.userAgent) || (platform === "MacIntel" && navigator.maxTouchPoints > 1);
}

export function PwaInstallButton({ language = "zh" }) {
  const isEnglish = language === "en";
  const { prompt: installPrompt, installed } = useSyncExternalStore(subscribeInstallState, getInstallState);
  const [instructionsOpen, setInstructionsOpen] = useState(false);
  const appleMobile = isAppleMobileDevice();

  const requestInstall = async () => {
    if (!installPrompt) {
      setInstructionsOpen(true);
      return;
    }
    try {
      await requestInstallation();
    } catch {
      setInstructionsOpen(true);
    }
  };

  if (installed) return null;

  return (
    <>
      <Button
        className="pwa-install-button"
        fullWidth
        onClick={requestInstall}
        startIcon={<InstallMobileIcon />}
        variant="outlined"
      >
        {isEnglish ? "Install app" : "安装到设备"}
      </Button>
      <Dialog
        aria-labelledby="pwa-install-title"
        fullWidth
        maxWidth="xs"
        onClose={() => setInstructionsOpen(false)}
        open={instructionsOpen}
      >
        <DialogTitle id="pwa-install-title">
          {isEnglish ? "Install this trip" : "安装新西兰行程"}
          <IconButton
            aria-label={isEnglish ? "Close install instructions" : "关闭安装说明"}
            onClick={() => setInstructionsOpen(false)}
            sx={{ position: "absolute", right: 10, top: 10 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Stack alignItems="flex-start" direction="row" spacing={1.5}>
            {appleMobile ? <IosShareIcon color="primary" /> : <AddToHomeScreenIcon color="primary" />}
            <Typography>
              {appleMobile
                ? (isEnglish
                    ? "In Safari, tap Share, then choose Add to Home Screen."
                    : "请在 Safari 中点按“分享”，再选择“添加到主屏幕”。")
                : (isEnglish
                    ? "Open the browser menu and choose Install app or Add to Home screen."
                    : "请打开浏览器菜单，选择“安装应用”或“添加到主屏幕”。")}
            </Typography>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setInstructionsOpen(false)} variant="contained">
            {isEnglish ? "Got it" : "知道了"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
