import { Box, Card, Grid2 as Grid, Typography } from "@mui/material";
import { gallery } from "../tripData";
import { SectionTitle } from "./SectionTitle";

export function Gallery() {
  return (
    <Box>
      <SectionTitle title="先看看会遇到的风景" desc="真实地点照片用于建立印象；首页路线图为专门制作的渲染图。" />
      <Grid container spacing={1.5}>
        {gallery.map((item, index) => (
          <Grid size={{ xs: 12, md: index === 0 || index === 3 ? 7 : 5 }} key={item.title}>
            <Card className="photo-card">
              <Box component="img" src={item.src} alt={item.alt} />
              <Box className="photo-gradient" />
              <Box className="photo-caption">
                <Typography variant="caption">{item.kicker}</Typography>
                <Typography variant="h3">{item.title}</Typography>
              </Box>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}
