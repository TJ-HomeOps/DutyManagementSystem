import { ReactNode } from "react";
import { NavLink } from "react-router-dom";

import {
  AppBar,
  Box,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Tooltip,
  Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";

import DashboardIcon from "@mui/icons-material/Dashboard";
import BadgeIcon from "@mui/icons-material/Badge";
import GroupsIcon from "@mui/icons-material/Groups";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import RuleIcon from "@mui/icons-material/Rule";
import AssessmentIcon from "@mui/icons-material/Assessment";
import SettingsIcon from "@mui/icons-material/Settings";
import BeachAccessIcon from "@mui/icons-material/BeachAccess";
import ViewWeekIcon from "@mui/icons-material/ViewWeek";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import LightModeIcon from "@mui/icons-material/LightMode";

import { useColorMode } from "../theme/ColorModeProvider";

const drawerWidth = 260;
const appBarHeight = 64;

interface Props {
  children: ReactNode;
}

const menu = [
  {
    section: "MAIN",
    items: [
      {
        label: "Dashboard",
        icon: <DashboardIcon />,
        path: "/",
      },
    ],
  },
  {
    section: "PLANNING",
    items: [
      {
        label: "Schedule",
        icon: <CalendarMonthIcon />,
        path: "/schedule",
      },
      {
        label: "Roster",
        icon: <ViewWeekIcon />,
        path: "/roster",
      },
      {
        label: "Holidays",
        icon: <BeachAccessIcon />,
        path: "/holidays",
      },
    ],
  },
  {
    section: "ADMINISTRATION",
    items: [
      {
        label: "Employees",
        icon: <BadgeIcon />,
        path: "/employees",
      },
      {
        label: "Teams",
        icon: <GroupsIcon />,
        path: "/teams",
      },
      {
        label: "Duty Rules",
        icon: <RuleIcon />,
        path: "/rules",
      },
    ],
  },
  {
    section: "REPORTING",
    items: [
      {
        label: "Reports",
        icon: <AssessmentIcon />,
        path: "/reports",
      },
    ],
  },
  {
    section: "",
    items: [
      {
        label: "Settings",
        icon: <SettingsIcon />,
        path: "/settings",
      },
    ],
  },
];

export default function AppLayout({ children }: Props) {
  const { mode, toggleMode } = useColorMode();

  return (
    <Box
      sx={{
        display: "flex",
        minHeight: "100vh",
        bgcolor: "background.default",
      }}
    >
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          height: appBarHeight,
          bgcolor: "background.paper",
          color: "text.primary",
          borderBottom: "1px solid",
          borderColor: "divider",
          zIndex: (theme) => theme.zIndex.drawer + 1,
        }}
      >
        <Toolbar sx={{ height: "100%" }}>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 700,
              flexGrow: 1,
            }}
          >
            Duty Management System
          </Typography>

          <Tooltip
            title={
              mode === "dark"
                ? "Switch to light mode"
                : "Switch to dark mode"
            }
          >
            <IconButton
              onClick={toggleMode}
              color="inherit"
              aria-label="Toggle color mode"
            >
              {mode === "dark" ? (
                <LightModeIcon />
              ) : (
                <DarkModeIcon />
              )}
            </IconButton>
          </Tooltip>
        </Toolbar>
      </AppBar>

      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          "& .MuiDrawer-paper": {
            width: drawerWidth,
            top: `${appBarHeight}px`,
            height: `calc(100% - ${appBarHeight}px)`,
            borderRight: "1px solid",
            borderColor: "divider",
            bgcolor: "background.paper",
            boxSizing: "border-box",
          },
        }}
      >
        <List sx={{ py: 2 }}>
          {menu.map((group) => (
            <Box key={group.section}>
              {group.section && (
                <Typography
                  sx={{
                    px: 3,
                    pt: 2,
                    pb: 1,
                    fontSize: 11,
                    fontWeight: 700,
                    color: "text.secondary",
                    letterSpacing: 1,
                  }}
                >
                  {group.section}
                </Typography>
              )}

              {group.items.map((item) => (
                <ListItemButton
                  key={item.path}
                  component={NavLink}
                  to={item.path}
                  sx={(theme) => ({
                    mx: 1.5,
                    mb: 0.5,
                    borderRadius: 2,
                    color: "text.primary",

                    "& .MuiListItemIcon-root": {
                      color: "inherit",
                      minWidth: 36,
                    },

                    "&.active": {
                      bgcolor: alpha(
                        theme.palette.primary.main,
                        0.15,
                      ),
                      color: theme.palette.primary.main,
                      fontWeight: 700,
                    },
                  })}
                >
                  <ListItemIcon>
                    {item.icon}
                  </ListItemIcon>

                  <ListItemText primary={item.label} />
                </ListItemButton>
              ))}

              <Divider sx={{ my: 2 }} />
            </Box>
          ))}
        </List>
      </Drawer>

      <Box
        component="main"
        sx={{
          flex: 1,
          ml: `${drawerWidth}px`,
          mt: `${appBarHeight}px`,
          minWidth: 0,
          width: `calc(100vw - ${drawerWidth}px)`,
          p: 4,
          overflow: "auto",
        }}
      >
        {children}
      </Box>
    </Box>
  );
}
