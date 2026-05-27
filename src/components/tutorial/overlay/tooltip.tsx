/**
 * Tooltip — adapted from v4 tutorial-tooltip.tsx for fake-pages engine.
 *
 * Same positioning algorithm (above/below/center, safe-area aware, onLayout
 * measured height). Reads from v5 store.
 */
import { useEffect, useState } from "react";
import {
  Alert,
  Dimensions,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import {
  IconChevronRight,
  IconConfetti,
  IconHandClick,
  IconX,
} from "@tabler/icons-react-native";
import { useTutorialStore } from "../engine-store";
import { useTutorial } from "../provider";
import type { TutorialStep, TutorialTargetRect } from "../engine-types";

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get("window");
const TOOLTIP_WIDTH = Math.min(SCREEN_W - 32, 380);
const TOOLTIP_PADDING = 16;
const ARROW_GAP = 12;
const DEFAULT_TOOLTIP_HEIGHT = 240;

function computeAnchoredPosition(
  step: TutorialStep,
  rect: TutorialTargetRect,
  measuredHeight: number,
  topInset: number,
  bottomInset: number,
): { top: number; left: number } {
  const left = Math.max(
    16,
    Math.min(
      rect.x + rect.width / 2 - TOOLTIP_WIDTH / 2,
      SCREEN_W - TOOLTIP_WIDTH - 16,
    ),
  );
  const minTop = topInset + 16;
  const maxTop = SCREEN_H - bottomInset - measuredHeight - 16;

  if (step.placement === "top") {
    const desiredTop = rect.y - measuredHeight - ARROW_GAP;
    if (desiredTop < minTop) {
      const fallbackTop = rect.y + rect.height + ARROW_GAP;
      return { top: Math.min(fallbackTop, maxTop), left };
    }
    return { top: Math.min(desiredTop, maxTop), left };
  }

  const desiredTop = rect.y + rect.height + ARROW_GAP;
  const overflow = desiredTop + measuredHeight > SCREEN_H - bottomInset - 16;
  if (overflow) {
    const fallbackTop = rect.y - measuredHeight - ARROW_GAP;
    if (fallbackTop >= minTop) return { top: fallbackTop, left };
    return { top: Math.min(desiredTop, maxTop), left };
  }
  return { top: Math.min(desiredTop, maxTop), left };
}

export function TutorialTooltip() {
  const rect = useTutorialStore((s) => s.activeTargetRect);
  const step = useTutorialStore((s) => s.steps[s.currentStepIndex] ?? null);
  const currentIndex = useTutorialStore((s) => s.currentStepIndex);
  const totalSteps = useTutorialStore((s) => s.steps.length);
  const awaitingAction = useTutorialStore((s) => s.awaitingAction);
  const { skip, notifyAction } = useTutorial();
  const insets = useSafeAreaInsets();

  const [measuredHeight, setMeasuredHeight] = useState(DEFAULT_TOOLTIP_HEIGHT);

  const pulse = useSharedValue(1);
  useEffect(() => {
    if (step?.kind !== "interactive") {
      pulse.value = withRepeat(
        withSequence(
          withTiming(1.04, { duration: 700, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 700, easing: Easing.inOut(Easing.ease) }),
        ),
        -1,
        true,
      );
    } else {
      pulse.value = 1;
    }
  }, [step?.kind, pulse]);
  const advanceStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
  }));

  if (!step) return null;

  const hasHighlight = !!step.highlight;
  const mode: "spotlight" | "centered" =
    step.placement === "center"
      ? "centered"
      : rect && hasHighlight
        ? "spotlight"
        : "centered";

  const pinToTop = !!step.tooltipPinToScreenTop;
  const pinToBottom = !!step.tooltipPinToScreenBottom;
  const isCentered = mode === "centered" || pinToTop || pinToBottom || !rect;
  const isPanelContext = step.dimBackground === false || pinToTop;

  // Vertical alignment for full-screen (non-anchored) tooltips. Rule: whenever
  // the tooltip is NOT anchored next to a specific component, it sits at the
  // bottom of the screen — never floating in the center. Only steps that
  // explicitly ask for the top (placement "top" or pinned) anchor to the top;
  // `tooltipPinToScreenBottom` always lands at the bottom regardless of the
  // (now-detached) anchor rect.
  const centeredWrapStyle =
    !pinToBottom && (pinToTop || step.placement === "top")
      ? styles.topWrap
      : styles.bottomWrap;
  const anchoredPos =
    !isCentered && rect
      ? computeAnchoredPosition(
          step,
          rect,
          measuredHeight,
          insets.top,
          insets.bottom,
        )
      : null;

  const isInteractive = step.kind === "interactive";
  const showContinue = !isInteractive;
  const continueLabel =
    step.ctaLabel ??
    (currentIndex === totalSteps - 1 ? "Concluir" : "Continuar");

  const handleSkip = () => {
    Alert.alert(
      "Pular tutorial",
      "Tem certeza que deseja pular o tutorial?",
      [
        { text: "Cancelar", style: "cancel" },
        { text: "Pular", style: "destructive", onPress: () => void skip() },
      ],
    );
  };

  const cardStyle = isCentered
    ? null
    : anchoredPos
      ? {
          position: "absolute" as const,
          top: anchoredPos.top,
          left: anchoredPos.left,
        }
      : null;

  const offsetStyle = step.tooltipOffsetY
    ? { transform: [{ translateY: step.tooltipOffsetY }] }
    : null;

  return (
    <View
      pointerEvents="box-none"
      style={[
        StyleSheet.absoluteFill,
        styles.layer,
        isCentered && centeredWrapStyle,
        isCentered && {
          paddingTop: insets.top + 24,
          paddingBottom: insets.bottom + 24,
          paddingHorizontal: 16,
        },
      ]}
    >
      <Animated.View
        onLayout={(e) => {
          const h = e.nativeEvent.layout.height;
          if (h > 0 && Math.abs(h - measuredHeight) > 1) {
            setMeasuredHeight(h);
          }
        }}
        style={[
          styles.tooltip,
          { width: TOOLTIP_WIDTH },
          step.celebrate && styles.tooltipCelebrate,
          cardStyle,
          offsetStyle,
        ]}
        pointerEvents="auto"
      >
        <View style={styles.header}>
          <View style={styles.progressWrap}>
            <Text style={styles.progress}>
              {currentIndex + 1} / {totalSteps}
            </Text>
            {step.celebrate ? <IconConfetti size={14} color="#FCD34D" /> : null}
          </View>
          <Pressable onPress={handleSkip} hitSlop={12} style={styles.closeBtn}>
            <IconX size={14} color="#FFFFFFAA" />
            <Text style={styles.closeText}>Pular tutorial</Text>
          </Pressable>
        </View>

        <Text style={styles.title}>{step.title}</Text>
        <Text style={styles.description}>{step.description}</Text>

        {step.hint ? <Text style={styles.hint}>{step.hint}</Text> : null}

        {isInteractive && awaitingAction ? (
          <View style={styles.interactiveCta}>
            <IconHandClick size={18} color="#FCD34D" />
            <Text style={styles.interactiveCtaText}>
              {step.ctaLabel ?? "Toque no elemento destacado"}
            </Text>
          </View>
        ) : null}

        {showContinue ? (
          <Animated.View style={advanceStyle}>
            <Pressable
              onPress={() => notifyAction("continue")}
              style={styles.advanceBtn}
            >
              <Text style={styles.advanceText}>{continueLabel}</Text>
              <IconChevronRight size={16} color="#FFFFFF" />
            </Pressable>
          </Animated.View>
        ) : null}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  // Tutorial stage layering (must stay consistent across overlays):
  //   spotlight dim … zIndex 10000 / elevation 1000
  //   tooltip card  … zIndex 10001 / elevation 1001  ← always above the dim
  //   dev picker    … zIndex 20000 / elevation 2000
  // Without this, the spotlight's full-screen scrim renders on top of the
  // tooltip (zIndex/elevation beat JSX order in RN), dimming the card and
  // swallowing taps on the Continue button — see welcome step regression.
  layer: { zIndex: 10001, elevation: 1001 },
  centerWrap: { justifyContent: "center", alignItems: "center" },
  topWrap: { justifyContent: "flex-start", alignItems: "center" },
  bottomWrap: { justifyContent: "flex-end", alignItems: "center" },
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
  tooltipCelebrate: { borderColor: "#FCD34D", backgroundColor: "#1E1B4B" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  progressWrap: { flexDirection: "row", alignItems: "center", gap: 6 },
  progress: { color: "#94A3B8", fontSize: 12, fontWeight: "600", letterSpacing: 0.5 },
  closeBtn: { flexDirection: "row", alignItems: "center", gap: 4 },
  closeText: { color: "#FFFFFFAA", fontSize: 12, fontWeight: "500" },
  title: { color: "#F8FAFC", fontSize: 18, fontWeight: "700", marginBottom: 6 },
  description: { color: "#CBD5E1", fontSize: 14, lineHeight: 20, marginBottom: 10 },
  hint: { color: "#94A3B8", fontSize: 12, fontStyle: "italic", lineHeight: 17, marginBottom: 12 },
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
    marginBottom: 4,
  },
  interactiveCtaText: { color: "#FCD34D", fontSize: 13, fontWeight: "600", flex: 1 },
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
    marginTop: 6,
  },
  advanceText: { color: "#FFFFFF", fontSize: 15, fontWeight: "700" },
});
