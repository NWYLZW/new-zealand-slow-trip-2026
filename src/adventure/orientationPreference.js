export const orientationPreferences = ["portrait", "landscape", "system"];

function orientationApi() {
  return typeof screen !== "undefined" ? screen.orientation : null;
}

export async function applyOrientationPreference(preference) {
  const orientation = orientationApi();
  if (preference === "system") {
    if (!orientation) return { status: "system" };
    try {
      orientation.unlock?.();
      return { status: "system" };
    } catch {
      return { status: "restricted" };
    }
  }

  if (!orientation) return { status: "unsupported" };
  if (typeof orientation.lock !== "function") return { status: "unsupported" };
  try {
    await orientation.lock(preference);
    return { status: "locked" };
  } catch (error) {
    return {
      status: error?.name === "NotSupportedError" ? "unsupported" : "restricted",
      error,
    };
  }
}

export function orientationLockStillApplies(preference) {
  if (preference === "system") return true;
  const orientation = orientationApi();
  return typeof orientation?.type !== "string" || orientation.type.startsWith(preference);
}
