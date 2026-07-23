import { Box, Button, Card, CardContent, Checkbox, Chip, Grid2 as Grid, LinearProgress, Stack, Typography } from "@mui/material";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import { PanelHero } from "../PanelHero";
import { assetPath } from "../../assets";
import { bookingItems, hotelPlans } from "../../tripData";
import { useLanguage } from "../../LanguageContext";

const bookingTitleEn = {
  "flight-nz619": "NZ619 Auckland → Queenstown",
  "south-car": "Omega South Island rental car",
  "hotel-airport": "Auckland Airport hotel",
  "hotel-queenstown": "Queenstown accommodation",
  "hotel-wanaka": "Wānaka accommodation",
  "mount-cook": "Aoraki / Mount Cook accommodation",
  "mount-cook-helicopter": "Mount Cook glacier helicopter",
  "mount-cook-stargazing": "Big Sky Stargazing",
  "hotel-christchurch": "Christchurch accommodation",
  "hotel-rotorua": "Rotorua accommodation",
  "walter-peak": "Walter Peak cruise and barbecue",
  "flight-jq242": "JQ242 Christchurch → Auckland",
  "north-car": "North Island rental car",
  hobbiton: "Hobbiton Movie Set",
};

const hotelDetailsEn = {
  "Novotel Auckland Airport": {
    place: "Auckland Airport",
    date: "28 Sep; 7–8 Oct",
    nights: "3 nights total",
    label: "Preferred",
    ratingDetail: "Location 9.8 · Cleanliness 9.3 · Comfort 9.4",
    reason: "Walk straight to the hotel after the late international arrival and the evening domestic flight. This best supports a low-stress itinerary.",
    facts: ["Outside the international terminal", "Walk to the domestic terminal", "24-hour reception"],
    backup: "ibis budget Auckland Airport — a lower-cost option about 800 m from the terminal, with airport-bus access.",
  },
  "Blue Peaks Lodge": {
    place: "Queenstown",
    date: "29 Sep–2 Oct",
    nights: "4 nights",
    label: "Preferred",
    ratingDetail: "Location 9.2 · Cleanliness 9.0 · Comfort 8.9",
    reason: "Close to the town centre for restaurants and lakefront walks, with free on-site parking. Request a quiet room when booking.",
    facts: ["Walkable town-centre location", "Free parking", "Near an airport-bus stop"],
    backup: "Holiday Inn Express & Suites Queenstown — breakfast is included and service is standardised, but parking costs extra.",
  },
  "Edgewater Wānaka": {
    place: "Wānaka",
    date: "3–4 Oct",
    nights: "2 nights",
    label: "Preferred",
    ratingDetail: "Location 9.4 · Cleanliness 9.1 · Comfort 9.2",
    reason: "A lakefront stay with easy parking and a relaxed resort feel for two nights. Activities can be adjusted around the weather.",
    facts: ["Lakefront location", "Free parking", "About a 20-minute walk to town"],
    backup: "Wānaka Hotel — closer to the town centre and restaurants, with free parking and often more manageable prices.",
  },
  "The Hermitage Hotel": {
    place: "Aoraki / Mount Cook",
    date: "5 Oct",
    nights: "1 night",
    label: "Preferred",
    ratingDetail: "Location 9.4 · Comfort 8.9 · Value 7.4",
    reason: "For a one-night stay, keeping the mountain view, restaurants and activities in one place saves the most time. Book this hotel first.",
    facts: ["Inside the national park", "Free parking", "Dining and activities on site"],
    backup: "Mt Cook Lodge / Motels — a more casual option with kitchens in some rooms. Confirm whether 2026 renovation work affects the chosen room.",
  },
  "Rydges Latimer Christchurch": {
    place: "Christchurch",
    date: "6 Oct",
    nights: "1 night",
    label: "Preferred",
    ratingDetail: "Location 9.1 · Cleanliness 9.0 · Comfort 9.0",
    reason: "On the eastern side of the city centre, convenient for Riverside Market and the Botanic Gardens, with on-site parking.",
    facts: ["Central-city location", "Paid on-site parking", "About 20 minutes to the airport"],
    backup: "Novotel Christchurch Cathedral Square — more central for walking, with paid parking.",
  },
  "JetPark Hotel Rotorua": {
    place: "Rotorua",
    date: "9 Oct",
    nights: "1 night",
    label: "Updated preferred option",
    ratingDetail: "Location 8.9 · Cleanliness 8.8 · Comfort 8.8",
    reason: "Recently refurbished rooms, reliable guest ratings and a convenient central location for dinner before Te Puia the next morning.",
    facts: ["Free parking", "Recently refurbished", "About a 5-minute walk to town"],
    backup: "Rydges Rotorua — closer to Te Puia, but choose it only if the price is clearly lower or proximity matters more.",
  },
};

const hotelLinkLabelsEn = ["Official website", "Guest reviews", "Alternative website"];

