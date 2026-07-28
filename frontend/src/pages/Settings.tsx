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

import {
  api,
  type EntraConfig,
  type NotificationsConfig,
} from "../services/api";
import { useColorMode } from "../theme/ColorModeProvider";
import SettingsGate from "../auth/SettingsGate";

export default function Settings() {
  return (
    <SettingsGate>
      <SettingsContent />
    </SettingsGate>
  );
}

function SettingsContent() {
  const { mode, toggleMode } = useColorMode();

  const [lockEnabled, setLockEnabled] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [error, setError] = useState("");

  const [setPasswordOpen, setSetPasswordOpen] =
    useState(false);
  const [confirmDisableOpen, setConfirmDisableOpen] =
    useState(false);
  const [changeAdminPasswordOpen, setChangeAdminPasswordOpen] =
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
          mb: 3,
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

      <EntraSection lockEnabled={lockEnabled} />

      <NotificationsSection />

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
          Admin Password
        </Typography>

        <Typography color="text.secondary" sx={{ mb: 2 }}>
          The separate password that guards this Settings page.
        </Typography>

        <Button
          variant="outlined"
          onClick={() => setChangeAdminPasswordOpen(true)}
        >
          Change admin password
        </Button>
      </Paper>

      <SetPasswordDialog
        open={setPasswordOpen}
        onClose={() => setSetPasswordOpen(false)}
        onEnabled={() => {
          setLockEnabled(true);
          setSetPasswordOpen(false);
        }}
      />

      <ChangeAdminPasswordDialog
        open={changeAdminPasswordOpen}
        onClose={() => setChangeAdminPasswordOpen(false)}
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

function ChangeAdminPasswordDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
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
      setError("Password must be at least 4 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      setSaving(true);
      setError("");

      await api.setSettingsPassword(password);

      onClose();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to change the admin password.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth>
      <DialogTitle>Change admin password</DialogTitle>

      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          {error && <Alert severity="error">{error}</Alert>}

          <TextField
            type="password"
            label="New admin password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoFocus
            fullWidth
          />

          <TextField
            type="password"
            label="Confirm new admin password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
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
          disabled={saving || !password || !confirmPassword}
        >
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function EntraSection({ lockEnabled }: { lockEnabled: boolean }) {
  const [config, setConfig] = useState<EntraConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [enabled, setEnabled] = useState(false);
  const [tenantId, setTenantId] = useState("");
  const [clientId, setClientId] = useState("");
  const [clientSecret, setClientSecret] = useState("");
  const [redirectUri, setRedirectUri] = useState("");

  useEffect(() => {
    api.getEntraConfig()
      .then((data) => {
        setConfig(data);
        setEnabled(data.enabled);
        setTenantId(data.tenantId ?? "");
        setClientId(data.clientId ?? "");
        setRedirectUri(
          data.redirectUri ??
            `${window.location.origin}/api/auth/entra/callback`,
        );
      })
      .catch(() =>
        setError("Unable to load Microsoft Entra ID settings."),
      )
      .finally(() => setLoading(false));
  }, []);

  async function handleSave() {
    try {
      setSaving(true);
      setError("");
      setSaved(false);

      const updated = await api.updateEntraConfig({
        enabled,
        tenantId,
        clientId,
        redirectUri,
        ...(clientSecret ? { clientSecret } : {}),
      });

      setConfig(updated);
      setClientSecret("");
      setSaved(true);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to save Microsoft Entra ID settings.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
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
      <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>
        Microsoft Entra ID
      </Typography>

      <Typography color="text.secondary" sx={{ mb: 2 }}>
        Let users sign in with a Microsoft work or school account,
        in addition to the local password. Register an app in the
        Entra admin center first, then fill in its details below.
      </Typography>

      {!lockEnabled && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Password Protection must be enabled above before Entra
          sign-in can be turned on — Entra is an alternate way to
          unlock the app, not a replacement for the lock itself.
        </Alert>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {saved && !error && (
        <Alert severity="success" sx={{ mb: 2 }}>
          Saved.
        </Alert>
      )}

      {!loading && config && (
        <Stack spacing={2}>
          <FormControlLabel
            control={
              <Switch
                checked={enabled}
                onChange={(_e, checked) => setEnabled(checked)}
              />
            }
            label={enabled ? "Enabled" : "Disabled"}
          />

          <TextField
            label="Tenant ID"
            value={tenantId}
            onChange={(e) => setTenantId(e.target.value)}
            fullWidth
            size="small"
          />

          <TextField
            label="Application (client) ID"
            value={clientId}
            onChange={(e) => setClientId(e.target.value)}
            fullWidth
            size="small"
          />

          <TextField
            type="password"
            label="Client secret"
            value={clientSecret}
            onChange={(e) => setClientSecret(e.target.value)}
            placeholder={
              config.hasClientSecret
                ? "•••••••• (unchanged)"
                : ""
            }
            helperText="Leave blank to keep the currently saved secret."
            fullWidth
            size="small"
          />

          <TextField
            label="Redirect URI"
            value={redirectUri}
            onChange={(e) => setRedirectUri(e.target.value)}
            helperText="Register this exact URI as a Web redirect URI on the Entra app registration."
            fullWidth
            size="small"
          />

          <Box>
            <Button
              variant="contained"
              onClick={handleSave}
              disabled={saving}
            >
              Save
            </Button>
          </Box>
        </Stack>
      )}
    </Paper>
  );
}

function NotificationsSection() {
  const [config, setConfig] = useState<NotificationsConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [enabled, setEnabled] = useState(false);
  const [smtpHost, setSmtpHost] = useState("");
  const [smtpPort, setSmtpPort] = useState("");
  const [smtpUser, setSmtpUser] = useState("");
  const [smtpPassword, setSmtpPassword] = useState("");
  const [smtpFrom, setSmtpFrom] = useState("");
  const [adminNotificationEmail, setAdminNotificationEmail] = useState("");

  useEffect(() => {
    api.getNotificationsConfig()
      .then((data) => {
        setConfig(data);
        setEnabled(data.enabled);
        setSmtpHost(data.smtpHost ?? "");
        setSmtpPort(data.smtpPort ? String(data.smtpPort) : "");
        setSmtpUser(data.smtpUser ?? "");
        setSmtpFrom(data.smtpFrom ?? "");
        setAdminNotificationEmail(data.adminNotificationEmail ?? "");
      })
      .catch(() => setError("Unable to load notification settings."))
      .finally(() => setLoading(false));
  }, []);

  async function handleSave() {
    try {
      setSaving(true);
      setError("");
      setSaved(false);

      const updated = await api.updateNotificationsConfig({
        enabled,
        smtpHost,
        smtpPort: smtpPort ? Number(smtpPort) : undefined,
        smtpUser,
        smtpFrom,
        adminNotificationEmail,
        ...(smtpPassword ? { smtpPassword } : {}),
      });

      setConfig(updated);
      setSmtpPassword("");
      setSaved(true);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to save notification settings.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
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
      <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>
        Notifications
      </Typography>

      <Typography color="text.secondary" sx={{ mb: 2 }}>
        Emails employees a reminder on the morning of their duty, and
        alerts an admin address whenever roster generation finds a
        conflict. Ships off until an SMTP server is configured below.
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {saved && !error && (
        <Alert severity="success" sx={{ mb: 2 }}>
          Saved.
        </Alert>
      )}

      {!loading && config && (
        <Stack spacing={2}>
          <FormControlLabel
            control={
              <Switch
                checked={enabled}
                onChange={(_e, checked) => setEnabled(checked)}
              />
            }
            label={enabled ? "Enabled" : "Disabled"}
          />

          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <TextField
              label="SMTP host"
              value={smtpHost}
              onChange={(e) => setSmtpHost(e.target.value)}
              fullWidth
              size="small"
            />

            <TextField
              label="SMTP port"
              value={smtpPort}
              onChange={(e) => setSmtpPort(e.target.value)}
              sx={{ minWidth: 140 }}
              size="small"
            />
          </Stack>

          <TextField
            label="SMTP username"
            value={smtpUser}
            onChange={(e) => setSmtpUser(e.target.value)}
            fullWidth
            size="small"
          />

          <TextField
            type="password"
            label="SMTP password"
            value={smtpPassword}
            onChange={(e) => setSmtpPassword(e.target.value)}
            placeholder={
              config.hasSmtpPassword ? "•••••••• (unchanged)" : ""
            }
            helperText="Leave blank to keep the currently saved password."
            fullWidth
            size="small"
          />

          <TextField
            label="From address"
            value={smtpFrom}
            onChange={(e) => setSmtpFrom(e.target.value)}
            helperText='e.g. "Duty Roster <duty@yourcompany.com>"'
            fullWidth
            size="small"
          />

          <TextField
            label="Admin alert email"
            value={adminNotificationEmail}
            onChange={(e) => setAdminNotificationEmail(e.target.value)}
            helperText="Where roster-conflict alerts are sent."
            fullWidth
            size="small"
          />

          <Box>
            <Button
              variant="contained"
              onClick={handleSave}
              disabled={saving}
            >
              Save
            </Button>
          </Box>
        </Stack>
      )}
    </Paper>
  );
}
