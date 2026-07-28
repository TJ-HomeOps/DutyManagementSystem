import { useEffect, useState } from "react";

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
import type { Currency, Team } from "../services/api";

const DEFAULT_COLOR = "#0A4D8C";
const DEFAULT_RATES = {
  currency: "DKK" as Currency,
  weekdayRate: 1250,
  weekendRate: 6000,
  holidayRate: 2250,
};

export default function Teams() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [snackbar, setSnackbar] = useState("");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Team | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState(DEFAULT_COLOR);
  const [currency, setCurrency] = useState<Currency>(
    DEFAULT_RATES.currency,
  );
  const [weekdayRate, setWeekdayRate] = useState(
    String(DEFAULT_RATES.weekdayRate),
  );
  const [weekendRate, setWeekendRate] = useState(
    String(DEFAULT_RATES.weekendRate),
  );
  const [holidayRate, setHolidayRate] = useState(
    String(DEFAULT_RATES.holidayRate),
  );
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const [deleting, setDeleting] = useState<Team | null>(null);
  const [deleteError, setDeleteError] = useState("");

  async function loadTeams() {
    try {
      setLoading(true);
      setError("");

      const data = await api.teams();

      setTeams(data);
    } catch (err) {
      console.error(err);
      setError("Unable to load teams.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTeams();
  }, []);

  function openCreate() {
    setEditing(null);
    setName("");
    setDescription("");
    setColor(DEFAULT_COLOR);
    setCurrency(DEFAULT_RATES.currency);
    setWeekdayRate(String(DEFAULT_RATES.weekdayRate));
    setWeekendRate(String(DEFAULT_RATES.weekendRate));
    setHolidayRate(String(DEFAULT_RATES.holidayRate));
    setFormError("");
    setDialogOpen(true);
  }

  function openEdit(team: Team) {
    setEditing(team);
    setName(team.name);
    setDescription(team.description ?? "");
    setColor(team.color ?? DEFAULT_COLOR);
    setCurrency(team.currency);
    setWeekdayRate(String(team.weekdayRate));
    setWeekendRate(String(team.weekendRate));
    setHolidayRate(String(team.holidayRate));
    setFormError("");
    setDialogOpen(true);
  }

  async function handleSave() {
    if (!name.trim()) {
      setFormError("Please provide a team name.");
      return;
    }

    try {
      setSaving(true);
      setFormError("");

      const payload = {
        name,
        description: description || undefined,
        color: color || undefined,
        currency,
        weekdayRate: Number(weekdayRate),
        weekendRate: Number(weekendRate),
        holidayRate: Number(holidayRate),
      };

      if (editing) {
        await api.updateTeam(editing.id, payload);
      } else {
        await api.createTeam(payload);
      }

      setDialogOpen(false);
      await loadTeams();
      setSnackbar(editing ? "Team updated." : "Team added.");
    } catch (err) {
      console.error(err);
      setFormError(
        editing
          ? "Unable to update team."
          : "Unable to create team. The name may already be in use.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleting) return;

    try {
      setDeleteError("");
      await api.deleteTeam(deleting.id);

      setDeleting(null);
      await loadTeams();
      setSnackbar("Team deleted.");
    } catch (err) {
      console.error(err);
      setDeleteError(
        "Unable to delete this team — it still has employees, duty rules, or assignments linked to it.",
      );
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
          {editing ? "Edit Team" : "Add Team"}
        </DialogTitle>

        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            {formError && (
              <Alert severity="error">{formError}</Alert>
            )}

            <TextField
              label="Name"
              value={name}
              disabled={saving}
              onChange={(e) => setName(e.target.value)}
            />

            <TextField
              label="Description"
              multiline
              minRows={2}
              value={description}
              disabled={saving}
              onChange={(e) => setDescription(e.target.value)}
            />

            <Stack
              direction="row"
              spacing={2}
              sx={{ alignItems: "center" }}
            >
              <TextField
                type="color"
                label="Color"
                value={color}
                disabled={saving}
                onChange={(e) => setColor(e.target.value)}
                sx={{ width: 120 }}
              />

              <Chip
                label={name || "Preview"}
                sx={{
                  bgcolor: color,
                  color: "#FFFFFF",
                  fontWeight: 700,
                }}
              />
            </Stack>

            <TextField
              select
              label="Currency"
              value={currency}
              disabled={saving}
              onChange={(e) =>
                setCurrency(e.target.value as Currency)
              }
            >
              <MenuItem value="DKK">DKK</MenuItem>
              <MenuItem value="EUR">EUR</MenuItem>
            </TextField>

            <Stack
              direction="row"
              spacing={2}
            >
              <TextField
                type="number"
                label="Weekday rate"
                value={weekdayRate}
                disabled={saving}
                onChange={(e) =>
                  setWeekdayRate(e.target.value)
                }
                fullWidth
              />

              <TextField
                type="number"
                label="Weekend rate"
                value={weekendRate}
                disabled={saving}
                onChange={(e) =>
                  setWeekendRate(e.target.value)
                }
                fullWidth
              />

              <TextField
                type="number"
                label="Holiday rate"
                value={holidayRate}
                disabled={saving}
                onChange={(e) =>
                  setHolidayRate(e.target.value)
                }
                fullWidth
              />
            </Stack>
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
        onClose={() => {
          setDeleting(null);
          setDeleteError("");
        }}
      >
        <DialogTitle>Delete Team</DialogTitle>

        <DialogContent>
          {deleteError ? (
            <Alert severity="error">{deleteError}</Alert>
          ) : (
            <DialogContentText>
              Are you sure you want to delete{" "}
              <strong>{deleting?.name}</strong>?
            </DialogContentText>
          )}
        </DialogContent>

        <DialogActions>
          <Button
            onClick={() => {
              setDeleting(null);
              setDeleteError("");
            }}
          >
            {deleteError ? "Close" : "Cancel"}
          </Button>

          {!deleteError && (
            <Button
              color="error"
              variant="contained"
              onClick={handleDelete}
            >
              Delete
            </Button>
          )}
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
          sx={{
            justifyContent: "space-between",
            alignItems: "center",
            mb: 4,
          }}
        >
          <Box>
            <Typography
              variant="h4"
              sx={{ fontWeight: 700 }}
            >
              Teams
            </Typography>

            <Typography color="text.secondary">
              Manage teams used across employees, duty rules and
              scheduling.
            </Typography>
          </Box>

          <Stack direction="row" spacing={2}>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={loadTeams}
            >
              Refresh
            </Button>

            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={openCreate}
            >
              New Team
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
            border: "1px solid",
            borderColor: "divider",
            borderRadius: 3,
          }}
        >
          <CardContent>
            {loading ? (
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "center",
                  py: 6,
                }}
              >
                <CircularProgress />
              </Box>
            ) : (
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Team</TableCell>
                    <TableCell>Description</TableCell>
                    <TableCell>Currency</TableCell>
                    <TableCell align="right">
                      Actions
                    </TableCell>
                  </TableRow>
                </TableHead>

                <TableBody>
                  {teams.map((team) => (
                    <TableRow key={team.id} hover>
                      <TableCell>
                        <Chip
                          size="small"
                          label={team.name}
                          sx={{
                            bgcolor:
                              team.color ?? DEFAULT_COLOR,
                            color: "#FFFFFF",
                            fontWeight: 700,
                          }}
                        />
                      </TableCell>

                      <TableCell>
                        {team.description || (
                          <Typography
                            component="span"
                            color="text.secondary"
                            variant="body2"
                          >
                            —
                          </Typography>
                        )}
                      </TableCell>

                      <TableCell>{team.currency}</TableCell>

                      <TableCell align="right">
                        <IconButton
                          color="primary"
                          onClick={() => openEdit(team)}
                        >
                          <EditIcon />
                        </IconButton>

                        <IconButton
                          color="error"
                          onClick={() => setDeleting(team)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}

                  {teams.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} align="center">
                        <Typography
                          color="text.secondary"
                          sx={{ py: 4 }}
                        >
                          No teams yet.
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
