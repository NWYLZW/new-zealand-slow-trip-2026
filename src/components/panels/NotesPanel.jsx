import { Card, CardContent, Grid2 as Grid, List, ListItem, ListItemText, Stack, Typography } from "@mui/material";
import { PanelHero } from "../PanelHero";
import { assetPath } from "../../assets";
import { notes } from "../../tripData";
import { useLanguage } from "../../LanguageContext";

const notesEn = [
  {
    title: "Roads and weather",
    items: [
      "Check NZTA road conditions every morning.",
      "Use the Cromwell route if Crown Range is snowy or closed.",
      "Helicopter flights and stargazing are weather-dependent; prioritise rescheduling or refunds.",
      "Avoid night driving on the South Island and keep snow chains in the car.",
    ],
  },
  {
    title: "Flights and baggage",
    items: [
      "Jetstar Starter fares usually include a combined 7 kg of carry-on baggage.",
      "Confirm checked baggage before paying for both domestic flights.",
      "Pack shopping into checked baggage on 10 October.",
    ],
  },
  {
    title: "Rental car reminders",
    items: [
      "Use 15:30 for South Island pickup and return to stay within eight 24-hour periods.",
      "Return the car during business hours on 7 October.",
      "Do not drive Skippers Road; check the rental terms before using gravel roads.",
    ],
  },
];

export function NotesPanel() {
  const { language } = useLanguage();
  const isEnglish = language === "en";
  const visibleNotes = isEnglish ? notesEn : notes;
  return (
    <Stack spacing={3}>
      <PanelHero
        image={assetPath("images/aoraki.webp")}
        kicker="BEFORE YOU GO"
        title={isEnglish ? "Final checks before departure" : "出发前再确认"}
        desc={isEnglish ? "Spring weather changes quickly on the South Island. Recheck roads, flights and baggage shortly before departure." : "春季南岛天气变化快；把路况和行李规则留到出发前最后复核。"}
      />
      <Grid container spacing={2}>
        {visibleNotes.map((note) => (
          <Grid size={{ xs: 12, md: 4 }} key={note.title}>
            <Card>
              <CardContent>
                <Typography variant="h3">{note.title}</Typography>
                <List dense>
                  {note.items.map((item) => (
                    <ListItem key={item} disableGutters>
                      <ListItemText primary={item} />
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Grid>
        ))}
        <Grid size={{ xs: 12 }}>
          <Card>
            <CardContent>
              <Typography variant="h3">{isEnglish ? "Image credits" : "图片来源与许可"}</Typography>
              <Typography color="text.secondary" className="credits-copy">
                {isEnglish ? "Photographs of Queenstown, Milford Sound, Aoraki / Mount Cook, Hobbiton, Rotorua and Auckland are sourced from Wikimedia Commons." : "皇后镇、米尔福德、库克山、霍比屯、罗托鲁瓦和奥克兰照片来自 Wikimedia Commons；照片仅做尺寸与 WebP 格式调整。路线封面为本攻略专门生成的渲染图。"}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Stack>
  );
}
