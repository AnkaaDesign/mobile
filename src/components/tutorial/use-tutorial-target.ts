import { useCallback, useEffect, useRef } from "react";
import { Dimensions, type View } from "react-native";
import { useOptionalTutorial } from "./tutorial-context";

const log = (msg: string, ...args: any[]) => {
  if (__DEV__) console.log(`[tutorial/target] ${msg}`, ...args);
};

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
  const tutorial = useOptionalTutorial();
  const ref = useRef<View | null>(null);

  const registerTarget = tutorial?.registerTarget;
  const unregisterTarget = tutorial?.unregisterTarget;
  const registerAction = tutorial?.registerAction;
  const unregisterAction = tutorial?.unregisterAction;
  const notifyAction = tutorial?.notifyAction;
  const isActive = tutorial?.isActive ?? false;
  const measureTick = tutorial?.measureTick ?? 0;
  const isActiveTarget = tutorial?.currentStep?.targetId === id;

  const onActionRef = useRef<(() => void) | undefined>(options?.onAction);
  onActionRef.current = options?.onAction;

  const measure = useCallback(() => {
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
        // Fully off-screen on any axis.
        y + height <= 0 ||
        y >= screen.height ||
        x + width <= 0 ||
        x >= screen.width;
      if (bad) {
        log(`measure REJECT id=${id} rect=`, { x, y, width, height });
        return;
      }
      log(`measure OK id=${id} rect=`, { x, y, width, height }, `→ calling registerTarget`);
      registerTarget(id, { x, y, width, height });
    });
  }, [registerTarget, id]);

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
