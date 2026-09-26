import { useSyncExternalStore } from "react";

const captureLocationKey = "nz-trip-camera-location";
const listeners = new Set();
let memoryCaptureLocation = true;
let memoryOverride = null;

function readCaptureLocation() {
  if (memoryOverride !== null) return memoryOverride;
  try {
    const value = localStorage.getItem(captureLocationKey);
    memoryCaptureLocation = value === null ? true : value !== "off";
    return memoryCaptureLocation;
  } catch {
    return memoryCaptureLocation;
  }
}

function subscribe(listener) {
  listeners.add(listener);
  const onStorage = event => {
    if (event.key !== captureLocationKey && event.key !== null) return;
    memoryOverride = null;
    if (event.key === captureLocationKey)
      memoryCaptureLocation = event.newValue === null ? true : event.newValue !== "off";
    listener();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

function setCaptureLocation(value) {
  memoryCaptureLocation = Boolean(value);
  try {
    localStorage.setItem(captureLocationKey, memoryCaptureLocation ? "on" : "off");
    memoryOverride = null;
  } catch {
    memoryOverride = memoryCaptureLocation;
  }
  for (const listener of listeners) listener();
}

export function useCameraLocationPreference() {
  const captureLocation = useSyncExternalStore(subscribe, readCaptureLocation, () => true);
  return { captureLocation, setCaptureLocation };
}

export { captureLocationKey };
