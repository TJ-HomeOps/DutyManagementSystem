import { useEffect, useState } from "react";

import {
  Box,
  Chip,
  Grid,
  Paper,
  Skeleton,
  Stack,
  Typography,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";

import BadgeIcon from "@mui/icons-material/Badge";
import GroupsIcon from "@mui/icons-material/Groups";
import RuleIcon from "@mui/icons-material/Rule";
import EventAvailableIcon from "@mui/icons-material/EventAvailable";
import BeachAccessIcon from "@mui/icons-material/BeachAccess";

import { api } from "../services/api";
import type {
  DashboardResponse,
  DashboardUpcomingAssignment,
} from "../services/api";
import EmptyState from "../components/EmptyState";

const DEFAULT_TEAM_COLOR = "#64748B";

function formatUpcomingDate(value: string): string {
  return new Date(value).toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

export default function Dashboard() {
  const theme = useTheme();
  const [dashboard, setDashboard] =
    useState<DashboardResponse | null>(null);

  useEffect(() => {
    api.dashboard()
      .then(setDashboard)
      .catch(console.error);
  }, []);

  const stats = dashboard?.stats;
  const loading = !dashboard;

  const kpis = [
    {
      label: "Employees",
      value: stats?.employees,
      icon: <BadgeIcon />,
    },
    {
      label: "Teams",
      value: stats?.teams,
      icon: <GroupsIcon />,
    },
    {
      label: "Duty rules",
      value: stats?.rules,
      icon: <RuleIcon />,
    },
    {
      label: "Assignments",
      value: stats?.assignments,
      icon: <EventAvailableIcon />,
    },
  ];

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

      <Grid container spacing={3} sx={{ mb: 3 }}>
        {kpis.map((kpi) => (
          <Grid
            key={kpi.label}
            size={{ xs: 12, sm: 6, lg: 3 }}
          >
            <Paper
              elevation={0}
              sx={{
                p: 3,
                borderRadius: 3,
                border: "1px solid",
                borderColor: "divider",
              }}
            >
              <Stack
                direction="row"
                spacing={2}
                sx={{ alignItems: "center" }}
              >
                <Box
                  sx={{
                    width: 44,
                    height: 44,
                    borderRadius: 2,
                    display: "grid",
                    placeItems: "center",
                    bgcolor: alpha(theme.palette.primary.main, 0.12),
                    color: "primary.main",
                  }}
                >
                  {kpi.icon}
                </Box>

                <Box>
                  <Typography color="text.secondary" variant="body2">
                    {kpi.label}
                  </Typography>

                  {loading ? (
                    <Skeleton width={48} height={36} />
                  ) : (
                    <Typography
                      variant="h4"
                      sx={{ fontWeight: 700 }}
                    >
                      {kpi.value}
                    </Typography>
                  )}
                </Box>
              </Stack>
            </Paper>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: 3,
              border: "1px solid",
              borderColor: "divider",
              height: "100%",
            }}
          >
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
              Today's duty
            </Typography>

            {loading ? (
              <Stack spacing={1.5}>
                {[0, 1].map((i) => (
                  <Skeleton key={i} height={40} />
                ))}
              </Stack>
            ) : dashboard.todayDutyByTeam.length === 0 ? (
              <EmptyState message="No teams yet." />
            ) : (
              <Stack spacing={1.5}>
                {dashboard.todayDutyByTeam.map((duty) => (
                  <Stack
                    key={duty.teamId}
                    direction="row"
                    spacing={1.5}
                    sx={{
                      alignItems: "center",
                      justifyContent: "space-between",
                      py: 1,
                      px: 1.5,
                      borderRadius: 2,
                      bgcolor: "action.hover",
                    }}
                  >
                    <Chip
                      size="small"
                      label={duty.teamName}
                      sx={{
                        bgcolor: duty.teamColor ?? DEFAULT_TEAM_COLOR,
                        color: "#FFFFFF",
                      }}
                    />

                    <Typography
                      sx={{
                        fontWeight: duty.employeeName ? 700 : 400,
                      }}
                      color={
                        duty.employeeName
                          ? "text.primary"
                          : "text.secondary"
                      }
                    >
                      {duty.employeeName ?? "Unassigned"}
                    </Typography>
                  </Stack>
                ))}
              </Stack>
            )}
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: 3,
              border: "1px solid",
              borderColor: "divider",
              height: "100%",
            }}
          >
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
              Employees on holiday
            </Typography>

            {loading ? (
              <Stack spacing={1.5}>
                {[0, 1].map((i) => (
                  <Skeleton key={i} height={40} />
                ))}
              </Stack>
            ) : dashboard.holidaysToday.length === 0 ? (
              <EmptyState
                icon={<BeachAccessIcon />}
                message="No one is on holiday today."
              />
            ) : (
              <Stack spacing={1.5}>
                {dashboard.holidaysToday.map((holiday) => (
                  <Stack
                    key={holiday.id}
                    direction="row"
                    spacing={1.5}
                    sx={{
                      alignItems: "center",
                      justifyContent: "space-between",
                      py: 1,
                      px: 1.5,
                      borderRadius: 2,
                      bgcolor: "action.hover",
                    }}
                  >
                    <Typography sx={{ fontWeight: 700 }}>
                      {holiday.employeeName ?? "Whole company"}
                    </Typography>

                    <Chip
                      size="small"
                      icon={<BeachAccessIcon />}
                      label={holiday.name}
                      sx={{
                        bgcolor: alpha(theme.palette.warning.main, 0.16),
                        color: theme.palette.warning.dark,
                        "& .MuiChip-icon": {
                          color: theme.palette.warning.dark,
                        },
                      }}
                    />
                  </Stack>
                ))}
              </Stack>
            )}
          </Paper>
        </Grid>
      </Grid>

      <Paper
        elevation={0}
        sx={{
          p: 3,
          borderRadius: 3,
          border: "1px solid",
          borderColor: "divider",
        }}
      >
        <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
          Upcoming duty
        </Typography>

        {loading ? (
          <Stack spacing={1}>
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} height={36} />
            ))}
          </Stack>
        ) : dashboard.upcoming.length === 0 ? (
          <EmptyState message="Nothing scheduled yet." />
        ) : (
          <Stack spacing={0.5}>
            {dashboard.upcoming.map(
              (assignment: DashboardUpcomingAssignment) => (
                <Stack
                  key={assignment.id}
                  direction="row"
                  spacing={1.5}
                  sx={{
                    alignItems: "center",
                    py: 1,
                    px: 1,
                    borderRadius: 2,
                    "&:hover": { bgcolor: "action.hover" },
                  }}
                >
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ minWidth: 90 }}
                  >
                    {formatUpcomingDate(assignment.start)}
                  </Typography>

                  <Chip
                    size="small"
                    label={assignment.teamName}
                    sx={{
                      bgcolor:
                        assignment.teamColor ?? DEFAULT_TEAM_COLOR,
                      color: "#FFFFFF",
                    }}
                  />

                  <Typography sx={{ fontWeight: 600 }}>
                    {assignment.employeeName}
                  </Typography>
                </Stack>
              ),
            )}
          </Stack>
        )}
      </Paper>
    </Box>
  );
}
