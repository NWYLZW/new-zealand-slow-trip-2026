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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Stack,
  Typography,
} from "@mui/material";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";
import DirectionsCarIcon from "@mui/icons-material/DirectionsCar";
import FactCheckOutlinedIcon from "@mui/icons-material/FactCheckOutlined";
import LanguageIcon from "@mui/icons-material/Language";
import LocalGasStationIcon from "@mui/icons-material/LocalGasStation";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import PaymentsOutlinedIcon from "@mui/icons-material/PaymentsOutlined";
import PlaceOutlinedIcon from "@mui/icons-material/PlaceOutlined";
import ShieldOutlinedIcon from "@mui/icons-material/ShieldOutlined";
import { assetPath } from "../../assets";
import { useLanguage } from "../../LanguageContext";
import { PanelHero } from "../PanelHero";
import "./RentalCarPanel.css";

const confirmedBooking = {
  company: "Budget",
  reservation: "00725083NZ2",
  vehicle: "Toyota RAV4 Hybrid 或同级",
  vehicleEn: "Toyota RAV4 Hybrid or similar",
  route: "皇后镇机场（ZQN）→ 基督城机场（CHC）",
  routeEn: "Queenstown Airport (ZQN) → Christchurch Airport (CHC)",
  dates: "2026年9月29日 15:30 — 10月7日 15:30",
  datesEn: "29 Sep 2026 15:30 — 7 Oct 2026 15:30",
  duration: "8 × 24小时 · 异地还车 · 无限公里",
  durationEn: "Eight 24-hour periods · one-way · unlimited kilometres",
  payment: "Pay at Counter · 邮件确认总价 NZ$2,052.96",
  paymentEn: "Pay at Counter · email-confirmed total NZ$2,052.96",
  cover: "LDW 已包含 + Zero Excess（符合条款的损失零自付额）+ 道路救援",
  coverEn: "LDW included + Zero Excess for eligible damage + roadside assistance",
};

const bookingCostLines = [
  { label: "基础租金", labelEn: "Base rate", value: "NZ$1,351.30" },
  { label: "道路救援", labelEn: "Roadside Assistance", value: "NZ$68.88" },
  { label: "Zero Excess 零自付额", labelEn: "Zero Excess", value: "NZ$320.00" },
  { label: "机场 / 轮渡附加费", labelEn: "Airport / ferry surcharge", value: "NZ$45.00" },
  { label: "GST", labelEn: "GST", value: "NZ$267.78" },
];

const bookingDetailsZh = [
  {
    title: "取车柜台",
    body: "Queenstown Airport（ZQN）航站楼内；每日 08:00–22:00。9月29日 15:30 取车。",
  },
  {
    title: "还车柜台",
    body: "Christchurch Airport（CHC）航站楼内；每日 06:00–次日 01:30。10月7日 15:30 还车，可使用非营业时间钥匙箱。",
  },
  {
    title: "取消规则",
    body: "本单为 Pay at Counter。确认邮件明确写明取消或未到店均不收手续费，也可随时在线取消；如行程变化，仍建议在取车时间前主动取消。",
  },
  {
    title: "柜台付款",
    body: "必须出示主驾驶本人名下实体 Visa / Mastercard / Amex。Visa、Mastercard 收 2.53% 交易费（约 NZ$51.94）；Amex 收 3.57%（约 NZ$73.29）。手机、手表和仅感应支付不可用。",
  },
  {
    title: "驾照要求",
    body: "携带有效实体正式驾照；中国驾照还要配完整英文翻译，可使用 NZTA 认可译员或在中国办理的公证翻译。",
  },
  {
    title: "费用边界",
    body: "NZ$2,052.96 不含银行卡交易费、燃油、额外驾驶员费及行程中可能产生的其他费用；取车时会对预计租金做银行卡预授权。",
  },
];

