export const brand = {
  main: "#0A4D8C",
  light: "#4C8DCB",
  dark: "#06325C",
};

export const lightPalette = {
  mode: "light" as const,
  primary: {
    main: brand.main,
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
