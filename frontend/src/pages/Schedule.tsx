import { useEffect, useMemo, useState } from "react";

import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Paper,
  Snackbar,
  Stack,
  Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";

import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import NavigateBeforeIcon from "@mui/icons-material/NavigateBefore";
import NavigateNextIcon from "@mui/icons-material/NavigateNext";

import AssignmentDialog, {
  type Assignment,
} from "../components/schedule/AssignmentDialog";

import { api } from "../services/api";
import type { DutyAssignment, Employee } from "../services/api";

const WEEKDAY_NAMES = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

const FIXED_DUTIES: Record<number, string | undefined> = {
  1: "RL",
  2: "RT",
  3: "JKS",
};

/*
  Weekend rotation.

  Each entry applies to one Friday-to-Monday weekend.
  TJ and MT are deliberately represented by null, so those weekends remain blank.
  Change the order or anchor date once the historical weekend roster is confirmed.
*/
const WEEKEND_ROTATION: Array<string | null> = [
  "RT",
  "JKS",
  "RL",
  null,
  null,
];

const WEEKEND_ROTATION_ANCHOR = new Date(2026, 0, 2);

interface BirthdayEvent {
  day: number;
  month: number;
  label: string;
}

interface MultiDayEvent {
  title: string;
  start: string;
  end: string;
  color: string;
}

/*
  Add birthdays here when you have the dates.

  Example:
  { day: 14, month: 8, label: "RL birthday" }
*/
const BIRTHDAYS: BirthdayEvent[] = [];

/*
  Add known multi-day events here when needed.

  Example:
  {
    title: "RL SKOLE",
    start: "2026-08-10",
    end: "2026-08-14",
    color: "#4f7d58",
  }
*/
const MULTI_DAY_EVENTS: MultiDayEvent[] = [];

function createLocalDate(
  year: number,
  month: number,
  day: number,
): Date {
  return new Date(year, month, day, 12, 0, 0, 0);
}

function startOfMonth(date: Date): Date {
  return createLocalDate(
    date.getFullYear(),
    date.getMonth(),
    1,
  );
}

function addDays(date: Date, days: number): Date {
  return createLocalDate(
    date.getFullYear(),
    date.getMonth(),
    date.getDate() + days,
  );
}

function addMonths(date: Date, months: number): Date {
  return createLocalDate(
    date.getFullYear(),
    date.getMonth() + months,
    1,
  );
}

function getMonday(date: Date): Date {
  const day = date.getDay();
  const daysSinceMonday = day === 0 ? 6 : day - 1;

  return addDays(date, -daysSinceMonday);
}

function dateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function parseDateKey(key: string): Date {
  const [year, month, day] = key.split("-").map(Number);

  return createLocalDate(year, month - 1, day);
}

function dayBounds(key: string): { start: Date; end: Date } {
  const day = parseDateKey(key);

  return {
    start: new Date(
      day.getFullYear(),
      day.getMonth(),
      day.getDate(),
      0,
      0,
      0,
      0,
    ),
    end: new Date(
      day.getFullYear(),
      day.getMonth(),
      day.getDate(),
      23,
      59,
      59,
      999,
    ),
  };
}

function isSameDay(first: Date, second: Date): boolean {
  return dateKey(first) === dateKey(second);
}

function isWithinRange(
  date: Date,
  start: string,
  end: string,
): boolean {
  const current = dateKey(date);

  return current >= start && current <= end;
}

function getWeekdayDuty(date: Date): string | undefined {
  return FIXED_DUTIES[date.getDay()];
}

function getFridayForWeekend(date: Date): Date | null {
  const day = date.getDay();

  if (day === 5) {
    return date;
  }

  if (day === 6) {
    return addDays(date, -1);
  }

  if (day === 0) {
    return addDays(date, -2);
  }

  return null;
}

