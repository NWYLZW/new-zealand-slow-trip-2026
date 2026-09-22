import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  Chip,
  FormControlLabel,
  LinearProgress,
  Stack,
  Switch,
  Typography,
} from "@mui/material";
import BadgeOutlinedIcon from "@mui/icons-material/BadgeOutlined";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import DirectionsCarOutlinedIcon from "@mui/icons-material/DirectionsCarOutlined";
import FlightTakeoffOutlinedIcon from "@mui/icons-material/FlightTakeoffOutlined";
import HealthAndSafetyOutlinedIcon from "@mui/icons-material/HealthAndSafetyOutlined";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import TaskAltIcon from "@mui/icons-material/TaskAlt";
import WifiOutlinedIcon from "@mui/icons-material/WifiOutlined";
import { preTripChecklist, preTripDepartureDate } from "../../data/preTripChecklist";
import { useLanguage } from "../../LanguageContext";
import "./PreTripPanel.css";

const storageKey = "nz-trip-preparation-v1";

const categoryIcons = {
  documents: BadgeOutlinedIcon,
  driving: DirectionsCarOutlinedIcon,
  bookings: FlightTakeoffOutlinedIcon,
  health: HealthAndSafetyOutlinedIcon,
  connectivity: WifiOutlinedIcon,
};

const allItems = preTripChecklist.flatMap((category) => category.items);
const itemIds = new Set(allItems.map((item) => item.id));

function readCheckedItems() {
  try {
    const stored = JSON.parse(localStorage.getItem(storageKey) || "{}");
    return Object.fromEntries(
      Object.entries(stored).filter(([id, value]) => itemIds.has(id) && typeof value === "boolean"),
    );
  } catch {
    return {};
  }
}

function getDaysUntilDeparture() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const departure = new Date(`${preTripDepartureDate}T00:00:00`);
  return Math.ceil((departure.getTime() - today.getTime()) / 86400000);
}

function ChecklistItem({ item, checked, isEnglish, onToggle }) {
  const title = isEnglish ? item.titleEn : item.title;
  const detail = isEnglish ? item.detailEn : item.detail;
  const deadline = isEnglish ? item.deadlineEn : item.deadline;
  const condition = isEnglish ? item.conditionEn : item.condition;
  const linkLabel = isEnglish ? item.linkLabelEn : item.linkLabel;
  const required = item.priority === "required";

  return (
    <Card className="pretrip-task" data-complete={checked || undefined} variant="outlined">
      <CardContent>
        <Box className="pretrip-task-row">
          <FormControlLabel
            className="pretrip-task-control"
            control={(
              <Checkbox
                checked={checked}
                color="success"
                inputProps={{ "aria-label": title }}
                onChange={onToggle}
              />
            )}
            label={(
              <Box className="pretrip-task-copy">
                <Stack className="pretrip-task-labels" direction="row" useFlexGap>
                  <Chip
                    className="pretrip-priority-chip"
                    color={required ? "warning" : "default"}
                    label={required ? (isEnglish ? "Required" : "必须") : (isEnglish ? "Recommended" : "建议")}
                    size="small"
                    variant={required ? "filled" : "outlined"}
                  />
                  <Chip className="pretrip-deadline-chip" label={deadline} size="small" variant="outlined" />
                  {condition && <Chip label={condition} size="small" variant="outlined" />}
                </Stack>
                <Typography className="pretrip-task-title">{title}</Typography>
                <Typography className="pretrip-task-detail" color="text.secondary">{detail}</Typography>
              </Box>
            )}
          />
          {item.link && (
            <Button
              aria-label={`${linkLabel} · ${title}`}
              className="pretrip-task-link"
              endIcon={<OpenInNewIcon />}
              href={item.link}
              rel="noreferrer"
              size="small"
              target="_blank"
              variant="text"
            >
              {linkLabel}
            </Button>
          )}
        </Box>
      </CardContent>
    </Card>
  );
}

