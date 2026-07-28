import { useEffect, useState } from "react";

import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Stack,
  TextField,
} from "@mui/material";

import {
  api,
  type CreateEmployeeDto,
  type Employee,
  type Team,
} from "../../services/api";

interface EmployeeDialogProps {
  open: boolean;
  employee?: Employee | null;
  onClose: () => void;
  onSaved: () => void;
}

export default function EmployeeDialog({
  open,
  employee,
  onClose,
  onSaved,
}: EmployeeDialogProps) {
  const [teams, setTeams] = useState<Team[]>([]);

  const [form, setForm] = useState<CreateEmployeeDto>({
    name: "",
    department: "",
    teamId: "",
    email: "",
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;

    async function load() {
      try {
        const teamData = await api.teams();

        setTeams(teamData);

        if (employee) {
          setForm({
            name: employee.name,
            department: employee.department,
            teamId: employee.teamId,
            email: employee.email ?? "",
          });
        } else {
          setForm({
            name: "",
            department: "",
            teamId: teamData[0]?.id ?? "",
            email: "",
          });
        }
      } catch (err) {
        console.error(err);
      }
    }

    load();
  }, [open, employee]);

  function update<K extends keyof CreateEmployeeDto>(
    field: K,
    value: CreateEmployeeDto[K],
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function save() {
    setError("");

    if (
      !form.name.trim() ||
      !form.department.trim() ||
      !form.teamId
    ) {
      setError("Please complete all fields.");
      return;
    }

    try {
      setSaving(true);

      const payload = {
        ...form,
        email: form.email?.trim() || null,
      };

      if (employee) {
        await api.updateEmployee(employee.id, payload);
      } else {
        await api.createEmployee(payload);
      }

      onSaved();
      onClose();
    } catch (err) {
      console.error(err);
      setError(
        err instanceof Error
          ? err.message
          : "Unable to save employee.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
    >
      <DialogTitle>
        {employee ? "Edit Employee" : "New Employee"}
      </DialogTitle>

      <DialogContent>
        <Stack
          spacing={3}
          sx={{ mt: 1 }}
        >
          {error && (
            <Alert severity="error">
              {error}
            </Alert>
          )}

          <TextField
            label="Initials / Name"
            value={form.name}
            onChange={(e) =>
              update("name", e.target.value)
            }
            fullWidth
          />

          <TextField
            label="Department"
            value={form.department}
            onChange={(e) =>
              update("department", e.target.value)
            }
            fullWidth
          />

          <TextField
            select
            label="Team"
            value={form.teamId}
            onChange={(e) =>
              update("teamId", e.target.value)
            }
            fullWidth
          >
            {teams.map((team) => (
              <MenuItem
                key={team.id}
                value={team.id}
              >
                {team.name}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            type="email"
            label="Email"
            value={form.email ?? ""}
            onChange={(e) =>
              update("email", e.target.value)
            }
            helperText="Work email — matches this employee to their Microsoft sign-in and is where duty notifications go."
            fullWidth
          />
        </Stack>
      </DialogContent>

      <DialogActions>
        <Button
          onClick={onClose}
          disabled={saving}
        >
          Cancel
        </Button>

        <Button
          variant="contained"
          onClick={save}
          disabled={saving}
        >
          {employee ? "Save Changes" : "Create Employee"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
