import { Box, Stack, Typography } from "@mui/material";
import "./CalendarPrimitives.css";

function joinClasses(...names) {
  return names.filter(Boolean).join(" ");
}

export function CalendarWeekdays({ className, labels, ...props }) {
  return (
    <Box className={joinClasses("route-weekdays", "calendar-weekdays", className)} {...props}>
      {labels.map((label) => <Typography key={label}>{label}</Typography>)}
    </Box>
  );
}

export function CalendarGrid({ children, className, ...props }) {
  return (
    <Box className={joinClasses("route-month-grid", "calendar-seven-column-grid", className)} {...props}>
      {children}
    </Box>
  );
}

export function CalendarDateHeader({ children, className, date, trailing, ...props }) {
  return (
    <Stack
      alignItems="center"
      className={joinClasses("route-day-date", "calendar-date-header", className)}
      direction="row"
      justifyContent={trailing ? "space-between" : undefined}
      {...props}
    >
      {children ?? <Typography>{date}</Typography>}
      {trailing}
    </Stack>
  );
}

export function CalendarDayCell({ children, className, date, dateHeaderClassName, dateHeaderProps, dateTrailing, ...props }) {
  return (
    <Box className={joinClasses("route-day-cell", "calendar-day-cell", className)} {...props}>
      {date !== undefined && (
        <CalendarDateHeader className={dateHeaderClassName} date={date} trailing={dateTrailing} {...dateHeaderProps} />
      )}
      {children}
    </Box>
  );
}
