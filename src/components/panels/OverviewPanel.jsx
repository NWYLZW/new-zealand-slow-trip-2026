import { Button, Card, CardContent, Chip, Grid2 as Grid, Stack, Typography } from "@mui/material";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import ShoppingBagIcon from "@mui/icons-material/ShoppingBag";
import { Gallery } from "../Gallery";
import { RouteMap } from "../RouteMap";
import { experienceHighlights } from "../../tripData";
import { useLanguage } from "../../LanguageContext";

export function OverviewPanel({ onJumpNorth }) {
  const { language } = useLanguage();
  const isEnglish = language === "en";
  return (
    <Stack spacing={3}>
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, lg: 8 }}>
          <RouteMap />
        </Grid>
        <Grid size={{ xs: 12, lg: 4 }}>
          <Card className="shopping-callout">
            <CardContent>
              <Chip icon={<ShoppingBagIcon />} label={isEnglish ? "Trip update" : "本次更新"} color="warning" />
              <Typography variant="h3" className="callout-title">{isEnglish ? "A full day in Auckland" : "奥克兰不再只是转机"}</Typography>
              <Typography className="callout-copy">
                {isEnglish ? "8 October is a relaxed shopping day with no rental car or hotel change." : "10月8日不取车、不赶路，安排完整购物日；继续住机场酒店，避免多搬一次行李。"}
              </Typography>
              <Button endIcon={<ArrowForwardIcon />} variant="contained" color="warning" onClick={onJumpNorth} className="callout-button">
                {isEnglish ? "View Auckland plans" : "查看购物安排"}
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
                  <Chip size="small" icon={<AutoAwesomeIcon />} label={isEnglish ? ({ 主方案: "Main plan", 备选: "Optional", 重点: "Highlight" }[item.tag] ?? item.tag) : item.tag} className="experience-chip" />
                  <Typography variant="caption" color="text.secondary">{isEnglish ? item.date.replace("10月", "Oct ").replace("日", "") : item.date}</Typography>
                </Stack>
                <Typography variant="h3" className="experience-title">{isEnglish ? ({
                  "Walter Peak 湖上巡游＋高地农场烧烤": "Walter Peak lake cruise and high-country barbecue",
                  "米尔福德峡湾保留为高强度备选": "Milford Sound remains an optional long day",
                  "库克山直升机冰川降落＋Big Sky 观星": "Glacier helicopter landing and Big Sky Stargazing",
                }[item.title] ?? item.title) : item.title}</Typography>
                <Typography color="text.secondary" className="experience-desc">{isEnglish ? ({
                  "Walter Peak 湖上巡游＋高地农场烧烤": "A relaxed, no-driving cruise, barbecue and farm show lasting about 3.5–4 hours.",
                  "米尔福德峡湾保留为高强度备选": "Keep the 12–13 hour coach-and-cruise day as an optional alternative.",
                  "库克山直升机冰川降落＋Big Sky 观星": "Glacier Highlights around 15:30, followed by Big Sky Stargazing at night; choose flexible cancellation terms.",
                }[item.title] ?? item.desc) : item.desc}</Typography>
                <Button endIcon={<OpenInNewIcon />} component="a" href={item.link} target="_blank" rel="noreferrer" size="small" className="experience-link">
                  {isEnglish ? "View details" : "查看详情"}
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
