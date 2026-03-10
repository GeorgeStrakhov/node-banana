const FRAME_BUDGET = 1000 / 60; // ~16.67ms → 60fps cap

/**
 * Creates a throttled requestAnimationFrame scheduler that limits
 * callback execution to ~60fps regardless of display refresh rate.
 *
 * On 144Hz displays, RAF fires every ~6.9ms. This utility coalesces
 * rapid schedule() calls and skips execution when less than one 60fps
 * frame budget has elapsed, so only the latest callback runs at most
 * once per ~16ms.
 *
 * For event-driven use (hover, ResizeObserver): the event source
 * keeps firing, so skipped frames naturally get picked up by the
 * next event.
 */
export function createThrottledRAF() {
  let rafId: number | null = null;
  let lastTime: number | null = null;

  function schedule(callback: () => void): void {
    if (rafId !== null) cancelAnimationFrame(rafId);
    rafId = requestAnimationFrame((now) => {
      rafId = null;
      if (lastTime !== null && now - lastTime < FRAME_BUDGET) return;
      lastTime = now;
      callback();
    });
  }

  function cancel(): void {
    if (rafId !== null) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
  }

  return { schedule, cancel };
}

/**
 * Creates a continuous animation loop throttled to ~60fps.
 *
 * Unlike createThrottledRAF (which is event-driven and relies on
 * external events to re-trigger), this runs a self-scheduling loop
 * that executes the callback at most once per ~16ms frame budget.
 * The RAF loop itself runs at the display's native rate but skips
 * work on intermediate frames.
 */
export function createThrottledLoop(callback: () => void) {
  let rafId: number | null = null;
  let lastTime = 0;

  function tick(now: number) {
    if (now - lastTime >= FRAME_BUDGET) {
      lastTime = now;
      callback();
    }
    rafId = requestAnimationFrame(tick);
  }

  function start(): void {
    if (rafId !== null) return;
    lastTime = 0; // Execute immediately on first frame
    rafId = requestAnimationFrame(tick);
  }

  function stop(): void {
    if (rafId !== null) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
  }

  return { start, stop };
}
