import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { CssBaseline, ThemeProvider } from "@mui/material";

import { createAppTheme, type ColorMode } from "./createAppTheme";

const STORAGE_KEY = "duty-color-mode";

interface ColorModeContextValue {
  mode: ColorMode;
  toggleMode: () => void;
}

const ColorModeContext = createContext<
  ColorModeContextValue | undefined
>(undefined);

function getInitialMode(): ColorMode {
  const stored = localStorage.getItem(STORAGE_KEY);

  if (stored === "light" || stored === "dark") {
    return stored;
  }

  const prefersDark = window.matchMedia(
    "(prefers-color-scheme: dark)",
  ).matches;

  return prefersDark ? "dark" : "light";
}

export function ColorModeProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [mode, setMode] = useState<ColorMode>(getInitialMode);

  const value = useMemo<ColorModeContextValue>(
    () => ({
      mode,
      toggleMode: () => {
        setMode((current) => {
          const next = current === "light" ? "dark" : "light";

          localStorage.setItem(STORAGE_KEY, next);

          return next;
        });
      },
    }),
    [mode],
  );

  const theme = useMemo(() => createAppTheme(mode), [mode]);

  return (
    <ColorModeContext.Provider value={value}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ColorModeContext.Provider>
  );
}

export function useColorMode(): ColorModeContextValue {
  const context = useContext(ColorModeContext);

  if (!context) {
    throw new Error(
      "useColorMode must be used within a ColorModeProvider",
    );
  }

  return context;
}
