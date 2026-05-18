import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { ActivityIndicator, Dimensions, StyleSheet, Pressable, Text, View } from "react-native";
import {
  bumpMeasureTickStore,
  getActiveTargetRect,
  subscribeActiveTargetRect,
} from "./tutorial-store";

// Temporarily ENABLED while we hunt the spotlight-stuck bug.
const VERBOSE = true;
const olog = VERBOSE
  ? (msg: string, ...args: any[]) => {
      if (__DEV__) console.log(`[tutorial/overlay ${Date.now() % 100000}] ${msg}`, ...args);
    }
  : (_msg: string, ..._args: any[]) => {};
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  withSpring,
  cancelAnimation,
  Easing,
  FadeIn,
  FadeOut,
} from "react-native-reanimated";
import {
  useTutorial,
  useTutorialIsActive,
  TUTORIAL_TIMINGS,
} from "./tutorial-context";
import { TutorialTooltip } from "./tutorial-tooltip";
import { TutorialDevStepPicker } from "./tutorial-dev-step-picker";

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get("window");
const SPOTLIGHT_PADDING = 8;
const SPOTLIGHT_RADIUS = 14;
const DIM_COLOR = "rgba(0, 0, 0, 0.78)";

/**
 * Lazy host. Subscribes only to the boolean `isActive` flag, so it
 * re-renders ~twice per session (start + stop). Mounts the heavy overlay
 * body only while the tutorial is running — SVG, Reanimated shared values,
 * tooltip, dev step picker, all of it. When idle, the cost of having a
 * tutorial system installed is one boolean read per re-render of the
 * root layout.
 */
export function TutorialOverlay() {
  const isActive = useTutorialIsActive();
  if (!isActive) return null;
  return <TutorialOverlayBody />;
}

