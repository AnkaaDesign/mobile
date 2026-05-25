/**
 * Spotlight cutout — adapted from v4 tutorial-overlay.tsx.
 *
 * 4 dim rects + 1 cover view with cross-fade opacity. Coordinates jump
 * (duration 0) so the spotlight never appears to slide between steps; only
 * the cover opacity tweens. Reads activeTargetRect + currentStep from the
 * v5 store; no router, no preconditions, no screen-ready signal.
 */
import { useEffect } from "react";
import {
  Pressable,
  StyleSheet,
  useWindowDimensions,
  View,
} from "react-native";
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { useTutorialStore } from "../engine-store";
import { useTutorial } from "../provider";
import { TUTORIAL_TIMINGS } from "../engine-types";

const SPOTLIGHT_PADDING = 8;
const SPOTLIGHT_RADIUS = 14;
/**
 * Two dim levels:
 *   - When a slot is highlighted, the dim is heavy (0.65) so the spotlight
 *     pops against a dark frame.
 *   - When the step has no highlight (narration / center tooltip), we want
 *     the user to clearly see the fake scene underneath. Use a much lighter
 *     scrim (0.35) so the screen reads as "subdued, not blacked out".
 */
const DIM_HEAVY = "rgba(0, 0, 0, 0.65)";
const DIM_LIGHT = "rgba(0, 0, 0, 0.35)";
const PULSE_COLOR = "#FCD34D";

