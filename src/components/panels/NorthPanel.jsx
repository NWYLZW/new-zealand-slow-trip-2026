import { Stack } from "@mui/material";
import { RouteMap } from "../RouteMap";
import { SectionTitle } from "../SectionTitle";
import { northDays } from "../../tripData";

export function NorthPanel() {
  return (
    <Stack spacing={3}>
      <SectionTitle title="北岛行程" desc="奥克兰、霍比屯、罗托鲁瓦和返程都放在同一张路线图与日历里。" />
      <RouteMap mode="north" days={northDays} />
    </Stack>
  );
}
