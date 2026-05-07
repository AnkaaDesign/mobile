import { View, Text, Pressable, StyleSheet, Dimensions } from "react-native";
import Animated, { FadeIn, FadeOut, SlideInDown, SlideOutDown } from "react-native-reanimated";
import {
  IconPlayerPlay,
  IconPlayerPause,
  IconChevronRight,
  IconChevronLeft,
  IconX,
  IconHandClick,
} from "@tabler/icons-react-native";
import type { TourStep, TourTargetRect } from "./types";

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get("window");
const TOOLTIP_WIDTH = Math.min(SCREEN_W - 32, 380);
const TOOLTIP_PADDING = 16;
const ARROW_SIZE = 8;

interface Props {
  step: TourStep;
  targetRect: TourTargetRect | null;
  currentIndex: number;
  totalSteps: number;
  playMode: "auto" | "manual";
  awaitingInteraction: boolean;
  onNext: () => void;
  onPrevious: () => void;
  onSkip: () => void;
  onTogglePlayMode: () => void;
}

function computeTooltipPosition(
  step: TourStep,
  rect: TourTargetRect | null
): { top: number; left: number; placement: "top" | "bottom" | "center" } {
  if (!rect || step.placement === "center") {
    return {
      top: SCREEN_H / 2 - 120,
      left: SCREEN_W / 2 - TOOLTIP_WIDTH / 2,
      placement: "center",
    };
  }
  const left = Math.max(
    16,
    Math.min(rect.x + rect.width / 2 - TOOLTIP_WIDTH / 2, SCREEN_W - TOOLTIP_WIDTH - 16)
  );
  if (step.placement === "top") {
    return {
      top: Math.max(48, rect.y - 220),
      left,
      placement: "top",
    };
  }
  // bottom (default)
  const desiredTop = rect.y + rect.height + ARROW_SIZE + 8;
  const overflow = desiredTop + 220 > SCREEN_H - 32;
  if (overflow) {
    return {
      top: Math.max(48, rect.y - 220),
      left,
      placement: "top",
    };
  }
  return { top: desiredTop, left, placement: "bottom" };
}

export function TourTooltip(props: Props) {
  const {
    step,
    targetRect,
    currentIndex,
    totalSteps,
    playMode,
    awaitingInteraction,
    onNext,
    onPrevious,
    onSkip,
    onTogglePlayMode,
  } = props;

  const pos = computeTooltipPosition(step, targetRect);
  const progress = `${currentIndex + 1} / ${totalSteps}`;

  return (
    <Animated.View
      entering={SlideInDown.duration(280).springify().damping(18)}
      exiting={SlideOutDown.duration(180)}
      style={[
        styles.tooltip,
        {
          width: TOOLTIP_WIDTH,
          top: pos.top,
          left: pos.left,
        },
      ]}
      pointerEvents="auto"
    >
      <View style={styles.header}>
        <Text style={styles.progress}>{progress}</Text>
        <Pressable onPress={onSkip} hitSlop={12} style={styles.closeBtn}>
          <IconX size={16} color="#FFFFFFAA" />
          <Text style={styles.closeText}>Pular</Text>
        </Pressable>
      </View>

      <Text style={styles.title}>{step.title}</Text>
      <Text style={styles.description}>{step.description}</Text>

      {step.mode === "interactive" && awaitingInteraction ? (
        <View style={styles.interactiveCta}>
          <IconHandClick size={18} color="#FCD34D" />
          <Text style={styles.interactiveCtaText}>
            {step.ctaLabel ?? "Toque no elemento destacado"}
          </Text>
        </View>
      ) : null}

      <View style={styles.controls}>
        <Pressable
          onPress={onPrevious}
          disabled={currentIndex === 0}
          style={[styles.iconBtn, currentIndex === 0 && styles.iconBtnDisabled]}
          hitSlop={8}
        >
          <IconChevronLeft size={18} color="#FFFFFF" />
        </Pressable>

        <Pressable onPress={onTogglePlayMode} style={styles.modeBtn} hitSlop={8}>
          {playMode === "auto" ? (
            <IconPlayerPause size={16} color="#FFFFFF" />
          ) : (
            <IconPlayerPlay size={16} color="#FFFFFF" />
          )}
          <Text style={styles.modeBtnText}>
            {playMode === "auto" ? "Automático" : "Manual"}
          </Text>
        </Pressable>

        <Pressable
          onPress={onNext}
          disabled={step.mode === "interactive" && awaitingInteraction}
          style={[
            styles.nextBtn,
            step.mode === "interactive" && awaitingInteraction && styles.iconBtnDisabled,
          ]}
          hitSlop={8}
        >
          <Text style={styles.nextText}>
            {currentIndex === totalSteps - 1 ? "Concluir" : "Próximo"}
          </Text>
          <IconChevronRight size={16} color="#FFFFFF" />
        </Pressable>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  tooltip: {
    position: "absolute",
    backgroundColor: "#0F172A",
    borderRadius: 16,
    padding: TOOLTIP_PADDING,
    shadowColor: "#000",
    shadowOpacity: 0.4,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 24,
    elevation: 12,
    borderWidth: 1,
    borderColor: "#1E293B",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
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
    marginBottom: 12,
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
    marginBottom: 12,
  },
  interactiveCtaText: {
    color: "#FCD34D",
    fontSize: 13,
    fontWeight: "600",
    flex: 1,
  },
  controls: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#1E293B",
    alignItems: "center",
    justifyContent: "center",
  },
  iconBtnDisabled: {
    opacity: 0.4,
  },
  modeBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "#1E293B",
    borderRadius: 999,
  },
  modeBtnText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
  },
  nextBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: "#2563EB",
    borderRadius: 999,
  },
  nextText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
});
