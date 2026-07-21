import { Box, Card, CardContent, Chip, Stack } from "@mui/material";
import { assetPath } from "../assets";

export function Hero() {
  return (
    <Card className="hero-card">
      <Box component="img" src={assetPath("images/hero-route-render.webp")} alt="新西兰南北岛山脉、湖泊和自驾路线的3D渲染图" />
      <Box className="hero-overlay" />
      <CardContent className="hero-content hero-content-minimal">
        <Stack direction="row" className="chip-row">
          {["9月28日出发", "10月11日返程"].map((tag) => (
            <Chip key={tag} label={tag} className="glass-chip" />
          ))}
        </Stack>
      </CardContent>
    </Card>
  );
}
