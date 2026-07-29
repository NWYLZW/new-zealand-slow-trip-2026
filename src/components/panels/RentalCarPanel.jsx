import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Grid2 as Grid,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Stack,
  Typography,
} from "@mui/material";
import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import FactCheckOutlinedIcon from "@mui/icons-material/FactCheckOutlined";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import PaymentsOutlinedIcon from "@mui/icons-material/PaymentsOutlined";
import PlaceOutlinedIcon from "@mui/icons-material/PlaceOutlined";
import ShieldOutlinedIcon from "@mui/icons-material/ShieldOutlined";
import { assetPath } from "../../assets";
import { useLanguage } from "../../LanguageContext";
import { PanelHero } from "../PanelHero";
import "./RentalCarPanel.css";

const confirmedBookings = [
  {
    id: "south",
    island: "南岛",
    islandEn: "South Island",
    reservation: "已私下保存",
    reservationEn: "stored privately",
    vehicle: "Toyota RAV4 Hybrid 或同级",
    vehicleEn: "Toyota RAV4 Hybrid or similar",
    route: "皇后镇机场（ZQN）→ 基督城机场（CHC）",
    routeEn: "Queenstown Airport (ZQN) → Christchurch Airport (CHC)",
    dates: "2026年9月29日 15:30 — 10月7日 15:30",
    datesEn: "29 Sep 2026 15:30 — 7 Oct 2026 15:30",
    duration: "8 × 24小时 · 异地还车 · 无限公里",
    durationEn: "Eight 24-hour periods · one-way · unlimited kilometres",
    total: "NZ$2,052.96",
    protection: "LDW + Zero Excess + 道路救援",
    protectionEn: "LDW + Zero Excess + roadside assistance",
    counter: "皇后镇机场柜台 08:00–22:00；基督城机场柜台 06:00–次日01:30，可使用非营业时间钥匙箱。",
    counterEn: "Queenstown Airport desk 08:00–22:00; Christchurch Airport desk 06:00–01:30, with an after-hours key drop.",
    cancellation: "Pay at Counter；确认邮件写明取消或未到店均不收费。行程有变时仍请在取车前在线取消。",
    cancellationEn: "Pay at Counter; the confirmation states no cancellation or no-show fee. Still cancel online before pickup if plans change.",
    payment: "主驾驶本人名下实体 Visa / Mastercard / Amex；Visa/Mastercard 2.53%，Amex 3.57%；取车时预授权。",
    paymentEn: "Physical Visa, Mastercard or Amex in the lead driver's name; Visa/Mastercard 2.53%, Amex 3.57%; pre-authorisation at pickup.",
    coverLimit: "玻璃、轮胎、车顶、底盘、涉水和禁行道路等未确认包含；不要驶入 Skippers Canyon。",
    coverLimitEn: "Windscreen, tyres, overhead, underbody, water damage and prohibited roads are not confirmed as covered. Do not drive Skippers Canyon.",
  },
  {
    id: "north",
    island: "北岛",
    islandEn: "North Island",
    reservation: "已私下保存",
    reservationEn: "stored privately",
    vehicle: "Mazda CX-30 或同级紧凑型自动挡 SUV",
    vehicleEn: "Mazda CX-30 or similar compact automatic SUV",
    route: "奥克兰机场（AKL）→ 奥克兰机场（AKL）",
    routeEn: "Auckland Airport (AKL) → Auckland Airport (AKL)",
    dates: "2026年10月9日 08:30 — 10月10日 17:00",
    datesEn: "9 Oct 2026 08:30 — 10 Oct 2026 17:00",
    duration: "2个计费日 · 原地还车 · 无限公里",
    durationEn: "Two billed days · same-location return · unlimited kilometres",
    total: "NZ$303.03",
    protection: "LDW + Zero Excess + 道路救援",
    protectionEn: "LDW + Zero Excess + roadside assistance",
    counter: "奥克兰机场航站楼内柜台，每日 05:00–次日01:30。",
    counterEn: "Inside the Auckland Airport terminal, open daily 05:00–01:30.",
    cancellation: "Pay at Counter；确认邮件写明取消或未到店均不收费。行程有变时仍请在取车前在线取消。",
    cancellationEn: "Pay at Counter; the confirmation states no cancellation or no-show fee. Still cancel online before pickup if plans change.",
    payment: "主驾驶本人名下实体 Visa / Mastercard / Amex；Visa/Mastercard 约 NZ$7.67，Amex 约 NZ$10.82；预授权通常 7–10个工作日释放。",
    paymentEn: "Physical Visa, Mastercard or Amex in the lead driver's name; card fee about NZ$7.67 or NZ$10.82; pre-authorisation is usually released within 7–10 working days.",
    coverLimit: "确认邮件未单列玻璃和轮胎保障，取车时向 Budget 再确认；Zero Excess 仍受租车条款限制。",
    coverLimitEn: "Windscreen and tyre cover is not listed separately. Reconfirm it with Budget at pickup; Zero Excess remains subject to the rental terms.",
  },
];

const checklistZh = [
  "两位驾驶人的实体正式驾照；中国驾照同时携带 NZTA 认可英文翻译或中国公证翻译件",
  "主驾驶本人名下实体信用卡，并预留足够的租金和预授权额度；不能只带手机或手表支付",
  "取车时确认两位驾驶人都已登记，并再次确认自动挡、玻璃、轮胎、车底和拖车保障",
  "连续拍摄车身、玻璃、轮胎、轮毂、油量和里程；发现划痕立即写入验车单",
  "满油取还，保留最后一次加油小票和还车照片；南岛不要驶入 Skippers Road",
];

