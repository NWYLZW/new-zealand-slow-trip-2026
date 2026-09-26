import { useMemo, useRef, useState } from "react";
import { useLanguage } from "../LanguageContext";
import { usePrivateVault } from "../PrivateVaultContext";
import { confirmedStayTransitionsOn } from "../data/confirmedStayTimeline";
import { confirmedAccommodationBookings } from "../data/confirmedAccommodationBookings";
import { confirmedRentalBookings } from "../data/rentalBookings";
import { getAdventureCalendarDays } from "../components/calendar/tripCalendarData";
import { activityBookingPlans } from "../tripData";
import { preTripChecklist } from "../data/preTripChecklist";
import { BagIcon, CalendarIcon, CarIcon, CityIcon, FlightIcon, LocationMapIcon, LockIcon, NextIcon, StarsIcon, TasksIcon } from "./SketchIcons";
import { PencilSurface } from "./pencil/PencilSurface";
import { PanelDivider } from "./pencil/PanelDivider";
import { PencilText } from "./pencil/PencilText";
import { adventureStayName } from "./adventureStayName";
import "./AdventureBag.css";

const tabs = [
  { id: "stays", zh: "住宿", en: "Stays", Icon: CityIcon },
  { id: "car", zh: "租车", en: "Car", Icon: CarIcon },
  { id: "activities", zh: "活动", en: "Activities", Icon: StarsIcon },
  { id: "notes", zh: "备忘", en: "Notes", Icon: TasksIcon },
];
const weekdays = { zh: ["一", "二", "三", "四", "五", "六", "日"], en: ["M", "T", "W", "T", "F", "S", "S"] };
const noteIcons = { documents: TasksIcon, driving: CarIcon, bookings: FlightIcon,
  health: BagIcon, connectivity: LocationMapIcon };

function dateParts(dateId) {
  const [, month, day] = dateId.split("-").map(Number);
  return { month, day };
}

