const jobs = new Set();
let pending = null;

function schedule() {
  if (pending !== null || !jobs.size) return;
  const run = deadline => {
    pending = null;
    const start = performance.now();
    do {
      const job = jobs.values().next().value;
      jobs.delete(job);
      job();
    } while (jobs.size && performance.now() - start < 6 && (deadline?.timeRemaining() ?? 0) > 2);
    schedule();
  };
  pending = window.requestIdleCallback ? window.requestIdleCallback(run, { timeout: 300 })
    : window.setTimeout(run, 16);
}

// A shared queue prevents hundreds of individually expired idle callbacks from
// starving input and IndexedDB completion during a cold calendar render.
export function queueTextPaint(job) {
  jobs.add(job);
  schedule();
  return () => {
    jobs.delete(job);
    if (!jobs.size && pending !== null) {
      if (window.cancelIdleCallback) window.cancelIdleCallback(pending);
      else window.clearTimeout(pending);
      pending = null;
    }
  };
}
