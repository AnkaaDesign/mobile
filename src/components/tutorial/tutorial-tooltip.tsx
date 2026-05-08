import { useEffect } from "react";
import { View, Text, Pressable, StyleSheet, Dimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, {
  FadeIn,
  FadeOut,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from "react-native-reanimated";
import {
  IconChevronRight,
  IconX,
  IconHandClick,
  IconConfetti,
} from "@tabler/icons-react-native";
import type { TutorialStep, TutorialTargetRect } from "./types";

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get("window");
const TOOLTIP_WIDTH = Math.min(SCREEN_W - 32, 380);
const TOOLTIP_PADDING = 16;
const ARROW_GAP = 12;
const TOOLTIP_ESTIMATED_HEIGHT = 240;

interface Props {
  step: TutorialStep;
  targetRect: TutorialTargetRect | null;
  currentIndex: number;
  totalSteps: number;
  awaitingAction: boolean;
  onAdvance: () => void;
  onSkip: () => void;
}

function computeAnchoredPosition(
  step: TutorialStep,
  rect: TutorialTargetRect,
  topInset: number,
  bottomInset: number
): { top: number; left: number } {
  const left = Math.max(
    16,
    Math.min(
      rect.x + rect.width / 2 - TOOLTIP_WIDTH / 2,
      SCREEN_W - TOOLTIP_WIDTH - 16
    )
  );

  const minTop = topInset + 16;
  const maxTop = SCREEN_H - bottomInset - TOOLTIP_ESTIMATED_HEIGHT - 16;

  if (step.placement === "top") {
    return {
      top: Math.max(minTop, Math.min(rect.y - TOOLTIP_ESTIMATED_HEIGHT - ARROW_GAP, maxTop)),
      left,
    };
  }

  // bottom (default)
  const desiredTop = rect.y + rect.height + ARROW_GAP;
  const overflow = desiredTop + TOOLTIP_ESTIMATED_HEIGHT > SCREEN_H - bottomInset - 16;
  if (overflow) {
    return {
      top: Math.max(minTop, Math.min(rect.y - TOOLTIP_ESTIMATED_HEIGHT - ARROW_GAP, maxTop)),
      left,
    };
  }
  return { top: Math.min(desiredTop, maxTop), left };
}

export function TutorialTooltip(props: Props) {
  const { step, targetRect, currentIndex, totalSteps, awaitingAction, onAdvance, onSkip } = props;

  const insets = useSafeAreaInsets();
  const isCentered = !targetRect || step.placement === "center";
  const anchoredPos = !isCentered && targetRect
    ? computeAnchoredPosition(step, targetRect, insets.top, insets.bottom)
    : null;
  const progressLabel = `${currentIndex + 1} / ${totalSteps}`;

  // Subtle pulse on the "advance" button when not awaiting an interactive action.
  const pulse = useSharedValue(1);
  useEffect(() => {
    if (step.kind !== "interactive") {
      pulse.value = withRepeat(
        withSequence(
          withTiming(1.04, { duration: 700, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 700, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      );
    } else {
      pulse.value = 1;
    }
  }, [step.kind, pulse]);

  const advanceStyle = useAnimatedStyle(() => ({ transform: [{ scale: pulse.value }] }));

  const showAdvanceBtn = step.kind !== "interactive" || !awaitingAction;
  const advanceLabel =
    step.ctaLabel ?? (currentIndex === totalSteps - 1 ? "Concluir" : "Continuar");

  // Single, stable wrapper for both centered and anchored placements: a flex
  // container that fills the screen. Centered cards rely on flex centering;
  // anchored cards stack-position the inner Animated.View via inline style.
  // Keeping the same wrapper identity prevents the Animated.View from being
  // unmounted/remounted on rect updates, which is what caused the bouncing.
  const cardStyle = isCentered
    ? null
    : anchoredPos
    ? { position: "absolute" as const, top: anchoredPos.top, left: anchoredPos.left }
    : null;

  return (
    <View
      pointerEvents="box-none"
      style={[
        StyleSheet.absoluteFill,
        isCentered && styles.centerWrap,
        isCentered && {
          paddingTop: insets.top + 24,
          paddingBottom: insets.bottom + 24,
        },
      ]}
    >
      <Animated.View
        entering={FadeIn.duration(220)}
        exiting={FadeOut.duration(160)}
        style={[
          styles.tooltip,
          { width: TOOLTIP_WIDTH },
          step.celebrate && styles.tooltipCelebrate,
          cardStyle,
        ]}
        pointerEvents="auto"
      >
        <View style={styles.header}>
          <View style={styles.progressWrap}>
            <Text style={styles.progress}>{progressLabel}</Text>
            {step.celebrate ? <IconConfetti size={14} color="#FCD34D" /> : null}
          </View>
          <Pressable onPress={onSkip} hitSlop={12} style={styles.closeBtn}>
            <IconX size={14} color="#FFFFFFAA" />
            <Text style={styles.closeText}>Pular</Text>
          </Pressable>
        </View>

        <Text style={styles.title}>{step.title}</Text>
        <Text style={styles.description}>{step.description}</Text>

        {step.kind === "interactive" && awaitingAction ? (
          <Animated.View
            entering={FadeIn.duration(200)}
            exiting={FadeOut.duration(120)}
            style={styles.interactiveCta}
          >
            <IconHandClick size={18} color="#FCD34D" />
            <Text style={styles.interactiveCtaText}>
              {step.hint ?? step.ctaLabel ?? "Toque no elemento destacado"}
            </Text>
          </Animated.View>
        ) : null}

        {showAdvanceBtn ? (
          <Animated.View style={advanceStyle}>
            <Pressable onPress={onAdvance} style={styles.advanceBtn}>
              <Text style={styles.advanceText}>{advanceLabel}</Text>
              <IconChevronRight size={16} color="#FFFFFF" />
            </Pressable>
          </Animated.View>
        ) : null}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  centerWrap: {
    justifyContent: "center",
    alignItems: "center",
  },
  tooltip: {
    backgroundColor: "#0F172A",
    borderRadius: 16,
    padding: TOOLTIP_PADDING,
    shadowColor: "#000",
    shadowOpacity: 0.5,
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 28,
    elevation: 16,
    borderWidth: 1,
    borderColor: "#1E293B",
  },
  tooltipCelebrate: {
    borderColor: "#FCD34D",
    backgroundColor: "#1E1B4B",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  progressWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  progress: {
    color: "#94A3B8",
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0.5,
  },
  closeBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  closeText: {
    color: "#FFFFFFAA",
    fontSize: 12,
    fontWeight: "500",
  },
  title: {
    color: "#F8FAFC",
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 6,
  },
  description: {
    color: "#CBD5E1",
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 14,
  },
  interactiveCta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#422006",
    borderColor: "#FCD34D55",
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
  },
  interactiveCtaText: {
    color: "#FCD34D",
    fontSize: 13,
    fontWeight: "600",
    flex: 1,
  },
  advanceBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingHorizontal: 18,
    paddingVertical: 12,
    backgroundColor: "#2563EB",
    borderRadius: 999,
    alignSelf: "stretch",
  },
  advanceText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
});
