import { useEffect, useState } from "react";

import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Paper,
  Stack,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import LightModeIcon from "@mui/icons-material/LightMode";

import { api } from "../services/api";
import { useColorMode } from "../theme/ColorModeProvider";

export default function Settings() {
  const { mode, toggleMode } = useColorMode();

  const [lockEnabled, setLockEnabled] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [error, setError] = useState("");

  const [setPasswordOpen, setSetPasswordOpen] =
    useState(false);
  const [confirmDisableOpen, setConfirmDisableOpen] =
    useState(false);

  useEffect(() => {
    api.authStatus()
      .then((status) => setLockEnabled(status.enabled))
      .catch(() =>
        setError("Unable to load password protection status."),
      )
      .finally(() => setLoadingStatus(false));
  }, []);

  function handleToggle(
    _event: unknown,
    checked: boolean,
  ) {
    setError("");

    if (checked) {
      setSetPasswordOpen(true);
    } else {
      setConfirmDisableOpen(true);
    }
  }

  async function handleDisable() {
    try {
      await api.disableLock();
      setLockEnabled(false);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to disable password protection.",
      );
    } finally {
      setConfirmDisableOpen(false);
    }
  }

  return (
    <Box>
      <Stack sx={{ mb: 4 }}>
        <Typography
          variant="h4"
          sx={{ fontWeight: 700 }}
        >
          Settings
        </Typography>

        <Typography color="text.secondary">
          Appearance and access preferences for this app.
        </Typography>
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
        <Typography
          variant="h6"
          sx={{ fontWeight: 700, mb: 0.5 }}
        >
          Appearance
        </Typography>

        <Typography color="text.secondary" sx={{ mb: 2 }}>
          Switch between light and dark mode.
        </Typography>

        <FormControlLabel
          control={
            <Switch
              checked={mode === "dark"}
              onChange={toggleMode}
            />
          }
          label={
            <Stack
              direction="row"
              spacing={1}
              sx={{ alignItems: "center" }}
            >
              {mode === "dark" ? (
                <DarkModeIcon fontSize="small" />
              ) : (
                <LightModeIcon fontSize="small" />
              )}

              <span>
                {mode === "dark" ? "Dark mode" : "Light mode"}
              </span>
            </Stack>
          }
        />
      </Paper>

      <Paper
        elevation={0}
        sx={{
          border: "1px solid",
          borderColor: "divider",
          borderRadius: 3,
          p: 3,
        }}
      >
        <Typography
          variant="h6"
          sx={{ fontWeight: 700, mb: 0.5 }}
        >
          Password Protection
        </Typography>

        <Typography color="text.secondary" sx={{ mb: 2 }}>
          When enabled, a password is required to open this
          app. There is no separate username — everyone
          uses the same password.
        </Typography>

        <FormControlLabel
          disabled={loadingStatus}
          control={
            <Switch
              checked={lockEnabled}
              onChange={handleToggle}
            />
          }
          label={
            lockEnabled ? "Enabled" : "Disabled"
          }
        />
      </Paper>

      <SetPasswordDialog
        open={setPasswordOpen}
        onClose={() => setSetPasswordOpen(false)}
        onEnabled={() => {
          setLockEnabled(true);
          setSetPasswordOpen(false);
        }}
      />

      <Dialog
        open={confirmDisableOpen}
        onClose={() => setConfirmDisableOpen(false)}
      >
        <DialogTitle>
          Turn off password protection?
        </DialogTitle>

        <DialogContent>
          <Typography color="text.secondary">
            Anyone with the link will be able to open this
            app without a password.
          </Typography>
        </DialogContent>

        <DialogActions>
          <Button
            onClick={() => setConfirmDisableOpen(false)}
          >
            Cancel
          </Button>

          <Button color="error" onClick={handleDisable}>
            Turn off
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

function SetPasswordDialog({
  open,
  onClose,
  onEnabled,
}: {
  open: boolean;
  onClose: () => void;
  onEnabled: () => void;
}) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] =
    useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setPassword("");
      setConfirmPassword("");
      setError("");
    }
  }, [open]);

  async function handleSubmit() {
    if (password.length < 4) {
      setError(
        "Password must be at least 4 characters.",
      );
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      setSaving(true);
      setError("");

      await api.enableLock(password);

      onEnabled();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to enable password protection.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth>
      <DialogTitle>Set a password</DialogTitle>

      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          {error && (
            <Alert severity="error">{error}</Alert>
          )}

          <TextField
            type="password"
            label="Password"
            value={password}
            onChange={(e) =>
              setPassword(e.target.value)
            }
            autoFocus
            fullWidth
          />

          <TextField
            type="password"
            label="Confirm password"
            value={confirmPassword}
            onChange={(e) =>
              setConfirmPassword(e.target.value)
            }
            fullWidth
          />
        </Stack>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={saving}>
          Cancel
        </Button>

        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={
            saving || !password || !confirmPassword
          }
        >
          Enable
        </Button>
      </DialogActions>
    </Dialog>
  );
}
