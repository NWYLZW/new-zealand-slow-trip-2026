let started = false;
let state = { prompt: null, installed: false };
const listeners = new Set();
const update = (next) => { state = { ...state, ...next }; listeners.forEach((listener) => listener()); };
const standalone = () => window.matchMedia("(display-mode: standalone)").matches || navigator.standalone === true;

export function startInstallCapture() {
  if (started) return;
  started = true;
  update({ installed: standalone() });
  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    update({ prompt: event });
  });
  window.addEventListener("appinstalled", () => update({ installed: true, prompt: null }));
  window.matchMedia("(display-mode: standalone)").addEventListener?.("change", () => {
    if (standalone()) update({ installed: true, prompt: null });
  });
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
