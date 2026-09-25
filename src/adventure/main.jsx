import React from "react";
import { createRoot } from "react-dom/client";
import { AdventurePage } from "./AdventurePage";
import "drawably/style.css";
import "./adventure.css";

createRoot(document.getElementById("root")).render(
  <React.StrictMode><AdventurePage /></React.StrictMode>,
);
