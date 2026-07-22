import { Box, Button, Card, CardContent, Checkbox, Chip, Grid2 as Grid, LinearProgress, Stack, Typography } from "@mui/material";
import { PanelHero } from "../PanelHero";
import { assetPath } from "../../assets";
import { bookingItems, hotelPlans } from "../../tripData";

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
        title="酒店与关键预订"
        desc="先把12晚住宿落定，再依次锁定国内航班、租车和热门项目。"
      />
      <Box>
        <Typography variant="h2" className="subsection-title">住宿安排</Typography>
        <Typography color="text.secondary" className="subsection-copy">
          综合动线、停车、住宿条件与住客评分筛选；评分为 Booking.com 于2026年7月核对的快照，预订前请再次确认。
        </Typography>
        <Grid container spacing={1.5} className="hotel-grid">
          {hotelPlans.map((hotel) => (
            <Grid size={{ xs: 12, md: 6 }} key={hotel.place}>
              <Card className="hotel-card">
                <CardContent>
                  <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1.5}>
                    <Box>
                      <Typography variant="h3">{hotel.place}</Typography>
                      <Typography variant="caption" color="text.secondary">{hotel.date}</Typography>
                    </Box>
                    <Chip label={hotel.nights} size="small" />
                  </Stack>
                  <Typography className="hotel-label">{hotel.label}</Typography>
                  <Typography className="hotel-name">{hotel.name}</Typography>
                  <Box className="hotel-rating">
                    <strong>{hotel.rating}</strong>
                    <span>{hotel.ratingDetail}</span>
                  </Box>
                  <Typography color="text.secondary" className="hotel-reason">{hotel.reason}</Typography>
                  <Stack direction="row" className="hotel-facts">
                    {hotel.facts.map((fact) => <Chip key={fact} label={fact} size="small" />)}
                  </Stack>
                  <Typography className="hotel-backup"><strong>备选：</strong>{hotel.backup}</Typography>
                  <Stack direction="row" className="hotel-links">
                    {hotel.links.map(([label, href]) => (
                      <Button key={label} component="a" href={href} target="_blank" rel="noreferrer" size="small">
                        {label}
                      </Button>
                    ))}
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
        <Typography className="hotel-booking-note">
          <strong>预订顺序：</strong>先订库克山，其次是皇后镇与奥克兰机场；其他城市优先选择“可免费取消”的房价，待路线完全确认后再换成更优惠的不可退价格。
        </Typography>
      </Box>
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
                先锁定库克山住宿、直升机与观星，再订皇后镇、奥克兰机场和两段国内航班；天气型项目优先选可改期或可退款条款。
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Stack>
  );
}
