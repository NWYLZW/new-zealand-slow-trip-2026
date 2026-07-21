import { Card, CardContent, Grid2 as Grid, Typography } from "@mui/material";
import { stats } from "../tripData";

export function StatGrid() {
  return (
    <Grid container spacing={1.5}>
      {stats.map((stat) => (
        <Grid size={{ xs: 6, md: 3 }} key={stat.label}>
          <Card className="stat-card">
            <CardContent>
              <Typography variant="caption" color="text.secondary" fontWeight={800}>{stat.label}</Typography>
              <Typography className="stat-value">{stat.value}</Typography>
              <Typography variant="caption" color="text.secondary">{stat.note}</Typography>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
}