export function TutorialSpotlight() {
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const rect = useTutorialStore((s) => s.activeTargetRect);
  const currentStep = useTutorialStore(
    (s) => s.steps[s.currentStepIndex] ?? null,
  );
  const interactiveStuck = useTutorialStore((s) => s.interactiveStuck);
  const { next, notifyAction } = useTutorial();

  const cx = useSharedValue(0);
  const cy = useSharedValue(0);
  const cw = useSharedValue(0);
  const ch = useSharedValue(0);
  const cutoutOpacity = useSharedValue(0);
  const pulseScale = useSharedValue(1);

  const hasHighlight = !!currentStep?.highlight;
  const mode: "spotlight" | "centered" | "hidden" = !currentStep
    ? "hidden"
    : currentStep.placement === "center"
      ? "centered"
      : rect && hasHighlight
        ? "spotlight"
        : "centered";

  // Heavy dim only when there's a spotlight to frame against. Centered
  // narration steps get a light scrim so the fake scene stays legible.
  // Declared before useAnimatedStyle so the worklet closure can see it.
  const dimColor = mode === "spotlight" ? DIM_HEAVY : DIM_LIGHT;

  useEffect(() => {
    cancelAnimation(cutoutOpacity);
    if (rect && hasHighlight) {
      cx.value = withTiming(rect.x - SPOTLIGHT_PADDING, { duration: 0 });
      cy.value = withTiming(rect.y - SPOTLIGHT_PADDING, { duration: 0 });
      cw.value = withTiming(rect.width + SPOTLIGHT_PADDING * 2, { duration: 0 });
      ch.value = withTiming(rect.height + SPOTLIGHT_PADDING * 2, { duration: 0 });
      cutoutOpacity.value = withTiming(1, {
        duration: TUTORIAL_TIMINGS.SPOTLIGHT_FADE_IN_MS,
        easing: Easing.out(Easing.cubic),
      });
    } else {
      cutoutOpacity.value = withTiming(0, {
        duration: TUTORIAL_TIMINGS.SPOTLIGHT_FADE_OUT_MS,
        easing: Easing.out(Easing.cubic),
      });
      cx.value = 0;
      cy.value = 0;
      cw.value = 0;
      ch.value = 0;
    }
  }, [rect, hasHighlight, cx, cy, cw, ch, cutoutOpacity]);

  const pulseActive = !!currentStep?.pulseTarget && mode === "spotlight";
  useEffect(() => {
    cancelAnimation(pulseScale);
    if (pulseActive) {
      pulseScale.value = withRepeat(
        withSequence(
          withTiming(1.08, { duration: 700, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 700, easing: Easing.inOut(Easing.ease) }),
        ),
        -1,
        true,
      );
    } else {
      pulseScale.value = withTiming(1, { duration: 180 });
    }
  }, [pulseActive, pulseScale]);

  const topStyle = useAnimatedStyle(() => ({
    position: "absolute" as const,
    left: 0,
    top: 0,
    width: windowWidth,
    height: Math.max(0, cy.value),
  }));
  const bottomStyle = useAnimatedStyle(() => ({
    position: "absolute" as const,
    left: 0,
    top: Math.max(0, cy.value + ch.value),
    width: windowWidth,
    height: Math.max(0, windowHeight - (cy.value + ch.value)),
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
    width: Math.max(0, windowWidth - (cx.value + cw.value)),
    height: Math.max(0, ch.value),
  }));
  // Reanimated worklets run on the UI thread and cannot read JS closure
  // strings reliably across Hermes versions. Apply backgroundColor outside
  // the worklet via a static style.
  const coverStyle = useAnimatedStyle(() => ({
    position: "absolute" as const,
    left: cx.value,
    top: cy.value,
    width: cw.value,
    height: ch.value,
    opacity: 1 - cutoutOpacity.value,
  }));
  const pulseStyle = useAnimatedStyle(() => ({
    position: "absolute" as const,
    left: cx.value,
    top: cy.value,
    width: cw.value,
    height: cw.value > 0 ? ch.value : 0,
    borderRadius: SPOTLIGHT_RADIUS,
    borderWidth: 3,
    borderColor: PULSE_COLOR,
    transform: [{ scale: pulseScale.value }],
    opacity: pulseActive ? cutoutOpacity.value : 0,
  }));

  if (!currentStep) return null;

  // A highlight that fills most of the screen is a whole list / form / page
  // overview (e.g. "Incluir Ponto", the histórico list). Dimming only a thin
  // border around it looks wrong and hides the very content being described,
  // so we skip the dim for these. Explicit `dimBackground: false` still wins.
  const isFullPageTarget =
    !!rect &&
    rect.height >= windowHeight * 0.6 &&
    rect.width >= windowWidth * 0.9;
  const dimEnabled = currentStep.dimBackground !== false && !isFullPageTarget;
  const isInteractive = currentStep.kind === "interactive";
  const showSpotlightTap = isInteractive && mode === "spotlight";

  const handleSpotlightTap = () => {
    notifyAction("tap");
  };

  const sx = rect ? rect.x - SPOTLIGHT_PADDING : 0;
  const sy = rect ? rect.y - SPOTLIGHT_PADDING : 0;
  const sw = rect ? rect.width + SPOTLIGHT_PADDING * 2 : 0;
  const sh = rect ? rect.height + SPOTLIGHT_PADDING * 2 : 0;

  return (
    <View
      pointerEvents="box-none"
      style={[StyleSheet.absoluteFill, styles.root]}
    >
      {dimEnabled ? (
        <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={
              isInteractive && interactiveStuck ? () => next() : undefined
            }
          >
            <Animated.View style={[topStyle, { backgroundColor: dimColor }]} />
            <Animated.View style={[bottomStyle, { backgroundColor: dimColor }]} />
            <Animated.View style={[leftStyle, { backgroundColor: dimColor }]} />
            <Animated.View style={[rightStyle, { backgroundColor: dimColor }]} />
            <Animated.View
              style={[
                coverStyle,
                {
                  backgroundColor: dimColor,
                  borderRadius: SPOTLIGHT_RADIUS,
                },
              ]}
            />
          </Pressable>
        </View>
      ) : null}

      <Animated.View pointerEvents="none" style={pulseStyle} />

      {showSpotlightTap ? (
        <Pressable
          onPress={handleSpotlightTap}
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
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    zIndex: 10000,
    elevation: 1000,
  },
});
