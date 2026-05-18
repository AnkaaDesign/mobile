import { useCallback, useEffect, useRef, useSyncExternalStore } from "react";
import { Dimensions, InteractionManager, type View } from "react-native";
import { useOptionalTutorialActions } from "./tutorial-context";
import {
  getActiveTargetId,
  getMeasureTick,
  subscribeIsActiveTarget,
  subscribeMeasureTick,
} from "./tutorial-store";

// Temporarily ENABLED while we hunt the spotlight-stuck bug.
const VERBOSE = true;
const log = VERBOSE
  ? (msg: string, ...args: any[]) => {
      if (__DEV__) console.log(`[tutorial/target ${Date.now() % 100000}] ${msg}`, ...args);
    }
  : (_msg: string, ..._args: any[]) => {};

interface Options {
  /**
   * Called when the user taps the spotlight overlay during an interactive
   * tap step targeting this id. Use this to reproduce the underlying button's
   * behavior so the tutorial works even when the overlay blocks pass-through
   * touches (e.g. on Android with elevated overlays).
   */
  onAction?: () => void;
  /**
   * Optional ref to a ScrollView ancestor. When the tutorial step
   * targeting this id activates, the hook scrolls the container so the
   * target sits ~`scrollOffsetTop` px from the top of the viewport.
   */
  scrollContainer?: React.RefObject<any>;
  /** Pixels to leave above the target after scrolling. Defaults to 100. */
  scrollOffsetTop?: number;
}

/**
 * Register a UI element as a tutorial target.
 *
 *   const { ref, onLayout, onPress } = useTutorialTarget(TUTORIAL_TARGETS.homeGreeting);
 *   return <View ref={ref} onLayout={onLayout}>...</View>;
 *
 * Re-measure schedule (critical for scaling to 140 steps):
 *   - On every onLayout (the cheapest signal that the element moved).
 *   - On step change ONLY IF this hook owns the active step's target id.
 *     Previously every mounted hook ran a 200ms setTimeout(measure) on each
 *     step change — at 140 mounted targets that's 140× measureInWindow per
 *     advance.
 *   - On external bumpMeasureTick (drawer open animation, scroll settle).
 */
