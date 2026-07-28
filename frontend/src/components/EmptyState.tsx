import type { ReactNode } from "react";

import { Box, Typography } from "@mui/material";
import InboxIcon from "@mui/icons-material/Inbox";

export default function EmptyState({
  message,
  icon,
  action,
}: {
  message: string;
  icon?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 1,
        py: 5,
      }}
    >
      <Box
        sx={{
          display: "flex",
          color: "text.secondary",
          opacity: 0.5,
          "& svg": { fontSize: 36 },
        }}
      >
        {icon ?? <InboxIcon />}
      </Box>

      <Typography color="text.secondary">{message}</Typography>

      {action}
    </Box>
  );
}
