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
  Typography,
} from "@mui/material";

import {
  api,
  type Employee,
} from "../../services/api";

export interface Assignment {
  employeeId: string;
  notes: string;
}

export interface ExistingAssignment {
  id: string;
  employeeId: string;
  notes: string;
}

interface AssignmentDialogProps {
  open: boolean;
  date: string;
  existing?: ExistingAssignment | null;
  onClose: () => void;
  onSave: (assignment: Assignment) => Promise<void> | void;
  onDelete?: (id: string) => Promise<void> | void;
}

export default function AssignmentDialog({
  open,
  date,
  existing,
  onClose,
  onSave,
  onDelete,
}: AssignmentDialogProps) {
  const [employees, setEmployees] = useState<Employee[]>([]);

  const [employeeId, setEmployeeId] = useState("");

  const [notes, setNotes] = useState("");

  const [loading, setLoading] = useState(false);

  const [saving, setSaving] = useState(false);

  const [deleting, setDeleting] = useState(false);

  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;

    setError("");

    async function loadEmployees() {
      try {
        setLoading(true);

        const data = await api.employees();

        setEmployees(data);

        if (existing) {
          setEmployeeId(existing.employeeId);
          setNotes(existing.notes);
        } else {
          setEmployeeId(data.length > 0 ? data[0].id : "");
          setNotes("");
        }
      } catch {
        setError("Unable to load employees.");
      } finally {
        setLoading(false);
      }
    }

    loadEmployees();
  }, [open, existing]);

  async function handleSave() {
    if (!employeeId) {
      setError("Please select an employee.");
      return;
    }

    try {
      setSaving(true);
      setError("");

      await onSave({
        employeeId,
        notes,
      });
    } catch {
      setError("Unable to save assignment.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!existing || !onDelete) return;

    try {
      setDeleting(true);
      setError("");

      await onDelete(existing.id);
    } catch {
      setError("Unable to delete assignment.");
    } finally {
      setDeleting(false);
    }
  }

  const selectedEmployee = employees.find(
    (e) => e.id === employeeId,
  );

  const busy = loading || saving || deleting;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
    >
      <DialogTitle>
        {existing ? "Edit Duty" : "Assign Duty"}
      </DialogTitle>

      <DialogContent>
        <Stack
          spacing={3}
          sx={{ mt: 1 }}
        >
          <Typography variant="body2">
            {date}
          </Typography>

          {error && (
            <Alert severity="error">
              {error}
            </Alert>
          )}

          <TextField
            select
            label="Employee"
            value={employeeId}
            disabled={busy}
            onChange={(e) =>
              setEmployeeId(e.target.value)
            }
          >
            {employees.map((employee) => (
              <MenuItem
                key={employee.id}
                value={employee.id}
              >
                {employee.name}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            label="Team"
            value={selectedEmployee?.team.name ?? ""}
            slotProps={{
              input: { readOnly: true },
            }}
          />

          <TextField
            multiline
            minRows={4}
            label="Notes"
            value={notes}
            disabled={busy}
            onChange={(e) =>
              setNotes(e.target.value)
            }
          />
        </Stack>
      </DialogContent>

      <DialogActions>
        {existing && onDelete && (
          <Button
            color="error"
            disabled={busy}
            onClick={handleDelete}
            sx={{ mr: "auto" }}
          >
            {deleting ? "Deleting…" : "Delete"}
          </Button>
        )}

        <Button
          onClick={onClose}
          disabled={busy}
        >
          Cancel
        </Button>

        <Button
          variant="contained"
          onClick={handleSave}
          disabled={busy}
        >
          {saving ? "Saving…" : "Save"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
