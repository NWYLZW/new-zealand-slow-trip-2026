import { Box, Chip, Stack, Typography } from "@mui/material";

const year = 2026;
const weekdays = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];

function parseTripDate(dateText) {
  const match = dateText.match(/(\d+)月(\d+)日/);
  if (!match) return null;
  return new Date(year, Number(match[1]) - 1, Number(match[2]));
}

function keyForDate(date) {
  return `${date.getMonth() + 1}-${date.getDate()}`;
}

function getMonths(days) {
  const set = new Set();
  days.forEach((day) => {
    const date = parseTripDate(day.date);
    if (date) set.add(date.getMonth());
  });
  return [...set].sort((a, b) => a - b);
}

function getMonthCells(month) {
  const first = new Date(year, month, 1);
  const start = new Date(first);
  start.setDate(first.getDate() - first.getDay());

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    return date;
  });
}

function formatTimeList(events) {
  return events.slice(0, 3).map(([time, text]) => `${time} ${text}`);
}

export function DayCalendar({ days }) {
  const daysByKey = new Map();
  days.forEach((day) => {
    const date = parseTripDate(day.date);
    if (date) daysByKey.set(keyForDate(date), day);
  });

  return (
    <Stack spacing={2.5}>
      {getMonths(days).map((month) => (
        <Box className="month-calendar" key={month}>
          <Stack direction="row" alignItems="baseline" justifyContent="space-between" className="month-calendar-header">
            <Typography variant="h2">{year} 年 {month + 1} 月</Typography>
          </Stack>
          <Box className="month-weekdays">
            {weekdays.map((weekday) => (
              <Typography key={weekday}>{weekday}</Typography>
            ))}
          </Box>
          <Box className="month-grid">
            {getMonthCells(month).map((date) => {
              const isCurrentMonth = date.getMonth() === month;
              const day = daysByKey.get(keyForDate(date));
              return (
                <Box
                  key={date.toISOString()}
                  className={day ? "month-cell has-trip" : "month-cell"}
                  data-muted={!isCurrentMonth}
                  style={day ? { "--day-color": day.color } : undefined}
                >
                  <Stack direction="row" justifyContent="space-between" alignItems="center" className="month-cell-date">
                    <Typography>{date.getDate()}日</Typography>
                    {day && <Chip size="small" label={day.intensity} />}
                  </Stack>
                  {day && (
                    <Box className="calendar-event">
                      <Typography className="calendar-event-title">{day.title}</Typography>
                      <Typography className="calendar-event-subtitle">{day.subtitle}</Typography>
                      <Stack spacing={0.4} className="calendar-event-times">
                        {formatTimeList(day.events).map((item) => (
                          <Typography key={item}>{item}</Typography>
                        ))}
                      </Stack>
                      <Typography className="calendar-event-stay">{day.stay}</Typography>
                    </Box>
                  )}
                </Box>
              );
            })}
          </Box>
        </Box>
      ))}
    </Stack>
  );
}
