import { useEffect, useMemo, useState } from "react";

import {
  Alert,
  Box,
  Button,
  Chip,
  FormControlLabel,
  MenuItem,
  Paper,
  Snackbar,
  Stack,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";

import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import { alpha, useTheme, type Theme } from "@mui/material/styles";

import EmptyState from "../components/EmptyState";
import TableSkeleton from "../components/TableSkeleton";
import { api } from "../services/api";
import type { RosterDayPlan, Team } from "../services/api";

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const WEEKDAY_LABELS: Record<string, string> = {
  MONDAY: "Mon",
  TUESDAY: "Tue",
  WEDNESDAY: "Wed",
  THURSDAY: "Thu",
  FRIDAY: "Fri",
  SATURDAY: "Sat",
  SUNDAY: "Sun",
};

function getStatusStyles(
  theme: Theme,
): Record<
  RosterDayPlan["status"],
  { label: string; bgcolor: string; color: string }
> {
  return {
    existing: {
      label: "Already scheduled",
      bgcolor: theme.palette.action.selected,
      color: theme.palette.text.secondary,
    },
    planned: {
      label: "Will be created",
      bgcolor: alpha(theme.palette.primary.main, 0.12),
      color: theme.palette.primary.main,
    },
    unassigned: {
      label: "No rule / manual",
      bgcolor: alpha(theme.palette.error.main, 0.12),
      color: theme.palette.error.main,
    },
    holiday: {
      label: "Holiday",
      bgcolor: alpha(theme.palette.warning.main, 0.16),
      color: theme.palette.warning.dark,
    },
    conflict: {
      label: "Conflict",
      bgcolor: alpha(theme.palette.error.main, 0.16),
      color: theme.palette.error.dark,
    },
  };
}

export default function Roster() {
  const now = new Date();
  const theme = useTheme();
  const statusStyles = getStatusStyles(theme);

  const [teams, setTeams] = useState<Team[]>([]);
  const [teamId, setTeamId] = useState("");
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [overwrite, setOverwrite] = useState(false);

  const [plan, setPlan] = useState<RosterDayPlan[]>([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");
  const [snackbar, setSnackbar] = useState("");

  useEffect(() => {
    api.teams()
      .then((data) => {
        setTeams(data);

        if (data.length > 0) {
          setTeamId(data[0].id);
        }
      })
      .catch(() => setError("Unable to load teams."));
  }, []);

  async function loadPreview() {
    if (!teamId) return;

    try {
      setLoading(true);
      setError("");

      const data = await api.rosterPreview(teamId, year, month);

      setPlan(data);
    } catch (err) {
      console.error(err);
      setError("Unable to load roster preview.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPreview();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teamId, year, month]);

  async function handleGenerate() {
    if (!teamId) return;

    try {
      setGenerating(true);
      setError("");

      const result = await api.rosterGenerate(
        teamId,
        year,
        month,
        overwrite,
      );

      setSnackbar(
        `Created ${result.created.length}, updated ${result.updated.length}, skipped ${result.skipped.length}.`,
      );

      await loadPreview();
    } catch (err) {
      console.error(err);
      setError("Unable to generate roster.");
    } finally {
      setGenerating(false);
    }
  }

  const summary = useMemo(() => {
    return plan.reduce(
      (acc, day) => {
        acc[day.status] += 1;
        return acc;
      },
      {
        existing: 0,
        planned: 0,
        unassigned: 0,
        holiday: 0,
        conflict: 0,
      },
    );
  }, [plan]);

  const plannedCount = summary.planned;

  return (
    <Box>
      <Snackbar
        open={snackbar !== ""}
        autoHideDuration={4000}
        onClose={() => setSnackbar("")}
        message={snackbar}
      />

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
            Roster
          </Typography>

          <Typography color="text.secondary">
            Generate duty assignments automatically from duty
            rules.
          </Typography>
        </Box>
      </Stack>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Paper
        elevation={0}
        sx={{
          border: "1px solid",
          borderColor: "divider",
          borderRadius: 3,
          p: 3,
          mb: 3,
        }}
      >
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={2}
          sx={{
            alignItems: { xs: "stretch", sm: "center" },
          }}
        >
          <TextField
            select
            label="Team"
            value={teamId}
            onChange={(e) => setTeamId(e.target.value)}
            sx={{ minWidth: 200 }}
          >
            {teams.map((team) => (
              <MenuItem key={team.id} value={team.id}>
                {team.name}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            select
            label="Month"
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
            sx={{ minWidth: 160 }}
          >
            {MONTH_NAMES.map((name, index) => (
              <MenuItem key={name} value={index + 1}>
                {name}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            type="number"
            label="Year"
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            sx={{ minWidth: 120 }}
          />

          <FormControlLabel
            control={
              <Switch
                checked={overwrite}
                onChange={(e) => setOverwrite(e.target.checked)}
              />
            }
            label="Overwrite existing"
          />

          <Box sx={{ flex: 1 }} />

          <Button
            variant="contained"
            startIcon={<AutoAwesomeIcon />}
            disabled={
              !teamId || generating || plannedCount === 0
            }
            onClick={handleGenerate}
          >
            {generating
              ? "Generating…"
              : `Generate Roster (${plannedCount})`}
          </Button>
        </Stack>
      </Paper>

      <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
        <Chip
          size="small"
          label={`${summary.existing} already scheduled`}
          sx={{
            bgcolor: statusStyles.existing.bgcolor,
            color: statusStyles.existing.color,
            fontWeight: 700,
          }}
        />

        <Chip
          size="small"
          label={`${summary.planned} to generate`}
          sx={{
            bgcolor: statusStyles.planned.bgcolor,
            color: statusStyles.planned.color,
            fontWeight: 700,
          }}
        />

        <Chip
          size="small"
          label={`${summary.unassigned} unassigned`}
          sx={{
            bgcolor: statusStyles.unassigned.bgcolor,
            color: statusStyles.unassigned.color,
            fontWeight: 700,
          }}
        />

        <Chip
          size="small"
          label={`${summary.holiday} holiday`}
          sx={{
            bgcolor: statusStyles.holiday.bgcolor,
            color: statusStyles.holiday.color,
            fontWeight: 700,
          }}
        />

        {summary.conflict > 0 && (
          <Chip
            size="small"
            icon={<WarningAmberIcon sx={{ fontSize: 16 }} />}
            label={`${summary.conflict} conflict${summary.conflict === 1 ? "" : "s"}`}
            sx={{
              bgcolor: statusStyles.conflict.bgcolor,
              color: statusStyles.conflict.color,
              fontWeight: 700,
            }}
          />
        )}
      </Stack>

      <Paper
        elevation={0}
        sx={{
          border: "1px solid",
          borderColor: "divider",
          borderRadius: 3,
          overflow: "hidden",
        }}
      >
        {loading ? (
          <Box sx={{ p: 3 }}>
            <TableSkeleton />
          </Box>
        ) : (
          <TableContainer sx={{ maxHeight: 640 }}>
            <Table stickyHeader size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Date</TableCell>
                  <TableCell>Weekday</TableCell>
                  <TableCell>Rule</TableCell>
                  <TableCell>Employee</TableCell>
                  <TableCell>Status</TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {plan.map((day) => {
                  const style = statusStyles[day.status];
                  const employeeName =
                    day.status === "existing"
                      ? day.existingEmployeeName
                      : day.ruleEmployeeName;

                  return (
                    <TableRow key={day.date} hover>
                      <TableCell>{day.date}</TableCell>

                      <TableCell>
                        {WEEKDAY_LABELS[day.weekday] ??
                          day.weekday}
                      </TableCell>

                      <TableCell>
                        {day.isHoliday ? (
                          <Typography
                            component="span"
                            variant="body2"
                            sx={{
                              color: statusStyles.holiday
                                .color,
                              fontWeight: 600,
                            }}
                          >
                            {day.holidayEmployeeName
                              ? `${day.holidayEmployeeName}: ${day.holidayName}`
                              : day.holidayName}
                          </Typography>
                        ) : (
                          day.ruleType ?? (
                            <Typography
                              component="span"
                              color="text.secondary"
                              variant="body2"
                            >
                              No rule
                            </Typography>
                          )
                        )}
                      </TableCell>

                      <TableCell>
                        {employeeName ?? (
                          <Typography
                            component="span"
                            color="text.secondary"
                            variant="body2"
                          >
                            —
                          </Typography>
                        )}
                      </TableCell>

                      <TableCell>
                        <Tooltip
                          title={day.conflict?.message ?? ""}
                          disableHoverListener={!day.conflict}
                        >
                          <Chip
                            size="small"
                            label={style.label}
                            sx={{
                              bgcolor: style.bgcolor,
                              color: style.color,
                              fontWeight: 600,
                            }}
                          />
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  );
                })}

                {plan.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} align="center">
                      <EmptyState message="Select a team to preview the roster." />
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>
    </Box>
  );
}
