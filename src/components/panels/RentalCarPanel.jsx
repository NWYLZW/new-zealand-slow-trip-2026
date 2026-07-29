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
import PendingActionsOutlinedIcon from "@mui/icons-material/PendingActionsOutlined";
import PlaceOutlinedIcon from "@mui/icons-material/PlaceOutlined";
import ShieldOutlinedIcon from "@mui/icons-material/ShieldOutlined";
import { assetPath } from "../../assets";
import { useLanguage } from "../../LanguageContext";
import { PanelHero } from "../PanelHero";
import "./RentalCarPanel.css";

const rentalBookings = [
  {
    id: "south",
    island: "南岛",
    islandEn: "South Island",
    reservation: "已私下保存",
    reservationEn: "stored privately",
    vehicle: "Mazda CX-30 或同级紧凑型 SUV",
    vehicleEn: "Mazda CX-30 or similar compact SUV",
    route: "皇后镇机场（ZQN）→ 基督城机场（CHC）",
    routeEn: "Queenstown Airport (ZQN) → Christchurch Airport (CHC)",
    dates: "计划：2026年9月29日 15:30 — 10月8日 15:30",
    datesEn: "Planned: 29 Sep 2026 15:30 — 8 Oct 2026 15:30",
    duration: "9 × 24小时 · 异地还车 · 无限公里",
    durationEn: "Nine 24-hour periods · one-way · unlimited kilometres",
    total: "NZ$1,663.96",
    protection: "LDW + Zero Excess + 附加驾驶员 + 道路救援",
    protectionEn: "LDW + Zero Excess + additional driver + roadside assistance",
    counter: "皇后镇机场柜台 08:00–22:00；基督城机场柜台 06:00–次日01:30，可使用非营业时间钥匙箱。",
    counterEn: "Queenstown Airport desk 08:00–22:00; Christchurch Airport desk 06:00–01:30, with an after-hours key drop.",
    cancellation: "Pay at Counter；确认邮件写明取消或未到店均不收费。行程有变时仍请在取车前在线取消。",
    cancellationEn: "Pay at Counter; the confirmation states no cancellation or no-show fee. Still cancel online before pickup if plans change.",
    payment: "主驾驶本人名下实体 Visa / Mastercard / Amex；Visa/Mastercard 2.53%，Amex 3.57%；取车时预授权。",
    paymentEn: "Physical Visa, Mastercard or Amex in the lead driver's name; Visa/Mastercard 2.53%, Amex 3.57%; pre-authorisation at pickup.",
    coverLimit: "玻璃、轮胎、车顶、底盘、涉水和禁行道路等未确认包含；不要驶入 Skippers Canyon。",
    coverLimitEn: "Windscreen, tyres, overhead, underbody, water damage and prohibited roads are not confirmed as covered. Do not drive Skippers Canyon.",
    changeNote: "Budget 的修改页已生成上述重报价，但尚未提交。当前有效订单仍是 RAV4 Hybrid 或同级、9月29日—10月7日、NZ$2,052.96；确认接受 CX-30 后才可完成延期。",
    changeNoteEn: "Budget has generated this revised quote, but it has not been submitted. The active booking is still a RAV4 Hybrid or similar for 29 Sep–7 Oct at NZ$2,052.96 until the CX-30 change is accepted.",
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
          <Chip icon={<PendingActionsOutlinedIcon />} color="warning" label={isEnglish ? "CHANGE PENDING" : "修改待确认"} />
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
            <BookingFact icon={<PaymentsOutlinedIcon />} label={isEnglish ? "Revised quote" : "修改后报价"}>
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

        <Alert severity="info" className="rental-change-note">
          {isEnglish ? booking.changeNoteEn : booking.changeNote}
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
        title={isEnglish ? "One South Island rental; North Island cancelled" : "只保留南岛租车 · 北岛已取消"}
        desc={isEnglish
          ? "The South Island return is planned for 8 Oct, but the cheaper CX-30 modification still needs approval and submission."
          : "南岛计划延长到10月8日还车；Budget 已给出更便宜的 CX-30 报价，但车型变化仍需确认并提交。"}
      />

      <Alert severity="success" className="rental-cancelled-notice">
        {isEnglish
          ? "North Island Budget reservation cancelled successfully. No pickup, refuelling or return is required; arrange the Auckland–Hobbiton–Rotorua transfers instead."
          : "北岛 Budget 订单已成功取消：无需取车、加油或还车；10月9—10日改订奥克兰—霍比屯—罗托鲁瓦联程及返机场接驳。"}
      </Alert>

      <Grid container spacing={2}>
        {rentalBookings.map((booking) => (
          <Grid size={{ xs: 12 }} key={booking.id}>
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
