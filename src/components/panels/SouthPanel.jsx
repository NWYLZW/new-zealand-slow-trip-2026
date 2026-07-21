import { Stack } from "@mui/material";
import { DayCalendar } from "../DayCalendar";
import { PanelHero } from "../PanelHero";
import { SectionTitle } from "../SectionTitle";
import { assetPath } from "../../assets";
import { southDays } from "../../tripData";

export function SouthPanel() {
  return (
    <Stack spacing={3}>
      <PanelHero
        image={assetPath("images/queenstown.webp")}
        kicker="SOUTH ISLAND · 9 DAYS"
        title="南岛慢慢开"
        desc="四晚皇后镇作为缓冲，再用瓦纳卡、库克山和蒂卡波把路程拆开。"
      />
      <SectionTitle title="每日安排" desc="改成月历视图：每天的关键时间和住宿安排放在同一个日期格子里。" />
      <DayCalendar days={southDays} />
    </Stack>
  );
}
