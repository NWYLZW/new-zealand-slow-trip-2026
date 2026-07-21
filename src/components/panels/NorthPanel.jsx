import { Card, CardContent, Chip, Grid2 as Grid, List, ListItem, ListItemText, Stack, Typography } from "@mui/material";
import { DayCalendar } from "../DayCalendar";
import { PanelHero } from "../PanelHero";
import { SectionTitle } from "../SectionTitle";
import { assetPath } from "../../assets";
import { northDays, shoppingStops } from "../../tripData";

export function NorthPanel() {
  return (
    <Stack spacing={3}>
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 7 }}>
          <PanelHero
            image={assetPath("images/auckland.webp")}
            kicker="10月8日 · AUCKLAND"
            title="一整天留给购物"
            desc="不取车、不换酒店，从机场酒店轻装进入市区；晚上再返回同一家酒店。"
          />
        </Grid>
        <Grid size={{ xs: 12, md: 5 }}>
          <Card className="shopping-plan-card">
            <CardContent>
              <Typography variant="h3">购物日时间表</Typography>
              <List>
                {shoppingStops.map(([time, title, desc]) => (
                  <ListItem key={time + title} disableGutters className="shopping-stop">
                    <Chip label={time} color="secondary" size="small" />
                    <ListItemText primary={title} secondary={desc} />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      <SectionTitle title="北岛每日安排" desc="购物日加入后，罗托鲁瓦缩短为1晚，保留霍比屯与 Te Puia 两个核心体验。" />
      <DayCalendar days={northDays} />
    </Stack>
  );
}
