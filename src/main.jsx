import React from "react";
import { createRoot } from "react-dom/client";
import { prepareSitePage, SiteRouter } from "./SiteRouter";
import { startInstallCapture } from "./pwa/installState";
import "./site.css";

prepareSitePage();
startInstallCapture();
let offlineStarted = false;
function startOfflineCache() {
  if (offlineStarted) return;
  offlineStarted = true;
  clearTimeout(offlineTimer);
  window.removeEventListener("trip-ui-ready", startOfflineCache);
  // Keep the initial module request and pre-cache traffic behind the visible UI.
  const register = () => import("virtual:pwa-register")
    .then(({ registerSW }) => registerSW({ immediate: true }))
    .catch(error => console.warn("Offline cache registration failed", error));
  if (window.requestIdleCallback) window.requestIdleCallback(register, { timeout: 5000 });
  else window.setTimeout(register, 1500);
}
window.addEventListener("trip-ui-ready", startOfflineCache);
const offlineTimer = window.setTimeout(startOfflineCache, 15000);

createRoot(document.getElementById("root")).render(
  <React.StrictMode><SiteRouter /></React.StrictMode>,
);
