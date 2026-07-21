import { Card, CardContent, Grid2 as Grid, List, ListItem, ListItemText, Stack, Typography } from "@mui/material";
import { PanelHero } from "../PanelHero";
import { assetPath } from "../../assets";
import { notes } from "../../tripData";

export function NotesPanel() {
  return (
    <Stack spacing={3}>
      <PanelHero
        image={assetPath("images/aoraki.webp")}
        kicker="BEFORE YOU GO"
        title="出发前再确认"
        desc="春季南岛天气变化快；把路况和行李规则留到出发前最后复核。"
      />
      <Grid container spacing={2}>
        {notes.map((note) => (
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
              <Typography variant="h3">图片来源与许可</Typography>
              <Typography color="text.secondary" className="credits-copy">
                皇后镇、米尔福德、库克山、霍比屯、罗托鲁瓦和奥克兰照片来自 Wikimedia Commons；照片仅做尺寸与 WebP 格式调整。路线封面为本攻略专门生成的渲染图。
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Stack>
  );
}
