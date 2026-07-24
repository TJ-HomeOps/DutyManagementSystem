import { useEffect, useMemo, useState } from "react";

import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
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
  Typography,
} from "@mui/material";

import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";

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

const STATUS_STYLES: Record<
  RosterDayPlan["status"],
  { label: string; bgcolor: string; color: string }
> = {
  existing: {
    label: "Already scheduled",
    bgcolor: "#F3F4F6",
    color: "#374151",
  },
  planned: {
    label: "Will be created",
    bgcolor: "#E8F1FB",
    color: "#0A4D8C",
  },
  unassigned: {
    label: "No rule / manual",
    bgcolor: "#FDECEC",
    color: "#B42318",
  },
  holiday: {
    label: "Holiday",
    bgcolor: "#FEF3C7",
    color: "#92400E",
  },
};

export default function Roster() {
  const now = new Date();

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
      { existing: 0, planned: 0, unassigned: 0, holiday: 0 },
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
        justifyContent="space-between"
        alignItems={{ xs: "flex-start", md: "center" }}
        spacing={2}
        mb={4}
      >
        <Box>
          <Typography variant="h4" fontWeight={700}>
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
          border: "1px solid #E5E7EB",
          borderRadius: 3,
          p: 3,
          mb: 3,
        }}
      >
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={2}
          alignItems={{ xs: "stretch", sm: "center" }}
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

          <Box flex={1} />

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

      <Stack direction="row" spacing={2} mb={2}>
        <Chip
          size="small"
          label={`${summary.existing} already scheduled`}
          sx={{
            bgcolor: STATUS_STYLES.existing.bgcolor,
            color: STATUS_STYLES.existing.color,
            fontWeight: 700,
          }}
        />

        <Chip
          size="small"
          label={`${summary.planned} to generate`}
          sx={{
            bgcolor: STATUS_STYLES.planned.bgcolor,
            color: STATUS_STYLES.planned.color,
            fontWeight: 700,
          }}
        />

        <Chip
          size="small"
          label={`${summary.unassigned} unassigned`}
          sx={{
            bgcolor: STATUS_STYLES.unassigned.bgcolor,
            color: STATUS_STYLES.unassigned.color,
            fontWeight: 700,
          }}
        />

        <Chip
          size="small"
          label={`${summary.holiday} holiday`}
          sx={{
            bgcolor: STATUS_STYLES.holiday.bgcolor,
            color: STATUS_STYLES.holiday.color,
            fontWeight: 700,
          }}
        />
      </Stack>

      <Paper
        elevation={0}
        sx={{
          border: "1px solid #E5E7EB",
          borderRadius: 3,
          overflow: "hidden",
        }}
      >
        {loading ? (
          <Box display="flex" justifyContent="center" py={6}>
            <CircularProgress />
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
                  const style = STATUS_STYLES[day.status];
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
                              color: STATUS_STYLES.holiday
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
                        <Chip
                          size="small"
                          label={style.label}
                          sx={{
                            bgcolor: style.bgcolor,
                            color: style.color,
                            fontWeight: 600,
                          }}
                        />
                      </TableCell>
                    </TableRow>
                  );
                })}

                {plan.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} align="center">
                      <Typography
                        color="text.secondary"
                        py={4}
                      >
                        Select a team to preview the roster.
                      </Typography>
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
