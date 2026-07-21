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
import { assetPath } from "../assets";
import { tabs } from "../tripData";

export function Sidebar({ tab, onTabChange, progress }) {
  return (
    <Paper className="sidebar" elevation={0}>
      <Box className="brand-mark">NZ</Box>
      <Typography className="brand-date">9月28日—10月11日 · 2人</Typography>

      <Tabs
        orientation="vertical"
        value={tab}
        onChange={(_, value) => onTabChange(value)}
        className="side-tabs"
      >
        {tabs.map((item) => (
          <Tab key={item.value} value={item.value} label={item.label} />
        ))}
      </Tabs>

      <Box className="sidebar-bottom">
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography variant="caption">预订进度</Typography>
          <Typography variant="caption">{progress.done} / {progress.total}</Typography>
        </Stack>
        <LinearProgress variant="determinate" value={progress.percent} className="progress" />
        <Stack direction="row" spacing={1}>
          <Button fullWidth variant="outlined" startIcon={<PrintIcon />} onClick={() => window.print()}>
            打印
          </Button>
          <Button fullWidth variant="outlined" component="a" href={assetPath("")} download="2026-新西兰旅行攻略.html">
            保存
          </Button>
        </Stack>
      </Box>
    </Paper>
  );
}