function getWeekendDuty(date: Date): string | null | undefined {
  const friday = getFridayForWeekend(date);

  if (!friday) {
    return undefined;
  }

  const millisecondsPerWeek = 7 * 24 * 60 * 60 * 1000;
  const difference =
    friday.getTime() - WEEKEND_ROTATION_ANCHOR.getTime();

  const weekIndex = Math.floor(difference / millisecondsPerWeek);
  const rotationIndex =
    ((weekIndex % WEEKEND_ROTATION.length) +
      WEEKEND_ROTATION.length) %
    WEEKEND_ROTATION.length;

  return WEEKEND_ROTATION[rotationIndex];
}

export default function Schedule() {
  const [visibleMonth, setVisibleMonth] = useState(
    startOfMonth(new Date()),
  );
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [assignments, setAssignments] = useState<
    Record<string, DutyAssignment>
  >({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [snackbar, setSnackbar] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState("");

  useEffect(() => {
    api.employees()
      .then(setEmployees)
      .catch(console.error);
  }, []);

  async function loadAssignments() {
    try {
      setLoading(true);
      setError("");

      const data = await api.getScheduleMonth(
        visibleMonth.getFullYear(),
        visibleMonth.getMonth() + 1,
      );

      const byDay: Record<string, DutyAssignment> = {};

      for (const assignment of data) {
        byDay[dateKey(new Date(assignment.start))] = assignment;
      }

      setAssignments(byDay);
    } catch (err) {
      console.error(err);
      setError("Unable to load schedule.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAssignments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visibleMonth]);

  const calendarDays = useMemo(() => {
    const firstDay = startOfMonth(visibleMonth);
    const gridStart = getMonday(firstDay);
    const lastDay = addDays(
      addMonths(firstDay, 1),
      -1,
    );
    const gridEnd = addDays(
      getMonday(lastDay),
      6,
    );

    const days: Date[] = [];
    let current = gridStart;

    while (current <= gridEnd) {
      days.push(current);
      current = addDays(current, 1);
    }

    while (days.length < 42) {
      days.push(addDays(days[days.length - 1], 1));
    }

    return days;
  }, [visibleMonth]);

  const monthTitle = visibleMonth.toLocaleDateString(
    "en-GB",
    {
      month: "long",
      year: "numeric",
    },
  );

  function openDay(date: Date) {
    setSelectedDate(dateKey(date));
    setDialogOpen(true);
  }

  async function saveAssignment(data: Assignment) {
    const employee = employees.find(
      (item) => item.id === data.employeeId,
    );

    if (!employee) {
      throw new Error("Employee not found.");
    }

    const existing = assignments[selectedDate];
    const { start, end } = dayBounds(selectedDate);

    if (existing) {
      await api.updateAssignment(existing.id, {
        employeeId: data.employeeId,
        teamId: employee.teamId,
        notes: data.notes,
      });
    } else {
      await api.createAssignment({
        employeeId: data.employeeId,
        teamId: employee.teamId,
        start: start.toISOString(),
        end: end.toISOString(),
        notes: data.notes,
      });
    }

    setDialogOpen(false);
    setSnackbar(
      existing ? "Duty assignment updated." : "Duty assignment created.",
    );

    await loadAssignments();
  }

  async function deleteAssignment(id: string) {
    await api.deleteAssignment(id);

    setDialogOpen(false);
    setSnackbar("Duty assignment removed.");

    await loadAssignments();
  }

  function getBirthday(date: Date): BirthdayEvent | undefined {
    return BIRTHDAYS.find(
      (birthday) =>
        birthday.day === date.getDate() &&
        birthday.month === date.getMonth() + 1,
    );
  }

  function getMultiDayEvents(date: Date): MultiDayEvent[] {
    return MULTI_DAY_EVENTS.filter((event) =>
      isWithinRange(date, event.start, event.end),
    );
  }

  const selectedAssignment = assignments[selectedDate];

  return (
    <>
      <AssignmentDialog
        open={dialogOpen}
        date={selectedDate}
        existing={
          selectedAssignment
            ? {
                id: selectedAssignment.id,
                employeeId: selectedAssignment.employeeId,
                notes: selectedAssignment.notes ?? "",
              }
            : null
        }
        onClose={() => setDialogOpen(false)}
        onSave={saveAssignment}
        onDelete={deleteAssignment}
      />

      <Snackbar
        open={!!snackbar}
        autoHideDuration={3000}
        onClose={() => setSnackbar("")}
        message={snackbar}
      />

      <Box>
        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={2}
          sx={{
            justifyContent: "space-between",
            alignItems: { xs: "flex-start", md: "center" },
            mb: 4,
          }}
        >
          <Box>
            <Typography
              variant="h4"
              sx={{ fontWeight: 700 }}
            >
              Schedule
            </Typography>

            <Typography color="text.secondary">
              Monthly duty overview and planning.
            </Typography>
          </Box>

          <Stack
            direction="row"
            spacing={2}
            sx={{ alignItems: "center" }}
          >
            {loading && <CircularProgress size={20} />}

            <Button
              variant="outlined"
              startIcon={<CalendarTodayIcon />}
              onClick={() => setVisibleMonth(startOfMonth(new Date()))}
            >
              Today
            </Button>
          </Stack>
        </Stack>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Paper
          elevation={0}
          sx={{
            border: "1px solid",
            borderColor: "divider",
            borderRadius: 3,
            overflow: "hidden",
            bgcolor: "background.paper",
          }}
        >
          <Stack
            direction="row"
            sx={{
              justifyContent: "space-between",
              alignItems: "center",
              px: { xs: 2, md: 3 },
              py: 2,
              borderBottom: "1px solid",
              borderColor: "divider",
            }}
          >
            <Button
              startIcon={<NavigateBeforeIcon />}
              onClick={() =>
                setVisibleMonth((current) =>
                  addMonths(current, -1),
                )
              }
            >
              Previous
            </Button>

            <Typography
              variant="h6"
              sx={{ fontWeight: 700, textAlign: "center" }}
            >
              {monthTitle}
            </Typography>

            <Button
              endIcon={<NavigateNextIcon />}
              onClick={() =>
                setVisibleMonth((current) =>
                  addMonths(current, 1),
                )
              }
            >
              Next
            </Button>
          </Stack>

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns:
                "repeat(7, minmax(0, 1fr))",
              borderBottom: "1px solid",
              borderColor: "divider",
              bgcolor: "action.hover",
            }}
          >
            {WEEKDAY_NAMES.map((weekday) => (
              <Box
                key={weekday}
                sx={{
                  px: 1,
                  py: 1.5,
                  borderRight: "1px solid",
                  borderColor: "divider",
                  "&:last-child": {
                    borderRight: "none",
                  },
                }}
              >
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{
                    fontWeight: 700,
                    display: "block",
                    textAlign: "center",
                    textTransform: "uppercase",
                    letterSpacing: 0.7,
                  }}
                >
                  {weekday.slice(0, 3)}
                </Typography>
              </Box>
            ))}
          </Box>

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns:
                "repeat(7, minmax(0, 1fr))",
            }}
          >
            {calendarDays.map((date) => {
              const key = dateKey(date);
              const isCurrentMonth =
                date.getMonth() === visibleMonth.getMonth();
              const isToday = isSameDay(
                date,
                new Date(),
              );
              const manualAssignment = assignments[key];
              const fixedDuty = getWeekdayDuty(date);
              const weekendDuty = getWeekendDuty(date);
              const birthday = getBirthday(date);
              const multiDayEvents = getMultiDayEvents(date);

              const displayedDuty =
                manualAssignment?.employee.name ??
                fixedDuty ??
                weekendDuty ??
                null;

              const isWeekend =
                date.getDay() === 5 ||
                date.getDay() === 6 ||
                date.getDay() === 0;

              return (
                <Box
                  key={key}
                  onClick={() => openDay(date)}
                  sx={(theme) => ({
                    position: "relative",
                    minHeight: {
                      xs: 132,
                      sm: 160,
                      lg: 180,
                    },
                    p: 1,
                    cursor: "pointer",
                    borderRight: "1px solid",
                    borderBottom: "1px solid",
                    borderColor: "divider",
                    bgcolor: isCurrentMonth
                      ? isWeekend
                        ? alpha(theme.palette.primary.main, 0.04)
                        : "background.paper"
                      : "action.hover",
                    opacity: isCurrentMonth ? 1 : 0.55,
                    transition: "background-color 160ms ease",
                    "&:nth-of-type(7n)": {
                      borderRight: "none",
                    },
                    "&:hover": {
                      bgcolor: alpha(
                        theme.palette.primary.main,
                        0.08,
                      ),
                    },
                  })}
                >
                  <Stack
                    direction="row"
                    sx={{
                      justifyContent: "space-between",
                      alignItems: "center",
                      mb: 1,
                    }}
                  >
                    <Box
                      sx={{
                        width: 28,
                        height: 28,
                        display: "grid",
                        placeItems: "center",
                        borderRadius: "50%",
                        bgcolor: isToday
                          ? "primary.main"
                          : "transparent",
                        color: isToday
                          ? "primary.contrastText"
                          : "text.primary",
                        fontWeight: 700,
                        fontSize: 13,
                      }}
                    >
                      {date.getDate()}
                    </Box>

                    {date.getDay() === 5 && (
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ fontWeight: 600 }}
                      >
                        Weekend
                      </Typography>
                    )}
                  </Stack>

                  <Stack spacing={0.75}>
                    {displayedDuty && (
                      <Chip
                        size="small"
                        label={
                          manualAssignment
                            ? `Duty: ${displayedDuty}`
                            : date.getDay() === 5
                              ? `Weekend: ${displayedDuty}`
                              : `Duty: ${displayedDuty}`
                        }
                        sx={(theme) => ({
                          alignSelf: "stretch",
                          height: "auto",
                          justifyContent: "flex-start",
                          bgcolor: manualAssignment
                            ? (manualAssignment.employee.team
                                .color ??
                              theme.palette.primary.main)
                            : alpha(
                                theme.palette.primary.main,
                                0.12,
                              ),
                          color: manualAssignment
                            ? "#FFFFFF"
                            : theme.palette.primary.main,
                          fontWeight: 700,
                          "& .MuiChip-label": {
                            display: "block",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            py: 0.45,
                          },
                        })}
                      />
                    )}

                    {!displayedDuty &&
                      isCurrentMonth &&
                      date.getDay() <= 4 && (
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ pt: 0.5 }}
                        >
                          Click to assign
                        </Typography>
                      )}

                    {date.getDay() === 6 &&
                      weekendDuty && (
                        <Typography
                          variant="caption"
                          color="text.secondary"
                        >
                          Weekend duty continues
                        </Typography>
                      )}

                    {date.getDay() === 0 &&
                      weekendDuty && (
                        <Typography
                          variant="caption"
                          color="text.secondary"
                        >
                          Weekend duty ends 08:00
                        </Typography>
                      )}

                    {manualAssignment?.notes && (
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {manualAssignment.notes}
                      </Typography>
                    )}

                    {multiDayEvents.map((event) => (
                      <Box
                        key={`${event.title}-${event.start}`}
                        sx={{
                          px: 0.75,
                          py: 0.5,
                          borderRadius: 1,
                          bgcolor: event.color,
                          color: "#FFFFFF",
                          fontSize: 11,
                          fontWeight: 700,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {event.title}
                      </Box>
                    ))}

                    {birthday && (
                      <Typography
                        variant="caption"
                        sx={{
                          color: "text.secondary",
                          fontWeight: 600,
                        }}
                      >
                        🎂 {birthday.label}
                      </Typography>
                    )}
                  </Stack>
                </Box>
              );
            })}
          </Box>
        </Paper>

        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={2}
          sx={{
            mt: 2,
            alignItems: { xs: "flex-start", sm: "center" },
          }}
        >
          <Chip
            size="small"
            label="Fixed weekday duty"
            sx={(theme) => ({
              bgcolor: alpha(theme.palette.primary.main, 0.12),
              color: theme.palette.primary.main,
              fontWeight: 700,
            })}
          />

          <Chip
            size="small"
            label="Weekend duty"
            sx={{
              bgcolor: "action.selected",
              color: "text.primary",
              fontWeight: 700,
            }}
          />

          <Typography variant="caption" color="text.secondary">
            Empty weekend slots represent former TJ and MT
            rotations.
          </Typography>
        </Stack>
      </Box>
    </>
  );
}
