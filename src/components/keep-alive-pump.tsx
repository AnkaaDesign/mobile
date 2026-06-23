/**
 * KeepAlivePump — the definitive fix for the parked-JS-thread bug.
 *
 * On RN 0.81 New Architecture (iOS): when the JS thread
 * goes idle after a navigation, it stops servicing its OWN queue — timers,
 * microtasks, requestAnimationFrame, and React's render scheduler all freeze
 * (even console.log stops) until a NATIVE event (touch / network / AppState /
 * notification) calls into JS. Consequences: data fetches resolve but the
 * re-render never flushes (stuck loading), and <Redirect>/mount effects never
 * run (blank screen). A JS-side rAF keep-alive can't fix it because rAF is
 * scheduled by the very thread that's parked — it parks too.
 *
 * The UI (main) thread, however, never parks: it keeps the native display link
 * running (that's what animates the ActivityIndicator). Reanimated's
 * useFrameCallback runs a worklet on that UI thread every frame, and runOnJS()
 * is a native→JS call — exactly the kind of call that wakes and drains the JS
 * thread. So pumping runOnJS a few times per second keeps the JS event loop
 * ticking, so React flushes pending renders, redirects run, and timers fire.
 *
 * Cost: ~10 UI→JS hops/sec (throttled). The work itself is a no-op; the value
 * is purely "make the JS thread run a task" so it drains its queue.
 */
import { useFrameCallback, useSharedValue, runOnJS } from 'react-native-reanimated';

// Running this on the JS thread is the whole point: forcing the thread to
// process a task drains any parked timers / microtasks / scheduled React
// renders alongside it. The body is intentionally empty — the act of being
// invoked (via runOnJS from the UI thread) is what keeps the JS loop ticking.
function pumpJsThread() {}

export function KeepAlivePump() {
  const accumMs = useSharedValue(0);

  useFrameCallback((frame) => {
    'worklet';
    // Runs every frame on the UI thread (native display-link driven — does NOT
    // park like the JS thread). Throttle the JS pump to ~10x/sec.
    accumMs.value += frame.timeSincePreviousFrame ?? 16;
    if (accumMs.value >= 100) {
      accumMs.value = 0;
      runOnJS(pumpJsThread)();
    }
  });

  return null;
}
