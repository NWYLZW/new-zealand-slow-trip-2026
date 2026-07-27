import { useEffect, useMemo, useState } from "react";
import { Box, Button, Chip, Dialog, DialogContent, DialogTitle, IconButton, Paper, Stack, Tab, Tabs, Typography, useMediaQuery } from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import CloseIcon from "@mui/icons-material/Close";
import CompareArrowsIcon from "@mui/icons-material/CompareArrows";
import DirectionsWalkIcon from "@mui/icons-material/DirectionsWalk";
import LocalParkingIcon from "@mui/icons-material/LocalParking";
import NightShelterIcon from "@mui/icons-material/NightShelter";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import { divIcon, latLngBounds } from "leaflet";
import { MapContainer, Marker, TileLayer, Tooltip, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { agodaUrlForStay, aucklandAirportHotels, aucklandAirportOvernightGuides, bookingUrlForStay, officialUrlForStay } from "../data/aucklandAirportHotels";
import "./HotelComparisonDialog.css";

const airportPosition = [-37.0082, 174.785];
const nzdToCny = 3.9198;

function currencyLabel(nzd) {
  if (nzd == null) return null;
  const nzdLabel = Number.isInteger(nzd) ? nzd : nzd.toFixed(2);
  return `NZD ${nzdLabel} · 约 ¥${Math.round(nzd * nzdToCny).toLocaleString("zh-CN")}`;
}

function stayNightCount(checkIn, checkOut) {
  const milliseconds = Date.parse(`${checkOut}T00:00:00Z`) - Date.parse(`${checkIn}T00:00:00Z`);
  return Math.max(1, Math.round(milliseconds / 86400000));
}

function platformUrl(hotel, platform) {
  if (platform === "Booking.com") return hotel.bookingStayUrl;
  if (platform === "Agoda") return hotel.agodaStayUrl;
  if (platform === "Airbnb") return hotel.stayUrl;
  if (platform === "Google") return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(hotel.mapQuery)}`;
  return null;
}

function FitHotelMap({ hotels }) {
  const map = useMap();
  const signature = hotels.map((hotel) => hotel.position.join(",")).join("|");

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      map.invalidateSize({ pan: false });
      map.fitBounds(latLngBounds([airportPosition, ...hotels.map((hotel) => hotel.position)]), {
        padding: [42, 42],
        maxZoom: 15,
      });
    });

    return () => cancelAnimationFrame(frame);
  }, [map, signature]);

  return null;
}

function comparisonMapIcon(label, type, selected = false) {
  return divIcon({
    className: "hotel-comparison-map-icon-wrap",
    html: `<span class="hotel-comparison-map-icon ${type}${selected ? " is-selected" : ""}">${label}</span>`,
    iconAnchor: [18, 18],
    iconSize: [36, 36],
  });
}

function HotelComparisonMap({ activeHotelId, hotels, isEnglish, onHotelChange }) {
  return (
    <Box className="hotel-comparison-map-wrap">
      <MapContainer
        aria-label={isEnglish ? "Auckland Airport stay locations" : "奥克兰机场住宿位置地图"}
        center={airportPosition}
        className="hotel-comparison-map"
        scrollWheelZoom
        zoom={14}
        zoomControl
      >
        <TileLayer
          attribution="&copy; OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker icon={comparisonMapIcon("✈", "airport")} position={airportPosition}>
          <Tooltip direction="top" offset={[0, -18]} permanent>
            {isEnglish ? "Auckland Airport" : "奥克兰机场"}
          </Tooltip>
        </Marker>
        {hotels.map((hotel, index) => {
          const selected = hotel.id === activeHotelId;
          return (
            <Marker
              eventHandlers={{ click: () => onHotelChange(hotel.id) }}
              icon={comparisonMapIcon(String(index + 1), "hotel", selected)}
              key={hotel.id}
              position={hotel.position}
              zIndexOffset={selected ? 500 : 0}
            >
              <Tooltip direction="top" offset={[0, -18]} permanent={selected}>
                {hotel.name}
              </Tooltip>
            </Marker>
          );
        })}
        <FitHotelMap hotels={hotels} />
      </MapContainer>
      <Box className="hotel-comparison-map-caption">
        <Typography fontWeight={900}>{isEnglish ? "Location overview" : "位置总览"}</Typography>
        <Typography color="text.secondary">
          {isEnglish ? "Select a numbered marker to switch the hotel tab below." : "点击带编号的酒店标记，可同步切换下方酒店标签。"}
        </Typography>
      </Box>
    </Box>
  );
}

export function HotelComparisonDialog({ isEnglish, onClose, onSelect, open, selectedHotelId, stay }) {
  const fullScreen = useMediaQuery("(max-width:600px)");
  const [activeHotelId, setActiveHotelId] = useState(selectedHotelId || aucklandAirportHotels[0].id);
  const [gallery, setGallery] = useState(null);
  const [hotelSlideIndex, setHotelSlideIndex] = useState(0);
  const dates = stay ?? { checkIn: "2026-09-28", checkOut: "2026-09-29", label: "9月28日—29日" };
  const nights = stayNightCount(dates.checkIn, dates.checkOut);
  const cards = useMemo(() => aucklandAirportHotels.filter((hotel) => !hotel.isAirbnb).map((hotel) => ({
    ...hotel,
    bookingStayUrl: hotel.bookingUrl ? bookingUrlForStay(hotel, dates.checkIn, dates.checkOut) : null,
    agodaStayUrl: hotel.agodaUrl ? agodaUrlForStay(hotel, dates.checkIn, dates.checkOut) : null,
    officialStayUrl: officialUrlForStay(hotel, dates.checkIn, dates.checkOut),
    stayUrl: officialUrlForStay(hotel, dates.checkIn, dates.checkOut),
    currentRate: hotel.rateSnapshots?.[`${dates.checkIn}/${dates.checkOut}`] ?? null,
  })), [dates.checkIn, dates.checkOut]);
  const activeHotel = cards.find((hotel) => hotel.id === activeHotelId) ?? cards[0];
  const galleryImages = gallery?.images ?? [];
  const galleryIndex = gallery?.index ?? 0;
  const galleryImage = galleryImages[galleryIndex] ?? null;

  const openGallery = (images, index, title) => setGallery({ images, index, title });
  const closeGallery = () => setGallery(null);
  const showPreviousImage = () => setGallery((current) => ({ ...current, index: (current.index - 1 + current.images.length) % current.images.length }));
  const showNextImage = () => setGallery((current) => ({ ...current, index: (current.index + 1) % current.images.length }));

  useEffect(() => {
    if (open) {
      setActiveHotelId(selectedHotelId || cards[0].id);
      setGallery(null);
      setHotelSlideIndex(0);
    }
  }, [cards, open, selectedHotelId]);

  useEffect(() => {
    setHotelSlideIndex(0);
  }, [activeHotelId]);

  return (
    <Dialog
      aria-labelledby="hotel-comparison-title"
      className="hotel-comparison-dialog"
      fullScreen={fullScreen}
      fullWidth
      maxWidth="lg"
      onClose={onClose}
      open={open}
    >
      <DialogTitle id="hotel-comparison-title" className="hotel-comparison-title">
        <Box>
          <Stack direction="row" alignItems="center" spacing={1}>
            <CompareArrowsIcon aria-hidden="true" />
            <Typography component="h2" variant="h3">
              {isEnglish ? "Auckland Airport stay comparison" : "奥克兰机场住宿比选"}
            </Typography>
          </Stack>
          <Typography color="text.secondary">
            {isEnglish ? `${dates.checkIn}—${dates.checkOut} · 2 guests · 1 room` : `${dates.label} · 2人 · 1间`}
          </Typography>
        </Box>
        <IconButton aria-label={isEnglish ? "Close" : "关闭"} onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent className="hotel-comparison-content">
        <HotelComparisonMap
          activeHotelId={activeHotel.id}
          hotels={cards}
          isEnglish={isEnglish}
          onHotelChange={setActiveHotelId}
        />
        <Box className="hotel-comparison-tabs-panel">
          <Tabs
            aria-label={isEnglish ? "Choose accommodation to compare" : "选择住宿进行比选"}
            className="hotel-comparison-tabs"
            onChange={(_, value) => setActiveHotelId(value)}
            scrollButtons="auto"
            value={activeHotel.id}
            variant="scrollable"
          >
            {cards.map((hotel, index) => (
              <Tab
                key={hotel.id}
                label={(
                  <Stack alignItems="center" direction="row" spacing={0.7}>
                    <span>{`${index + 1} · ${hotel.name.replace(" Auckland Airport", "")}`}</span>
                    {hotel.id === selectedHotelId && <CheckCircleIcon className="hotel-tab-selected-icon" />}
                  </Stack>
                )}
                value={hotel.id}
              />
            ))}
          </Tabs>
          <Box className="hotel-comparison-grid">
          {[activeHotel].map((hotel) => {
            const selected = hotel.id === selectedHotelId;
            return (
              <Paper className="hotel-option-card" data-selected={selected} key={hotel.id} variant="outlined">
                <Stack className="hotel-option-heading" direction="row" justifyContent="space-between" alignItems="center" spacing={1}>
                  <Stack className="hotel-option-heading-title" direction="row" alignItems="center" spacing={0.8}>
                    <Chip label={isEnglish ? hotel.recommendationEn : hotel.recommendation} size="small" />
                    <Typography
                      className="hotel-option-name"
                      component="a"
                      href={hotel.stayUrl}
                      rel="noreferrer"
                      target="_blank"
                    >
                      {hotel.name}<OpenInNewIcon aria-hidden="true" />
                    </Typography>
                  </Stack>
                  {selected && <Chip color="success" icon={<CheckCircleIcon />} label={isEnglish ? "Selected" : "已选择"} size="small" />}
                </Stack>
                {hotel.hotelImages?.length > 0 && (
                  <Box className="hotel-photo-carousel">
                    <Box component="figure" onClick={() => openGallery(hotel.hotelImages, hotelSlideIndex, isEnglish ? "Hotel photos" : "酒店图片")}>
                      <Box alt={hotel.hotelImages[hotelSlideIndex].label} component="img" src={hotel.hotelImages[hotelSlideIndex].src} />
                      <Typography component="figcaption">{hotelSlideIndex + 1} / {hotel.hotelImages.length} · {hotel.hotelImages[hotelSlideIndex].label} · {hotel.hotelImages[hotelSlideIndex].source}</Typography>
                    </Box>
                    {hotel.hotelImages.length > 1 && (
                      <>
                        <IconButton aria-label={isEnglish ? "Previous hotel photo" : "上一张酒店图片"} className="hotel-carousel-prev" onClick={() => setHotelSlideIndex((current) => (current - 1 + hotel.hotelImages.length) % hotel.hotelImages.length)}><ArrowBackIosNewIcon /></IconButton>
                        <IconButton aria-label={isEnglish ? "Next hotel photo" : "下一张酒店图片"} className="hotel-carousel-next" onClick={() => setHotelSlideIndex((current) => (current + 1) % hotel.hotelImages.length)}><ArrowForwardIosIcon /></IconButton>
                        <Box className="hotel-carousel-dots">{hotel.hotelImages.map((image, index) => <button aria-label={`${isEnglish ? "Show hotel photo" : "查看酒店图片"} ${index + 1}`} className={index === hotelSlideIndex ? "is-active" : ""} key={image.src} onClick={() => setHotelSlideIndex(index)} />)}</Box>
                      </>
                    )}
                  </Box>
                )}
                <Typography className="hotel-option-summary" color="text.secondary">
                  {isEnglish ? hotel.summaryEn : hotel.summary}
                </Typography>
                <Stack className="hotel-option-facts" spacing={0.7}>
                  <Stack direction="row" spacing={0.8}><DirectionsWalkIcon /><Typography>{isEnglish ? hotel.accessEn : hotel.access}</Typography></Stack>
                  <Stack direction="row" spacing={0.8}><LocalParkingIcon /><Typography>{isEnglish ? hotel.parkingEn : hotel.parking}</Typography></Stack>
                </Stack>
                <Box className="hotel-platform-ratings">
                  {hotel.ratings.map((rating) => {
                    const href = platformUrl(hotel, rating.platform);
                    return (
                    <Box
                      className={href ? "is-clickable" : ""}
                      component={href ? "a" : "div"}
                      href={href || undefined}
                      key={rating.platform}
                      rel={href ? "noreferrer" : undefined}
                      target={href ? "_blank" : undefined}
                    >
                      <Typography variant="caption">{rating.platform}</Typography>
                      <Typography fontWeight={900}>{rating.score}</Typography>
                      <Typography variant="caption" color="text.secondary">{rating.reviews}</Typography>
                    </Box>
                  )})}
                </Box>
                {hotel.roomTypes?.length > 0 && (
                  <Box className="hotel-room-types">
                    <Typography fontWeight={900}>{isEnglish ? "Available room types" : "可选房型与设施"}</Typography>
                    {hotel.roomTypes.map((room, roomIndex) => {
                      const bookingQuotedRoom = hotel.currentRate && (
                        room.rateKey
                          ? room.rateKey === hotel.currentRate.roomKey
                          : room.name === hotel.currentRate.room.split(" · ")[0]
                      );
                      const agodaQuotedRoom = hotel.currentRate?.agoda && (
                        room.rateKey
                          ? room.rateKey === hotel.currentRate.agoda.roomKey
                          : room.name === hotel.currentRate.agoda.room.split(" · ")[0]
                      );
                      const roomImages = room.images ?? (hotel.roomImages?.[roomIndex] ? [hotel.roomImages[roomIndex]] : []);
                      const explicitRates = hotel.currentRate?.roomRates?.[room.rateKey];
                      const bookingRate = explicitRates?.booking ?? (bookingQuotedRoom ? hotel.currentRate : null);
                      const agodaRate = explicitRates?.agoda ?? (agodaQuotedRoom ? hotel.currentRate.agoda : null);
                      return (
                      <Box className="hotel-room-type" key={room.name}>
                        <Box className="hotel-room-type-layout">
                          {roomImages.length > 0 && <Box className="hotel-room-photo-strip">
                            {roomImages.map((image, imageIndex) => <Box
                              alt={`${image.label} · 来源：${image.source}`}
                              component="img"
                              key={image.src}
                              onClick={() => openGallery(roomImages, imageIndex, room.name)}
                              src={image.src}
                            />)}
                          </Box>}
                          <Box>
                            <Typography fontWeight={900}>{room.name}</Typography>
                            <Typography color="text.secondary">{room.size} · {room.bed}</Typography>
                            <Typography>{room.facilities.join(" · ")}</Typography>
                            {roomImages.length > 1 && <Typography className="hotel-room-photo-count">{isEnglish ? `${roomImages.length} room photos · tap to view` : `${roomImages.length} 张客房图 · 点击查看`}</Typography>}
                          </Box>
                        </Box>
                        {(bookingRate || agodaRate) && (
                          <Box className="hotel-room-platform-prices">
                            {bookingRate && <Box>
                              <Typography className="hotel-room-platform-name" component="a" href={bookingRate.useOfficialUrl || hotel.currentRate.useOfficialUrl ? hotel.officialStayUrl : hotel.bookingStayUrl} rel="noreferrer" target="_blank">
                                {bookingRate.source}<OpenInNewIcon />
                              </Typography>
                              <Typography color="text.secondary">{isEnglish ? "Platform room" : "平台房型"}：{bookingRate.room.split(" · ")[0]}</Typography>
                              {bookingRate.originalCurrency && <Typography color="text.secondary">{isEnglish ? "Platform original price" : "平台原始价"}：{bookingRate.originalCurrency} {bookingRate.originalAmount}</Typography>}
                              <Typography fontWeight={900}>{currencyLabel(bookingRate.nonRefundableNzd)}</Typography>
                              <Typography color="text.secondary">{bookingRate.rateLabel ?? (isEnglish ? "Total · non-refundable" : `${dates.label}总价 · 不可退款`)}</Typography>
                              {nights > 1 && <Typography color="text.secondary">{isEnglish ? "Average per night" : "平均每晚"} {currencyLabel(bookingRate.nonRefundableNzd / nights)}</Typography>}
                              {bookingRate.refundableNzd != null && (
                                <>
                                  <Typography fontWeight={900}>{currencyLabel(bookingRate.refundableNzd)}</Typography>
                                  <Typography color="text.secondary">{isEnglish ? `Total · free cancellation before ${bookingRate.cancelUntil}` : `${dates.label}总价 · ${bookingRate.cancelUntil} 前免费取消`}</Typography>
                                  {nights > 1 && <Typography color="text.secondary">{isEnglish ? "Average per night" : "平均每晚"} {currencyLabel(bookingRate.refundableNzd / nights)}</Typography>}
                                </>
                              )}
                              {bookingRate.conversionNote && <Typography color="text.secondary">{bookingRate.conversionNote}</Typography>}
                              {(bookingRate.payment || bookingRate.breakfast) && <Typography color="text.secondary">{[bookingRate.payment, bookingRate.breakfast].filter(Boolean).join(" · ")}</Typography>}
                            </Box>}
                            {agodaRate ? <Box>
                              <Typography className="hotel-room-platform-name" component="a" href={hotel.agodaStayUrl} rel="noreferrer" target="_blank">
                                Agoda<OpenInNewIcon />
                              </Typography>
                              <Typography color="text.secondary">{isEnglish ? "Platform room" : "平台房型"}：{agodaRate.room.split(" · ")[0]}</Typography>
                              <Typography fontWeight={900}>{currencyLabel(agodaRate.nonRefundableNzd)}</Typography>
                              <Typography color="text.secondary">{dates.label}总价 · 会员含税不可退款</Typography>
                              {nights > 1 && <Typography color="text.secondary">{isEnglish ? "Average per night" : "平均每晚"} {currencyLabel(agodaRate.nonRefundableNzd / nights)}</Typography>}
                              <Typography fontWeight={900}>{currencyLabel(agodaRate.refundableNzd)}</Typography>
                              <Typography color="text.secondary">{agodaRate.cancelUntil ? `${dates.label}总价 · ${agodaRate.cancelUntil} 前免费取消` : `${dates.label}总价 · 免费取消，截止时间需结算页确认`}</Typography>
                              {nights > 1 && <Typography color="text.secondary">{isEnglish ? "Average per night" : "平均每晚"} {currencyLabel(agodaRate.refundableNzd / nights)}</Typography>}
                              <Typography color="text.secondary">{agodaRate.payment} · {agodaRate.breakfast}</Typography>
                            </Box> : bookingRate && <Box className="hotel-room-platform-pending">
                              <Typography className="hotel-room-platform-name" component="a" href={hotel.agodaStayUrl} rel="noreferrer" target="_blank">Agoda<OpenInNewIcon /></Typography>
                              <Typography fontWeight={900}>{isEnglish ? "No verifiable rate for these dates" : "当前日期暂无可核验报价"}</Typography>
                              <Typography color="text.secondary">{isEnglish ? "Open Agoda with the same dates to re-check availability." : `已带入${dates.label}、2 人 1 间；可进入 Agoda 再次确认库存。`}</Typography>
                            </Box>}
                          </Box>
                        )}
                      </Box>
                    )})}
                  </Box>
                )}
                <Box className="hotel-option-pros-cons">
                  <Box>
                    <Typography fontWeight={900}>{isEnglish ? "Good for" : "优点"}</Typography>
                    {hotel.strengths.map((item) => <Typography key={item}>+ {item}</Typography>)}
                  </Box>
                  <Box>
                    <Typography fontWeight={900}>{isEnglish ? "Watch for" : "注意"}</Typography>
                    {hotel.cautions.map((item) => <Typography key={item}>− {item}</Typography>)}
                  </Box>
                </Box>
                {hotel.id === "novotel-auckland-airport" && (
                  <Box className="airport-overnight-alternative">
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <NightShelterIcon aria-hidden="true" />
                      <Box>
                        <Typography fontWeight={900}>{isEnglish ? "Alternative: sleep in the airport" : "省钱备选：直接留宿机场"}</Typography>
                        <Typography color="text.secondary">{isEnglish ? "Possible, but not recommended before the next day's flight." : "可以过夜，但不建议作为这次深夜落地后的首选。"}</Typography>
                      </Box>
                    </Stack>
                    <Box className="airport-overnight-verdict">
                      <Typography><b>{isEnglish ? "Where" : "能睡哪里"}：</b>{isEnglish ? "International terminal level 2; the domestic terminal closes around midnight." : "国际航站楼 24 小时开放，二楼有无扶手木椅、薄软椅和少量充电；国内航站楼午夜关闭，不能过夜。"}</Typography>
                      <Typography><b>{isEnglish ? "Comfort" : "实际舒适度"}：</b>{isEnglish ? "Cold, bright and noisy. Several travellers reported very limited sleep." : "夜里冷、灯光和环境声持续，店铺大多关闭；有作者 43 小时行程只睡约 3 小时。"}</Typography>
                      <Typography><b>{isEnglish ? "Useful" : "可利用设施"}：</b>{isEnglish ? "Showers are in the domestic terminal; walk 10–15 minutes following the green line." : "国内楼 3 号门附近二楼有淋浴，需自备洗漱用品；两楼沿绿色指引线步行约 10—15 分钟。"}</Typography>
                      <Typography><b>{isEnglish ? "Verdict" : "建议"}：</b>{isEnglish ? "Only for a very tight budget and if poor sleep is acceptable." : "若只是极限省钱且能接受几乎睡不好，可以考虑；你们第二天还要飞皇后镇，住 Novotel 更稳妥。"}</Typography>
                    </Box>
                    <Box className="airport-overnight-guides">
                      {aucklandAirportOvernightGuides.map((guide, index) => (
                        <Box component="a" href={guide.url} key={guide.url} rel="noreferrer" target="_blank">
                          <Typography variant="caption">小红书 · {index + 1}/5 · {guide.author}</Typography>
                          <Typography fontWeight={900}>{guide.title}<OpenInNewIcon /></Typography>
                          <Typography color="text.secondary">{guide.note}</Typography>
                        </Box>
                      ))}
                    </Box>
                  </Box>
                )}
                <Button
                  className="hotel-select-button"
                  disabled={selected}
                  fullWidth
                  onClick={() => onSelect(hotel)}
                  variant={selected ? "outlined" : "contained"}
                >
                  {selected ? (isEnglish ? "Current choice" : "当前选择") : (isEnglish ? "Choose this hotel" : "选择这家")}
                </Button>
              </Paper>
            );
          })}
          </Box>
        </Box>
      </DialogContent>
      <Dialog className="hotel-photo-lightbox" fullScreen onClose={closeGallery} open={Boolean(galleryImage)}>
        {galleryImage && (
          <Box className="hotel-photo-lightbox-stage">
            <IconButton aria-label={isEnglish ? "Close photo viewer" : "关闭图片查看器"} className="hotel-photo-lightbox-close" onClick={closeGallery}>
              <CloseIcon />
            </IconButton>
            {galleryImages.length > 1 && (
              <IconButton aria-label={isEnglish ? "Previous photo" : "上一张图片"} className="hotel-photo-lightbox-prev" onClick={showPreviousImage}>
                <ArrowBackIosNewIcon />
              </IconButton>
            )}
            <Box alt={galleryImage.label} component="img" src={galleryImage.src} />
            {galleryImages.length > 1 && (
              <IconButton aria-label={isEnglish ? "Next photo" : "下一张图片"} className="hotel-photo-lightbox-next" onClick={showNextImage}>
                <ArrowForwardIosIcon />
              </IconButton>
            )}
            <Box className="hotel-photo-lightbox-caption">
              <Typography fontWeight={900}>{activeHotel.name} · {gallery.title}</Typography>
              <Typography>{galleryIndex + 1} / {galleryImages.length} · {galleryImage.label}</Typography>
              <Typography>{isEnglish ? "Source" : "图片来源"}：{galleryImage.source}</Typography>
            </Box>
            {galleryImages.length > 1 && <Box className="hotel-photo-lightbox-gallery" aria-label={isEnglish ? "Photo gallery" : "图片画廊"}>
              {galleryImages.map((image, index) => <button aria-label={`${isEnglish ? "Show photo" : "查看图片"} ${index + 1}：${image.label}`} className={index === galleryIndex ? "is-active" : ""} key={image.src} onClick={() => setGallery((current) => ({ ...current, index }))}>
                <img alt="" src={image.src} />
              </button>)}
            </Box>}
          </Box>
        )}
      </Dialog>
    </Dialog>
  );
}
