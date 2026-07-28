import { createTheme } from "@mui/material/styles";

import { darkPalette, lightPalette } from "./palette";

export type ColorMode = "light" | "dark";

// Every page renders its content in a Paper/Card with elevation={0} (there's
// no other elevation level in use for content — Dialog/Drawer/Menu keep
// their own MUI defaults) — targeting that exact class gives every one of
// those cards a soft, considered shadow app-wide without touching a single
// page's markup.
function elevationZeroShadow(mode: ColorMode): string {
  return mode === "dark"
    ? "0 1px 2px rgba(0, 0, 0, 0.3), 0 2px 8px rgba(0, 0, 0, 0.25)"
    : "0 1px 2px rgba(15, 23, 42, 0.04), 0 1px 1px rgba(15, 23, 42, 0.03)";
}

export function createAppTheme(mode: ColorMode) {
  const palette = mode === "dark" ? darkPalette : lightPalette;

  return createTheme({
    palette,
    shape: {
      borderRadius: 10,
    },
    typography: {
      fontFamily: [
        "Inter",
        "Segoe UI",
        "Roboto",
        "Helvetica",
        "Arial",
        "sans-serif",
      ].join(","),
      h4: {
        fontWeight: 700,
        letterSpacing: -0.3,
      },
      h6: {
        fontWeight: 700,
      },
      button: {
        fontWeight: 600,
      },
    },
    components: {
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: "none",
            "&.MuiPaper-elevation0": {
              boxShadow: elevationZeroShadow(mode),
              transition: "box-shadow 160ms ease",
            },
          },
        },
      },
      MuiButton: {
        defaultProps: {
          disableElevation: true,
        },
        styleOverrides: {
          root: {
            textTransform: "none",
            borderRadius: 10,
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: {
            fontWeight: 600,
          },
        },
      },
      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            borderRadius: 10,
          },
        },
      },
      MuiTableRow: {
        styleOverrides: {
          root: {
            transition: "background-color 120ms ease",
          },
        },
      },
    },
  });
}
