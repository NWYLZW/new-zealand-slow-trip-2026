import { Stack, Typography } from "@mui/material";

export function SectionTitle({ title, desc }) {
  return (
    <Stack className="section-title" direction={{ xs: "column", sm: "row" }} justifyContent="space-between" spacing={1}>
      <Typography variant="h2">{title}</Typography>
      {desc && <Typography color="text.secondary">{desc}</Typography>}
    </Stack>
  );
}
