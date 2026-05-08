import { useEffect } from "react";
import { Dimensions, StyleSheet, Pressable } from "react-native";
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
import { useTutorial } from "./tutorial-context";
import { TutorialTooltip } from "./tutorial-tooltip";

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
    next,
    skip,
    notifyAction,
    invokeTargetAction,
  } = tutorial;

  const cx = useSharedValue(SCREEN_W / 2);
  const cy = useSharedValue(SCREEN_H / 2);
  const cw = useSharedValue(0);
  const ch = useSharedValue(0);
  const pulseScale = useSharedValue(1);

  // Animate spotlight to target.
  useEffect(() => {
    if (!isActive || !currentStep) return;
    const t = currentTargetRect;
    const cfg = { duration: 320, easing: Easing.out(Easing.cubic) };
    if (t) {
      cx.value = withTiming(t.x - SPOTLIGHT_PADDING, cfg);
      cy.value = withTiming(t.y - SPOTLIGHT_PADDING, cfg);
      cw.value = withTiming(t.width + SPOTLIGHT_PADDING * 2, cfg);
      ch.value = withTiming(t.height + SPOTLIGHT_PADDING * 2, cfg);
    } else {
      cx.value = withTiming(SCREEN_W / 2, cfg);
      cy.value = withTiming(SCREEN_H / 2, cfg);
      cw.value = withTiming(0, cfg);
      ch.value = withTiming(0, cfg);
    }
  }, [isActive, currentStep, currentTargetRect, cx, cy, cw, ch]);

  // Pulsing ring on the highlighted target when interactive.
  useEffect(() => {
    if (currentStep?.pulseTarget && currentStep?.kind === "interactive") {
      pulseScale.value = withRepeat(
        withSequence(
          withTiming(1.08, { duration: 600, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 600, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      );
    } else {
      pulseScale.value = withTiming(1, { duration: 200 });
    }
  }, [currentStep?.pulseTarget, currentStep?.kind, pulseScale]);

  const cutoutProps = useAnimatedProps(() => ({
    x: cx.value,
    y: cy.value,
    width: cw.value,
    height: ch.value,
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
        currentStep?.pulseTarget && currentStep?.kind === "interactive" ? 1 : 0,
    };
  });

  if (!isActive || !currentStep) return null;

  // Briefly bump the pulsing ring to signal "tap here, not there" when the
  // user taps outside the spotlight on an interactive step.
  const nudgeSpotlight = () => {
    pulseScale.value = withSequence(
      withTiming(1.18, { duration: 140, easing: Easing.out(Easing.quad) }),
      withSpring(1, { damping: 6, stiffness: 220 })
    );
  };

  // Gate the tooltip: while we're waiting for an active step's target to be
  // measured, don't render the tooltip at all (it would flash centered then
  // jump). We still render the dark overlay so the user sees that something
  // is happening. The tutorial-context has a timeout that auto-skips if the
  // measurement never arrives.
  const isWaitingForRect =
    !!currentStep.targetId && currentTargetRect == null;

  // Ghost layer: on interactive steps, absorb taps OUTSIDE the spotlight so
  // they don't leak to the underlying screen, and nudge the pulsing ring to
  // signal where to tap. Inside the spotlight rect we render nothing —
  // taps fall through to the actual button below the overlay.
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

  return (
    <Animated.View
      style={[StyleSheet.absoluteFill, styles.root]}
      pointerEvents="box-none"
      entering={FadeIn.duration(220)}
      exiting={FadeOut.duration(180)}
    >
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
        <Rect
          x={0}
          y={0}
          width={SCREEN_W}
          height={SCREEN_H}
          fill="#000000"
          opacity={0.78}
          mask="url(#tutorial-mask)"
        />
      </Svg>

      {/* Pulsing yellow ring around interactive targets */}
      <Animated.View pointerEvents="none" style={pulseStyle} />

      {/* Tap-capture for interactive `tap` steps. Sits inside the spotlight
          rect and drives BOTH the tutorial advance and (if registered) the
          underlying screen's action — so the tutorial never depends on the
          touch passing through the dim layer to the real button. */}
      {currentStep.kind === "interactive" &&
      currentStep.expectedAction === "tap" &&
      currentStep.targetId &&
      currentTargetRect ? (
        <Pressable
          onPress={() => {
            const stepTargetId = currentStep.targetId;
            if (!stepTargetId) return;
            invokeTargetAction(stepTargetId);
            notifyAction("tap", { targetId: stepTargetId });
          }}
          style={{
            position: "absolute",
            left: currentTargetRect.x - SPOTLIGHT_PADDING,
            top: currentTargetRect.y - SPOTLIGHT_PADDING,
            width: currentTargetRect.width + SPOTLIGHT_PADDING * 2,
            height: currentTargetRect.height + SPOTLIGHT_PADDING * 2,
            borderRadius: SPOTLIGHT_RADIUS,
          }}
        />
      ) : null}

      {/* Ghost interactive layer: 4 strips around the spotlight that swallow
          stray taps and nudge the pulsing ring. The spotlight rect itself is
          intentionally NOT covered, so taps there reach the underlying
          button (which forwards onPress via useTutorialTarget). */}
      {showGhostLayer ? (
        <>
          {/* top strip — full width above the spotlight */}
          <Pressable
            onPress={nudgeSpotlight}
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              width: SCREEN_W,
              height: Math.max(0, sy),
            }}
          />
          {/* bottom strip — full width below the spotlight */}
          <Pressable
            onPress={nudgeSpotlight}
            style={{
              position: "absolute",
              left: 0,
              top: sy + sh,
              width: SCREEN_W,
              height: Math.max(0, SCREEN_H - (sy + sh)),
            }}
          />
          {/* left strip — alongside the spotlight */}
          <Pressable
            onPress={nudgeSpotlight}
            style={{
              position: "absolute",
              left: 0,
              top: Math.max(0, sy),
              width: Math.max(0, sx),
              height: sh,
            }}
          />
          {/* right strip — alongside the spotlight */}
          <Pressable
            onPress={nudgeSpotlight}
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

      {/* Tooltip — keyed on step index so the FadeIn re-fires per step.
          Suppressed while we're waiting for the active target rect so it
          doesn't flash centered then jump to anchored position. */}
      {!isWaitingForRect ? (
        <TutorialTooltip
          key={`tutorial-step-${currentStepIndex}`}
          step={currentStep}
          targetRect={currentTargetRect}
          currentIndex={currentStepIndex}
          totalSteps={totalSteps}
          awaitingAction={awaitingAction}
          onAdvance={next}
          onSkip={skip}
        />
      ) : null}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: {
    zIndex: 10000,
    elevation: 1000,
  },
});
