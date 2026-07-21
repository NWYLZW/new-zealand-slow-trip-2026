import { Box, Card, CardContent, Checkbox, Grid2 as Grid, LinearProgress, Stack, Typography } from "@mui/material";
import { PanelHero } from "../PanelHero";
import { assetPath } from "../../assets";
import { bookingItems } from "../../tripData";

export function BookingPanel({ checked, setChecked, storageKey }) {
  const done = Object.values(checked).filter(Boolean).length;
  const percent = Math.round((done / bookingItems.length) * 100);
  const toggle = (id) => {
    setChecked((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      localStorage.setItem(storageKey, JSON.stringify(next));
      return next;
    });
  };

  return (
    <Stack spacing={3}>
      <PanelHero
        image={assetPath("images/hero-route-render.webp")}
        kicker="BOOKING CHECKLIST"
        title="先锁定关键节点"
        desc="勾选状态只保存在当前设备，不会上传任何个人信息。"
      />
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 8 }}>
          <Grid container spacing={1.5}>
            {bookingItems.map(([id, title, desc]) => (
              <Grid size={{ xs: 12, sm: 6 }} key={id}>
                <Card className={checked[id] ? "booking-card checked" : "booking-card"} onClick={() => toggle(id)}>
                  <CardContent>
                    <Stack direction="row" spacing={1.5}>
                      <Checkbox checked={Boolean(checked[id])} tabIndex={-1} />
                      <Box>
                        <Typography fontWeight={900}>{title}</Typography>
                        <Typography color="text.secondary" variant="body2">{desc}</Typography>
                      </Box>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <Card className="progress-card">
            <CardContent>
              <Typography>当前完成</Typography>
              <Typography className="big-progress">{percent}%</Typography>
              <LinearProgress variant="determinate" value={percent} />
              <Typography color="text.secondary" className="progress-note">
                先订库克山、两段国内航班和米尔福德；其他项目随后补齐。
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Stack>
  );
}
