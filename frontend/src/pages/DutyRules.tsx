import { useEffect, useMemo, useState } from "react";

import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  FormControlLabel,
  IconButton,
  MenuItem,
  Snackbar,
  Stack,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";

import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import RefreshIcon from "@mui/icons-material/Refresh";

import { api } from "../services/api";
import type {
  DutyRule,
  DutyRuleType,
  Employee,
  Team,
  Weekday,
} from "../services/api";

const WEEKDAYS: Weekday[] = [
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
  "SUNDAY",
];

const WEEKDAY_LABELS: Record<Weekday, string> = {
  MONDAY: "Monday",
  TUESDAY: "Tuesday",
  WEDNESDAY: "Wednesday",
  THURSDAY: "Thursday",
  FRIDAY: "Friday",
  SATURDAY: "Saturday",
  SUNDAY: "Sunday",
};

const RULE_TYPES: DutyRuleType[] = [
  "FIXED",
  "ROTATION",
  "MANUAL",
];

const RULE_TYPE_DESCRIPTIONS: Record<DutyRuleType, string> = {
  FIXED: "Always the same employee",
  ROTATION: "Rotates weekly across the team",
  MANUAL: "Assigned by hand, not auto-generated",
};

export default function DutyRules() {
  const [rules, setRules] = useState<DutyRule[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [snackbar, setSnackbar] = useState("");
  const [teamFilter, setTeamFilter] = useState("");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<DutyRule | null>(null);
  const [teamId, setTeamId] = useState("");
  const [weekday, setWeekday] = useState<Weekday>("MONDAY");
  const [ruleType, setRuleType] =
    useState<DutyRuleType>("FIXED");
  const [employeeId, setEmployeeId] = useState("");
  const [active, setActive] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const [deleting, setDeleting] = useState<DutyRule | null>(
    null,
  );

  async function loadAll() {
    try {
      setLoading(true);
      setError("");

      const [rulesData, teamsData, employeesData] =
        await Promise.all([
          api.dutyRules(),
          api.teams(),
          api.employees(),
        ]);

      setRules(rulesData);
      setTeams(teamsData);
      setEmployees(employeesData);
    } catch (err) {
      console.error(err);
      setError("Unable to load duty rules.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
  }, []);

  const filteredRules = useMemo(() => {
    return [...rules]
      .filter((rule) =>
        teamFilter ? rule.teamId === teamFilter : true,
      )
      .sort((a, b) => {
        const teamCompare = a.team.name.localeCompare(
          b.team.name,
        );

        if (teamCompare !== 0) return teamCompare;

        return (
          WEEKDAYS.indexOf(a.weekday) -
          WEEKDAYS.indexOf(b.weekday)
        );
      });
  }, [rules, teamFilter]);

  const employeesForTeam = useMemo(() => {
    return employees.filter((e) => e.teamId === teamId);
  }, [employees, teamId]);

  function openCreate() {
    setEditing(null);
    setTeamId(teams[0]?.id ?? "");
    setWeekday("MONDAY");
    setRuleType("FIXED");
    setEmployeeId("");
    setActive(true);
    setFormError("");
    setDialogOpen(true);
  }

  function openEdit(rule: DutyRule) {
    setEditing(rule);
    setTeamId(rule.teamId);
    setWeekday(rule.weekday);
    setRuleType(rule.ruleType);
    setEmployeeId(rule.employeeId ?? "");
    setActive(rule.active);
    setFormError("");
    setDialogOpen(true);
  }

  async function handleSave() {
    if (!teamId) {
      setFormError("Please select a team.");
      return;
    }

    if (ruleType === "FIXED" && !employeeId) {
      setFormError(
        "Please select an employee for a fixed rule.",
      );
      return;
    }

    try {
      setSaving(true);
      setFormError("");

      const payload = {
        teamId,
        weekday,
        ruleType,
        employeeId:
          ruleType === "FIXED" ? employeeId : undefined,
        active,
      };

      if (editing) {
        await api.updateDutyRule(editing.id, payload);
      } else {
        await api.createDutyRule(payload);
      }

      setDialogOpen(false);
      await loadAll();
      setSnackbar(
        editing ? "Duty rule updated." : "Duty rule added.",
      );
    } catch (err) {
      console.error(err);
      setFormError(
        editing
          ? "Unable to update duty rule."
          : "A rule already exists for this team and weekday.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleting) return;

    try {
      await api.deleteDutyRule(deleting.id);

      setDeleting(null);
      await loadAll();
      setSnackbar("Duty rule removed.");
    } catch (err) {
      console.error(err);
      setError("Unable to delete duty rule.");
    }
  }

  return (
    <>
      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>
          {editing ? "Edit Duty Rule" : "Add Duty Rule"}
        </DialogTitle>

        <DialogContent>
          <Stack spacing={3} mt={1}>
            {formError && (
              <Alert severity="error">{formError}</Alert>
            )}

            <TextField
              select
              label="Team"
              value={teamId}
              disabled={saving}
              onChange={(e) => {
                setTeamId(e.target.value);
                setEmployeeId("");
              }}
            >
              {teams.map((team) => (
                <MenuItem key={team.id} value={team.id}>
                  {team.name}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              select
              label="Weekday"
              value={weekday}
              disabled={saving}
              onChange={(e) =>
                setWeekday(e.target.value as Weekday)
              }
            >
              {WEEKDAYS.map((day) => (
                <MenuItem key={day} value={day}>
                  {WEEKDAY_LABELS[day]}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              select
              label="Rule Type"
              value={ruleType}
              disabled={saving}
              onChange={(e) => {
                setRuleType(e.target.value as DutyRuleType);

                if (e.target.value !== "FIXED") {
                  setEmployeeId("");
                }
              }}
              helperText={RULE_TYPE_DESCRIPTIONS[ruleType]}
            >
              {RULE_TYPES.map((type) => (
                <MenuItem key={type} value={type}>
                  {type}
                </MenuItem>
              ))}
            </TextField>

            {ruleType === "FIXED" && (
              <TextField
                select
                label="Employee"
                value={employeeId}
                disabled={saving}
                onChange={(e) =>
                  setEmployeeId(e.target.value)
                }
              >
                {employeesForTeam.map((employee) => (
                  <MenuItem
                    key={employee.id}
                    value={employee.id}
                  >
                    {employee.name}
                  </MenuItem>
                ))}

                {employeesForTeam.length === 0 && (
                  <MenuItem value="" disabled>
                    No employees on this team
                  </MenuItem>
                )}
              </TextField>
            )}

            <FormControlLabel
              control={
                <Switch
                  checked={active}
                  disabled={saving}
                  onChange={(e) =>
                    setActive(e.target.checked)
                  }
                />
              }
              label="Active"
            />
          </Stack>
        </DialogContent>

        <DialogActions>
          <Button
            onClick={() => setDialogOpen(false)}
            disabled={saving}
          >
            Cancel
          </Button>

          <Button
            variant="contained"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? "Saving…" : "Save"}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={deleting !== null}
        onClose={() => setDeleting(null)}
      >
        <DialogTitle>Delete Duty Rule</DialogTitle>

        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete the{" "}
            <strong>
              {deleting && WEEKDAY_LABELS[deleting.weekday]}
            </strong>{" "}
            rule for <strong>{deleting?.team.name}</strong>?
          </DialogContentText>
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setDeleting(null)}>
            Cancel
          </Button>

          <Button
            color="error"
            variant="contained"
            onClick={handleDelete}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar !== ""}
        autoHideDuration={3000}
        onClose={() => setSnackbar("")}
        message={snackbar}
      />

      <Box>
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          mb={4}
        >
          <Box>
            <Typography variant="h4" fontWeight={700}>
              Duty Rules
            </Typography>

            <Typography color="text.secondary">
              Define who is responsible for each weekday —
              drives automatic roster generation.
            </Typography>
          </Box>

          <Stack direction="row" spacing={2}>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={loadAll}
            >
              Refresh
            </Button>

            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={openCreate}
              disabled={teams.length === 0}
            >
              New Rule
            </Button>
          </Stack>
        </Stack>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <Card
          elevation={0}
          sx={{
            border: "1px solid #E5E7EB",
            borderRadius: 3,
          }}
        >
          <CardContent>
            <Stack
              direction="row"
              justifyContent="flex-end"
              mb={3}
            >
              <TextField
                select
                size="small"
                label="Filter by team"
                value={teamFilter}
                onChange={(e) =>
                  setTeamFilter(e.target.value)
                }
                sx={{ minWidth: 220 }}
              >
                <MenuItem value="">All teams</MenuItem>

                {teams.map((team) => (
                  <MenuItem key={team.id} value={team.id}>
                    {team.name}
                  </MenuItem>
                ))}
              </TextField>
            </Stack>

            {loading ? (
              <Box
                display="flex"
                justifyContent="center"
                py={6}
              >
                <CircularProgress />
              </Box>
            ) : (
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Team</TableCell>
                    <TableCell>Weekday</TableCell>
                    <TableCell>Rule Type</TableCell>
                    <TableCell>Employee</TableCell>
                    <TableCell>Active</TableCell>
                    <TableCell align="right">
                      Actions
                    </TableCell>
                  </TableRow>
                </TableHead>

                <TableBody>
                  {filteredRules.map((rule) => (
                    <TableRow key={rule.id} hover>
                      <TableCell>
                        <Chip
                          size="small"
                          label={rule.team.name}
                          sx={{
                            bgcolor:
                              rule.team.color ?? "#0A4D8C",
                            color: "#FFFFFF",
                            fontWeight: 700,
                          }}
                        />
                      </TableCell>

                      <TableCell>
                        {WEEKDAY_LABELS[rule.weekday]}
                      </TableCell>

                      <TableCell>{rule.ruleType}</TableCell>

                      <TableCell>
                        {rule.employee?.name ?? (
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
                          label={
                            rule.active ? "Active" : "Inactive"
                          }
                          sx={{
                            bgcolor: rule.active
                              ? "#E8F1FB"
                              : "#F3F4F6",
                            color: rule.active
                              ? "#0A4D8C"
                              : "#374151",
                            fontWeight: 700,
                          }}
                        />
                      </TableCell>

                      <TableCell align="right">
                        <IconButton
                          color="primary"
                          onClick={() => openEdit(rule)}
                        >
                          <EditIcon />
                        </IconButton>

                        <IconButton
                          color="error"
                          onClick={() => setDeleting(rule)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}

                  {filteredRules.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} align="center">
                        <Typography
                          color="text.secondary"
                          py={4}
                        >
                          No duty rules found.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </Box>
    </>
  );
}