export function BookingPanel({ checked, setChecked, storageKey }) {
  const { language } = useLanguage();
  const isEnglish = language === "en";
  const done = Object.values(checked).filter(Boolean).length;
  const percent = Math.round((done / bookingItems.length) * 100);
  const toggle = (id) => {
    setChecked((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      localStorage.setItem(storageKey, JSON.stringify(next));
      return next;
    });
  };

  return (
    <Stack spacing={3}>
      <PanelHero
        image={assetPath("images/hero-route-render.webp")}
        kicker="BOOKING CHECKLIST"
        title={isEnglish ? "Flights, hotels and key bookings" : "酒店与关键预订"}
        desc={isEnglish ? "Confirm accommodation first, followed by domestic flights, rental cars and popular activities." : "先把12晚住宿落定，再依次锁定国内航班、租车和热门项目。"}
      />
      <Box>
        <Typography variant="h2" className="subsection-title">{isEnglish ? "Accommodation" : "住宿安排"}</Typography>
        <Typography color="text.secondary" className="subsection-copy">
          {isEnglish ? "Selections prioritise the route, parking, comfort and guest ratings. Recheck availability and conditions before booking." : "综合动线、停车、住宿条件与住客评分筛选；评分为 Booking.com 于2026年7月核对的快照，预订前请再次确认。"}
        </Typography>
        <Grid container spacing={1.5} className="hotel-grid">
          {hotelPlans.map((hotel) => {
            const translatedHotel = isEnglish ? { ...hotel, ...hotelDetailsEn[hotel.name] } : hotel;
            return (
            <Grid size={{ xs: 12, md: 6 }} key={hotel.place}>
              <Card className="hotel-card">
                <CardContent>
                  <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1.5}>
                    <Box>
                      <Typography variant="h3">{translatedHotel.place}</Typography>
                      <Typography variant="caption" color="text.secondary">{translatedHotel.date}</Typography>
                    </Box>
                    <Chip label={translatedHotel.nights} size="small" />
                  </Stack>
                  <Typography className="hotel-label">{translatedHotel.label}</Typography>
                  <Typography
                    className="hotel-name"
                    component="a"
                    href={hotel.links[0][1]}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={`${hotel.name} · ${isEnglish ? "official website" : "官方网站"}`}
                  >
                    {hotel.name}<OpenInNewIcon aria-hidden="true" />
                  </Typography>
                  <Box className="hotel-rating">
                    <strong>{hotel.rating}</strong>
                    <span>{translatedHotel.ratingDetail}</span>
                  </Box>
                  <Typography color="text.secondary" className="hotel-reason">{translatedHotel.reason}</Typography>
                  <Stack direction="row" className="hotel-facts">
                    {translatedHotel.facts.map((fact) => <Chip key={fact} label={fact} size="small" />)}
                  </Stack>
                  <Typography className="hotel-backup"><strong>{isEnglish ? "Alternative: " : "备选："}</strong>{translatedHotel.backup}</Typography>
                  <Stack direction="row" className="hotel-links">
                    {hotel.links.map(([label, href], index) => (
                      <Button key={label} component="a" href={href} target="_blank" rel="noreferrer" size="small">
                        {isEnglish ? hotelLinkLabelsEn[index] : label}
                      </Button>
                    ))}
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          );})}
        </Grid>
        <Typography className="hotel-booking-note">
          <strong>{isEnglish ? "Booking order: " : "预订顺序："}</strong>
          {isEnglish ? "Book Aoraki / Mount Cook first, followed by Queenstown and Auckland Airport. Use free-cancellation rates elsewhere until the route is final." : "先订库克山，其次是皇后镇与奥克兰机场；其他城市优先选择“可免费取消”的房价，待路线完全确认后再换成更优惠的不可退价格。"}
        </Typography>
      </Box>
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 8 }}>
          <Grid container spacing={1.5}>
            {bookingItems.map(([id, title, desc]) => (
              <Grid size={{ xs: 12, sm: 6 }} key={id}>
                <Card className={checked[id] ? "booking-card checked" : "booking-card"} onClick={() => toggle(id)}>
                  <CardContent>
                    <Stack direction="row" spacing={1.5}>
                      <Checkbox checked={Boolean(checked[id])} tabIndex={-1} />
                      <Box>
                        <Typography fontWeight={900}>{isEnglish ? (bookingTitleEn[id] ?? title) : title}</Typography>
                        <Typography color="text.secondary" variant="body2">{isEnglish ? "Open this item to review the booking details and current status." : desc}</Typography>
                      </Box>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <Card className="progress-card">
            <CardContent>
              <Typography>{isEnglish ? "Completed" : "当前完成"}</Typography>
              <Typography className="big-progress">{percent}%</Typography>
              <LinearProgress variant="determinate" value={percent} />
              <Typography color="text.secondary" className="progress-note">
                {isEnglish ? "Prioritise Aoraki / Mount Cook accommodation, the helicopter flight and stargazing. Choose flexible terms for weather-dependent activities." : "先锁定库克山住宿、直升机与观星，再订皇后镇、奥克兰机场和两段国内航班；天气型项目优先选可改期或可退款条款。"}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Stack>
  );
}
