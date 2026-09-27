import { useEffect } from "react";

export function normalizeCameraAngle(angle) {
  return ((Number(angle) + 180) % 360 + 360) % 360 - 180;
}

export function cameraDeviceRoll(beta, gamma) {
  if (!Number.isFinite(beta) || !Number.isFinite(gamma)) return null;
  const betaRadians = beta * Math.PI / 180;
  const gammaRadians = gamma * Math.PI / 180;
  // Project gravity onto the device screen. atan2(gamma,beta) only works near
  // flat angles and visibly over-rotates common upright, tilted poses.
  const screenX = Math.sin(gammaRadians) * Math.cos(betaRadians);
  const screenY = Math.sin(betaRadians);
  if (Math.hypot(screenX, screenY) < .25) return null;
  return normalizeCameraAngle(Math.atan2(screenX, screenY) * 180 / Math.PI);
}

export function cameraIconCompensation(beta, gamma, screenAngle = 0) {
  const roll = cameraDeviceRoll(beta, gamma);
  return roll === null ? null : normalizeCameraAngle(normalizeCameraAngle(screenAngle) - roll);
}

function currentScreenOrientation() {
  const orientation = globalThis.screen?.orientation;
  return {
    angle: Number.isFinite(orientation?.angle) ? normalizeCameraAngle(orientation.angle) : 0,
    type: orientation?.type || (innerWidth > innerHeight ? "landscape-primary" : "portrait-primary"),
  };
}

export function useCameraIconOrientation(active, cameraRef) {
  useEffect(() => {
    const surface = cameraRef.current?.closest(".trip-day--camera");
    if (!active || !surface) return undefined;
    const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
    const explicitPermission = typeof DeviceOrientationEvent !== "undefined"
      && typeof DeviceOrientationEvent.requestPermission === "function";
    const supportsPassiveOrientation = typeof DeviceOrientationEvent !== "undefined" && !explicitPermission;
    let listening = false, frame = 0, pendingAngle = 0, sensorSeen = false, lastAngle = 0;

    const applyAngle = angle => {
      const normalized = normalizeCameraAngle(angle);
      if (Math.abs(normalizeCameraAngle(normalized - lastAngle)) < 1 && surface.style.getPropertyValue("--trip-camera-icon-rotation")) return;
      lastAngle = normalized;
      surface.style.setProperty("--trip-camera-icon-rotation", `${normalized.toFixed(2)}deg`);
    };
    const updateScreen = () => {
      const orientation = currentScreenOrientation();
      surface.dataset.cameraOrientation = orientation.type;
      if (!sensorSeen || reducedMotion.matches) applyAngle(0);
    };
    const flush = () => {
      frame = 0;
      applyAngle(pendingAngle);
    };
    const deviceOrientation = event => {
      if (document.hidden || reducedMotion.matches) return;
      const compensated = cameraIconCompensation(event.beta, event.gamma, currentScreenOrientation().angle);
      if (compensated === null) return;
      sensorSeen = true;
      pendingAngle = compensated;
      if (!frame) frame = requestAnimationFrame(flush);
    };
    const stop = () => {
      if (!listening) return;
      listening = false;
      screen.orientation?.removeEventListener?.("change", updateScreen);
      window.removeEventListener("orientationchange", updateScreen);
      if (supportsPassiveOrientation) window.removeEventListener("deviceorientation", deviceOrientation, true);
      cancelAnimationFrame(frame);
      frame = 0;
    };
    const start = () => {
      if (listening || document.hidden) return;
      listening = true;
      screen.orientation?.addEventListener?.("change", updateScreen);
      window.addEventListener("orientationchange", updateScreen);
      if (supportsPassiveOrientation && !reducedMotion.matches)
        window.addEventListener("deviceorientation", deviceOrientation, true);
      updateScreen();
    };
    const visibility = () => document.hidden ? stop() : start();
    const motionPreference = () => {
      stop();
      sensorSeen = false;
      applyAngle(0);
      start();
    };

    document.addEventListener("visibilitychange", visibility);
    reducedMotion.addEventListener?.("change", motionPreference);
    start();
    return () => {
      stop();
      document.removeEventListener("visibilitychange", visibility);
      reducedMotion.removeEventListener?.("change", motionPreference);
      delete surface.dataset.cameraOrientation;
      surface.style.removeProperty("--trip-camera-icon-rotation");
    };
  }, [active, cameraRef]);
}
