import { Button, Card, CardContent, Chip, Grid2 as Grid, Stack, Typography } from "@mui/material";
import { Gallery } from "../Gallery";
import { Hero } from "../Hero";
import { RouteMap } from "../RouteMap";
import { StatGrid } from "../StatGrid";

export function OverviewPanel({ onJumpNorth }) {
  return (
    <Stack spacing={3}>
      <Hero />
      <StatGrid />
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, lg: 8 }}>
          <RouteMap />
        </Grid>
        <Grid size={{ xs: 12, lg: 4 }}>
          <Card className="shopping-callout">
            <CardContent>
              <Chip label="本次更新" color="warning" />
              <Typography variant="h3" className="callout-title">奥克兰不再只是转机</Typography>
              <Typography className="callout-copy">
                10月8日不取车、不赶路，安排完整购物日；继续住机场酒店，避免多搬一次行李。
              </Typography>
              <Button variant="contained" color="warning" onClick={onJumpNorth} className="callout-button">
                查看购物安排
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      <Gallery />
    </Stack>
  );
}