const bookingDetailsEn = [
  {
    title: "Pickup desk",
    body: "Inside the Queenstown Airport (ZQN) terminal; open daily 08:00–22:00. Pickup is 29 Sep at 15:30.",
  },
  {
    title: "Return desk",
    body: "Inside the Christchurch Airport (CHC) terminal; open daily 06:00–01:30. Return is 7 Oct at 15:30; an after-hours key drop is available.",
  },
  {
    title: "Cancellation",
    body: "This is a Pay at Counter booking. The confirmation states that neither a cancellation nor no-show fee applies and it may be cancelled online at any time; still cancel before pickup if plans change.",
  },
  {
    title: "Counter payment",
    body: "Bring a physical Visa, Mastercard or Amex in the lead driver's name. Visa/Mastercard carries a 2.53% fee (about NZ$51.94); Amex 3.57% (about NZ$73.29). Phone, watch and contactless-only payment are not accepted.",
  },
  {
    title: "Licence",
    body: "Bring a valid physical full licence. A Chinese licence must have a full English translation from an NZTA-approved translator or a notarised translation issued in China.",
  },
  {
    title: "Not included",
    body: "The NZ$2,052.96 estimate excludes card fees, fuel, additional-driver fees and other possible trip charges. Budget will pre-authorise the estimated rental charges at pickup.",
  },
];

const rentalSegments = [
  {
    id: "south",
    label: "南岛 · 已预订",
    labelEn: "South Island · booked",
    route: "皇后镇机场 → 基督城机场",
    routeEn: "Queenstown Airport → Christchurch Airport",
    dates: "9月29日 15:30 — 10月7日 15:30",
    datesEn: "29 Sep 15:30 — 7 Oct 15:30",
    duration: "8 × 24小时 · 异地还车",
    durationEn: "Eight 24-hour periods · one-way",
    primary: "Budget · Toyota RAV4 Hybrid 或同级",
    primaryEn: "Budget · Toyota RAV4 Hybrid or similar",
    fallback: "无需继续比价；仅在行程变化时通过 Budget 修改或取消",
    fallbackEn: "No further comparison needed; modify or cancel with Budget only if the itinerary changes",
    budget: "已订 · NZ$2,052.96",
    note: "Pay at Counter，含 LDW、Zero Excess、道路救援与无限公里。确认邮件写明取消和未到店均不收费；银行卡交易费另计。",
    noteEn: "Pay at Counter with LDW, Zero Excess, roadside assistance and unlimited kilometres. The confirmation states there is no cancellation or no-show fee; card fees are extra.",
  },
  {
    id: "north",
    label: "北岛 · 短租车段",
    labelEn: "North Island · short rental",
    route: "奥克兰机场 → 霍比屯 → 罗托鲁瓦 → 奥克兰机场",
    routeEn: "Auckland Airport → Hobbiton → Rotorua → Auckland Airport",
    dates: "10月9日 08:30 — 10月10日 17:00",
    datesEn: "9 Oct 08:30 — 10 Oct 17:00",
    duration: "约2天 · 原地还车",
    durationEn: "About two days · same-location return",
    primary: "GO Rentals 或 Omega 紧凑型 SUV",
    primaryEn: "GO Rentals or Omega compact SUV",
    fallback: "Ezi 新款混动车（仅在全险总价更低时）",
    fallbackEn: "Ezi late-model hybrid only when its fully covered total is lower",
    budget: "NZ$260–420",
    note: "短租更看重机场取还车效率。17:00还车前先加满油，至少预留30分钟处理接驳或验车。",
    noteEn: "For a short hire, airport efficiency matters most. Refuel before the 17:00 return and allow at least 30 minutes for inspection or shuttle transfer.",
  },
];

