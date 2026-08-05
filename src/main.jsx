import React from "react";
import { createRoot } from "react-dom/client";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { registerSW } from "virtual:pwa-register";
import App from "./App.jsx";
import "./styles.css";

registerSW({ immediate: true });

const theme = createTheme({
  palette: {
    primary: { main: "#123f36" },
    secondary: { main: "#df7659" },
    warning: { main: "#f2b86b" },
    background: { default: "#f4f7f3", paper: "#fffdf8" },
    text: { primary: "#18342e", secondary: "#58716a" },
  },
  shape: { borderRadius: 10 },
  typography: {
    fontFamily:
      '"PingFang SC", "Microsoft YaHei", "Noto Sans CJK SC", system-ui, sans-serif',
    h1: {
      fontFamily: 'Georgia, "Songti SC", serif',
      fontWeight: 700,
      letterSpacing: "-0.045em",
    },
    h2: {
      fontFamily: 'Georgia, "Songti SC", serif',
      fontWeight: 700,
      letterSpacing: "-0.035em",
    },
    h3: {
      fontFamily: 'Georgia, "Songti SC", serif',
      fontWeight: 700,
    },
    button: { fontWeight: 800 },
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
        },
      },
    },
  },
});

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <App />
    </ThemeProvider>
  </React.StrictMode>
);
