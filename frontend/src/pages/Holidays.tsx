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
  IconButton,
  MenuItem,
  Snackbar,
  Stack,
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
import type { Employee, Holiday } from "../services/api";

const ALL_EMPLOYEES_VALUE = "";
const COMPANY_WIDE_VALUE = "";

function todayDateInput(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatDateRange(
  startDate: string,
  endDate: string,
): string {
  const formatter = new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  const start = formatter.format(new Date(startDate));
  const end = formatter.format(new Date(endDate));

  return start === end ? start : `${start} – ${end}`;
}

export default function Holidays() {
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [snackbar, setSnackbar] = useState("");
  const [employeeFilter, setEmployeeFilter] = useState(
    ALL_EMPLOYEES_VALUE,
  );

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Holiday | null>(null);
  const [startDate, setStartDate] = useState(todayDateInput());
  const [endDate, setEndDate] = useState(todayDateInput());
  const [name, setName] = useState("");
  const [employeeId, setEmployeeId] = useState(
    COMPANY_WIDE_VALUE,
  );
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const [deleting, setDeleting] = useState<Holiday | null>(null);

  async function loadHolidays() {
    try {
      setLoading(true);
      setError("");

      const data = await api.holidays();

      setHolidays(data);
    } catch (err) {
      console.error(err);
      setError("Unable to load holidays.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadHolidays();

    api.employees()
      .then(setEmployees)
      .catch(() =>
        setError("Unable to load employees."),
      );
  }, []);

  const sortedHolidays = useMemo(() => {
    return [...holidays]
      .filter((holiday) =>
        employeeFilter === ALL_EMPLOYEES_VALUE
          ? true
          : holiday.employeeId === employeeFilter,
      )
      .sort((a, b) => a.startDate.localeCompare(b.startDate));
  }, [holidays, employeeFilter]);

  function openCreate() {
    setEditing(null);
    setStartDate(todayDateInput());
    setEndDate(todayDateInput());
    setName("");
    setEmployeeId(COMPANY_WIDE_VALUE);
    setFormError("");
    setDialogOpen(true);
  }

  function openEdit(holiday: Holiday) {
    setEditing(holiday);
    setStartDate(holiday.startDate.slice(0, 10));
    setEndDate(holiday.endDate.slice(0, 10));
    setName(holiday.name);
    setEmployeeId(holiday.employeeId ?? COMPANY_WIDE_VALUE);
    setFormError("");
    setDialogOpen(true);
  }

  async function handleSave() {
    if (!startDate || !endDate || !name.trim()) {
      setFormError(
        "Please provide a start date, end date, and a name.",
      );
      return;
    }

    if (endDate < startDate) {
      setFormError("End date cannot be before start date.");
      return;
    }

    try {
      setSaving(true);
      setFormError("");

      const payload = {
        startDate,
        endDate,
        name,
        employeeId:
          employeeId === COMPANY_WIDE_VALUE ? null : employeeId,
      };

      if (editing) {
        await api.updateHoliday(editing.id, payload);
      } else {
        await api.createHoliday(payload);
      }

      setDialogOpen(false);
      await loadHolidays();
      setSnackbar(
        editing ? "Holiday updated." : "Holiday added.",
      );
    } catch (err) {
      console.error(err);
      setFormError(
        editing
          ? "Unable to update holiday."
          : "An overlapping holiday already exists for this date range.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleting) return;

    try {
      await api.deleteHoliday(deleting.id);

      setDeleting(null);
      await loadHolidays();
      setSnackbar("Holiday removed.");
    } catch (err) {
      console.error(err);
      setError("Unable to delete holiday.");
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
          {editing ? "Edit Holiday" : "Add Holiday"}
        </DialogTitle>

        <DialogContent>
          <Stack spacing={3} mt={1}>
            {formError && (
              <Alert severity="error">{formError}</Alert>
            )}

            <Stack direction="row" spacing={2}>
              <TextField
                type="date"
                label="Start date"
                value={startDate}
                disabled={saving}
                onChange={(e) => {
                  setStartDate(e.target.value);

                  if (e.target.value > endDate) {
                    setEndDate(e.target.value);
                  }
                }}
                InputLabelProps={{ shrink: true }}
                fullWidth
              />

              <TextField
                type="date"
                label="End date"
                value={endDate}
                disabled={saving}
                onChange={(e) => setEndDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
                fullWidth
              />
            </Stack>

            <TextField
              label="Name"
              placeholder="e.g. Christmas Day"
              value={name}
              disabled={saving}
              onChange={(e) => setName(e.target.value)}
            />

            <TextField
              select
              label="Employee"
              value={employeeId}
              disabled={saving}
              onChange={(e) => setEmployeeId(e.target.value)}
              helperText='Leave as "All employees" for a company-wide holiday'
            >
              <MenuItem value={COMPANY_WIDE_VALUE}>
                All employees (company-wide)
              </MenuItem>

              {employees.map((employee) => (
                <MenuItem
                  key={employee.id}
                  value={employee.id}
                >
                  {employee.name} ({employee.team.name})
                </MenuItem>
              ))}
            </TextField>
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
        <DialogTitle>Delete Holiday</DialogTitle>

        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete{" "}
            <strong>{deleting?.name}</strong>?
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
              Holidays
            </Typography>

            <Typography color="text.secondary">
              Company-wide and personal holidays are skipped
              automatically when generating the roster.
            </Typography>
          </Box>

          <Stack direction="row" spacing={2}>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={loadHolidays}
            >
              Refresh
            </Button>

            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={openCreate}
            >
              Add Holiday
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
                label="Filter by employee"
                value={employeeFilter}
                onChange={(e) =>
                  setEmployeeFilter(e.target.value)
                }
                sx={{ minWidth: 260 }}
              >
                <MenuItem value={ALL_EMPLOYEES_VALUE}>
                  All holidays
                </MenuItem>

                {employees.map((employee) => (
                  <MenuItem
                    key={employee.id}
                    value={employee.id}
                  >
                    {employee.name}
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
                    <TableCell>Date</TableCell>
                    <TableCell>Name</TableCell>
                    <TableCell>Employee</TableCell>
                    <TableCell align="right">
                      Actions
                    </TableCell>
                  </TableRow>
                </TableHead>

                <TableBody>
                  {sortedHolidays.map((holiday) => (
                    <TableRow key={holiday.id} hover>
                      <TableCell>
                        {formatDateRange(
                          holiday.startDate,
                          holiday.endDate,
                        )}
                      </TableCell>

                      <TableCell>{holiday.name}</TableCell>

                      <TableCell>
                        {holiday.employee ? (
                          <Chip
                            size="small"
                            label={holiday.employee.name}
                            sx={{
                              bgcolor:
                                holiday.employee.team.color ??
                                "#0A4D8C",
                              color: "#FFFFFF",
                              fontWeight: 700,
                            }}
                          />
                        ) : (
                          <Chip
                            size="small"
                            label="All employees"
                            sx={{
                              bgcolor: "#F3F4F6",
                              color: "#374151",
                              fontWeight: 700,
                            }}
                          />
                        )}
                      </TableCell>

                      <TableCell align="right">
                        <IconButton
                          color="primary"
                          onClick={() => openEdit(holiday)}
                        >
                          <EditIcon />
                        </IconButton>

                        <IconButton
                          color="error"
                          onClick={() =>
                            setDeleting(holiday)
                          }
                        >
                          <DeleteIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}

                  {sortedHolidays.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} align="center">
                        <Typography
                          color="text.secondary"
                          py={4}
                        >
                          No holidays found.
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