function addDays(dateId, count) {
  const date = new Date(`${dateId}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + count);
  return date.toISOString().slice(0, 10);
}

function shortDate(dateId) {
  const { month, day } = dateParts(dateId);
  return `${month}/${day}`;
}

function stayWeeks(days) {
  if (!days.length) return [];
  const first = days[0].dateId;
  const last = days.at(-1).dateId;
  const offset = (new Date(`${first}T12:00:00Z`).getUTCDay() + 6) % 7;
  const start = addDays(first, -offset);
  const weekCount = Math.ceil((days.length + offset) / 7);
  const bookings = Object.values(confirmedAccommodationBookings);
  return Array.from({ length: weekCount }, (_, weekIndex) => {
    const dates = Array.from({ length: 7 }, (_, dayIndex) => addDays(start, weekIndex * 7 + dayIndex));
    const bands = bookings.flatMap((booking) => {
      const occupied = dates.map((dateId, index) => ({ dateId, index }))
        .filter(({ dateId }) => dateId >= first && dateId <= last && dateId >= booking.checkIn && dateId < booking.checkOut);
      if (!occupied.length) return [];
      return [{ booking, start: occupied[0].index + 1, length: occupied.length,
        dateId: occupied[0].dateId, continuesFromPrevious: occupied[0].dateId > booking.checkIn,
        continuesNext: occupied.at(-1).dateId < addDays(booking.checkOut, -1) }];
    });
    return { dates, bands, first, last };
  });
}

function StayCalendar({ selectedDate, onDateChange, onSelectStay, language }) {
  const vault = usePrivateVault();
  const nameFor = booking => adventureStayName(booking,
    vault.isUnlocked ? vault.data?.accommodations?.[booking.bookingId] : null, language);
  const days = useMemo(() => getAdventureCalendarDays({ language }), [language]);
  const weeks = useMemo(() => stayWeeks(days), [days]);
  const labels = language === "en" ? weekdays.en : weekdays.zh;
  return <div className="trip-bag-stay-calendar" aria-label={language === "en" ? "Confirmed stays calendar" : "已确认住宿日历"}>
    <div className="trip-bag-weekdays" aria-hidden="true">{labels.map((label, index) => <span key={index}><PencilText>{label}</PencilText></span>)}</div>
    <div className="trip-bag-calendar-weeks">{weeks.map(({ dates, bands, first, last }) => <div className="trip-bag-calendar-week" key={dates[0]}>
      <div className="trip-bag-calendar-dates">{dates.map((dateId) => {
        if (dateId < first || dateId > last) return <span key={dateId} aria-hidden="true" />;
        const departure = confirmedStayTransitionsOn(dateId).find(({ phase }) => phase === "check-out");
        const active = selectedDate === dateId;
        const dateLabel = language === "en" ? `${dateParts(dateId).day} ${dateParts(dateId).month === 9 ? "Sep" : "Oct"}` : `${dateParts(dateId).month}月${dateParts(dateId).day}日`;
        const departureName = departure && nameFor(departure.booking);
        return <button type="button" className="trip-bag-calendar-date" data-selected={active} key={dateId}
          aria-pressed={active} aria-label={language === "en" ? `Select ${dateLabel}${departure ? `, ${departureName} check-out` : ""}` : `选择${dateLabel}${departure ? `，${departureName}退房日` : ""}`}
          title={departure ? language === "en" ? `${departureName} check-out` : `${departureName}退房` : undefined}
          onClick={() => onDateChange?.(dateId)}>
          <span className="trip-bag-calendar-number"><PencilText>{shortDate(dateId)}</PencilText></span>
          {departure && <span className="trip-bag-calendar-departure" aria-hidden="true"><PencilText>{language === "en" ? "Out" : "退"}</PencilText></span>}
        </button>;
      })}</div>
      <div className="trip-bag-calendar-bands">{bands.map(({ booking, start, length, dateId, continuesFromPrevious, continuesNext }) => {
        const name = nameFor(booking);
        const interval = `${shortDate(booking.checkIn)}–${shortDate(booking.checkOut)}`;
        return <PencilSurface as="button" variant="action" key={booking.bookingId} className="trip-bag-calendar-band"
          data-continues-start={continuesFromPrevious} data-continues-end={continuesNext}
          style={{ gridColumn: `${start} / span ${length}` }}
          title={`${name} · ${interval}`} aria-label={language === "en" ? `${name}, ${interval}, open stay details` : `${name}，${interval}，查看住宿详情`}
          onClick={() => onSelectStay?.({ bookingId: booking.bookingId, dateId })}>
          {continuesFromPrevious && <span className="trip-bag-band-join" aria-hidden="true">‹</span>}
          <span className="trip-bag-band-name"><PencilText>{name}</PencilText></span>
          {continuesNext && <span className="trip-bag-band-join" aria-hidden="true">›</span>}
        </PencilSurface>;
      })}</div>
    </div>)}</div>
  </div>;
}

function rentalField(booking, key, language) {
  return language === "en" ? booking[`${key}En`] ?? booking[key] : booking[key];
}

function RentalFact({ Icon, label, children }) {
  return <div className="trip-bag-rental-fact">
    <span className="trip-bag-rental-icon" aria-hidden="true"><Icon /></span>
    <div><span className="trip-bag-rental-label"><PencilText>{label}</PencilText></span>
      <strong><PencilText>{children}</PencilText></strong></div>
  </div>;
}

function CarContent({ language, onRequestUnlock }) {
  const [expanded, setExpanded] = useState(false);
  const vault = usePrivateVault();
  const booking = confirmedRentalBookings.find((item) => item.status === "booked");
  if (!booking) return <p className="trip-bag-empty"><PencilText>{language === "en" ? "No active rental booking" : "暂无有效租车订单"}</PencilText></p>;
  const privateDetails = vault.isUnlocked ? vault.data?.rentalCars?.[booking.id] : null;
  const details = [
    [language === "en" ? "Protection" : "保障", rentalField(booking, "protection", language)],
    [language === "en" ? "Counters" : "柜台", rentalField(booking, "counter", language)],
    [language === "en" ? "Changes and cancellation" : "退改", rentalField(booking, "cancellation", language)],
    [language === "en" ? "Payment and deposit" : "付款与押金", rentalField(booking, "payment", language)],
    [language === "en" ? "Coverage limits" : "保障边界", rentalField(booking, "coverLimit", language)],
  ];
  return <section className="trip-bag-rental" aria-label={language === "en" ? "Current rental booking" : "当前租车订单"}>
    <div className="trip-bag-rental-heading">
      <div><h2><PencilText>{booking.provider}</PencilText></h2>
        <span><PencilText>{language === "en" ? "Rental confirmed" : "租车已确认"}</PencilText></span></div>
      <PencilSurface as="span" variant="badge" className="trip-bag-rental-status"><PencilText>{language === "en" ? "Booked" : "已预订"}</PencilText></PencilSurface>
    </div>
    <div className="trip-bag-rental-facts">
      <RentalFact Icon={LocationMapIcon} label={language === "en" ? "Pickup" : "取车"}>
        {`${booking.pickup.date} ${booking.pickup.time} · ${rentalField(booking.pickup, "location", language)}`}
      </RentalFact>
      <RentalFact Icon={LocationMapIcon} label={language === "en" ? "Return" : "还车"}>
        {`${booking.return.date} ${booking.return.time} · ${rentalField(booking.return, "location", language)}`}
      </RentalFact>
      <RentalFact Icon={CarIcon} label={language === "en" ? "Vehicle" : "车型"}>{rentalField(booking, "vehicle", language)}</RentalFact>
      <RentalFact Icon={CalendarIcon} label={language === "en" ? "Duration" : "租期"}>{rentalField(booking, "duration", language)}</RentalFact>
      <RentalFact Icon={BagIcon} label={language === "en" ? "Prepaid" : "已预付"}>{rentalField(booking, "total", language)}</RentalFact>
    </div>
    <PanelDivider />
    <button type="button" className="trip-bag-rental-expand" aria-expanded={expanded} aria-controls="trip-bag-rental-details"
      onClick={() => setExpanded((value) => !value)}><PencilText>{language === "en" ? "Counter and policy details" : "柜台与政策详情"}</PencilText><NextIcon /></button>
    <div className="trip-bag-rental-details" id="trip-bag-rental-details" hidden={!expanded}>
      {details.map(([label, value]) => <div key={label}><span><PencilText>{label}</PencilText></span><p><PencilText>{value}</PencilText></p></div>)}
    </div>
    <PanelDivider />
    {privateDetails && typeof privateDetails === "object" && !Array.isArray(privateDetails)
      ? <div className="trip-bag-rental-private"><h3><PencilText>{language === "en" ? "Private rental details" : "私密租车资料"}</PencilText></h3>
        <dl>{Object.entries(privateDetails).map(([label, value]) => <div key={label}><dt><PencilText>{label}</PencilText></dt><dd><PencilText>{String(value)}</PencilText></dd></div>)}</dl>
      </div>
      : vault.isConfigured && !vault.isUnlocked && <button type="button" className="trip-bag-rental-unlock" onClick={() => onRequestUnlock?.()}
        disabled={!onRequestUnlock}><LockIcon /><PencilText>{language === "en" ? "Unlock private details" : "解锁私密资料"}</PencilText></button>}
  </section>;
}

function ActivityContent({ language }) {
  return <div className="trip-bag-content-list" aria-label={language === "en" ? "Activity plans" : "活动安排"}>
    {activityBookingPlans.map((activity) => <section key={activity.id} className="trip-bag-entry">
      <h2><PencilText>{language === "en" ? activity.titleEn ?? activity.title : activity.title}</PencilText></h2>
      <p className="trip-bag-entry-meta"><PencilText>{language === "en" ? activity.dateEn ?? activity.date : activity.date} · {language === "en" ? activity.statusEn ?? activity.status : activity.status}</PencilText></p>
      <p><PencilText>{language === "en" ? activity.detailEn ?? activity.detail : activity.detail}</PencilText></p>
      {activity.bookingUrl && <a href={activity.bookingUrl} target="_blank" rel="noopener noreferrer"><PencilText>{language === "en" ? activity.bookingLabelEn ?? activity.bookingLabel : activity.bookingLabel}</PencilText></a>}
      <PanelDivider />
    </section>)}
  </div>;
}

function NotesContent({ language, onSelectNoteCategory }) {
  return <div className="trip-bag-notes" aria-label={language === "en" ? "Travel notes" : "出行备忘"}>
    <div className="trip-bag-note-categories">{preTripChecklist.map((group, index) => {
      const Icon = noteIcons[group.id] ?? TasksIcon;
      return <div className="trip-bag-note-row" key={group.id}>
        <button type="button" className="trip-bag-note-category" onClick={() => onSelectNoteCategory?.(group.id)}>
          <span className="trip-bag-note-icon" aria-hidden="true"><Icon /></span>
          <span className="trip-bag-note-category-title"><PencilText>{language === "en" ? group.titleEn ?? group.title : group.title}</PencilText></span>
          <span className="trip-bag-note-count"><PencilText>{group.items.length}</PencilText></span>
          <NextIcon />
        </button>
        {index < preTripChecklist.length - 1 && <PanelDivider />}
      </div>;
    })}</div>
  </div>;
}

export function AdventureBagNoteCategory({ categoryId }) {
  const { language } = useLanguage();
  const [expanded, setExpanded] = useState(null);
  const category = preTripChecklist.find((group) => group.id === categoryId);
  if (!category) return null;
  return <section className="trip-bag-note-category-view" aria-label={language === "en" ? category.titleEn ?? category.title : category.title}>
      <div className="trip-bag-note-items">{category.items.map((item) => {
        const isExpanded = expanded?.categoryId === categoryId && expanded?.itemId === item.id;
        return <div className="trip-bag-note-row" key={item.id}>
          <button type="button" className="trip-bag-note-item" aria-expanded={isExpanded}
            aria-controls={`trip-bag-note-detail-${item.id}`}
            onClick={() => setExpanded(isExpanded ? null : { categoryId, itemId: item.id })}>
            <span><PencilText>{language === "en" ? item.titleEn ?? item.title : item.title}</PencilText></span>
            <NextIcon />
          </button>
          <div className="trip-bag-note-detail" id={`trip-bag-note-detail-${item.id}`} hidden={!isExpanded}>
            {item.deadline && <small><PencilText>{language === "en" ? item.deadlineEn ?? item.deadline : item.deadline}</PencilText></small>}
            <p><PencilText>{language === "en" ? item.detailEn ?? item.detail : item.detail}</PencilText></p>
            {item.link && <a href={item.link} target="_blank" rel="noopener noreferrer"><PencilText>{language === "en" ? item.linkLabelEn ?? item.linkLabel : item.linkLabel}</PencilText></a>}
          </div>
          <PanelDivider />
        </div>;
      })}</div>
  </section>;
}

export function AdventureBag({ selectedTab = "stays", onTabChange, selectedDate, onDateChange, onSelectStay, onRequestUnlock, onSelectNoteCategory }) {
  const { language } = useLanguage();
  const refs = useRef([]);
  const activeTab = tabs.some((tab) => tab.id === selectedTab) ? selectedTab : "stays";
  const onKeyDown = (event, index) => {
    let next = index;
    if (event.key === "ArrowDown" || event.key === "ArrowRight") next = (index + 1) % tabs.length;
    else if (event.key === "ArrowUp" || event.key === "ArrowLeft") next = (index + tabs.length - 1) % tabs.length;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = tabs.length - 1;
    else return;
    event.preventDefault();
    onTabChange?.(tabs[next].id);
    refs.current[next]?.focus();
  };
  return <section className="trip-bag" aria-label={language === "en" ? "Travel bag" : "旅行背包"}>
    <nav className="trip-bag-tabs" role="tablist" aria-orientation="vertical" aria-label={language === "en" ? "Bag sections" : "背包分类"}>
      {tabs.map(({ id, zh, en, Icon }, index) => <PencilSurface key={id} as="button" variant={activeTab === id ? "action" : "quiet"} role="tab"
        ref={(node) => { refs.current[index] = node; }}
        className="trip-bag-tab" id={`trip-bag-tab-${id}`} aria-controls="trip-bag-tabpanel"
        aria-selected={activeTab === id} tabIndex={activeTab === id ? 0 : -1}
        aria-label={language === "en" ? en : zh} title={language === "en" ? en : zh}
        onClick={() => onTabChange?.(id)} onKeyDown={(event) => onKeyDown(event, index)}><Icon /></PencilSurface>)}
    </nav>
    <div id="trip-bag-tabpanel" className="trip-bag-tabpanel" role="tabpanel" tabIndex={0}
      aria-labelledby={`trip-bag-tab-${activeTab}`}>
      {activeTab === "stays" && <StayCalendar selectedDate={selectedDate} onDateChange={onDateChange}
        onSelectStay={onSelectStay} language={language} />}
      {activeTab === "car" && <CarContent language={language} onRequestUnlock={onRequestUnlock} />}
      {activeTab === "activities" && <ActivityContent language={language} />}
      {activeTab === "notes" && <NotesContent language={language} onSelectNoteCategory={onSelectNoteCategory} />}
    </div>
  </section>;
}
