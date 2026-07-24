import { createTheme } from "@mui/material/styles";

import { darkPalette, lightPalette } from "./palette";

export type ColorMode = "light" | "dark";

export function createAppTheme(mode: ColorMode) {
  const palette = mode === "dark" ? darkPalette : lightPalette;

  return createTheme({
    palette,
    shape: {
      borderRadius: 8,
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
    },
    components: {
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: "none",
          },
        },
      },
    },
  });
}
