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
    reservation: "新订单是否沿用原预订号待核对",
    reservationEn: "check whether the updated booking retains the original reference",
    vehicle: "车型待新确认邮件核对",
    vehicleEn: "Vehicle to verify in the updated confirmation",
    route: "皇后镇机场（ZQN）→ 基督城机场（CHC）",
    routeEn: "Queenstown Airport (ZQN) → Christchurch Airport (CHC)",
    dates: "2026年9月29日取车 — 10月8日还车",
    datesEn: "Pick up 29 Sep 2026 — return 8 Oct 2026",
    duration: "改期后计费时长待按新确认邮件核对 · 异地还车",
    durationEn: "Updated billed duration to verify against the new confirmation · one-way",
    total: "待按新确认邮件核对",
    totalEn: "Pending verification from the new confirmation email",
    protection: "待新确认邮件核对",
    protectionEn: "Pending updated confirmation",
    counter: "皇后镇机场柜台 08:00–22:00；基督城机场柜台 06:00–次日01:30，可使用非营业时间钥匙箱。",
    counterEn: "Queenstown Airport desk 08:00–22:00; Christchurch Airport desk 06:00–01:30, with an after-hours key drop.",
    cancellation: "原确认邮件写明 Pay at Counter，取消或未到店均不收费；改期后的规则仍需按新确认邮件复核。",
    cancellationEn: "The previous confirmation stated Pay at Counter with no cancellation or no-show fee; recheck the updated terms in the new confirmation.",
    payment: "旧确认邮件记录主驾驶本人名下实体卡、刷卡费与取车预授权要求；改期后费率和规则须以新确认邮件为准。",
    paymentEn: "The previous confirmation recorded a physical card in the lead driver's name, card fees and pickup pre-authorisation; verify all rates and rules in the updated confirmation.",
    coverLimit: "玻璃、轮胎、车顶、底盘、涉水和禁行道路等未确认包含；不要驶入 Skippers Canyon。",
    coverLimitEn: "Windscreen, tyres, overhead, underbody, water damage and prohibited roads are not confirmed as covered. Do not drive Skippers Canyon.",
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
            <BookingFact icon={<PaymentsOutlinedIcon />} label={isEnglish ? "Updated total" : "改期后总价"}>
              <b>{isEnglish ? booking.totalEn : booking.total}</b>
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
        title={isEnglish ? "South Island rental updated to 8 October" : "南岛租车已改为10月8日还车"}
        desc={isEnglish
          ? "The return date has been changed to 8 October. Verify the exact return time, updated total, vehicle, protection and whether the booking reference remains unchanged in the new confirmation email."
          : "还车日期已改为10月8日；具体还车时刻、改期后总价、车型、保障及预订号是否沿用，均需按新确认邮件核对。"}
      />

      <Alert severity="warning" className="rental-cover-limit">
        <Stack spacing={1} alignItems="flex-start">
          <Typography fontWeight={900}>
            {isEnglish ? "North Island Budget booking: cancellation pending" : "北岛 Budget 真实订单：待你主动取消"}
          </Typography>
          <Typography>
            {isEnglish
              ? "The existing booking is still active for 9 Oct 08:30–10 Oct 17:00, Mazda CX-30 or similar, NZ$303.03; its reservation number is stored privately. Updating this itinerary does not cancel the real booking. The confirmation states Pay at Counter with no cancellation or no-show fee, but cancel online before pickup."
              : "现有订单仍是 10月9日 08:30—10月10日 17:00、Mazda CX-30 或同级、NZ$303.03，预订号已私下保存。页面改成大巴方案不等于真实订单已取消；确认邮件写明 Pay at Counter 且取消或未到店不收费，但仍请在取车前主动在线取消。"}
          </Typography>
          <Button
            href="https://www.budget.co.nz/en/reservation/view-modify-cancel"
            target="_blank"
            rel="noreferrer"
            variant="outlined"
            color="warning"
            endIcon={<OpenInNewIcon />}
          >
            {isEnglish ? "Manage or cancel North Island booking" : "管理或取消北岛订单"}
          </Button>
        </Stack>
      </Alert>

      <Grid container spacing={2}>
        {confirmedBookings.map((booking) => (
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
