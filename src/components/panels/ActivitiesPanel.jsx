import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  LinearProgress,
  Stack,
  Typography,
} from "@mui/material";
import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import LocalActivityIcon from "@mui/icons-material/LocalActivity";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import PaymentsOutlinedIcon from "@mui/icons-material/PaymentsOutlined";
import RadioButtonUncheckedIcon from "@mui/icons-material/RadioButtonUnchecked";
import { itineraryDaysEn } from "../../englishTripData";
import { activityBookingPlans, activityBookingSummary, northDays, southDays } from "../../tripData";
import { useLanguage } from "../../LanguageContext";
import { CalendarDayCell, CalendarGrid, CalendarWeekdays } from "../calendar/CalendarPrimitives";
import { PrivateDetailSection } from "../PrivateVaultAccess";
import "./ActivitiesPanel.css";

const activityUrlParam = "activity";
const weekdaysZh = ["周一", "周二", "周三", "周四", "周五", "周六", "周日"];
const weekdaysEn = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const itineraryDays = [...southDays, ...northDays];
const englishDayByDate = new Map(itineraryDaysEn.map((day) => [day.dateKey ?? day.date, day]));
const activitiesById = new Map(activityBookingPlans.map((activity) => [activity.id, activity]));

function mondayFirstColumn(date) {
  return ((date.getDay() + 6) % 7) + 1;
}

function isoDateFromDay(day) {
  const key = day.dateKey ?? day.date;
  if (/^\d{4}-\d{2}-\d{2}$/.test(key)) return key;
  const match = key.match(/(\d+)月(\d+)日/);
  return match ? `2026-${String(match[1]).padStart(2, "0")}-${String(match[2]).padStart(2, "0")}` : key;
}

const calendarDays = itineraryDays.map((day) => {
  const dateKey = isoDateFromDay(day);
  const englishDay = englishDayByDate.get(day.dateKey ?? day.date);
  return {
    date: new Date(`${dateKey}T00:00:00`),
    dateKey,
    title: day.title,
    titleEn: englishDay?.title ?? day.title,
    subtitle: day.subtitle,
    subtitleEn: englishDay?.subtitle ?? day.subtitle,
    calendarRegion: day.calendarRegion,
    activities: activityBookingPlans.filter((activity) => activity.dateKey === dateKey),
  };
});

function readActivityUrl() {
  const url = new URL(window.location.href);
  if (url.hash !== "#activities") return null;
  const activityId = url.searchParams.get(activityUrlParam);
  return activitiesById.has(activityId) ? activityId : null;
}

function writeActivityUrl(activityId, method = "replaceState", state = history.state) {
  const url = new URL(window.location.href);
  if (activityId) url.searchParams.set(activityUrlParam, activityId);
  else url.searchParams.delete(activityUrlParam);
  url.hash = "activities";
  history[method](state, "", url);
}

function ActivityDetail({ activity, checked, isEnglish, onToggle }) {
  return (
    <Card className={checked ? "activity-booking-card checked" : "activity-booking-card"} id="activity-booking-detail">
      <CardContent>
        <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ xs: "stretch", sm: "flex-start" }} spacing={1.5}>
          <Box>
            <Chip
              className="activity-booking-status"
              data-tone={activity.statusTone}
              label={isEnglish ? activity.statusEn : activity.status}
              size="small"
            />
            <Typography className="activity-booking-operator">{activity.operator}</Typography>
            <Typography variant="h2">{isEnglish ? activity.titleEn : activity.title}</Typography>
          </Box>
          <Button
            aria-pressed={checked}
            color={checked ? "success" : "primary"}
            onClick={onToggle}
            startIcon={checked ? <CheckCircleOutlineIcon /> : <RadioButtonUncheckedIcon />}
            variant={checked ? "contained" : "outlined"}
          >
            {checked
              ? (isEnglish ? "Booked / completed" : "已完成预订")
              : (isEnglish ? "Mark as booked" : "标记为已预订")}
          </Button>
        </Stack>

        <Box className="activity-booking-facts">
          <Box>
            <CalendarMonthOutlinedIcon aria-hidden="true" />
            <span>{isEnglish ? activity.dateEn : activity.date}</span>
          </Box>
          <Box>
            <PaymentsOutlinedIcon aria-hidden="true" />
            <span><strong>{isEnglish ? (activity.totalEn ?? activity.total) : activity.total}</strong><small>{isEnglish ? activity.unitPriceEn : activity.unitPrice}</small></span>
          </Box>
        </Box>
        <Typography className="activity-booking-detail">{isEnglish ? activity.detailEn : activity.detail}</Typography>
        <Typography className="activity-booking-policy" color="text.secondary">{isEnglish ? activity.policyEn : activity.policy}</Typography>
        <PrivateDetailSection
          itemId={activity.id}
          section="activities"
          title={isEnglish ? "Private booking details" : "私密预订资料"}
        />
        <Button
          className="activity-booking-link"
          endIcon={<OpenInNewIcon />}
          href={activity.bookingUrl}
          rel="noreferrer"
          target="_blank"
          variant="contained"
        >
          {isEnglish ? activity.bookingLabelEn : activity.bookingLabel}
        </Button>
      </CardContent>
    </Card>
  );
}

