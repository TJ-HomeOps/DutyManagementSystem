export const brand = {
  main: "#0A4D8C",
  light: "#4C8DCB",
  dark: "#06325C",
};

// Every page's badges/alerts/conflict chips lean on these (Roster's
// conflict/holiday chips, Reports' holiday highlight, Settings' Alerts) —
// previously left at stock MUI red/orange/etc. with no relation to the
// brand blue at all.
export const lightPalette = {
  mode: "light" as const,
  primary: {
    main: brand.main,
  },
  secondary: {
    main: "#7C3AED",
  },
  success: {
    main: "#16A34A",
  },
  warning: {
    main: "#D97706",
  },
  error: {
    main: "#DC2626",
  },
  info: {
    main: "#0284C7",
  },
  background: {
    default: "#F4F7FB",
    paper: "#FFFFFF",
  },
  divider: "#E5E7EB",
  text: {
    primary: "#1F2937",
    secondary: "#6B7280",
  },
};

export const darkPalette = {
  mode: "dark" as const,
  primary: {
    main: brand.light,
  },
  secondary: {
    main: "#A78BFA",
  },
  success: {
    main: "#4ADE80",
  },
  warning: {
    main: "#FBBF24",
  },
  error: {
    main: "#F87171",
  },
  info: {
    main: "#38BDF8",
  },
  background: {
    default: "#0F172A",
    paper: "#1A2436",
  },
  divider: "#2D3B52",
  text: {
    primary: "#E5E9F0",
    secondary: "#94A3B8",
  },
};