export function useTutorialTarget(id: string, options?: Options) {
  // Subscribe ONLY to the stable actions bag. This hook used to subscribe
  // to the entire composed context, which re-rendered all 140+ mounted
  // targets on every state mutation (phase, rect, awaiting, measureTick).
  // Now register/unregister/notify identities are stable across the
  // tutorial's lifetime — no re-render churn from this access.
  const actions = useOptionalTutorialActions();
  const ref = useRef<View | null>(null);

  const registerTarget = actions?.registerTarget;
  const unregisterTarget = actions?.unregisterTarget;
  const registerAction = actions?.registerAction;
  const unregisterAction = actions?.unregisterAction;
  const notifyAction = actions?.notifyAction;

  // Per-id external-store subscription. Only the two affected hooks
  // re-render on activeTargetId change (the old active + the new active).
  // The other 138+ hooks stay quiet.
  const isActiveTarget = useSyncExternalStore(
    useCallback((cb) => subscribeIsActiveTarget(id, cb), [id]),
    useCallback(() => getActiveTargetId() === id, [id]),
    () => false,
  );

  // measureTick: gate the subscription on `isActiveTarget` so 139 idle
  // hooks don't re-render on every bump. The active hook re-renders 4×
  // per step (the cascade), reads the tick, re-runs its measure effect.
  const measureTick = useSyncExternalStore(
    useCallback(
      (cb) => (isActiveTarget ? subscribeMeasureTick(cb) : () => {}),
      [isActiveTarget],
    ),
    useCallback(
      () => (isActiveTarget ? getMeasureTick() : 0),
      [isActiveTarget],
    ),
    () => 0,
  );

  // Local `isActive` flag is used solely to gate the measure effect's
  // first call. It can be derived from whether actions are available —
  // when the provider mounts they're non-null; when no provider exists
  // the hook is a no-op.
  const isActive = actions != null;

  const onActionRef = useRef<(() => void) | undefined>(options?.onAction);
  onActionRef.current = options?.onAction;

  // Tracks whether THIS hook has ever successfully registered a rect for
  // its id during the current active span. Drives the polling cadence —
  // we stay at 300ms while we've never measured, downshifting only after
  // a real registration. The previous unconditional 4s downshift meant
  // that a hook whose target was racing the navigator's first layout
  // commit (chrome header children are the main offender) dropped to
  // 1.5s polling before its first measure ever landed; users saw the
  // spotlight stuck blank for several seconds with no obvious path to
  // recovery.
  const hasRegisteredRef = useRef(false);

  const measureAttempt = useCallback(() => {
    if (!registerTarget || !ref.current) {
      log(`measure ABORT id=${id} registerTarget=${!!registerTarget} ref=${!!ref.current}`);
      return;
    }
    ref.current.measureInWindow((x, y, width, height) => {
      // SG1: reject only obviously-bad rect measurements. The earlier
      // "50% off-screen" rule rejected legitimately tall containers (the
      // home widget list extends past the viewport after scroll-to-end),
      // leaving showcase steps with no spotlight. The SVG cutout clips
      // to the screen automatically, so a rect that extends off-screen
      // still renders a spotlight where it intersects the viewport.
      const MIN_DIM = 8;
      const screen = Dimensions.get("window");
      const bad =
        width < MIN_DIM ||
        height < MIN_DIM ||
        y + height <= 0 ||
        y >= screen.height ||
        x + width <= 0 ||
        x >= screen.width;
      if (bad) {
        log(`measure REJECT id=${id} rect=`, { x, y, width, height });
        return;
      }
      log(`measure OK id=${id} rect=`, { x, y, width, height }, `→ calling registerTarget`);
      hasRegisteredRef.current = true;
      registerTarget(id, { x, y, width, height });
    });
  }, [registerTarget, id]);

  // 2-attempt measure: immediate + 1 follow-up RAF, gated by
  // hasRegisteredRef. measureInWindow is async — the callback may not
  // fire by the time this function returns — so we fire the immediate
  // attempt unconditionally, then check hasRegisteredRef on the next
  // frame: if a previous measure already registered, skip the retry to
  // avoid duplicate JSI calls. This catches the common "View just
  // committed, layout settling" case (95%+ of recoveries) without the
  // 3x measureInWindow cost across the cascade + polling that the
  // earlier 3-RAF chain produced (degraded perf after long sessions).
  const measure = useCallback(() => {
    measureAttempt();
    requestAnimationFrame(() => {
      if (hasRegisteredRef.current) return;
      measureAttempt();
    });
  }, [measureAttempt]);

  // Double-RAF — schedule the measure two frames out so layout shifts
  // triggered by the same render pass (Yoga reflow + child re-mount) have
  // a chance to settle before we read window coordinates.
  const onLayout = useCallback(() => {
    log(`onLayout fired id=${id} isActiveTarget=${isActiveTarget}`);
    requestAnimationFrame(() =>
      requestAnimationFrame(() => measure()),
    );
  }, [measure, id, isActiveTarget]);

  useEffect(() => {
    log(`hook mount id=${id} isActiveTarget=${isActiveTarget}`);
    return () => {
      log(`hook unmount id=${id}`);
      unregisterTarget?.(id);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unregisterTarget, id]);

  const hasAction = !!options?.onAction;
  useEffect(() => {
    if (!registerAction || !unregisterAction) return;
    if (!hasAction) return;
    const fn = () => onActionRef.current?.();
    registerAction(id, fn);
    return () => unregisterAction(id);
  }, [registerAction, unregisterAction, id, hasAction]);

  // Re-measure only when THIS hook owns the active step's target.
  // Previously every mounted hook re-measured on every step change → at
  // 140 targets, 140 measureInWindow calls per advance.
  useEffect(() => {
    if (!isActive || !isActiveTarget) return;
    const handle = setTimeout(() => measure(), 60);
    return () => clearTimeout(handle);
  }, [isActive, isActiveTarget, measureTick, measure]);

  // Continuous re-measure loop. The provider's cascade fires bumps at 80/
  // 200/400/800/1500/2500/4000ms, but if all of those fired BEFORE the
  // target view was laid out (chrome-header targets in particular suffer
  // this — the navigation header's children mount with placeholder 0-dim
  // layout that settles hundreds of ms later, and measureInWindow returns
  // junk until then), no further re-measure happens until something
  // external (modal open, scroll, orientation change) triggers an
  // onLayout. The user-visible symptom is "spotlight missing, but opening
  // the Passos modal brings it back".
  //
  // Cadence is adaptive:
  //   - While `hasRegisteredRef` is false (we've never successfully
  //     measured this active span), poll every 300ms forever. Spotlight
  //     recovery is the priority — steady-state cost is irrelevant if
  //     the spotlight is missing.
  //   - After the first successful registration, downshift to 1500ms
  //     so the active hook self-heals stale rects (layout shifts from
  //     async data, font swap, etc.) without per-second measure churn.
  //   - We re-arm `hasRegisteredRef` to false on every active span entry
  //     so the next time this id becomes active it starts in fast mode
  //     again. Important for header-chrome targets that appear on
  //     multiple steps — the second appearance can race the navigator
  //     just like the first did.
  useEffect(() => {
    if (!isActive || !isActiveTarget) return;
    log(`polling effect ACTIVE id=${id} (isActiveTarget flipped true)`);
    hasRegisteredRef.current = false;
    measure();
    requestAnimationFrame(() => requestAnimationFrame(() => measure()));
    const interactionHandle = InteractionManager.runAfterInteractions(() => {
      log(`polling effect InteractionManager.runAfterInteractions fire id=${id}`);
      measure();
    });
    let interval: ReturnType<typeof setInterval> | null = null;
    let downshiftTimer: ReturnType<typeof setTimeout> | null = null;
    let cancelled = false;
    const startPolling = (ms: number) => {
      if (interval) clearInterval(interval);
      interval = setInterval(() => measure(), ms);
    };
    // Initial 500ms polling cadence (was 300ms). The triple-strategy
    // first measure (immediate + double-RAF + InteractionManager) covers
    // the typical-case fast paths; the polling loop only matters for
    // genuinely slow layouts (Reanimated transforms still settling,
    // navigator header rehydrating after a deep jump). 500ms is enough
    // to catch those without hammering measureInWindow on the JSI
    // bridge for the dozens of mounted target hooks during long
    // tutorial sessions, which was the main contributor to the engine
    // feeling sluggish after the task-detail screen.
    startPolling(500);
    // Schedule the downshift check after the initial settle window.
    // Only downshift if a measure has actually landed — otherwise keep
    // polling at the fast cadence until one does. Re-arms the timer until
    // success.
    const armDownshift = () => {
      if (cancelled) return;
      downshiftTimer = setTimeout(() => {
        if (cancelled) return;
        if (hasRegisteredRef.current) {
          startPolling(1500);
        } else {
          // Still no rect — keep aggressive cadence and re-check later.
          armDownshift();
        }
      }, 4000);
    };
    armDownshift();
    return () => {
      log(`polling effect CLEANUP id=${id}`);
      cancelled = true;
      if (interval) clearInterval(interval);
      if (downshiftTimer) clearTimeout(downshiftTimer);
      interactionHandle.cancel();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActive, isActiveTarget, measure]);

  const scrollContainer = options?.scrollContainer;
  const scrollOffsetTop = options?.scrollOffsetTop ?? 100;
  // Scroll-into-view for the active step's target.
  //
  // CRITICAL design choices:
  //
  //  1. The FIRST scroll attempt is dispatched SYNCHRONOUSLY in the
  //     effect body — not behind requestAnimationFrame or setTimeout(0).
  //     A previous version used setTimeout(40) and another used RAF
  //     (~16ms). Both were susceptible to the user rapid-tapping
  //     "Continuar" within those windows: the effect cleanup would
  //     `cancelAnimationFrame`/`clearTimeout` before the deferred call
  //     could fire, leaving the user staring at the previous card with
  //     a tooltip pointing at something below the fold (e.g. dates
  //     section invisible during the dates step).
  //
  //  2. The `measureLayout` success callback does NOT gate scrollTo on
  //     a `cancelled` flag. measureLayout dispatch IS synchronous; only
  //     the callback is async (typically 5–20ms). If the step changes
  //     during that window the in-flight callback STILL fires its
  //     scrollTo — but to the previous target. That's visually fine:
  //     the new step's scroll fires next and interrupts the animation,
  //     so the user sees each card briefly slide into view as they
  //     rapid-advance. The alternative (cancelled check) made the
  //     scroll silently never happen for any rapidly-advanced step.
  //
  //  3. The deps array intentionally omits `measureTick` and
  //     `bumpMeasureTick`. A previous version included them, and bumps
  //     scheduled by step-entry (80/320/700/1500ms, each 50ms-debounced)
  //     would re-trigger this effect within ~50–130ms, clearing the
  //     pending scroll timer before it could fire. We instead schedule
  //     a fixed cascade of additional attempts inside the effect — none
  //     bound to deps — so the cascade survives bumps.
  useEffect(() => {
    log(`scroll effect run id=${id} isActive=${isActive} isActiveTarget=${isActiveTarget} sc=${!!scrollContainer}`);
    if (!isActive || !isActiveTarget) return;
    if (!scrollContainer) return;

    const performScroll = () => {
      const node = ref.current;
      const sc = scrollContainer.current;
      if (!node || !sc) {
        log(`scroll SKIP id=${id} node=${!!node} sc=${!!sc}`);
        return;
      }
      // Resolve the ScrollView's native ref. Fabric (new architecture)
      // requires a host-component ref; the ScrollView imperative handle
      // exposes `getNativeScrollRef()` for that. Falls back to
      // `getInnerViewRef()` then to the imperative handle itself.
      let scTarget: any = null;
      if (typeof sc.getNativeScrollRef === "function") {
        scTarget = sc.getNativeScrollRef();
      }
      if (!scTarget && typeof sc.getInnerViewRef === "function") {
        scTarget = sc.getInnerViewRef();
      }
      if (!scTarget) scTarget = sc;
      log(`scroll measureLayout START id=${id} scTargetType=${typeof scTarget} hasMeasure=${typeof scTarget?.measure === "function"}`);
      try {
        (node as any).measureLayout(
          scTarget,
          (_xl: number, yl: number, _wl: number, _hl: number) => {
            // yl is the target's y relative to the scroll container's content.
            // scrollTo(y) sets the content offset — so y === yl - scrollOffsetTop
            // puts the target `scrollOffsetTop` px from the viewport top.
            const targetY = Math.max(0, yl - scrollOffsetTop);
            log(`scroll measureLayout OK id=${id} yInScroll=${yl} → scrollTo y=${targetY}`);
            sc.scrollTo?.({ y: targetY, animated: true });
          },
          () => {
            log(`scroll measureLayout FAIL id=${id} — falling back to window-relative scroll`);
            // Fallback: compute scroll target from window coords. Works when
            // the ScrollView starts at the top of the viewport (common case
            // for screens without a fixed header above the scroll).
            (node as any).measureInWindow?.(
              (_x: number, y: number) => {
                const targetY = Math.max(0, y - scrollOffsetTop);
                log(`scroll FALLBACK scrollTo y=${targetY} (window-relative)`);
                sc.scrollTo?.({ y: targetY, animated: true });
              },
            );
          },
        );
      } catch (e) {
        log(`scroll EXCEPTION id=${id}`, e);
      }
    };

    // Synchronous first attempt. measureLayout's dispatch IS synchronous
    // — only its callback is async — so the work is committed to the
    // event loop BEFORE the current tick can be preempted by another
    // user tap. Without this, rapid taps (~5–10ms apart) could cancel
    // the effect before any deferred attempt fired.
    performScroll();
    // Retries to cover slow Yoga reflows on below-fold cards whose rect
    // wasn't settled on the first attempt. Each call is idempotent —
    // measureLayout returns the same yl, scrollTo to the same position
    // is a visual no-op once the page is already there.
    const t1 = setTimeout(performScroll, 80);
    const t2 = setTimeout(performScroll, 320);
    const t3 = setTimeout(performScroll, 700);

    return () => {
      log(`scroll effect cleanup id=${id}`);
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [isActive, isActiveTarget, scrollContainer, scrollOffsetTop, id]);

  const onPress = useCallback(() => {
    notifyAction?.("tap", { targetId: id });
  }, [notifyAction, id]);

  return {
    ref,
    onLayout,
    onPress,
    isActiveTarget,
  };
}