export function PreTripPanel() {
  const { language } = useLanguage();
  const isEnglish = language === "en";
  const [checked, setChecked] = useState(readCheckedItems);
  const [showOpenOnly, setShowOpenOnly] = useState(false);
  const daysUntilDeparture = getDaysUntilDeparture();

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(checked));
  }, [checked]);

  const progress = useMemo(() => {
    const done = allItems.filter((item) => checked[item.id]).length;
    const requiredItems = allItems.filter((item) => item.priority === "required");
    const requiredDone = requiredItems.filter((item) => checked[item.id]).length;
    return {
      done,
      percent: Math.round((done / allItems.length) * 100),
      requiredRemaining: requiredItems.length - requiredDone,
      total: allItems.length,
    };
  }, [checked]);

  const visibleCategories = useMemo(() => preTripChecklist.map((category) => ({
    ...category,
    items: showOpenOnly ? category.items.filter((item) => !checked[item.id]) : category.items,
  })).filter((category) => category.items.length > 0), [checked, showOpenOnly]);

  const departureCopy = daysUntilDeparture > 0
    ? (isEnglish ? `${daysUntilDeparture} days until departure` : `距出发还有 ${daysUntilDeparture} 天`)
    : daysUntilDeparture === 0
      ? (isEnglish ? "Departure day" : "今天出发")
      : (isEnglish ? "Departure date passed" : "出发日期已过");

  const toggleItem = (itemId) => {
    setChecked((current) => ({ ...current, [itemId]: !current[itemId] }));
  };

  return (
    <Box className="pretrip-panel">
      <Card className="pretrip-summary" variant="outlined">
        <CardContent>
          <Box className="pretrip-summary-heading">
            <Box>
              <Stack className="pretrip-summary-kicker" direction="row" alignItems="center" spacing={1}>
                <TaskAltIcon aria-hidden="true" />
                <Typography>{isEnglish ? "PRE-DEPARTURE CHECKLIST" : "出行前准备清单"}</Typography>
              </Stack>
              <Typography variant="h2">
                {isEnglish ? "Finish the essentials before 28 September" : "9月28日出发前，把必须项逐一清零"}
              </Typography>
              <Typography color="text.secondary">
                {isEnglish
                  ? "Check items on either phone or computer; completion is saved only in this browser."
                  : "在手机或电脑上逐项勾选；完成状态只保存在当前浏览器。"}
              </Typography>
            </Box>
            <Chip className="pretrip-departure-chip" label={departureCopy} />
          </Box>

          <Box className="pretrip-progress" aria-live="polite">
            <Stack direction="row" alignItems="end" justifyContent="space-between" spacing={2}>
              <Box>
                <Typography className="pretrip-progress-label">
                  {isEnglish ? "Overall preparation" : "整体准备进度"}
                </Typography>
                <Typography color="text.secondary">
                  {isEnglish
                    ? `${progress.done} of ${progress.total} completed`
                    : `已完成 ${progress.done} / ${progress.total} 项`}
                </Typography>
              </Box>
              <Typography className="pretrip-progress-percent">{progress.percent}%</Typography>
            </Stack>
            <LinearProgress
              aria-label={isEnglish ? "Overall preparation progress" : "整体准备进度"}
              value={progress.percent}
              variant="determinate"
            />
          </Box>

          <Box className="pretrip-summary-actions">
            <Alert icon={<CheckCircleOutlineIcon />} severity={progress.requiredRemaining === 0 ? "success" : "warning"}>
              {progress.requiredRemaining === 0
                ? (isEnglish ? "All required items are complete." : "所有必须项已经完成。")
                : (isEnglish ? `${progress.requiredRemaining} required items still open.` : `还有 ${progress.requiredRemaining} 项必须事项未完成。`)}
            </Alert>
            <FormControlLabel
              className="pretrip-open-filter"
              control={<Switch checked={showOpenOnly} onChange={(event) => setShowOpenOnly(event.target.checked)} />}
              label={isEnglish ? "Show open items only" : "只看未完成"}
            />
          </Box>
        </CardContent>
      </Card>

      <Stack className="pretrip-category-list" spacing={2.5}>
        {visibleCategories.map((category) => {
          const Icon = categoryIcons[category.id] ?? TaskAltIcon;
          return (
            <Box className="pretrip-category" component="section" key={category.id}>
              <Box className="pretrip-category-heading">
                <Icon aria-hidden="true" />
                <Box>
                  <Typography component="h2" variant="h3">{isEnglish ? category.titleEn : category.title}</Typography>
                  <Typography color="text.secondary">{isEnglish ? category.descriptionEn : category.description}</Typography>
                </Box>
              </Box>
              <Stack spacing={1}>
                {category.items.map((item) => (
                  <ChecklistItem
                    checked={Boolean(checked[item.id])}
                    isEnglish={isEnglish}
                    item={item}
                    key={item.id}
                    onToggle={() => toggleItem(item.id)}
                  />
                ))}
              </Stack>
            </Box>
          );
        })}
      </Stack>

      {visibleCategories.length === 0 && (
        <Card className="pretrip-empty" variant="outlined">
          <CardContent>
            <CheckCircleOutlineIcon aria-hidden="true" />
            <Typography variant="h3">{isEnglish ? "Everything is checked" : "全部准备完成"}</Typography>
            <Typography color="text.secondary">
              {isEnglish ? "Turn off the filter to review completed items." : "关闭“只看未完成”可以复核全部事项。"}
            </Typography>
          </CardContent>
        </Card>
      )}
    </Box>
  );
}
