import { useEffect, useRef } from "react";
import { Dimensions, StyleSheet, Pressable } from "react-native";

const olog = (msg: string, ...args: any[]) => {
  if (__DEV__) console.log(`[tutorial/overlay] ${msg}`, ...args);
};
import Animated, {
  useSharedValue,
  useAnimatedProps,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  withSpring,
  Easing,
  FadeIn,
  FadeOut,
} from "react-native-reanimated";
import Svg, { Defs, Mask, Rect } from "react-native-svg";
import { useTutorial, TUTORIAL_TIMINGS } from "./tutorial-context";
import { TutorialTooltip } from "./tutorial-tooltip";
import { TutorialDevStepPicker } from "./tutorial-dev-step-picker";

const AnimatedRect = Animated.createAnimatedComponent(Rect);

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get("window");
const SPOTLIGHT_PADDING = 8;
const SPOTLIGHT_RADIUS = 14;

export function TutorialOverlay() {
  const tutorial = useTutorial();
  const {
    isActive,
    currentStep,
    currentTargetRect,
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

    if (isSwap) {
      cutoutOpacity.value = withTiming(0, {
        duration: TUTORIAL_TIMINGS.spotlightFadeOut,
        easing: Easing.out(Easing.cubic),
      });
      swapTimerRef.current = setTimeout(() => {
        cx.value = nx;
        cy.value = ny;
        cw.value = nw;
        ch.value = nh;
        cutoutOpacity.value = withTiming(1, {
          duration: TUTORIAL_TIMINGS.spotlightFadeIn,
          easing: Easing.out(Easing.cubic),
        });
        prevRectRef.current = { x: nx, y: ny, w: nw, h: nh };
        swapTimerRef.current = null;
      }, TUTORIAL_TIMINGS.spotlightFadeOut + 10);
    } else {
      // First appearance OR re-measure of same rect.
      cx.value = nx;
      cy.value = ny;
      cw.value = nw;
      ch.value = nh;
      cutoutOpacity.value = withTiming(1, {
        duration: TUTORIAL_TIMINGS.spotlightFadeIn,
        easing: Easing.out(Easing.cubic),
      });
      prevRectRef.current = { x: nx, y: ny, w: nw, h: nh };
    }

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

  const cutoutProps = useAnimatedProps(() => ({
    x: cx.value,
    y: cy.value,
    width: cw.value,
    height: ch.value,
    opacity: cutoutOpacity.value,
  }));

  // Outer dim layer's mask follows the cutout — but we also need its opacity
  // to follow so that during the fade-out window the dim layer doesn't briefly
  // show full darkness with no cutout. Animate the overall mask in lockstep.
  const maskedRectAnimatedProps = useAnimatedProps(() => ({
    opacity: 0.78,
  }));

  const pulseStyle = useAnimatedStyle(() => {
    if (!currentTargetRect) return { opacity: 0 };
    return {
      position: "absolute" as const,
      left: currentTargetRect.x - SPOTLIGHT_PADDING,
      top: currentTargetRect.y - SPOTLIGHT_PADDING,
      width: currentTargetRect.width + SPOTLIGHT_PADDING * 2,
      height: currentTargetRect.height + SPOTLIGHT_PADDING * 2,
      borderRadius: SPOTLIGHT_RADIUS,
      borderWidth: 3,
      borderColor: "#FCD34D",
      transform: [{ scale: pulseScale.value }],
      opacity:
        currentStep?.pulseTarget && currentStep?.kind === "interactive"
          ? cutoutOpacity.value
          : 0,
    };
  });

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

  return (
    <Animated.View
      style={[StyleSheet.absoluteFill, styles.root]}
      pointerEvents="box-none"
      entering={FadeIn.duration(200)}
      exiting={FadeOut.duration(160)}
    >
      {/* Background dim — opted out by `dimBackground: false` on narration
          steps that describe a panel/drawer the user already opened. Keeps
          the underlying content clearly visible behind the tooltip. */}
      {currentStep.dimBackground !== false ? (
        <Svg
          width={SCREEN_W}
          height={SCREEN_H}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        >
          <Defs>
            <Mask id="tutorial-mask">
              <Rect x={0} y={0} width={SCREEN_W} height={SCREEN_H} fill="white" />
              <AnimatedRect
                animatedProps={cutoutProps}
                rx={SPOTLIGHT_RADIUS}
                ry={SPOTLIGHT_RADIUS}
                fill="black"
              />
            </Mask>
          </Defs>
          <AnimatedRect
            animatedProps={maskedRectAnimatedProps}
            x={0}
            y={0}
            width={SCREEN_W}
            height={SCREEN_H}
            fill="#000000"
            mask="url(#tutorial-mask)"
          />
        </Svg>
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
});
