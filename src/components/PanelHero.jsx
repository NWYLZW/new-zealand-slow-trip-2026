import { Box, Card, CardContent, Typography } from "@mui/material";

export function PanelHero({ image, kicker, title, desc }) {
  return (
    <Card className="panel-hero">
      <Box component="img" src={image} alt="" />
      <Box className="panel-gradient" />
      <CardContent>
        <Typography className="eyebrow">{kicker}</Typography>
        <Typography variant="h2">{title}</Typography>
        <Typography>{desc}</Typography>
      </CardContent>
    </Card>
  );
}
