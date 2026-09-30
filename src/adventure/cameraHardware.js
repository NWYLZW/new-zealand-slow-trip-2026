import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { createLatestCameraZoomQueue, snapCameraZoom } from "./cameraZoomDial.js";

const storageKey = "nz-trip-camera-hardware";
const stillFlashModes = ["off", "auto", "flash"];
const automaticFocusModes = ["continuous", "single-shot"];
const imageCaptureConstraintNames = new Set([
  "whiteBalanceMode", "exposureMode", "focusMode", "pointsOfInterest", "exposureCompensation",
  "exposureTime", "colorTemperature", "iso", "brightness", "contrast", "saturation", "sharpness",
  "focusDistance", "pan", "tilt", "zoom", "torch", "backgroundBlur", "backgroundSegmentationMask",
  "eyeGazeCorrection", "faceFraming",
]);
const listeners = new Set();
const defaultPreferences = Object.freeze({ zoom: null, focusMode: "auto", focusDistance: null });
const trackPreferenceKeys = new WeakMap();
let nextTrackPreferenceKey = 1;

function normalizePreferences(stored) {
  return {
    zoom: Number.isFinite(stored?.zoom) ? stored.zoom : null,
    focusMode: stored?.focusMode === "manual" ? "manual" : "auto",
    focusDistance: Number.isFinite(stored?.focusDistance) ? stored.focusDistance : null,
  };
}

function readStoredPreferenceProfiles() {
  try {
    const stored = JSON.parse(localStorage.getItem(storageKey) || "null");
    if (stored?.version !== 2 || !stored.profiles || typeof stored.profiles !== "object") return {};
    return Object.fromEntries(Object.entries(stored.profiles)
      .map(([key, preferences]) => [key, normalizePreferences(preferences)]));
  } catch {
    return {};
  }
}

let preferenceProfiles = readStoredPreferenceProfiles();
let storeSnapshot = {
  preferences: { ...defaultPreferences },
  preferenceKey: null,
  capabilities: null,
};

function emitStore() {
  for (const listener of listeners) listener();
}

function writePreferences(preferences) {
  const normalized = normalizePreferences(preferences);
  storeSnapshot = { ...storeSnapshot, preferences: normalized };
  if (storeSnapshot.preferenceKey) preferenceProfiles = {
    ...preferenceProfiles,
    [storeSnapshot.preferenceKey]: normalized,
  };
  try { localStorage.setItem(storageKey, JSON.stringify({ version: 2, profiles: preferenceProfiles })); }
  catch { /* Memory state remains usable. */ }
  emitStore();
}

function activatePreferenceScope(preferenceKey) {
  const preferences = preferenceProfiles[preferenceKey] ?? { ...defaultPreferences };
  storeSnapshot = { ...storeSnapshot, preferenceKey, preferences };
  emitStore();
  return preferences;
}

function setPreference(name, value) {
  writePreferences({ ...storeSnapshot.preferences, [name]: value });
}

export function setCameraHardwarePreference(name, value) {
  if (!["zoom", "focusMode", "focusDistance"].includes(name)) return;
  setPreference(name, value);
}

function publishCapabilities(capabilities) {
  storeSnapshot = { ...storeSnapshot, capabilities };
  emitStore();
}

function markCapabilitiesStale() {
  if (!storeSnapshot.capabilities?.authoritative) return;
  publishCapabilities({ ...storeSnapshot.capabilities, authoritative: false });
}

