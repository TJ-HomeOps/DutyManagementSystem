import { useEffect, useState, type ReactNode } from "react";

import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Paper,
  TextField,
  Typography,
} from "@mui/material";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";

import { api } from "../services/api";

type GateState =
  | "checking"
  | "authenticated"
  | "needsSetup"
  | "needsPassword"
  | "error";

// Gates the Settings page behind its own admin password, separate from the
// app-wide password lock — someone who unlocks the app can still be denied
// Settings access. Mirrors AuthGate's shape, but with a bootstrap step
// (needsSetup) for the very first visit, since there's no separate "create
// an account" flow anywhere else in the app.
export default function SettingsGate({
  children,
}: {
  children: ReactNode;
}) {
  const [state, setState] = useState<GateState>("checking");

  useEffect(() => {
    let cancelled = false;

    async function check() {
      try {
        const { configured } = await api.settingsStatus();

        if (cancelled) return;

        if (!configured) {
          setState("needsSetup");
          return;
        }

        try {
          await api.settingsSession();

          if (!cancelled) setState("authenticated");
        } catch {
          if (!cancelled) setState("needsPassword");
        }
      } catch {
        if (!cancelled) setState("error");
      }
    }

    check();

    return () => {
      cancelled = true;
    };
  }, []);

  if (state === "checking") {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", p: 6 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (state === "error") {
    return (
      <Alert severity="error">
        Unable to reach the server. Check your connection and reload
        the page.
      </Alert>
    );
  }

  if (state === "needsSetup") {
    return (
      <SetupPrompt onSuccess={() => setState("authenticated")} />
    );
  }

  if (state === "needsPassword") {
    return (
      <PasswordPrompt onSuccess={() => setState("authenticated")} />
    );
  }

  return <>{children}</>;
}

function GateShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "center",
        p: 3,
      }}
    >
      <Paper
        elevation={0}
        sx={{
          border: "1px solid",
          borderColor: "divider",
          borderRadius: 3,
          p: 4,
          width: "100%",
          maxWidth: 400,
        }}
      >
        <Box sx={{ textAlign: "center", mb: 3 }}>
          <AdminPanelSettingsIcon
            color="primary"
            sx={{ fontSize: 40, mb: 1 }}
          />

          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            {title}
          </Typography>

          <Typography color="text.secondary" variant="body2">
            {subtitle}
          </Typography>
        </Box>

        {children}
      </Paper>
    </Box>
  );
}

function PasswordPrompt({ onSuccess }: { onSuccess: () => void }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    if (!password) return;

    try {
      setSubmitting(true);
      setError("");

      await api.settingsLogin(password);

      onSuccess();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to log in.",
      );
      setPassword("");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <GateShell
      title="Admin password required"
      subtitle="Enter the Settings password to continue."
    >
      <Box component="form" onSubmit={handleSubmit}>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <TextField
          type="password"
          label="Admin password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          fullWidth
          autoFocus
          sx={{ mb: 2 }}
        />

        <Button
          type="submit"
          variant="contained"
          fullWidth
          disabled={!password || submitting}
        >
          Unlock Settings
        </Button>
      </Box>
    </GateShell>
  );
}

function SetupPrompt({ onSuccess }: { onSuccess: () => void }) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    if (password.length < 4) {
      setError("Password must be at least 4 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      setSubmitting(true);
      setError("");

      await api.setSettingsPassword(password);

      onSuccess();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to set the admin password.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <GateShell
      title="Set up an admin password"
      subtitle="This is the first visit to Settings — choose a password that only admins should know."
    >
      <Box component="form" onSubmit={handleSubmit}>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <TextField
          type="password"
          label="Admin password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          fullWidth
          autoFocus
          sx={{ mb: 2 }}
        />

        <TextField
          type="password"
          label="Confirm admin password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          fullWidth
          sx={{ mb: 2 }}
        />

        <Button
          type="submit"
          variant="contained"
          fullWidth
          disabled={!password || !confirmPassword || submitting}
        >
          Set admin password
        </Button>
      </Box>
    </GateShell>
  );
}