const providers = [
  {
    name: "Budget",
    verdict: "南岛已预订",
    verdictEn: "South booked",
    price: "Pay at Counter · NZ$2,052.96",
    priceEn: "Pay at Counter · NZ$2,052.96",
    vehicle: "RAV4 Hybrid 或同级；机场柜台取还车",
    vehicleEn: "RAV4 Hybrid or similar with airport pickup and return",
    reputation: "跨国大型车行；流程和后续处理更标准化",
    reputationEn: "Large multinational operator with a more standardised process",
    chinese: "官网和柜台以英语为主；需携带实体驾照、翻译件和主驾驶实体银行卡",
    chineseEn: "English-first website and counter; bring the physical licence, translation and lead driver's physical payment card",
    url: "https://www.budget.co.nz/en/reservation/view-modify-cancel",
  },
  {
    name: "Omega",
    verdict: "历史备选",
    verdictEn: "Previous alternative",
    price: "价格中低",
    priceEn: "Low–mid price",
    vehicle: "Premium / Hybrid 车组更稳；经济车可能偏旧",
    vehicleEn: "Premium and Hybrid groups are safer bets; economy cars may be older",
    reputation: "独立评价量大、整体口碑稳定",
    reputationEn: "Large independent review base and consistently strong feedback",
    chinese: "接受中国公证处等合规翻译件；现场中文不保证",
    chineseEn: "Accepts compliant Chinese licence translations; Mandarin staff not guaranteed",
    url: "https://www.omegarentalcars.com/",
  },
  {
    name: "Apex",
    verdict: "价格备选",
    verdictEn: "Value alternative",
    price: "通常最低",
    priceEn: "Often cheapest",
    vehicle: "里程可能较高，但常见配置完整；取车时重点拍照验车",
    vehicleEn: "Mileage can be higher, but equipment is usually adequate; document the car carefully",
    reputation: "小红书和自驾社区反馈较多，评价集中在性价比",
    reputationEn: "Frequently recommended in road-trip communities for value",
    chinese: "有简体中文官网；柜台通常仍以英语沟通",
    chineseEn: "Simplified Chinese website; counter service is usually in English",
    url: "https://www.apexrentals.co.nz/zh-cn/",
  },
  {
    name: "GO Rentals",
    verdict: "车况优先",
    verdictEn: "Best vehicle condition",
    price: "通常高10%–25%",
    priceEn: "Often 10–25% higher",
    vehicle: "新车比例高，取还车体验较顺",
    vehicleEn: "High share of late-model vehicles and a polished pickup experience",
    reputation: "近期独立口碑强，好评主要集中在车况和流程",
    reputationEn: "Strong recent feedback, especially for cars and process",
    chinese: "官网有中国驾照专门说明；现场中文不保证",
    chineseEn: "Publishes guidance for Chinese licences; Mandarin staff not guaranteed",
    url: "https://www.gorentals.co.nz/",
  },
  {
    name: "Ezi",
    verdict: "新车备选",
    verdictEn: "Late-model alternative",
    price: "价格中高",
    priceEn: "Mid–high price",
    vehicle: "机场网点方便，RAV4 / 混动车组较新",
    vehicleEn: "Convenient airport desks and newer RAV4 / hybrid groups",
    reputation: "大型本地品牌，评价量充足；全险价格偏高",
    reputationEn: "Established local brand with ample reviews; full cover costs more",
    chinese: "接受正式驾照与合规英文翻译；需年满20岁",
    chineseEn: "Accepts a full licence with compliant English translation; minimum age 20",
    url: "https://www.ezicarrental.co.nz/",
  },
];

const southQuotes = [
  { company: "Budget · 已预订", companyEn: "Budget · booked", car: "RAV4 Hybrid 或同级 · 柜台付款", carEn: "RAV4 Hybrid or similar · Pay at Counter", base: "1,420.18", cover: "320.00", total: "2,052.96", status: "确认邮件实价；基础栏含 NZ$68.88 道路救援，总价另含 NZ$312.78 税费", statusEn: "Email-confirmed; base column includes NZ$68.88 roadside assistance, and total includes NZ$312.78 in tax/fees", exact: true },
  { company: "Omega", car: "RAV4 2WD · 2022–23", base: "831.20", cover: "200.00", total: "1,031.20", status: "历史报价；未预订，现需重新询价", statusEn: "Historical quote; not booked and now requires a fresh quote" },
  { company: "Apex", car: "Mitsubishi ASX · 2022–25", base: "680.88", cover: "约 200", total: "约 880.88", status: "裸车实报；全险按 NZ$25/天预留", statusEn: "Live base; cover budgeted at NZ$25/day" },
  { company: "GO Rentals", car: "紧凑型 SUV / Hybrid", base: "约 880–1,000", cover: "约 280–320", total: "约 1,184–1,344", status: "规划价；含 NZ$3/天道路服务", statusEn: "Planning range incl. NZ$3/day road care" },
  { company: "Ezi", car: "RAV4 / 同级 SUV", base: "约 820–980", cover: "至少 280", total: "约 1,100–1,300", status: "规划价；Ultra 零自付从 NZ$35/天起", statusEn: "Planning range; Ultra starts at NZ$35/day" },
];

