import { useEffect, useState } from "react";

import {
  Box,
  Card,
  CardContent,
  Grid,
  Typography,
} from "@mui/material";

import { api } from "../services/api";
import type { DashboardResponse } from "../services/api";

export default function Dashboard() {
  const [dashboard, setDashboard] =
    useState<DashboardResponse | null>(null);

  useEffect(() => {
    api.dashboard()
      .then(setDashboard)
      .catch(console.error);
  }, []);

  const stats = dashboard?.stats;

  return (
    <Box>
      <Typography
        variant="h4"
        sx={{ fontWeight: 700, mb: 1 }}
      >
        Dashboard
      </Typography>

      <Typography
        color="text.secondary"
        sx={{ mb: 4 }}
      >
        Operational overview
      </Typography>

      <Grid container spacing={3}>
        {[
          ["Employees", stats?.employees],
          ["Teams", stats?.teams],
          ["Duty Rules", stats?.rules],
          ["Assignments", stats?.assignments],
        ].map(([title, value]) => (
          <Grid
            key={title}
            size={{
              xs: 12,
              md: 6,
              lg: 3,
            }}
          >
            <Card
              elevation={0}
              sx={{
                borderRadius: 3,
                border: "1px solid",
                borderColor: "divider",
                bgcolor: "background.paper",
              }}
            >
              <CardContent>
                <Typography color="text.secondary">
                  {title}
                </Typography>

                <Typography
                  variant="h3"
                  sx={{
                    mt: 2,
                    fontWeight: 700,
                    color: "primary.main",
                  }}
                >
                  {value ?? "..."}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}
