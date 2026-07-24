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

interface AssignmentDialogProps {
  open: boolean;
  date: string;
  onClose: () => void;
  onSave: (assignment: Assignment) => void;
}

export default function AssignmentDialog({
  open,
  date,
  onClose,
  onSave,
}: AssignmentDialogProps) {
  const [employees, setEmployees] = useState<Employee[]>([]);

  const [employeeId, setEmployeeId] = useState("");

  const [notes, setNotes] = useState("");

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;

    async function loadEmployees() {
      try {
        setLoading(true);

        const data = await api.employees();

        setEmployees(data);

        if (data.length > 0) {
          setEmployeeId(data[0].id);
        }
      } catch {
        setError("Unable to load employees.");
      } finally {
        setLoading(false);
      }
    }

    loadEmployees();
  }, [open]);

  function handleSave() {
    if (!employeeId) {
      setError("Please select an employee.");
      return;
    }

    onSave({
      employeeId,
      notes,
    });

    setNotes("");
  }

  const selectedEmployee = employees.find(
    (e) => e.id === employeeId,
  );

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
    >
      <DialogTitle>
        Assign Duty
      </DialogTitle>

      <DialogContent>
        <Stack
          spacing={3}
          mt={1}
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
            disabled={loading}
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
            InputProps={{
              readOnly: true,
            }}
          />

          <TextField
            multiline
            minRows={4}
            label="Notes"
            value={notes}
            onChange={(e) =>
              setNotes(e.target.value)
            }
          />
        </Stack>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>
          Cancel
        </Button>

        <Button
          variant="contained"
          onClick={handleSave}
        >
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
}
