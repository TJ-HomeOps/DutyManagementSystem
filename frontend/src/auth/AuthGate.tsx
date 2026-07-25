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
import LockIcon from "@mui/icons-material/Lock";

import { api } from "../services/api";

type GateState =
  | "checking"
  | "open"
  | "authenticated"
  | "needsPassword"
  | "error";

export default function AuthGate({
  children,
}: {
  children: ReactNode;
}) {
  const [state, setState] = useState<GateState>("checking");

  useEffect(() => {
    let cancelled = false;

    async function check() {
      try {
        const { enabled } = await api.authStatus();

        if (cancelled) return;

        if (!enabled) {
          setState("open");
          return;
        }

        try {
          await api.authSession();

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
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (state === "error") {
    return (
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
          p: 3,
        }}
      >
        <Alert severity="error">
          Unable to reach the server. Check your connection
          and reload the page.
        </Alert>
      </Box>
    );
  }

  if (state === "needsPassword") {
    return (
      <PasswordPrompt
        onSuccess={() => setState("authenticated")}
      />
    );
  }

  return <>{children}</>;
}

function PasswordPrompt({
  onSuccess,
}: {
  onSuccess: () => void;
}) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(
    event: React.FormEvent,
  ) {
    event.preventDefault();

    if (!password) return;

    try {
      setSubmitting(true);
      setError("");

      await api.login(password);

      onSuccess();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to log in.",
      );
      setPassword("");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        bgcolor: "background.default",
        p: 3,
      }}
    >
      <Paper
        elevation={0}
        component="form"
        onSubmit={handleSubmit}
        sx={{
          border: "1px solid",
          borderColor: "divider",
          borderRadius: 3,
          p: 4,
          width: "100%",
          maxWidth: 360,
        }}
      >
        <Box sx={{ textAlign: "center", mb: 3 }}>
          <LockIcon
            color="primary"
            sx={{ fontSize: 40, mb: 1 }}
          />

          <Typography
            variant="h6"
            sx={{ fontWeight: 700 }}
          >
            Password required
          </Typography>

          <Typography color="text.secondary" variant="body2">
            This app is password protected.
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <TextField
          type="password"
          label="Password"
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
          Unlock
        </Button>
      </Paper>
    </Box>
  );
}
