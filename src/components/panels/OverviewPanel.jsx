import { Button, Card, CardContent, Chip, Grid2 as Grid, Stack, Typography } from "@mui/material";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import ShoppingBagIcon from "@mui/icons-material/ShoppingBag";
import { Gallery } from "../Gallery";
import { RouteMap } from "../RouteMap";
import { experienceHighlights } from "../../tripData";

export function OverviewPanel({ onJumpNorth }) {
  return (
    <Stack spacing={3}>
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, lg: 8 }}>
          <RouteMap />
        </Grid>
        <Grid size={{ xs: 12, lg: 4 }}>
          <Card className="shopping-callout">
            <CardContent>
              <Chip icon={<ShoppingBagIcon />} label="本次更新" color="warning" />
              <Typography variant="h3" className="callout-title">奥克兰不再只是转机</Typography>
              <Typography className="callout-copy">
                10月8日不取车、不赶路，安排完整购物日；继续住机场酒店，避免多搬一次行李。
              </Typography>
              <Button endIcon={<ArrowForwardIcon />} variant="contained" color="warning" onClick={onJumpNorth} className="callout-button">
                查看购物安排
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      <Grid container spacing={1.5}>
        {experienceHighlights.map((item) => (
          <Grid size={{ xs: 12, md: 4 }} key={item.title}>
            <Card className="experience-card" style={{ "--experience-color": item.color }}>
              <CardContent>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Chip size="small" icon={<AutoAwesomeIcon />} label={item.tag} className="experience-chip" />
                  <Typography variant="caption" color="text.secondary">{item.date}</Typography>
                </Stack>
                <Typography variant="h3" className="experience-title">{item.title}</Typography>
                <Typography color="text.secondary" className="experience-desc">{item.desc}</Typography>
                <Button endIcon={<OpenInNewIcon />} component="a" href={item.link} target="_blank" rel="noreferrer" size="small" className="experience-link">
                  查看详情
                </Button>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
      <Gallery />
    </Stack>
  );
}
