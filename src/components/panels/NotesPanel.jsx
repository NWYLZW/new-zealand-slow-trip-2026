import { Card, CardContent, Grid2 as Grid, List, ListItem, ListItemText, Stack, Typography } from "@mui/material";
import { PanelHero } from "../PanelHero";
import { assetPath } from "../../assets";
import { notes } from "../../tripData";
import { useLanguage } from "../../LanguageContext";

const notesZh = notes.map((note) => note.title !== "租车关键点" ? note : {
  ...note,
  items: [
    "南岛 Budget 订单已改为10月8日在基督城机场还车；具体时刻待新确认邮件。",
    "旧订单的8 × 24小时与 NZ$2,052.96 不再作为改期后信息；新总价及预订号是否沿用原号码均待核对。",
    "改期后的付款、取消与保障条款以新确认邮件为准。",
    "北岛 Budget 订单现为待取消：网站改成大巴行程不会同步取消真实订单，需在 Budget 官网管理订单中主动操作并保存取消确认。",
    "不走 Skippers Road；车顶、底盘、涉水及其他条款除外损失仍可能需要全额自付。",
  ],
});

const notesEn = [
  {
    title: "Roads and weather",
    items: [
      "Check NZTA road conditions every morning.",
      "Use the Cromwell route if Crown Range is snowy or closed.",
      "Helicopter flights and stargazing are weather-dependent; prioritise rescheduling or refunds.",
      "Avoid night driving on the South Island and keep snow chains in the car.",
    ],
  },
  {
    title: "Flights and baggage",
    items: [
      "Jetstar Starter fares usually include a combined 7 kg of carry-on baggage.",
      "Confirm checked baggage before paying for both domestic flights.",
      "Pack shopping into checked baggage on 10 October.",
    ],
  },
  {
    title: "Rental car reminders",
    items: [
      "The South Island booking has been changed to return at Christchurch Airport on 8 October; verify the exact time in the updated confirmation.",
      "Do not reuse the previous eight-24-hour duration or NZD 2,052.96 total. Verify the updated total and whether the booking reference remains unchanged.",
      "Recheck the updated payment, cancellation and protection terms in the new confirmation email.",
      "The existing North Island Budget booking is still active. The new coach itinerary does not cancel it; cancel it online before pickup and save the confirmation.",
      "Do not drive Skippers Road; check the rental terms before using gravel roads.",
    ],
  },
];

export function NotesPanel() {
  const { language } = useLanguage();
  const isEnglish = language === "en";
  const visibleNotes = isEnglish ? notesEn : notesZh;
  return (
    <Stack className="notes-panel" spacing={3}>
      <PanelHero
        image={assetPath("images/aoraki.webp")}
        kicker="BEFORE YOU GO"
        title={isEnglish ? "Final checks before departure" : "出发前再确认"}
        desc={isEnglish ? "Spring weather changes quickly on the South Island. Recheck roads, flights and baggage shortly before departure." : "春季南岛天气变化快；把路况和行李规则留到出发前最后复核。"}
      />
      <Grid container spacing={2}>
        {visibleNotes.map((note) => (
          <Grid size={{ xs: 12, md: 4 }} key={note.title}>
            <Card>
              <CardContent>
                <Typography variant="h3">{note.title}</Typography>
                <List dense>
                  {note.items.map((item) => (
                    <ListItem key={item} disableGutters>
                      <ListItemText primary={item} />
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Grid>
        ))}
        <Grid size={{ xs: 12 }}>
          <Card>
            <CardContent>
              <Typography variant="h3">{isEnglish ? "Image credits" : "图片来源与许可"}</Typography>
              <Typography color="text.secondary" className="credits-copy">
                {isEnglish ? "Photographs of Queenstown, Milford Sound, Aoraki / Mount Cook, Hobbiton and Auckland are sourced from Wikimedia Commons." : "皇后镇、米尔福德、库克山、霍比屯和奥克兰照片来自 Wikimedia Commons；照片仅做尺寸与 WebP 格式调整。路线封面为本攻略专门生成的渲染图。"}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Stack>
  );
}
