export function createCameraNicknameAutosave({ save, delay = 500, allowEmpty = false, onStatus = () => {} }) {
  let committed = "";
  let latest = "";
  let version = 0;
  let touched = false;
  let timer = 0;
  let running = null;

  const flush = () => {
    clearTimeout(timer);
    if (running) return running;
    running = (async () => {
      while (true) {
        const targetVersion = version;
        const value = latest.trim();
        if (!value && !allowEmpty) {
          if (targetVersion === version) onStatus("invalid");
          return false;
        }
        if (value === committed) {
          if (targetVersion === version) {
            touched = false;
            onStatus("saved");
          }
          return true;
        }
        if (targetVersion === version) onStatus("saving");
        try {
          await save(value);
          committed = value;
        } catch (error) {
          if (targetVersion === version) {
            onStatus("error", error);
            return false;
          }
          continue;
        }
        if (targetVersion === version && latest.trim() === value) {
          touched = false;
          onStatus("saved");
          return true;
        }
      }
    })().finally(() => { running = null; });
    return running;
  };

  return {
    edit(value, { immediate = false } = {}) {
      latest = String(value ?? "");
      touched = true;
      version += 1;
      clearTimeout(timer);
      if (immediate) return flush();
      timer = setTimeout(flush, delay);
      return null;
    },
    sync(value) {
      committed = String(value ?? "");
      if (!touched) latest = committed;
      if (latest.trim() === committed) touched = false;
      return { adopt: !touched, value: latest };
    },
    cancelPending() {
      clearTimeout(timer);
    },
    flush,
    dispose() {
      clearTimeout(timer);
      return flush();
    },
  };
}