const northQuotes = [
  { company: "Omega", total: "约 300–380" },
  { company: "Apex", total: "约 270–350" },
  { company: "GO Rentals", total: "约 330–430" },
  { company: "Ezi", total: "约 350–460" },
];

const bookingStepsZh = [
  "保存 Budget 确认邮件和订单截图；预订代码 00725083NZ2 同步到手机离线备忘。",
  "在 Manage Booking 核对主驾驶英文姓名、手机号、邮箱和航班号；不要重复下单。",
  "如两人都要开车，取车前确认第二驾驶员已正式加入合同，不能只口头告知。",
  "本单可随时取消且取消/未到店不收费；若行程变化，仍在 9月29日15:30 取车前主动在线取消。",
  "出发前 7 天再次确认订单状态、柜台营业时间和实体银行卡预授权额度。",
];

const bookingStepsEn = [
  "Save the Budget confirmation email and screenshots, and copy reservation 00725083NZ2 into an offline phone note.",
  "Use Manage Booking to verify the lead driver's English name, mobile, email and flight number; do not create a duplicate booking.",
  "If both travellers will drive, make sure the second driver is formally added to the agreement before pickup.",
  "This booking may be cancelled at any time with no cancellation or no-show fee; still cancel online before the 29 Sep 15:30 pickup if plans change.",
  "Seven days before departure, reconfirm the booking, counter hours and physical-card pre-authorisation headroom.",
];

const checklistZh = [
  "中国驾照实体原件＋NZTA认可英文翻译件或中国公证处翻译件",
  "主驾驶人名下实体 Visa / Mastercard / Amex；不可只带手机或手表支付，提前确认预授权额度",
  "取车时连续拍摄车身、玻璃、轮胎、轮毂、油量和里程",
  "确认全险是否包含玻璃、轮胎、车底、拖车与道路救援",
  "南岛不走 Skippers Road；碎石路和雪链按租车条款执行",
  "满油取还；保留最后一次加油小票和还车照片",
];

const checklistEn = [
  "Physical Chinese licence plus an NZTA-approved English translation or Chinese notarial translation",
  "A physical Visa, Mastercard or Amex in the lead driver's name; phone/watch-only payment is not accepted, and the card needs room for pre-authorisation",
  "Film the body, glass, tyres, wheels, fuel gauge and odometer at pickup",
  "Confirm whether glass, tyres, underbody, towing and roadside assistance are included",
  "Do not drive Skippers Road; follow the contract for gravel roads and snow chains",
  "Return full; keep the final fuel receipt and return-condition photos",
];

