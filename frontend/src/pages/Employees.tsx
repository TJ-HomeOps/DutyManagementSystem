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
  Snackbar,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import RefreshIcon from "@mui/icons-material/Refresh";

import {
  DataGrid,
  type GridColDef,
} from "@mui/x-data-grid";

import { api } from "../services/api";
import type { Employee } from "../services/api";

import EmployeeDialog from "../components/employees/EmployeeDialog";

export default function Employees() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] =
    useState<Employee | null>(null);

  const [deleteEmployee, setDeleteEmployee] =
    useState<Employee | null>(null);

  const [snackbar, setSnackbar] = useState("");

  async function loadEmployees() {
    try {
      setLoading(true);
      setError("");

      const data = await api.employees();

      setEmployees(data);
    } catch (err) {
      console.error(err);
      setError("Unable to load employees.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadEmployees();
  }, []);

  const filteredEmployees = useMemo(() => {
    const value = search.toLowerCase();

    return employees.filter((employee) => {
      return (
        employee.name.toLowerCase().includes(value) ||
        employee.department.toLowerCase().includes(value) ||
        employee.team.name.toLowerCase().includes(value)
      );
    });
  }, [employees, search]);

  async function removeEmployee() {
    if (!deleteEmployee) return;

    try {
      await api.deleteEmployee(deleteEmployee.id);

      setDeleteEmployee(null);

      await loadEmployees();

      setSnackbar("Employee deleted.");
    } catch (err) {
      console.error(err);
      setError("Unable to delete employee.");
    }
  }

  const columns: GridColDef[] = [
    {
      field: "name",
      headerName: "Name",
      flex: 1,
      minWidth: 140,
    },
    {
      field: "department",
      headerName: "Department",
      flex: 1,
      minWidth: 150,
    },
    {
      field: "team",
      headerName: "Team",
      flex: 1,
      minWidth: 170,
      renderCell: (params) => (
        <Chip
          label={params.row.team.name}
          size="small"
          sx={{
            backgroundColor: params.row.team.color,
            color: "#fff",
            fontWeight: 600,
          }}
        />
      ),
    },
    {
      field: "createdAt",
      headerName: "Created",
      minWidth: 150,
      valueFormatter: (value) =>
        new Date(value as string).toLocaleDateString(),
    },
    {
      field: "actions",
      headerName: "Actions",
      sortable: false,
      filterable: false,
      width: 120,
      renderCell: (params) => (
        <>
          <IconButton
            color="primary"
            onClick={() => {
              setSelectedEmployee(params.row);
              setDialogOpen(true);
            }}
          >
            <EditIcon />
          </IconButton>

          <IconButton
            color="error"
            onClick={() =>
              setDeleteEmployee(params.row)
            }
          >
            <DeleteIcon />
          </IconButton>
        </>
      ),
    },
  ];

  return (
    <>
      <EmployeeDialog
        open={dialogOpen}
        employee={selectedEmployee}
        onClose={() => {
          setDialogOpen(false);
          setSelectedEmployee(null);
        }}
        onSaved={async () => {
          await loadEmployees();
          setSnackbar("Employee saved.");
        }}
      />

      <Dialog
        open={deleteEmployee !== null}
        onClose={() => setDeleteEmployee(null)}
      >
        <DialogTitle>
          Delete Employee
        </DialogTitle>

        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete{" "}
            <strong>
              {deleteEmployee?.name}
            </strong>
            ?
          </DialogContentText>
        </DialogContent>

        <DialogActions>
          <Button
            onClick={() =>
              setDeleteEmployee(null)
            }
          >
            Cancel
          </Button>

          <Button
            color="error"
            variant="contained"
            onClick={removeEmployee}
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
              Employees
            </Typography>

            <Typography color="text.secondary">
              Manage personnel and duty assignments.
            </Typography>
          </Box>

          <Stack
            direction="row"
            spacing={2}
          >
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={loadEmployees}
            >
              Refresh
            </Button>

            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => {
                setSelectedEmployee(null);
                setDialogOpen(true);
              }}
            >
              New Employee
            </Button>
          </Stack>
        </Stack>

        {error && (
          <Alert
            severity="error"
            sx={{ mb: 3 }}
          >
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
            <Stack
              direction="row"
              sx={{ justifyContent: "space-between", mb: 3 }}
            >
              <Typography
                variant="h6"
                sx={{ fontWeight: 600 }}
              >
                Employee List
              </Typography>

              <TextField
                size="small"
                placeholder="Search..."
                value={search}
                onChange={(e) =>
                  setSearch(e.target.value)
                }
                sx={{ width: 300 }}
              />
            </Stack>

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
              <DataGrid
                rows={filteredEmployees}
                columns={columns}
                autoHeight
                pageSizeOptions={[10, 25, 50]}
                initialState={{
                  pagination: {
                    paginationModel: {
                      pageSize: 10,
                      page: 0,
                    },
                  },
                }}
                disableRowSelectionOnClick
              />
            )}
          </CardContent>
        </Card>
      </Box>
    </>
  );
}
