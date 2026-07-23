import { Box, Card, Grid2 as Grid, Typography } from "@mui/material";
import { gallery } from "../tripData";
import { SectionTitle } from "./SectionTitle";
import { useLanguage } from "../LanguageContext";

export function Gallery() {
  const { language } = useLanguage();
  const englishTitles = {
    "皇后镇 · 湖与山之间": "Queenstown · Between lake and mountains",
    "米尔福德 · 高强度备选": "Milford Sound · Optional long day",
    "库克山 · 直升机与星空": "Aoraki / Mount Cook · Helicopter and stars",
    "奥克兰 · 城市购物日": "Auckland · City shopping day",
  };
  return (
    <Box>
      <SectionTitle
        title={language === "en" ? "A preview of the landscapes" : "先看看会遇到的风景"}
        desc={language === "en" ? "Photographs show the real places along the trip." : "真实地点照片用于建立印象；首页路线图为专门制作的渲染图。"}
      />
      <Grid container spacing={1.5}>
        {gallery.map((item, index) => (
          <Grid size={{ xs: 12, md: index === 0 || index === 3 ? 7 : 5 }} key={item.title}>
            <Card className="photo-card">
              <Box component="img" src={item.src} alt={item.alt} />
              <Box className="photo-gradient" />
              <Box className="photo-caption">
                <Typography variant="caption">{item.kicker}</Typography>
                <Typography variant="h3">{language === "en" ? (englishTitles[item.title] ?? item.title) : item.title}</Typography>
              </Box>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}