export function RentalCarPanel() {
  const { language } = useLanguage();
  const isEnglish = language === "en";
  const bookingSteps = isEnglish ? bookingStepsEn : bookingStepsZh;
  const checklist = isEnglish ? checklistEn : checklistZh;

  return (
    <Stack spacing={3} className="rental-panel">
      <PanelHero
        image={assetPath("images/queenstown.webp")}
        kicker="SELF DRIVE"
        title={isEnglish ? "Two rentals, one relaxed road trip" : "分两段租车，轻松完成南北岛自驾"}
        desc={isEnglish
          ? "The South Island car is booked with Budget. The short North Island hire remains open and can be booked closer to departure."
          : "南岛 Budget 租车已经预订完成；北岛短租仍待确认，可在临近出发时再锁定。"}
      />

      <Alert severity="success" icon={<CheckCircleOutlineIcon />}>
        {isEnglish
          ? "Booked: Budget RAV4 Hybrid or similar, Queenstown Airport to Christchurch Airport, Pay at Counter with LDW, Zero Excess and roadside assistance, NZ$2,052.96."
          : "已预订：Budget RAV4 Hybrid 或同级，皇后镇机场取车、基督城机场还车；柜台付款，含 LDW、Zero Excess 和道路救援，NZ$2,052.96。"}
      </Alert>

      <Alert severity="warning" icon={<ShieldOutlinedIcon />}>
        {isEnglish
          ? "Novice-driver rule: automatic only, a 2022-or-newer compact SUV where possible, reversing camera, zero-excess cover and non-mechanical roadside assistance. These figures assume both drivers hold full licences."
          : "新手司机规则：只选自动挡；尽量选 2022 年后紧凑型 SUV、带倒车影像；必须买租车公司自己的零自付额险和非机械故障道路救援。以下测算假设两位驾驶人均持正式驾照。"}
      </Alert>

      <Card className="rental-booking-confirmed">
        <CardContent>
          <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" alignItems={{ xs: "flex-start", md: "center" }} spacing={2}>
            <Box>
              <Typography className="rental-kicker">{isEnglish ? "SOUTH ISLAND BOOKING" : "南岛租车订单"}</Typography>
              <Typography variant="h2">{confirmedBooking.company} · {isEnglish ? confirmedBooking.vehicleEn : confirmedBooking.vehicle}</Typography>
              <Typography color="text.secondary">
                {isEnglish ? `Booked on 27 Jul 2026 · Reservation ${confirmedBooking.reservation}` : `已于 2026-07-27 完成预订 · 预订代码 ${confirmedBooking.reservation}`}
              </Typography>
            </Box>
            <Chip icon={<CheckCircleOutlineIcon />} color="success" label={isEnglish ? "BOOKED" : "已预订"} />
          </Stack>

          <Grid container spacing={1.5} className="rental-booking-facts">
            <Grid size={{ xs: 12, md: 6 }}>
              <Box><PlaceOutlinedIcon /><span><strong>{isEnglish ? "Route" : "取还车"}</strong>{isEnglish ? confirmedBooking.routeEn : confirmedBooking.route}</span></Box>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <Box><CalendarMonthOutlinedIcon /><span><strong>{isEnglish ? "Time" : "时间"}</strong>{isEnglish ? confirmedBooking.datesEn : confirmedBooking.dates}<small>{isEnglish ? confirmedBooking.durationEn : confirmedBooking.duration}</small></span></Box>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <Box><PaymentsOutlinedIcon /><span><strong>{isEnglish ? "Payment" : "付款"}</strong>{isEnglish ? confirmedBooking.paymentEn : confirmedBooking.payment}<small>{isEnglish ? "Card fee: Visa/Mastercard 2.53%; Amex 3.57%." : "银行卡费：Visa/Mastercard 2.53%；Amex 3.57%。"}</small></span></Box>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <Box><ShieldOutlinedIcon /><span><strong>{isEnglish ? "Protection" : "保障"}</strong>{isEnglish ? confirmedBooking.coverEn : confirmedBooking.cover}</span></Box>
            </Grid>
          </Grid>

          <Box className="rental-email-details">
            <Box className="rental-cost-summary">
              <Typography variant="h3">{isEnglish ? "Confirmation cost breakdown" : "确认邮件费用明细"}</Typography>
              <Stack spacing={0} className="rental-cost-lines">
                {bookingCostLines.map((line) => (
                  <Box key={line.label}>
                    <span>{isEnglish ? line.labelEn : line.label}</span>
                    <strong>{line.value}</strong>
                  </Box>
                ))}
                <Box className="rental-cost-total">
                  <span>{isEnglish ? "Estimated total" : "预订预计总价"}</span>
                  <strong>NZ$2,052.96</strong>
                </Box>
              </Stack>
              <Typography color="text.secondary" className="rental-cost-caption">
                {isEnglish
                  ? "Loss Damage Waiver is included at no separate charge. Card fees and fuel are excluded."
                  : "Loss Damage Waiver（LDW）已包含且不单独收费；银行卡交易费和燃油不含在总价内。"}
              </Typography>
            </Box>

            <Box className="rental-confirmation-grid">
              {(isEnglish ? bookingDetailsEn : bookingDetailsZh).map((detail) => (
                <Box key={detail.title}>
                  <strong>{detail.title}</strong>
                  <span>{detail.body}</span>
                </Box>
              ))}
            </Box>
          </Box>

          <Alert severity="warning" className="rental-cover-limit">
            {isEnglish
              ? "The confirmation does not list windscreen or tyre protection. Zero Excess is not unconditional full insurance: overhead, underbody and water damage, unauthorised drivers, prohibited roads and other breaches may remain excluded. Do not drive Skippers Canyon."
              : "确认邮件没有列出玻璃或轮胎保障。零自付额也不等于无条件全险：车顶、底盘、涉水、未登记驾驶员、禁行道路及其他违约情形仍可能全额自付；不要驶入 Skippers Canyon。"}
          </Alert>

          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.25} className="rental-booking-actions">
            <Button href="https://www.budget.co.nz/en/reservation/view-modify-cancel" target="_blank" rel="noreferrer" variant="contained" endIcon={<OpenInNewIcon />}>
              {isEnglish ? "Manage Budget booking" : "管理 Budget 订单"}
            </Button>
            <Button href="https://www.budget.co.nz/en/customer-care/faqs/nz/protections-coverages" target="_blank" rel="noreferrer" variant="outlined" endIcon={<OpenInNewIcon />}>
              {isEnglish ? "Review cover exclusions" : "查看保障除外条款"}
            </Button>
          </Stack>
        </CardContent>
      </Card>

      <Grid container spacing={2}>
        {rentalSegments.map((segment) => (
          <Grid size={{ xs: 12, lg: 6 }} key={segment.id}>
            <Card className="rental-segment-card">
              <CardContent>
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={2}>
                  <Box>
                    <Typography className="rental-kicker">{isEnglish ? segment.labelEn : segment.label}</Typography>
                    <Typography variant="h3">{isEnglish ? segment.routeEn : segment.route}</Typography>
                  </Box>
                  <Chip label={segment.budget} color="primary" />
                </Stack>
                <Box className="rental-timeline">
                  <Typography>{isEnglish ? segment.datesEn : segment.dates}</Typography>
                  <Typography color="text.secondary">{isEnglish ? segment.durationEn : segment.duration}</Typography>
                </Box>
                <Stack spacing={1.25} className="rental-choice-list">
                  <Box><strong>{isEnglish ? "Primary" : "首选"}</strong><span>{isEnglish ? segment.primaryEn : segment.primary}</span></Box>
                  <Box><strong>{isEnglish ? "Fallback" : "备选"}</strong><span>{isEnglish ? segment.fallbackEn : segment.fallback}</span></Box>
                </Stack>
                <Typography color="text.secondary" className="rental-note">
                  {isEnglish ? segment.noteEn : segment.note}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Box>
        <Typography variant="h2" className="subsection-title">{isEnglish ? "Costed comparison" : "逐家费用测算"}</Typography>
        <Typography color="text.secondary" className="subsection-copy">
          {isEnglish
            ? "The Budget row is the booked checkout total from 27 Jul 2026. All other rows are retained only as historical comparison and should not be treated as current availability."
            : "Budget 行是 2026-07-27 已完成预订的最终结算总额；其余报价仅保留作历史比较，不代表当前库存或价格。"}
        </Typography>
        <TableContainer component={Card} className="rental-quote-table">
          <Table>
            <TableHead><TableRow>
              <TableCell>{isEnglish ? "Company / car" : "平台 / 车型"}</TableCell>
              <TableCell align="right">{isEnglish ? "Base + options" : "基础车价 + 选项"}</TableCell>
              <TableCell align="right">{isEnglish ? "Zero excess" : "零自付额险"}</TableCell>
              <TableCell align="right">{isEnglish ? "South total" : "南岛总价"}</TableCell>
              <TableCell>{isEnglish ? "Confidence" : "报价性质"}</TableCell>
            </TableRow></TableHead>
            <TableBody>{southQuotes.map((quote) => (
              <TableRow key={quote.company} className={quote.exact ? "quote-best" : undefined}>
                <TableCell><strong>{isEnglish ? quote.companyEn || quote.company : quote.company}</strong><br /><span>{isEnglish ? quote.carEn || quote.car : quote.car}</span></TableCell>
                <TableCell align="right">NZ${quote.base}</TableCell>
                <TableCell align="right">NZ${quote.cover}</TableCell>
                <TableCell align="right"><strong>NZ${quote.total}</strong></TableCell>
                <TableCell>{isEnglish ? quote.statusEn : quote.status}</TableCell>
              </TableRow>
            ))}</TableBody>
          </Table>
        </TableContainer>
        <Stack direction={{ xs: "column", md: "row" }} spacing={1} className="north-quote-strip">
          <Typography><strong>{isEnglish ? "North Island (two billed days, fully covered):" : "北岛短租（按 2 个计费日、含零自付额）："}</strong></Typography>
          {northQuotes.map((quote) => <Chip key={quote.company} label={`${quote.company} · NZ$${quote.total}`} variant="outlined" />)}
        </Stack>
        <Alert severity="success" className="rental-recommendation">
          {isEnglish
            ? "South Island decision is closed: keep the Budget booking and stop repricing unless the itinerary changes. Requote the short North Island hire 4–6 weeks before pickup and prefer an airport operator with zero-excess cover."
            : "南岛决策已完成：保留 Budget 订单，除非行程变化，否则不再反复比价。北岛短租在取车前 4–6 周重报，优先选择机场取还车方便且含零自付额的方案。"}
        </Alert>
      </Box>

      <Box>
        <Typography variant="h2" className="subsection-title">{isEnglish ? "Which company to book" : "租车公司怎么选"}</Typography>
        <Typography color="text.secondary" className="subsection-copy">
          {isEnglish ? "The ranking balances fully covered price, car condition, review depth and ease for Chinese travellers." : "排序同时考虑含全险价格、车辆状况、好评基础和中国游客使用便利度。"}
        </Typography>
        <Grid container spacing={2}>
          {providers.map((provider) => (
            <Grid size={{ xs: 12, md: 6, lg: 3 }} key={provider.name}>
              <Card className="provider-card">
                <CardContent>
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography variant="h3">{provider.name}</Typography>
                    <Chip size="small" label={isEnglish ? provider.verdictEn : provider.verdict} />
                  </Stack>
                  <List dense disablePadding>
                    <ListItem disableGutters><ListItemIcon><LocalGasStationIcon /></ListItemIcon><ListItemText primary={isEnglish ? provider.priceEn : provider.price} /></ListItem>
                    <ListItem disableGutters><ListItemIcon><DirectionsCarIcon /></ListItemIcon><ListItemText primary={isEnglish ? provider.vehicleEn : provider.vehicle} /></ListItem>
                    <ListItem disableGutters><ListItemIcon><FactCheckOutlinedIcon /></ListItemIcon><ListItemText primary={isEnglish ? provider.reputationEn : provider.reputation} /></ListItem>
                    <ListItem disableGutters><ListItemIcon><LanguageIcon /></ListItemIcon><ListItemText primary={isEnglish ? provider.chineseEn : provider.chinese} /></ListItem>
                  </List>
                  <Button endIcon={<OpenInNewIcon />} href={provider.url} target="_blank" rel="noreferrer" variant="outlined" fullWidth>
                    {isEnglish ? "Check direct quote" : "查看官网报价"}
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card className="rental-guide-card">
            <CardContent>
              <Stack direction="row" spacing={1} alignItems="center"><ShieldOutlinedIcon /><Typography variant="h3">{isEnglish ? "After-booking follow-up" : "预订后的跟进"}</Typography></Stack>
              <List>
                {bookingSteps.map((step, index) => (
                  <ListItem key={step} disableGutters alignItems="flex-start">
                    <ListItemIcon><span className="rental-step-number">{index + 1}</span></ListItemIcon>
                    <ListItemText primary={step} />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card className="rental-guide-card">
            <CardContent>
              <Stack direction="row" spacing={1} alignItems="center"><FactCheckOutlinedIcon /><Typography variant="h3">{isEnglish ? "Pickup checklist" : "取车与证件清单"}</Typography></Stack>
              <List>
                {checklist.map((item) => (
                  <ListItem key={item} disableGutters alignItems="flex-start">
                    <ListItemIcon><CheckCircleOutlineIcon color="success" /></ListItemIcon>
                    <ListItemText primary={item} />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Stack>
  );
}