function TutorialOverlayBody() {
  const tutorial = useTutorial();
  const {
    isActive,
    currentStep,
    currentStepIndex,
    totalSteps,
    awaitingAction,
    phase,
    interactiveStuck,
    next,
    skip,
    notifyAction,
    invokeTargetAction,
  } = tutorial;

  // Subscribe directly to the rect store. This bypasses the React state
  // path that previously gated spotlight rendering — registerTarget pushes
  // to the store BEFORE its setState, so the cutout updates instantly even
  // if React's setState happens to flush on a delayed frame. Closes the
  // class of bugs where a successful measure didn't visibly render the
  // spotlight until something unrelated (AppState foreground, Passos modal
  // open) forced a re-render.
  const currentTargetRect = useSyncExternalStore(
    useCallback((cb) => subscribeActiveTargetRect(cb), []),
    useCallback(() => getActiveTargetRect(), []),
    () => null,
  );

  // Cutout coordinates and opacity. Coords JUMP between rects (no tween),
  // opacity fades — together this produces a clean "old spotlight fades out,
  // new spotlight fades in at the new location" effect with no visible
  // travel between rects. The old engine tweened coords with a 320ms
  // duration, which both kept the old rect partially visible *and* showed
  // the spotlight drifting across the screen on every step change.
  const cx = useSharedValue(SCREEN_W / 2);
  const cy = useSharedValue(SCREEN_H / 2);
  const cw = useSharedValue(0);
  const ch = useSharedValue(0);
  const cutoutOpacity = useSharedValue(0);
  const pulseScale = useSharedValue(1);

  const prevRectRef = useRef<{ x: number; y: number; w: number; h: number } | null>(null);
  const swapTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Drive the cutout off React state, NOT off a mutable ref. Three cases:
  //   1. rect → null            : fade opacity to 0
  //   2. null → rect (first)    : jump coords, fade opacity to 1
  //   3. rectA → rectB (swap)   : fade out, jump coords, fade in
  useEffect(() => {
    if (swapTimerRef.current) {
      clearTimeout(swapTimerRef.current);
      swapTimerRef.current = null;
    }

    if (!currentTargetRect) {
      // Fade the cover out. The OLD code also collapsed cw/ch to 0 inside
      // the worklet's `finished` callback, which produced a nasty race:
      // if a new rect arrived AFTER the worklet zeroed cw/ch but BEFORE
      // the rect-branch's coord assignment landed on the UI thread, the
      // spotlight cover stayed at 0×0 and the user saw a uniformly-dim
      // screen with no cutout — even though `phase: "active"` and the
      // rect was correct. We now leave cw/ch at the previous rect's
      // size; the cover's opacity going to 0 already makes it invisible,
      // and the dim frames re-cover the full screen automatically on the
      // next render via the top/bottom/left/right view layout math. The
      // rounded-corner "leak" the original code worried about is invisible
      // at opacity 0 anyway.
      cancelAnimation(cutoutOpacity);
      cutoutOpacity.value = withTiming(0, {
        duration: TUTORIAL_TIMINGS.spotlightFadeOut,
        easing: Easing.out(Easing.cubic),
      });
      prevRectRef.current = null;
      return;
    }

    const nx = currentTargetRect.x - SPOTLIGHT_PADDING;
    const ny = currentTargetRect.y - SPOTLIGHT_PADDING;
    const nw = currentTargetRect.width + SPOTLIGHT_PADDING * 2;
    const nh = currentTargetRect.height + SPOTLIGHT_PADDING * 2;

    const prev = prevRectRef.current;
    const isSwap =
      prev != null &&
      (Math.abs(prev.x - nx) > 0.5 ||
        Math.abs(prev.y - ny) > 0.5 ||
        Math.abs(prev.w - nw) > 0.5 ||
        Math.abs(prev.h - nh) > 0.5);

    // Update prevRectRef SYNCHRONOUSLY for both branches. The old code
    // updated prevRectRef inside the swap-timer callback (~130ms later);
    // a rect change A→B→C arriving during the swap timer's window would
    // compare C against A (the stale prev) instead of B, mis-classifying
    // the transition and leaving cutoutOpacity stuck mid-animation.
    prevRectRef.current = { x: nx, y: ny, w: nw, h: nh };

    // Coords are ALWAYS set synchronously — never deferred into the swap
    // timer. The previous code set cx/cy/cw/ch inside a 130ms setTimeout
    // for the swap branch, which means a same-step measure that arrived
    // at +50ms (when cw/ch had been zeroed by the prior fade-out callback)
    // would leave the cover at 0×0 until the timer fired. If anything
    // cancelled the timer in that window (parent re-render → effect
    // cleanup at the top of this function), the coords stayed at 0×0 and
    // the spotlight was permanently invisible despite phase: "active".
    cancelAnimation(cutoutOpacity);
    cx.value = nx;
    cy.value = ny;
    cw.value = nw;
    ch.value = nh;

    // Always fade in. The previous "isSwap → fade-out then fade-in via a
    // 130ms setTimeout" approach was responsible for the spotlight-stuck
    // bug: if the timer was cancelled before firing (any effect re-run
    // does that), cutoutOpacity stayed at 0 and the cover stayed opaque.
    // With coords already set synchronously above, a single fade-in
    // produces a clean appearance whether this is the first rect, a
    // same-rect re-measure, or a swap from a prior rect. The unused
    // `isSwap` is left as documentation of the prior intent in case the
    // visual cross-fade is reintroduced later.
    void isSwap;
    cutoutOpacity.value = withTiming(1, {
      duration: TUTORIAL_TIMINGS.spotlightFadeIn,
      easing: Easing.out(Easing.cubic),
    });

    return () => {
      if (swapTimerRef.current) {
        clearTimeout(swapTimerRef.current);
        swapTimerRef.current = null;
      }
    };
  }, [currentTargetRect, cx, cy, cw, ch, cutoutOpacity]);

  // Pulse ring for interactive steps.
  useEffect(() => {
    if (currentStep?.pulseTarget && currentStep?.kind === "interactive") {
      pulseScale.value = withRepeat(
        withSequence(
          withTiming(1.08, {
            duration: TUTORIAL_TIMINGS.pulseHalf,
            easing: Easing.inOut(Easing.ease),
          }),
          withTiming(1, {
            duration: TUTORIAL_TIMINGS.pulseHalf,
            easing: Easing.inOut(Easing.ease),
          }),
        ),
        -1,
        true,
      );
    } else {
      pulseScale.value = withTiming(1, { duration: 180 });
    }
  }, [currentStep?.pulseTarget, currentStep?.kind, pulseScale]);

  // 4-View dim frame + 1 cover view. Replaces the old SVG Mask + AnimatedRect
  // setup. All five views run on the UI thread via Reanimated shared values;
  // there's no SVG rendering or mask compositing cost, and no JS-side
  // re-evaluation of the cutout coords on every step.
  //
  // Frame layout (cutoutOpacity drives only the cover view; the 4 frame
  // views stay at 0.78 dim):
  //
  //   ┌─────────── top ──────────┐
  //   │                          │
  //   │ left │ SPOTLIGHT │ right │
  //   │                          │
  //   └────────── bottom ────────┘
  //
  // The cover view is positioned exactly over the spotlight rect and
  // fades 0 ↔ 0.78 in lockstep with cutoutOpacity. When cutoutOpacity=0
  // (between steps), the cover is fully dim → screen reads as full dim.
  // When cutoutOpacity=1 the cover is fully transparent → spotlight is
  // visible underneath. Border-radius on the cover preserves the
  // rounded-corner look from the old SVG mask cutout.
  const topStyle = useAnimatedStyle(() => ({
    position: "absolute" as const,
    left: 0,
    top: 0,
    width: SCREEN_W,
    height: Math.max(0, cy.value),
  }));
  const bottomStyle = useAnimatedStyle(() => ({
    position: "absolute" as const,
    left: 0,
    top: Math.max(0, cy.value + ch.value),
    width: SCREEN_W,
    height: Math.max(0, SCREEN_H - (cy.value + ch.value)),
  }));
  const leftStyle = useAnimatedStyle(() => ({
    position: "absolute" as const,
    left: 0,
    top: Math.max(0, cy.value),
    width: Math.max(0, cx.value),
    height: Math.max(0, ch.value),
  }));
  const rightStyle = useAnimatedStyle(() => ({
    position: "absolute" as const,
    left: Math.max(0, cx.value + cw.value),
    top: Math.max(0, cy.value),
    width: Math.max(0, SCREEN_W - (cx.value + cw.value)),
    height: Math.max(0, ch.value),
  }));
  const coverStyle = useAnimatedStyle(() => ({
    position: "absolute" as const,
    left: cx.value,
    top: cy.value,
    width: cw.value,
    height: ch.value,
    borderRadius: SPOTLIGHT_RADIUS,
    opacity: 1 - cutoutOpacity.value,
  }));

  // Pulse ring entirely on the UI thread — reads ONLY shared values, no
  // dependency on `currentTargetRect`. Previously this was a JS-side
  // computed style that recomputed on every React re-render; now it
  // only re-evaluates when one of its shared-value dependencies changes,
  // off the JS thread.
  const interactivePulseActive = useSharedValue(0);
  useEffect(() => {
    interactivePulseActive.value =
      currentStep?.pulseTarget && currentStep?.kind === "interactive" ? 1 : 0;
  }, [currentStep?.pulseTarget, currentStep?.kind, interactivePulseActive]);

  const pulseStyle = useAnimatedStyle(() => ({
    position: "absolute" as const,
    left: cx.value,
    top: cy.value,
    width: cw.value,
    height: ch.value,
    borderRadius: SPOTLIGHT_RADIUS,
    borderWidth: 3,
    borderColor: "#FCD34D",
    transform: [{ scale: pulseScale.value }],
    opacity: interactivePulseActive.value * cutoutOpacity.value,
  }));

  if (!isActive || !currentStep) return null;

  const nudgeSpotlight = () => {
    pulseScale.value = withSequence(
      withTiming(1.18, { duration: 140, easing: Easing.out(Easing.quad) }),
      withSpring(1, { damping: 6, stiffness: 220 }),
    );
  };

  // When the user taps anywhere on the ghost layer during an interactive
  // tap step, treat it as a valid tap on the target. The user's intent is
  // clear (they're trying to interact with the highlighted element), and
  // if the spotlight rect drifted out of alignment with the visible
  // button — or the screen's onPress chain was missing — this is the only
  // way the engine can recover without the user being stuck. Fires both
  // the registered side-effect (open sheet, navigate, etc.) AND the
  // advance, so the tutorial mirrors a real interaction even when the
  // overlay's geometry was wrong.
  const handleGhostTap = () => {
    nudgeSpotlight();
    const stepTargetId = currentStep.targetId;
    const action = currentStep.expectedAction;
    olog(`ghost TAP stepId=${currentStep.id} target=${stepTargetId} action=${action} kind=${currentStep.kind}`);
    if (
      currentStep.kind === "interactive" &&
      stepTargetId &&
      (action === "tap" || action === "drawer-open")
    ) {
      invokeTargetAction(stepTargetId);
      notifyAction(action, { targetId: stepTargetId });
    }
  };

  const showGhostLayer =
    currentStep.kind === "interactive" && currentTargetRect != null;
  const sx = currentTargetRect ? currentTargetRect.x - SPOTLIGHT_PADDING : 0;
  const sy = currentTargetRect ? currentTargetRect.y - SPOTLIGHT_PADDING : 0;
  const sw = currentTargetRect
    ? currentTargetRect.width + SPOTLIGHT_PADDING * 2
    : 0;
  const sh = currentTargetRect
    ? currentTargetRect.height + SPOTLIGHT_PADDING * 2
    : 0;

  // Tooltip visibility rule — driven by phase, not by ad-hoc timers:
  //   - active   → show, anchored or centred per step.placement + rect
  //   - fallback → show centred (target never arrived)
  //   - waiting  → hide briefly so the tooltip doesn't flash centred-then-anchor
  //   - navigating → hide
  const showTooltip = phase === "active" || phase === "fallback";

  // Loading indicator for waiting/navigating phases. Shows AFTER a 250ms
  // delay so fast transitions (the common case) don't flash. This is the
  // key UX fix for the "user minimizes thinking it's stuck" bug: instead
  // of staring at a dim screen with no feedback during the ~300-800ms
  // it takes to navigate cross-screen + mount the destination + measure
  // the new target, the user sees "Carregando próximo passo..." and
  // waits instead of minimizing the app (which suspends JS and stalls
  // the navigation indefinitely).
  const [showLoadingHint, setShowLoadingHint] = useState(false);
  useEffect(() => {
    if (phase === "navigating") {
      setShowLoadingHint(true);
      return undefined;
    }
    if (phase === "waiting") {
      const handle = setTimeout(() => setShowLoadingHint(true), 120);
      return () => clearTimeout(handle);
    }
    setShowLoadingHint(false);
    return undefined;
  }, [phase]);

  // (RAF-driven rescue loop removed — was redundant with the recovery
  // effect in tutorial-context.tsx which already bumps measure tick at
  // 1000ms cadence during non-active phases, AND with the tap-anywhere
  // Pressable that fires bumps on any user touch. Three independent
  // recovery mechanisms added measureInWindow churn without adding
  // recovery capability — `bumpMeasureTickStore` only matters when a
  // hook is subscribed, and bumps from all three paths achieve the
  // same thing when subscribers exist.)

  return (
    <Animated.View
      style={[StyleSheet.absoluteFill, styles.root]}
      pointerEvents="box-none"
      entering={FadeIn.duration(200)}
      exiting={FadeOut.duration(160)}
    >
      {/* Background dim — opted out by `dimBackground: false` on narration
          steps that describe a panel/drawer the user already opened. Keeps
          the underlying content clearly visible behind the tooltip.
          Four frame Views + one cutout cover replace the old SVG Mask. */}
      {currentStep.dimBackground !== false ? (
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          <Animated.View style={[styles.dimFrame, topStyle]} />
          <Animated.View style={[styles.dimFrame, bottomStyle]} />
          <Animated.View style={[styles.dimFrame, leftStyle]} />
          <Animated.View style={[styles.dimFrame, rightStyle]} />
          <Animated.View style={[styles.dimFrame, coverStyle]} />
        </View>
      ) : null}

      {/* Tap-anywhere rescue during waiting/navigating. The user has no
          interactive target yet (rect not measured, tooltip hidden), so
          taps would otherwise hit dead screen below the dim. Capturing
          taps here gives the user a reliable "tap anywhere to nudge the
          engine" affordance — equivalent to opening the dev picker but
          discoverable. Pressed BEFORE the loading hint in JSX so the
          hint (rendered later) sits on top and gets its taps first. */}
      {(phase === "waiting" || phase === "navigating") ? (
        <Pressable
          onPress={() => {
            olog(`waiting/navigating screen TAP → bump measure tick`);
            bumpMeasureTickStore();
          }}
          style={StyleSheet.absoluteFill}
        />
      ) : null}

      {/* Pulsing yellow ring around interactive targets */}
      <Animated.View pointerEvents="none" style={pulseStyle} />

      {/* Tap-capture for interactive `tap` and `drawer-open` steps */}
      {currentStep.kind === "interactive" &&
      (currentStep.expectedAction === "tap" ||
        currentStep.expectedAction === "drawer-open") &&
      currentStep.targetId &&
      currentTargetRect ? (
        <Pressable
          onPress={() => {
            const stepTargetId = currentStep.targetId;
            const action = currentStep.expectedAction;
            olog(`spotlight TAP stepId=${currentStep.id} target=${stepTargetId} action=${action}`);
            if (!stepTargetId || !action) return;
            invokeTargetAction(stepTargetId);
            notifyAction(action, { targetId: stepTargetId });
          }}
          style={{
            position: "absolute",
            left: sx,
            top: sy,
            width: sw,
            height: sh,
            borderRadius: SPOTLIGHT_RADIUS,
          }}
        />
      ) : null}

      {/* Ghost layer absorbs strays + nudges the pulse ring */}
      {showGhostLayer ? (
        <>
          <Pressable
            onPress={handleGhostTap}
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              width: SCREEN_W,
              height: Math.max(0, sy),
            }}
          />
          <Pressable
            onPress={handleGhostTap}
            style={{
              position: "absolute",
              left: 0,
              top: sy + sh,
              width: SCREEN_W,
              height: Math.max(0, SCREEN_H - (sy + sh)),
            }}
          />
          <Pressable
            onPress={handleGhostTap}
            style={{
              position: "absolute",
              left: 0,
              top: Math.max(0, sy),
              width: Math.max(0, sx),
              height: sh,
            }}
          />
          <Pressable
            onPress={handleGhostTap}
            style={{
              position: "absolute",
              left: sx + sw,
              top: Math.max(0, sy),
              width: Math.max(0, SCREEN_W - (sx + sw)),
              height: sh,
            }}
          />
        </>
      ) : null}

      {showTooltip ? (
        <TutorialTooltip
          key={`tutorial-step-${currentStepIndex}`}
          step={currentStep}
          // In fallback phase the target rect is null — tooltip auto-centres.
          targetRect={phase === "fallback" ? null : currentTargetRect}
          currentIndex={currentStepIndex}
          totalSteps={totalSteps}
          awaitingAction={awaitingAction}
          phase={phase}
          interactiveStuck={interactiveStuck}
          onAdvance={next}
          onSkip={skip}
        />
      ) : showLoadingHint ? (
        // TAPPABLE loading indicator. The bumpMeasureTickStore call here
        // is the SAME recovery mechanism as the dev-step-picker's open
        // handler and the AppState foreground handler — the only three
        // mechanisms confirmed working when the engine appears stuck.
        // Making it user-tappable closes the perception gap: the user
        // sees a clear "tap to retry" affordance instead of feeling
        // forced to minimize the app or open the dev picker.
        // (Underlying root cause is JS-thread setTimeout throttling
        // — Chrome remote debugger or iOS background suspension can
        // pause the recovery cascade indefinitely. A tap reliably wakes
        // the JS thread.)
        <Animated.View
          entering={FadeIn.duration(120)}
          exiting={FadeOut.duration(80)}
          style={styles.loadingHintWrap}
        >
          <Pressable
            onPress={() => {
              olog(`loading hint TAP → bump measure tick`);
              bumpMeasureTickStore();
            }}
            style={styles.loadingHint}
            hitSlop={20}
          >
            <ActivityIndicator color="#FCD34D" size="small" />
            <Text style={styles.loadingHintText}>
              Carregando… toque para tentar
            </Text>
          </Pressable>
        </Animated.View>
      ) : null}

      <TutorialDevStepPicker />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: {
    zIndex: 10000,
    elevation: 1000,
  },
  dimFrame: {
    backgroundColor: DIM_COLOR,
  },
  loadingHintWrap: {
    position: "absolute",
    // 140 instead of 80: clears the dev step picker FAB (left:8,
    // bottom:~42) on narrow devices where the centered pill would
    // otherwise extend across the FAB's tap region.
    bottom: 140,
    left: 0,
    right: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingHint: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 18,
    paddingVertical: 12,
    backgroundColor: "#0F172AEE",
    borderColor: "#FCD34D55",
    borderWidth: 1,
    borderRadius: 999,
  },
  loadingHintText: {
    color: "#FCD34D",
    fontSize: 14,
    fontWeight: "600",
  },
});