function subscribeStore(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getCameraHardwareSnapshot() {
  return storeSnapshot;
}

export function useCameraHardwareStore() {
  return useSyncExternalStore(subscribeStore, getCameraHardwareSnapshot, getCameraHardwareSnapshot);
}

export function normalizeCameraRange(value) {
  if (!value || !Number.isFinite(Number(value.min)) || !Number.isFinite(Number(value.max))) return null;
  const min = Number(value.min), max = Number(value.max);
  if (max < min) return null;
  const rawStep = Number(value.step);
  return { min, max, step: Number.isFinite(rawStep) && rawStep > 0 ? rawStep : Math.max((max - min) / 100, .01) };
}

function enumValues(value) {
  return [...new Set((Array.isArray(value) ? value : value == null ? [] : [value])
    .filter(item => typeof item === "string"))];
}

function finiteSetting(value) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

export function inspectCameraHardwareCapabilities(trackCapabilities = {}, trackSettings = {}, photoCapabilities = null) {
  const zoom = normalizeCameraRange(trackCapabilities.zoom);
  const focusDistance = normalizeCameraRange(trackCapabilities.focusDistance);
  const focusModes = enumValues(trackCapabilities.focusMode);
  const flashModes = enumValues(photoCapabilities?.fillLightMode).filter(mode => stillFlashModes.includes(mode));
  const autoMode = automaticFocusModes.find(mode => focusModes.includes(mode)) ?? null;
  return {
    zoom,
    torch: trackCapabilities.torch === true,
    flashModes,
    focusModes,
    focusDistance,
    manualFocus: focusModes.includes("manual") && Boolean(focusDistance),
    autoMode,
    preferenceKey: typeof trackSettings.deviceId === "string" && trackSettings.deviceId
      ? `device:${trackSettings.deviceId}`
      : `facing:${typeof trackSettings.facingMode === "string" && trackSettings.facingMode || "unknown"}`,
    settings: {
      zoom: finiteSetting(trackSettings.zoom),
      torch: trackSettings.torch === true,
      focusMode: typeof trackSettings.focusMode === "string" ? trackSettings.focusMode : null,
      focusDistance: finiteSetting(trackSettings.focusDistance),
    },
  };
}

export function resolveCameraPhotoSettings(flashModes, selectedMode = "off") {
  const modes = enumValues(flashModes).filter(mode => stillFlashModes.includes(mode));
  if (!modes.length) return {};
  if (selectedMode === "off") return modes.includes("off") ? { fillLightMode: "off" } : {};
  return modes.includes(selectedMode) ? { fillLightMode: selectedMode } : {};
}

export function clampCameraValue(value, range) {
  if (!range) return null;
  const numeric = Number(value);
  const candidate = Number.isFinite(numeric) ? numeric : range.min;
  const stepped = range.min + Math.round((candidate - range.min) / range.step) * range.step;
  return Math.min(range.max, Math.max(range.min, Number(stepped.toFixed(6))));
}

export function cameraSettingMatches(actual, expected, range = null) {
  if (typeof expected === "number") {
    if (!Number.isFinite(Number(actual))) return false;
    const tolerance = Math.max(Math.min(range?.step ?? .01, .01) / 2, .000001) + Number.EPSILON;
    return Math.abs(Number(actual) - expected) <= tolerance;
  }
  return actual === expected;
}

function liveTrack(track) {
  return Boolean(track && track.readyState === "live");
}

function preferenceKeyForTrack(track, settings) {
  if (typeof settings.deviceId === "string" && settings.deviceId) return `device:${settings.deviceId}`;
  if (typeof settings.facingMode === "string" && settings.facingMode) return `facing:${settings.facingMode}`;
  if (!trackPreferenceKeys.has(track)) trackPreferenceKeys.set(track, `track:${nextTrackPreferenceKey++}`);
  return trackPreferenceKeys.get(track);
}

export async function applyVerifiedCameraConstraints(track, constraints, expected, ranges = {}) {
  if (!liveTrack(track)) throw new DOMException("The camera track is no longer live.", "AbortError");
  if (typeof track.applyConstraints !== "function" || typeof track.getSettings !== "function")
    throw new DOMException("Camera constraints are unavailable.", "NotSupportedError");
  let currentConstraints = {};
  try { currentConstraints = track.getConstraints?.() ?? {}; } catch { /* Apply the requested fields alone. */ }
  const currentAdvanced = Array.isArray(currentConstraints.advanced) ? currentConstraints.advanced : [];
  const replacedKeys = new Set(Object.keys(constraints));
  // Chromium rejects capture controls mixed with stream constraints such as width/facingMode.
  // Retain only other ImageCapture controls; the negotiated video stream stays untouched.
  const preserveHardware = entry => Object.fromEntries(Object.entries(entry)
    .filter(([name]) => imageCaptureConstraintNames.has(name) && !replacedKeys.has(name)));
  const preservedAdvanced = currentAdvanced.map(preserveHardware).filter(entry => Object.keys(entry).length);
  await track.applyConstraints({
    ...preserveHardware(currentConstraints),
    ...constraints,
    advanced: [...preservedAdvanced, constraints],
  });
  if (!liveTrack(track)) throw new DOMException("The camera track ended while applying settings.", "AbortError");
  const settings = track.getSettings();
  for (const [name, value] of Object.entries(expected)) {
    if (!cameraSettingMatches(settings[name], value, ranges[name])) {
      const error = new Error(`Camera ${name} did not apply (requested ${value}, actual ${String(settings[name])}).`);
      error.name = "CameraSettingVerificationError";
      throw error;
    }
  }
  return settings;
}

export function createCameraHardwareTaskQueue() {
  let pending = Promise.resolve();
  return {
    enqueue(task) {
      const result = pending.catch(() => {}).then(task);
      pending = result.catch(() => {});
      return result;
    },
  };
}

function settleWithin(promise, timeoutMs, fallback) {
  let timeoutId;
  return Promise.race([
    Promise.resolve(promise).catch(() => fallback),
    new Promise(resolve => { timeoutId = setTimeout(() => resolve(fallback), timeoutMs); }),
  ]).finally(() => clearTimeout(timeoutId));
}

export async function inspectCameraHardwareTrack(track, ImageCaptureCtor = globalThis.ImageCapture, timeoutMs = 3000) {
  let trackCapabilities = {}, trackSettings = {}, photoCapabilities = null;
  try { trackCapabilities = track.getCapabilities?.() ?? {}; } catch { /* Unsupported capability probe. */ }
  try { trackSettings = track.getSettings?.() ?? {}; } catch { /* Settings remain unknown. */ }
  if (typeof ImageCaptureCtor === "function") {
    try {
      const imageCapture = new ImageCaptureCtor(track);
      photoCapabilities = await settleWithin(imageCapture.getPhotoCapabilities?.(), timeoutMs, null) ?? null;
    } catch { /* Still-photo controls remain hidden when Image Capture cannot probe them. */ }
  }
  return {
    ...inspectCameraHardwareCapabilities(trackCapabilities, trackSettings, photoCapabilities),
    preferenceKey: preferenceKeyForTrack(track, trackSettings),
  };
}

export function cameraHardwareErrorMessage(error, en = false) {
  if (typeof error === "string") return error;
  const messages = {
    camera: ["无法读取相机硬件能力。", "Could not read the camera capabilities."],
    zoom: ["无法应用相机变焦。", "Could not apply camera zoom."],
    torch: ["无法切换相机常亮灯。", "Could not switch the camera torch."],
    focus: ["无法应用相机对焦设置。", "Could not apply the camera focus setting."],
  };
  return messages[error?.kind]?.[en ? 1 : 0]
    ?? (en ? "Could not apply the camera setting." : "无法应用相机设置。");
}

function hardwareError(kind, cause) {
  const error = new Error(cameraHardwareErrorMessage({ kind }, true));
  error.kind = kind;
  error.name = cause?.name || "CameraHardwareError";
  error.cause = cause;
  return error;
}

function emptyControllerState() {
  return { ready: false, busy: false, capabilities: null, settings: {} };
}

export function useCameraHardware({ track, active, recording, disabled, onError }) {
  const [hardware, setHardware] = useState(emptyControllerState);
  const generationRef = useRef(0);
  const queueRef = useRef(null);
  const zoomQueueRef = useRef(null);
  const pendingRef = useRef(0);
  const mountedRef = useRef(true);
  const configRef = useRef({ track, active, recording, disabled, onError });
  if (!queueRef.current) queueRef.current = createCameraHardwareTaskQueue();
  if (!zoomQueueRef.current) zoomQueueRef.current = createLatestCameraZoomQueue(task => queueRef.current.enqueue(task));
  configRef.current = { track, active, recording, disabled, onError };

  const setBusy = useCallback(delta => {
    pendingRef.current = Math.max(0, pendingRef.current + delta);
    if (mountedRef.current) setHardware(previous => ({ ...previous, busy: pendingRef.current > 0 }));
  }, []);

  const reportError = useCallback((kind, error) => {
    configRef.current.onError?.(hardwareError(kind, error));
  }, []);

  const updateFromSettings = useCallback((settings) => {
    setHardware(previous => {
      if (!previous.capabilities) return previous;
      const capabilities = { ...previous.capabilities, settings: {
        ...previous.capabilities.settings,
        zoom: finiteSetting(settings.zoom),
        torch: settings.torch === true,
        focusMode: typeof settings.focusMode === "string" ? settings.focusMode : previous.capabilities.settings.focusMode,
        focusDistance: finiteSetting(settings.focusDistance),
      } };
      return { ...previous, capabilities, settings: capabilities.settings };
    });
    const current = getCameraHardwareSnapshot().capabilities;
    if (current) publishCapabilities({ ...current, settings: {
      ...current.settings,
      zoom: finiteSetting(settings.zoom),
      torch: settings.torch === true,
      focusMode: typeof settings.focusMode === "string" ? settings.focusMode : current.settings.focusMode,
      focusDistance: finiteSetting(settings.focusDistance),
    }, authoritative: true, capturedAt: new Date().toISOString() });
  }, []);

  const runConstraint = useCallback((kind, constraints, expected, ranges = {}, afterSuccess, { allowRecording = false } = {}) => {
    const generation = generationRef.current;
    const requestedTrack = configRef.current.track;
    setBusy(1);
    return queueRef.current.enqueue(async () => {
      try {
        const current = configRef.current;
        if (generation !== generationRef.current || current.track !== requestedTrack || !current.active
          || (!allowRecording && current.recording) || current.disabled || !liveTrack(requestedTrack)) return false;
        const settings = await applyVerifiedCameraConstraints(requestedTrack, constraints, expected, ranges);
        if (generation !== generationRef.current || configRef.current.track !== requestedTrack) return false;
        updateFromSettings(settings);
        afterSuccess?.(settings);
        return true;
      } catch (error) {
        if (generation === generationRef.current && configRef.current.track === requestedTrack) {
          try { updateFromSettings(requestedTrack.getSettings?.() ?? {}); } catch { /* Preserve last confirmed settings. */ }
          reportError(kind, error);
        }
        return false;
      } finally {
        setBusy(-1);
      }
    });
  }, [reportError, setBusy, updateFromSettings]);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  useLayoutEffect(() => {
    const cancel = () => zoomQueueRef.current.cancel();
    track?.addEventListener?.("ended", cancel);
    return () => {
      cancel();
      track?.removeEventListener?.("ended", cancel);
    };
  }, [active, disabled, track]);

  useEffect(() => {
    const generation = ++generationRef.current;
    const currentTrack = track;
    if (!active || !liveTrack(currentTrack)) {
      markCapabilitiesStale();
      setHardware(emptyControllerState());
      return undefined;
    }
    let disposed = false;
    setHardware(emptyControllerState());
    queueRef.current.enqueue(async () => {
      const isCurrent = () => !disposed && generation === generationRef.current
        && configRef.current.track === currentTrack && configRef.current.active && liveTrack(currentTrack);
      const capabilities = await inspectCameraHardwareTrack(currentTrack);
      if (!isCurrent()) return;
      const preferences = activatePreferenceScope(capabilities.preferenceKey);
      let settings = capabilities.settings;
      if (capabilities.torch && settings.torch) {
        try {
          settings = await applyVerifiedCameraConstraints(currentTrack, { torch: false }, { torch: false });
          if (!isCurrent()) return;
        } catch (error) { if (isCurrent()) reportError("torch", error); }
      }
      if (capabilities.zoom && preferences.zoom !== null) {
        const zoom = clampCameraValue(preferences.zoom, capabilities.zoom);
        if (!cameraSettingMatches(settings.zoom, zoom, capabilities.zoom)) {
          try {
            settings = await applyVerifiedCameraConstraints(currentTrack, { zoom }, { zoom }, { zoom: capabilities.zoom });
            if (!isCurrent()) return;
          } catch (error) { if (isCurrent()) reportError("zoom", error); }
        }
      }
      if (capabilities.manualFocus) {
        const manual = preferences.focusMode === "manual" || !capabilities.autoMode;
        const focusMode = manual ? "manual" : capabilities.autoMode;
        const focusDistance = manual
          ? clampCameraValue(preferences.focusDistance ?? settings.focusDistance, capabilities.focusDistance) : null;
        if (focusMode) {
          const constraints = { focusMode };
          const expected = { focusMode };
          const ranges = {};
          if (manual && focusDistance !== null) {
            constraints.focusDistance = focusDistance;
            expected.focusDistance = focusDistance;
            ranges.focusDistance = capabilities.focusDistance;
          }
          if (Object.entries(expected).some(([name, value]) => !cameraSettingMatches(settings[name], value, ranges[name]))) {
            try {
              settings = await applyVerifiedCameraConstraints(currentTrack, constraints, expected, ranges);
              if (!isCurrent()) return;
            } catch (error) { if (isCurrent()) reportError("focus", error); }
          }
        }
      }
      if (!isCurrent()) return;
      const confirmed = { ...capabilities, flashMode: "off", settings: {
        ...capabilities.settings,
        zoom: finiteSetting(settings.zoom),
        torch: settings.torch === true,
        focusMode: typeof settings.focusMode === "string" ? settings.focusMode : capabilities.settings.focusMode,
        focusDistance: finiteSetting(settings.focusDistance),
      } };
      publishCapabilities({ ...confirmed, authoritative: true, capturedAt: new Date().toISOString() });
      setHardware({ ready: true, busy: false, capabilities: confirmed, settings: confirmed.settings });
    }).catch(error => {
      if (!disposed && generation === generationRef.current) {
        setHardware(emptyControllerState());
        reportError("camera", error);
      }
    });
    const ended = () => {
      if (generation !== generationRef.current) return;
      markCapabilitiesStale();
      setHardware(emptyControllerState());
    };
    currentTrack.addEventListener?.("ended", ended);
    return () => {
      disposed = true;
      generationRef.current++;
      currentTrack.removeEventListener?.("ended", ended);
      markCapabilitiesStale();
      queueRef.current.enqueue(async () => {
        if (!liveTrack(currentTrack) || currentTrack.getSettings?.().torch !== true) return;
        try { await applyVerifiedCameraConstraints(currentTrack, { torch: false }, { torch: false }); }
        catch { /* Best-effort safety cleanup on an obsolete track. */ }
      });
    };
  }, [active, reportError, track]);

  const capabilities = hardware.capabilities;
  const unavailable = Boolean(!hardware.ready || disabled || !active || !liveTrack(track));
  const blocked = unavailable || hardware.busy;
  const recordingBlocked = unavailable || recording;

  const zoomMin = capabilities?.zoom?.min, zoomMax = capabilities?.zoom?.max, zoomStep = capabilities?.zoom?.step;
  const setZoom = useCallback((value, { signal } = {}) => {
    if (zoomMin == null || unavailable || configRef.current.track !== track) return Promise.resolve(false);
    const range = { min: zoomMin, max: zoomMax, step: zoomStep };
    const zoom = snapCameraZoom(value, range);
    const generation = generationRef.current;
    return zoomQueueRef.current.enqueue(async isCurrentRequest => {
      const isCurrent = () => isCurrentRequest() && mountedRef.current
        && generation === generationRef.current && configRef.current.track === track
        && configRef.current.active && !configRef.current.disabled && liveTrack(track);
      if (!isCurrent()) return false;
      setBusy(1);
      try {
        const settings = await applyVerifiedCameraConstraints(track, { zoom }, { zoom }, { zoom: range });
        if (!isCurrent()) return false;
        updateFromSettings(settings);
        setPreference("zoom", finiteSetting(settings.zoom));
        return true;
      } catch (error) {
        if (isCurrent()) {
          try { updateFromSettings(track.getSettings?.() ?? {}); } catch { /* Keep the last confirmed reading. */ }
          reportError("zoom", error);
        }
        return false;
      } finally {
        // An aborted native call can still alter the live track; read it without saving a preference.
        if (!isCurrentRequest() && mountedRef.current && generation === generationRef.current
          && configRef.current.track === track && configRef.current.active && liveTrack(track)) {
          try { updateFromSettings(track.getSettings?.() ?? {}); } catch { /* Keep the last confirmed reading. */ }
        }
        setBusy(-1);
      }
    }, { signal });
  }, [reportError, setBusy, track, unavailable, updateFromSettings, zoomMax, zoomMin, zoomStep]);

  const setTorch = useCallback(value => {
    if (!hardware.capabilities?.torch) return Promise.resolve(false);
    const torch = Boolean(value);
    return runConstraint("torch", { torch }, { torch }, {}, undefined, { allowRecording: true });
  }, [hardware.capabilities, runConstraint]);

  const setFlash = useCallback(value => {
    const modes = hardware.capabilities?.flashModes ?? [];
    if ((value !== "off" && !modes.includes(value)) || recordingBlocked) return Promise.resolve(false);
    setHardware(previous => ({ ...previous, capabilities: { ...previous.capabilities, flashMode: value } }));
    return Promise.resolve(true);
  }, [hardware.capabilities, recordingBlocked]);

  const setFocusMode = useCallback(value => {
    const focus = hardware.capabilities;
    if (!focus?.manualFocus) return Promise.resolve(false);
    const manual = value === "manual";
    const focusMode = manual ? "manual" : focus.autoMode;
    if (!focusMode) return Promise.resolve(false);
    const focusDistance = manual
      ? clampCameraValue(getCameraHardwareSnapshot().preferences.focusDistance
        ?? focus.settings.focusDistance, focus.focusDistance) : null;
    const constraints = { focusMode };
    const expected = { focusMode };
    const ranges = {};
    if (manual && focusDistance !== null) {
      constraints.focusDistance = focusDistance;
      expected.focusDistance = focusDistance;
      ranges.focusDistance = focus.focusDistance;
    }
    return runConstraint("focus", constraints, expected, ranges, () => {
      setPreference("focusMode", manual ? "manual" : "auto");
      if (focusDistance !== null) setPreference("focusDistance", focusDistance);
    });
  }, [hardware.capabilities, runConstraint]);

  const setFocusDistance = useCallback(value => {
    const focus = hardware.capabilities;
    if (!focus?.manualFocus) return Promise.resolve(false);
    const focusDistance = clampCameraValue(value, focus.focusDistance);
    return runConstraint("focus", { focusMode: "manual", focusDistance },
      { focusMode: "manual", focusDistance }, { focusDistance: focus.focusDistance }, () => {
        setPreference("focusMode", "manual");
        setPreference("focusDistance", focusDistance);
      });
  }, [hardware.capabilities, runConstraint]);

  const photoSettings = resolveCameraPhotoSettings(capabilities?.flashModes, capabilities?.flashMode);
  const flashValue = capabilities?.flashMode ?? "off";
  const selectableFlashModes = capabilities?.flashModes.length
    ? [...new Set(["off", ...capabilities.flashModes])]
    : [];

  return useMemo(() => ({
    ready: hardware.ready,
    busy: hardware.busy,
    disabled: blocked,
    capabilities,
    settings: hardware.settings,
    photoSettings,
    zoom: capabilities?.zoom ? { ...capabilities.zoom, disabled: unavailable,
      value: finiteSetting(hardware.settings.zoom), setValue: setZoom } : null,
    torch: capabilities?.torch ? { disabled: unavailable, value: hardware.settings.torch === true, setValue: setTorch } : null,
    flash: selectableFlashModes.length ? { disabled: recordingBlocked,
      modes: selectableFlashModes, value: flashValue, setValue: setFlash } : null,
    focus: capabilities?.manualFocus ? {
      modes: [capabilities.autoMode && "auto", "manual"].filter(Boolean),
      mode: hardware.settings.focusMode === "manual" || !capabilities.autoMode ? "manual" : "auto",
      distance: finiteSetting(hardware.settings.focusDistance),
      min: capabilities.focusDistance.min,
      max: capabilities.focusDistance.max,
      step: capabilities.focusDistance.step,
      manualSupported: true,
      autoMode: capabilities.autoMode,
      disabled: recordingBlocked,
      setMode: setFocusMode,
      setDistance: setFocusDistance,
    } : null,
  }), [blocked, capabilities, flashValue, hardware.busy, hardware.ready, hardware.settings,
    photoSettings.fillLightMode, recordingBlocked, selectableFlashModes.join("|"), setFlash, setFocusDistance,
    setFocusMode, setTorch, setZoom, unavailable]);
}

export { storageKey as cameraHardwareStorageKey };