const checklistEn = [
  "Physical full licences for both drivers, plus an NZTA-approved English translation or Chinese notarial translation for each Chinese licence",
  "A physical credit card in the lead driver's name with enough room for the rental and pre-authorisation; phone or watch payment alone is not accepted",
  "Register both drivers and reconfirm automatic transmission plus windscreen, tyre, underbody and towing cover at pickup",
  "Film the body, glass, tyres, wheels, fuel gauge and odometer, and add every existing mark to the inspection report",
  "Return full, keep the final fuel receipt and return photos, and do not drive Skippers Road on the South Island",
];

function BookingFact({ icon, label, children, secondary }) {
  return (
    <Box className="rental-booking-fact">
      {icon}
      <span>
        <strong>{label}</strong>
        {children}
        {secondary && <small>{secondary}</small>}
      </span>
    </Box>
  );
}

function BookingConfirmationCard({ booking, isEnglish }) {
  const operationalDetails = [
    {
      label: isEnglish ? "Airport counter" : "机场柜台",
      body: isEnglish ? booking.counterEn : booking.counter,
    },
    {
      label: isEnglish ? "Cancellation" : "取消规则",
      body: isEnglish ? booking.cancellationEn : booking.cancellation,
    },
    {
      label: isEnglish ? "Payment" : "现场付款",
      body: isEnglish ? booking.paymentEn : booking.payment,
    },
  ];

  return (
    <Card className="rental-booking-confirmed">
      <CardContent>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={2} className="rental-booking-header">
          <Box>
            <Typography className="rental-kicker">{isEnglish ? booking.islandEn : booking.island}</Typography>
            <Typography variant="h2">Budget · {isEnglish ? booking.vehicleEn : booking.vehicle}</Typography>
            <Typography color="text.secondary" className="rental-reservation">
              {isEnglish ? "Reservation" : "预订代码"} <strong>{isEnglish ? booking.reservationEn : booking.reservation}</strong>
            </Typography>
          </Box>
          <Chip icon={<CheckCircleOutlineIcon />} color="success" label={isEnglish ? "BOOKED" : "已预订"} />
        </Stack>

        <Grid container spacing={1.5} className="rental-booking-facts">
          <Grid size={{ xs: 12, md: 6 }}>
            <BookingFact icon={<PlaceOutlinedIcon />} label={isEnglish ? "Pickup and return" : "取还车"}>
              {isEnglish ? booking.routeEn : booking.route}
            </BookingFact>
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <BookingFact
              icon={<CalendarMonthOutlinedIcon />}
              label={isEnglish ? "Time" : "时间"}
              secondary={isEnglish ? booking.durationEn : booking.duration}
            >
              {isEnglish ? booking.datesEn : booking.dates}
            </BookingFact>
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <BookingFact icon={<PaymentsOutlinedIcon />} label={isEnglish ? "Confirmed total" : "确认总价"}>
              <b>{booking.total}</b>
            </BookingFact>
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <BookingFact icon={<ShieldOutlinedIcon />} label={isEnglish ? "Protection" : "保障"}>
              {isEnglish ? booking.protectionEn : booking.protection}
            </BookingFact>
          </Grid>
        </Grid>

        <Box className="rental-operational-details">
          {operationalDetails.map((detail) => (
            <Box key={detail.label}>
              <strong>{detail.label}</strong>
              <span>{detail.body}</span>
            </Box>
          ))}
        </Box>

        <Alert severity="warning" className="rental-cover-limit">
          {isEnglish ? booking.coverLimitEn : booking.coverLimit}
        </Alert>

        <Button
          href="https://www.budget.co.nz/en/reservation/view-modify-cancel"
          target="_blank"
          rel="noreferrer"
          variant="outlined"
          endIcon={<OpenInNewIcon />}
          className="rental-manage-button"
        >
          {isEnglish ? "Manage Budget booking" : "管理 Budget 订单"}
        </Button>
      </CardContent>
    </Card>
  );
}

export function RentalCarPanel() {
  const { language } = useLanguage();
  const isEnglish = language === "en";
  const checklist = isEnglish ? checklistEn : checklistZh;

  return (
    <Stack spacing={3} className="rental-panel">
      <PanelHero
        image={assetPath("images/queenstown.webp")}
        kicker="SELF DRIVE"
        title={isEnglish ? "Two confirmed car rentals" : "南北岛两段租车均已确认"}
        desc={isEnglish
          ? "The reservation codes are stored privately; keep the airport times, payment card and pickup checks handy for the road trip."
          : "预订代码已私下保存；旅行中关注机场取还车时间、现场付款和取车检查即可。"}
      />

      <Grid container spacing={2}>
        {confirmedBookings.map((booking) => (
          <Grid size={{ xs: 12, xl: 6 }} key={booking.id}>
            <BookingConfirmationCard booking={booking} isEnglish={isEnglish} />
          </Grid>
        ))}
      </Grid>

      <Card className="rental-guide-card">
        <CardContent>
          <Stack direction="row" spacing={1} alignItems="center">
            <FactCheckOutlinedIcon />
            <Typography variant="h2">{isEnglish ? "Before pickup" : "取车前清单"}</Typography>
          </Stack>
          <List className="rental-checklist">
            {checklist.map((item) => (
              <ListItem key={item} disableGutters alignItems="flex-start">
                <ListItemIcon><CheckCircleOutlineIcon color="success" /></ListItemIcon>
                <ListItemText primary={item} />
              </ListItem>
            ))}
          </List>
        </CardContent>
      </Card>
    </Stack>
  );
}
