import React from "react";
import { createRoot } from "react-dom/client";
import { registerSW } from "virtual:pwa-register";
import { prepareSitePage, SiteRouter } from "./SiteRouter";
import { startInstallCapture } from "./pwa/installState";
import "./site.css";

prepareSitePage();
startInstallCapture();
registerSW({ immediate: true });

createRoot(document.getElementById("root")).render(
  <React.StrictMode><SiteRouter /></React.StrictMode>,
);
