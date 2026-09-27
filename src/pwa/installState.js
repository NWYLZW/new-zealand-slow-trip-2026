let started = false;
let state = { prompt: null, installed: false };
const listeners = new Set();
const update = (next) => { state = { ...state, ...next }; listeners.forEach((listener) => listener()); };
const installedDisplay = () => window.matchMedia("(display-mode: standalone)").matches
  || navigator.standalone === true
  || (window.matchMedia("(display-mode: fullscreen)").matches && !document.fullscreenElement);

export function startInstallCapture() {
  if (started) return;
  started = true;
  update({ installed: installedDisplay() });
  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    update({ prompt: event });
  });
  window.addEventListener("appinstalled", () => update({ installed: true, prompt: null }));
  for (const mode of ["standalone", "fullscreen"]) {
    window.matchMedia(`(display-mode: ${mode})`).addEventListener?.("change", () => {
      if (installedDisplay()) update({ installed: true, prompt: null });
    });
  }
}

export const getInstallState = () => state;
export const subscribeInstallState = (listener) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

export async function requestInstallation() {
  const prompt = state.prompt;
  if (!prompt) return;
  update({ prompt: null });
  await prompt.prompt();
  const choice = await prompt.userChoice;
  if (choice.outcome === "accepted") update({ installed: true });
}
