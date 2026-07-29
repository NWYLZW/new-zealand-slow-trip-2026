import { Box, Button, Card, CardContent, Chip, Grid2 as Grid, Stack, Typography } from "@mui/material";
import DirectionsCarIcon from "@mui/icons-material/DirectionsCar";
import MapIcon from "@mui/icons-material/Map";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import PetsIcon from "@mui/icons-material/Pets";
import { useLanguage } from "../LanguageContext";
import "./WildlifeRouteOption.css";

const links = [
  ["10月6日 General · 20:00", "6 Oct General · 20:00", "https://book.penguins.co.nz/activity/selection?filter=ProdGroup-General&date=2026-10-06"],
  ["10月6日 Premium · 20:00", "6 Oct Premium · 20:00", "https://book.penguins.co.nz/activity/selection?filter=ProdGroup-Premium&date=2026-10-06"],
  ["官方参观与拍摄规则", "Official visit and photography rules", "https://www.penguins.co.nz/visit/plan-your-visit/"],
  ["Kātiki Point · DOC", "Kātiki Point · DOC", "https://www.doc.govt.nz/parks-and-recreation/places-to-go/otago/places/moeraki-area/things-to-do/katiki-point-walking-track/"],
];

const routeUrl = "https://www.google.com/maps/dir/?api=1&origin=Mt%20Cook%20Lodge%20%26%20Motels&destination=Oamaru%20Blue%20Penguin%20Colony&waypoints=Church%20of%20the%20Good%20Shepherd%20Lake%20Tekapo&travelmode=driving";

export function WildlifeRouteOption({ onOpenEvent }) {
  const { language } = useLanguage();
  const en = language === "en";

  return (
    <Card className="wildlife-route-option">
      <CardContent>
        <Stack className="wildlife-route-heading" direction={{ xs: "column", md: "row" }} justifyContent="space-between" spacing={2}>
          <Box>
            <Stack direction="row" spacing={1} alignItems="center">
              <PetsIcon />
              <Typography variant="h3">{en ? "Wildlife route option" : "野生动物改线 · 企鹅 + 新西兰海狗"}</Typography>
            </Stack>
            <Typography color="text.secondary">
              {en ? "Feasible option: stay in Ōamaru on 6 Oct instead of Christchurch. This keeps the booked Aoraki stay, helicopter, stargazing and JQ242." : "可行备选：把 10 月 6 日住宿从基督城改到奥马鲁；保留已订冬宫、直升机、观星与 JQ242。"}
            </Typography>
          </Box>
          <Chip color="warning" label={en ? "Under review · not booked" : "待决定 · 尚未预订"} />
        </Stack>

        <Grid container spacing={1.5} className="wildlife-route-grid">
          <Grid size={{ xs: 12, md: 4 }}>
            <Box className="wildlife-route-fact">
              <Typography fontWeight={950}>{en ? "6 Oct · Aoraki → Ōamaru" : "10月6日 · 库克山 → 奥马鲁"}</Typography>
              <Typography>{en ? "Short Lake Tekapo stop; about 281 km / 3 hr 26 min driving." : "蒂卡波只短停；约281公里 / 3小时26分纯驾驶（7月29日 Google 地图实查）。"}</Typography>
            </Box>
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <Box className="wildlife-route-fact">
              <Typography fontWeight={950}>{en ? "20:00 little-penguin viewing" : "20:00 小蓝企鹅归巢"}</Typography>
              <Typography>{en ? "General NZD 50, 5+ places; Premium NZD 70, 5 places. Verified 29 Jul 2026." : "General NZD 50/人、余5+；Premium NZD 70/人、余5。2026-07-29实查。"}</Typography>
            </Box>
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <Box className="wildlife-route-fact">
              <Typography fontWeight={950}>{en ? "7 Oct · direct to CHC" : "10月7日 · 直达基督城机场"}</Typography>
              <Typography>{en ? "About 245 km / 3 hr 6 min; keep the 15:30 car return (Google Maps, 29 Jul)." : "约245公里 / 3小时6分；仍按15:30还车（7月29日 Google 地图实查）。"}</Typography>
            </Box>
          </Grid>
        </Grid>

        <Box className="wildlife-route-verdict">
          <Typography fontWeight={950}>{en ? "What you gain and give up" : "得到什么、牺牲什么"}</Typography>
          <Typography>{en ? "The paid evening colony is the highest-confidence penguin experience. New Zealand fur seals often rest on rocks near the same colony, but are not guaranteed. The trade-off is the Christchurch hotel and city half-day; total driving over the two days rises by roughly two hours, based on the current Google Maps snapshot." : "付费晚场是看企鹅把握最高的方案；同一保护区附近岩石常有新西兰海狗，但不能保证。代价是取消基督城住宿与市区半日；按当前 Google 地图快照，两天合计纯驾驶约增加2小时。"}</Typography>
          <Typography>{en ? "Kātiki Point is 44 km south of Ōamaru and is open 07:30–17:30. Fur seals are more reliable there; yellow-eyed penguins remain only a possibility. Do not add it on flight day." : "Kātiki Point 在奥马鲁以南约44公里，07:30—17:30开放；海狗更稳，黄眼企鹅仍只是概率。不要塞到赶飞机当天。"}</Typography>
          <Typography>{en ? "Rules: no cameras, filming or bright screens during the penguin viewing; keep at least 20 m from fur seals. Refund requests require at least 24 hours' notice." : "规则：企鹅晚场禁止相机、录像和亮屏；与海狗至少保持20米。退票需至少提前24小时通知。"}</Typography>
        </Box>

        <Stack className="wildlife-route-actions" direction="row" flexWrap="wrap" useFlexGap spacing={1}>
          <Button onClick={onOpenEvent} startIcon={<PetsIcon />} variant="contained">
            {en ? "View route, timing and official links" : "查看路线、时间与官方链接"}
          </Button>
          <Button component="a" href={routeUrl} target="_blank" rel="noreferrer" startIcon={<MapIcon />} variant="contained">
            {en ? "Open route in Google Maps" : "在 Google 地图打开改线"}
          </Button>
          {links.map(([label, labelEn, href]) => (
            <Button component="a" href={href} key={href} target="_blank" rel="noreferrer" startIcon={<OpenInNewIcon />} variant="outlined">
              {en ? labelEn : label}
            </Button>
          ))}
        </Stack>
        <Stack direction="row" spacing={1} alignItems="center" className="wildlife-route-driving-note">
          <DirectionsCarIcon />
          <Typography>{en ? "Decision order: check Christchurch cancellation terms → choose an Ōamaru hotel → book the penguin ticket." : "决策顺序：先确认基督城住宿能否取消 → 选奥马鲁酒店 → 再买企鹅票。"}</Typography>
        </Stack>
      </CardContent>
    </Card>
  );
}