export function ActivitiesPanel({ checked, onDetailChange, setChecked }) {
  const { language } = useLanguage();
  const isEnglish = language === "en";
  const [selectedActivityId, setSelectedActivityId] = useState(readActivityUrl);
  const selectedActivity = activitiesById.get(selectedActivityId) ?? null;
  const activityIds = useMemo(() => new Set(activityBookingPlans.map((activity) => activity.id)), []);
  const done = Object.entries(checked).filter(([id, value]) => activityIds.has(id) && value).length;
  const percent = activityBookingPlans.length ? Math.round((done / activityBookingPlans.length) * 100) : 0;

  useEffect(() => {
    const syncFromUrl = () => {
      const requestedId = readActivityUrl();
      if (requestedId) {
        setSelectedActivityId(requestedId);
      }
      else {
        const url = new URL(window.location.href);
        if (url.hash !== "#activities") return;
        setSelectedActivityId(null);
        if (url.searchParams.has(activityUrlParam)) writeActivityUrl(null);
      }
    };
    syncFromUrl();
    window.addEventListener("hashchange", syncFromUrl);
    window.addEventListener("popstate", syncFromUrl);
    return () => {
      window.removeEventListener("hashchange", syncFromUrl);
      window.removeEventListener("popstate", syncFromUrl);
    };
  }, []);

  const selectActivity = (activityId) => {
    if (activityId === selectedActivityId && readActivityUrl() === activityId) return;
    const currentState = history.state && typeof history.state === "object" ? history.state : {};
    setSelectedActivityId(activityId);
    writeActivityUrl(activityId, "pushState", { ...currentState, activityBooking: true });
  };

  const closeActivity = useCallback(() => {
    setSelectedActivityId(null);
    if (history.state?.activityBooking) {
      history.back();
      return;
    }
    writeActivityUrl(null);
  }, []);

  useEffect(() => {
    if (!onDetailChange) return;
    if (!selectedActivity) {
      onDetailChange(null);
      return;
    }
    const frame = requestAnimationFrame(() => {
      onDetailChange({
        label: isEnglish ? selectedActivity.titleEn : selectedActivity.title,
        onBack: closeActivity,
      });
    });
    return () => cancelAnimationFrame(frame);
  }, [closeActivity, isEnglish, onDetailChange, selectedActivity]);

  useEffect(() => () => onDetailChange?.(null), [onDetailChange]);

  const toggleActivity = (activityId) => {
    setChecked((current) => {
      return { ...current, [activityId]: !current[activityId] };
    });
  };

  if (selectedActivity) {
    return (
      <Box className="activities-panel activity-detail-page">
        <ActivityDetail
          activity={selectedActivity}
          checked={Boolean(checked[selectedActivity.id])}
          isEnglish={isEnglish}
          onToggle={() => toggleActivity(selectedActivity.id)}
        />
      </Box>
    );
  }

  return (
    <Box className="activities-panel">
      <Box className="route-day-calendar activity-calendar">
        <Card className="route-month activity-calendar-card" variant="outlined">
          <Box className="activity-progress-strip">
            <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2}>
              <Box>
                <Typography className="activity-progress-title">
                  {isEnglish ? "Activity booking progress" : "活动预订进度"}
                </Typography>
                <Typography color="text.secondary">
                  {isEnglish
                    ? `${done} of ${activityBookingPlans.length} tickets booked`
                    : `已预订 ${done} / ${activityBookingPlans.length} 项活动`}
                </Typography>
              </Box>
              <Typography className="activity-progress-percent">{percent}%</Typography>
            </Stack>
            <LinearProgress aria-label={isEnglish ? "Activity booking progress" : "活动预订进度"} value={percent} variant="determinate" />
          </Box>
          <Stack className="activity-calendar-heading" direction="row" alignItems="center" spacing={1}>
            <LocalActivityIcon aria-hidden="true" />
            <Box>
              <Typography className="route-month-title">{isEnglish ? "Trip and ticket calendar · 28 Sep—11 Oct" : "行程与票务日历 · 9月28日—10月11日"}</Typography>
              <Typography color="text.secondary">
                {isEnglish ? "Select a ticket chip to view price, policy and the official booking link." : "点击票务标签查看价格、规则和官网预订入口。"}
              </Typography>
            </Box>
          </Stack>
          <Box className="activity-calendar-grid-scroll" role="region" aria-label={isEnglish ? "Activity booking calendar" : "活动预订日历"} tabIndex={0}>
            <CalendarWeekdays labels={isEnglish ? weekdaysEn : weekdaysZh} />
            <CalendarGrid>
              {calendarDays.map((day, index) => (
                <CalendarDayCell
                  className="has-day activity-calendar-day"
                  data-has-activities={day.activities.length > 0 || undefined}
                  data-region={day.calendarRegion}
                  date={`${day.date.getMonth() + 1}/${day.date.getDate()}`}
                  dateTrailing={day.activities.length > 0 ? <Chip label={isEnglish ? `${day.activities.length} ticket${day.activities.length > 1 ? "s" : ""}` : `${day.activities.length}项票`} size="small" /> : undefined}
                  key={day.dateKey}
                  style={{ gridColumnStart: index === 0 ? mondayFirstColumn(day.date) : undefined }}
                >
                  <Typography className="activity-calendar-place">{isEnglish ? day.titleEn : day.title}</Typography>
                  <Typography className="activity-calendar-subtitle" color="text.secondary">{isEnglish ? day.subtitleEn : day.subtitle}</Typography>
                  <Stack className="activity-calendar-tickets" spacing={0.75}>
                    {day.activities.map((activity) => (
                      <Button
                        aria-label={`${isEnglish ? activity.titleEn : activity.title} · ${isEnglish ? activity.statusEn : activity.status}`}
                        className="activity-calendar-ticket"
                        data-checked={checked[activity.id] || undefined}
                        key={activity.id}
                        onClick={() => selectActivity(activity.id)}
                        size="small"
                        startIcon={checked[activity.id] ? <CheckCircleOutlineIcon /> : <LocalActivityIcon />}
                        title={isEnglish ? activity.titleEn : activity.title}
                        variant="contained"
                      >
                        {isEnglish ? activity.calendarTitleEn : activity.calendarTitle}
                      </Button>
                    ))}
                    {day.activities.length === 0 && (
                      <Typography className="activity-calendar-empty">{isEnglish ? "No activity ticket needed today" : "当天无需预订活动票"}</Typography>
                    )}
                  </Stack>
                </CalendarDayCell>
              ))}
            </CalendarGrid>
          </Box>
          <Typography className="activity-booking-checked-at" color="text.secondary">
            {isEnglish
              ? `Information and price references last compiled on ${activityBookingSummary.checkedAt}. Recheck inventory and terms at checkout; all amounts are New Zealand dollars.`
              : `信息与价格参考最近整理于 ${activityBookingSummary.checkedAt}；库存与条款以结账页为准，金额均为新西兰元。`}
          </Typography>
        </Card>
      </Box>
    </Box>
  );
}
