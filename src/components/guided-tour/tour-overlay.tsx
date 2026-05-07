import { useEffect } from "react";
import { Dimensions, StyleSheet, View, Pressable } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withTiming,
  Easing,
  FadeIn,
  FadeOut,
} from "react-native-reanimated";
import Svg, { Defs, Mask, Rect } from "react-native-svg";
import { useTour } from "./tour-context";
import { TourTooltip } from "./tour-tooltip";

const AnimatedRect = Animated.createAnimatedComponent(Rect);

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get("window");
const SPOTLIGHT_PADDING = 8;
const SPOTLIGHT_RADIUS = 12;

export function TourOverlay() {
  const tour = useTour();
  const {
    isActive,
    currentStep,
    currentTargetRect,
    currentStepIndex,
    totalSteps,
    playMode,
    awaitingInteraction,
    next,
    previous,
    skip,
    togglePlayMode,
    notifyInteraction,
  } = tour;

  const cx = useSharedValue(SCREEN_W / 2);
  const cy = useSharedValue(SCREEN_H / 2);
  const cw = useSharedValue(0);
  const ch = useSharedValue(0);

  useEffect(() => {
    if (!isActive || !currentStep) return;
    const t = currentTargetRect;
    const cfg = { duration: 280, easing: Easing.out(Easing.cubic) };
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

  const cutoutProps = useAnimatedProps(() => ({
    x: cx.value,
    y: cy.value,
    width: cw.value,
    height: ch.value,
  }));

  if (!isActive || !currentStep) return null;

  const handleSpotlightTap = () => {
    if (currentStep.mode === "interactive" && currentStep.targetId) {
      notifyInteraction(currentStep.targetId);
    }
  };

  return (
    <Animated.View
      style={StyleSheet.absoluteFill}
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
          <Mask id="tour-mask">
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
          opacity={0.72}
          mask="url(#tour-mask)"
        />
      </Svg>

      {/* Touch passthrough on the spotlight when interactive — let it tap the underlying element OR record interaction */}
      {currentTargetRect && currentStep.mode === "interactive" ? (
        <Pressable
          onPress={handleSpotlightTap}
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

      <TourTooltip
        step={currentStep}
        targetRect={currentTargetRect}
        currentIndex={currentStepIndex}
        totalSteps={totalSteps}
        playMode={playMode}
        awaitingInteraction={awaitingInteraction}
        onNext={next}
        onPrevious={previous}
        onSkip={skip}
        onTogglePlayMode={togglePlayMode}
      />
    </Animated.View>
  );
}
