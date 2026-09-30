const PREVIEW_CONSTRAINT_ERROR_NAMES = new Set([
  "ConstraintNotSatisfiedError",
  "OverconstrainedError",
  "NotSupportedError",
  "TypeError",
]);
const PHOTO_SETTINGS_ERROR_NAMES = new Set([...PREVIEW_CONSTRAINT_ERROR_NAMES, "OperationError"]);

function domError(message, name) {
  if (typeof DOMException === "function") return new DOMException(message, name);
  const error = new Error(message);
  error.name = name;
  return error;
}

function ensureCurrent(isCurrent) {
  if (!isCurrent()) throw domError("Camera work is no longer current.", "AbortError");
}

function ensureCurrentTrack(track, isCurrent) {
  ensureCurrent(isCurrent);
  if (!track || track.readyState === "ended")
    throw domError("The camera track has ended.", "InvalidStateError");
}

function previewFallbackAllowed(error) {
  return PREVIEW_CONSTRAINT_ERROR_NAMES.has(error?.name);
}

function photoSettingsFallbackAllowed(error) {
  return PHOTO_SETTINGS_ERROR_NAMES.has(error?.name);
}

function dimensionSetting(requested, capability) {
  const minimum = Number(capability?.min);
  const maximum = Number(capability?.max);
  if (!Number.isFinite(maximum) || maximum <= 0) return undefined;
  const value = Number(requested);
  if (!Number.isFinite(value) || value <= 0) return maximum;
  return Math.min(maximum, Number.isFinite(minimum) ? Math.max(minimum, value) : value);
}

function preferredPhotoSettings(capabilities, requested = {}) {
  const settings = {};
  const imageWidth = dimensionSetting(requested.imageWidth, capabilities?.imageWidth);
  const imageHeight = dimensionSetting(requested.imageHeight, capabilities?.imageHeight);
  if (imageWidth !== undefined) settings.imageWidth = imageWidth;
  if (imageHeight !== undefined) settings.imageHeight = imageHeight;

  if (typeof requested.redEyeReduction === "boolean" && capabilities?.redEyeReduction === "controllable")
    settings.redEyeReduction = requested.redEyeReduction;
  return settings;
}

function stopStream(stream) {
  stream?.getTracks?.().forEach(track => track.stop?.());
}

function currentStream(stream, isCurrent) {
  if (isCurrent()) return stream;
  stopStream(stream);
  throw domError("Camera preview is no longer current.", "AbortError");
}

function usableBlob(blob) {
  return blob instanceof Blob && blob.size > 0;
}

async function canvasPhoto({ track, video, isCurrent }) {
  ensureCurrentTrack(track, isCurrent);
  const settings = track.getSettings?.() || {};
  const width = Number(video?.videoWidth) || Number(settings.width);
  const height = Number(video?.videoHeight) || Number(settings.height);
  const documentApi = video?.ownerDocument || globalThis.document;
  if (!documentApi?.createElement || !(width > 0) || !(height > 0))
    throw domError("No camera frame is available.", "NotReadableError");

  const canvas = documentApi.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext?.("2d");
  if (!context || typeof canvas.toBlob !== "function")
    throw domError("Canvas photo capture is unavailable.", "NotSupportedError");

  // Draw the source frame directly. The preview's CSS mirror must not affect saved media.
  context.drawImage(video, 0, 0, width, height);
  const blob = await new Promise(resolve => canvas.toBlob(resolve, "image/jpeg", .95));
  ensureCurrentTrack(track, isCurrent);
  if (!usableBlob(blob)) throw domError("The captured camera frame was empty.", "NotReadableError");
  return { blob, source: "video-frame" };
}

export async function requestCameraPreview({ mediaDevices, facingMode, isCurrent = () => true }) {
  if (!mediaDevices?.getUserMedia)
    throw domError("Camera capture is not supported.", "NotSupportedError");
  ensureCurrent(isCurrent);
  const facingConstraint = facingMode ? { facingMode: { ideal: facingMode } } : {};
  try {
    const stream = await mediaDevices.getUserMedia({
      video: { ...facingConstraint, width: { ideal: 1920 }, height: { ideal: 1080 } },
      audio: false,
    });
    return currentStream(stream, isCurrent);
  } catch (error) {
    if (!previewFallbackAllowed(error)) throw error;
    ensureCurrent(isCurrent);
    const stream = await mediaDevices.getUserMedia({
      video: Object.keys(facingConstraint).length ? facingConstraint : true,
      audio: false,
    });
    return currentStream(stream, isCurrent);
  }
}

export async function captureCameraPhoto({ track, video, photoSettings, isCurrent = () => true }) {
  ensureCurrentTrack(track, isCurrent);
  const ImageCaptureApi = globalThis.ImageCapture;
  if (typeof ImageCaptureApi === "function") {
    let imageCapture;
    try {
      imageCapture = new ImageCaptureApi(track);
    } catch {
      imageCapture = null;
    }

    if (imageCapture?.takePhoto) {
      let capabilities = null;
      let capabilitiesKnown = false;
      if (typeof imageCapture.getPhotoCapabilities === "function") {
        try {
          capabilities = await imageCapture.getPhotoCapabilities();
          capabilitiesKnown = true;
          ensureCurrentTrack(track, isCurrent);
        } catch (error) {
          ensureCurrentTrack(track, isCurrent);
          if (error?.name === "AbortError") throw error;
        }
      }

      const requestedFillMode = typeof photoSettings?.fillLightMode === "string"
        ? photoSettings.fillLightMode : "off";
      const advertisedFillModes = Array.isArray(capabilities?.fillLightMode) ? capabilities.fillLightMode : [];
      const fillModeSupported = requestedFillMode === "off"
        || capabilitiesKnown && advertisedFillModes.includes(requestedFillMode);
      if (!fillModeSupported) return canvasPhoto({ track, video, isCurrent });

      const preferred = preferredPhotoSettings(capabilities, photoSettings);
      preferred.fillLightMode = requestedFillMode;
      const hasPreferred = Object.keys(preferred).length > 0;
      const hasPreferredSize = preferred.imageWidth !== undefined || preferred.imageHeight !== undefined;
      if (hasPreferred) {
        let shouldRetry = false;
        try {
          const blob = await imageCapture.takePhoto(preferred);
          ensureCurrentTrack(track, isCurrent);
          if (usableBlob(blob)) return { blob, source: "image-capture" };
          shouldRetry = true;
        } catch (error) {
          ensureCurrentTrack(track, isCurrent);
          if (!photoSettingsFallbackAllowed(error)) return canvasPhoto({ track, video, isCurrent });
          shouldRetry = true;
        }
        if (shouldRetry && hasPreferredSize) {
          const safeRetry = { fillLightMode: requestedFillMode };
          try {
            const blob = await imageCapture.takePhoto(safeRetry);
            ensureCurrentTrack(track, isCurrent);
            if (usableBlob(blob)) return { blob, source: "image-capture" };
          } catch {
            ensureCurrentTrack(track, isCurrent);
          }
        }
        return canvasPhoto({ track, video, isCurrent });
      }
    }
  }

  return canvasPhoto({ track, video, isCurrent });
}
