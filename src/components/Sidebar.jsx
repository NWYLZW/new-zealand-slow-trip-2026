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

export function Sidebar({ tab, onTabChange, progress, language, onLanguageToggle }) {
  const isEnglish = language === "en";
  return (
    <Paper className="sidebar" elevation={0}>
      <Tabs
        orientation="vertical"
        value={tab}
        onChange={(_, value) => onTabChange(value)}
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
    </Paper>
  );
}
