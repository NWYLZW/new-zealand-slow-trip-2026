import { Stack } from "@mui/material";
import { RouteMap } from "../RouteMap";
import { SectionTitle } from "../SectionTitle";
import { northDays } from "../../tripData";
import { useLanguage } from "../../LanguageContext";

export function NorthPanel() {
  const { language } = useLanguage();
  return (
    <Stack spacing={3}>
      <SectionTitle
        title={language === "en" ? "North Island itinerary" : "北岛行程"}
        desc={language === "en" ? "Auckland, Hobbiton, Rotorua and the return journey are shown on one route map and calendar." : "奥克兰、霍比屯、罗托鲁瓦和返程都放在同一张路线图与日历里。"}
      />
      <RouteMap mode="north" days={northDays} />
    </Stack>
  );
}
