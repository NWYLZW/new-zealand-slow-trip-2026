import { useSyncExternalStore } from "react";

const captureLocationKey = "nz-trip-camera-location";
const cameraGridKey = "nz-trip-camera-grid";
const listeners = new Set();
let memoryCaptureLocation = true;
let memoryCameraGrid = true;
let locationOverride = null;
let gridOverride = null;

function readCaptureLocation() {
  if (locationOverride !== null) return locationOverride;
  try {
    const value = localStorage.getItem(captureLocationKey);
    memoryCaptureLocation = value === null ? true : value !== "off";
    return memoryCaptureLocation;
  } catch {
    return memoryCaptureLocation;
  }
}

function readCameraGrid() {
  if (gridOverride !== null) return gridOverride;
  try {
    const value = localStorage.getItem(cameraGridKey);
    memoryCameraGrid = value === null ? true : value !== "off";
    return memoryCameraGrid;
  } catch {
    return memoryCameraGrid;
  }
}

function subscribe(listener) {
  listeners.add(listener);
  const onStorage = event => {
    if (![captureLocationKey, cameraGridKey, null].includes(event.key)) return;
    locationOverride = null;
    gridOverride = null;
    if (event.key === captureLocationKey)
      memoryCaptureLocation = event.newValue === null ? true : event.newValue !== "off";
    if (event.key === cameraGridKey)
      memoryCameraGrid = event.newValue === null ? true : event.newValue !== "off";
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
    locationOverride = null;
  } catch {
    locationOverride = memoryCaptureLocation;
  }
  for (const listener of listeners) listener();
}

function setCameraGrid(value) {
  memoryCameraGrid = Boolean(value);
  try {
    localStorage.setItem(cameraGridKey, memoryCameraGrid ? "on" : "off");
    gridOverride = null;
  } catch {
    gridOverride = memoryCameraGrid;
  }
  for (const listener of listeners) listener();
}

export function useCameraLocationPreference() {
  const captureLocation = useSyncExternalStore(subscribe, readCaptureLocation, () => true);
  return { captureLocation, setCaptureLocation };
}

export function useCameraGridPreference() {
  const cameraGrid = useSyncExternalStore(subscribe, readCameraGrid, () => true);
  return { cameraGrid, setCameraGrid };
}

export { cameraGridKey, captureLocationKey };
