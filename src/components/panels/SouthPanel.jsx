import { Stack } from "@mui/material";
import { PanelHero } from "../PanelHero";
import { RouteMap } from "../RouteMap";
import { assetPath } from "../../assets";
import { southDays } from "../../tripData";
import { useLanguage } from "../../LanguageContext";

export function SouthPanel() {
  const { language } = useLanguage();
  const isEnglish = language === "en";
  return (
    <Stack spacing={3}>
      <PanelHero
        image={assetPath("images/queenstown.webp")}
        kicker="SOUTH ISLAND · 9 DAYS"
        title={isEnglish ? "A relaxed South Island drive" : "南岛慢慢开"}
        desc={isEnglish ? "Four nights in Queenstown provide breathing room, followed by Walter Peak, Wānaka, a glacier helicopter flight and stargazing at Aoraki / Mount Cook." : "四晚皇后镇作为缓冲，10月2日改为Walter Peak轻松方案；库克山加入直升机冰川降落和Big Sky观星。"}
      />
      <RouteMap mode="south" days={southDays} />
    </Stack>
  );
}
