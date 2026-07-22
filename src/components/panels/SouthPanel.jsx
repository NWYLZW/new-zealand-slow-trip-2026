import { Stack } from "@mui/material";
import { PanelHero } from "../PanelHero";
import { RouteMap } from "../RouteMap";
import { assetPath } from "../../assets";
import { southDays } from "../../tripData";

export function SouthPanel() {
  return (
    <Stack spacing={3}>
      <PanelHero
        image={assetPath("images/queenstown.webp")}
        kicker="SOUTH ISLAND · 9 DAYS"
        title="南岛慢慢开"
        desc="四晚皇后镇作为缓冲，10月2日改为Walter Peak轻松方案；库克山加入直升机冰川降落和Big Sky观星。"
      />
      <RouteMap mode="south" days={southDays} />
    </Stack>
  );
}
