import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Modal,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Platform,
  BackHandler,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { GestureDetector, Gesture } from "react-native-gesture-handler";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  runOnJS,
  interpolate,
  Extrapolate,
  FadeIn,
  FadeOut,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { IconX, IconChevronLeft, IconChevronRight } from "@tabler/icons-react-native";

import { ThemedView, ThemedText } from "@/components/ui";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/lib/theme";
import { spacing, borderRadius, shadow, transitions } from "@/constants/design-system";
import type { Notification } from "@/types";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.3;
const SWIPE_VELOCITY_THRESHOLD = 500;

export interface MessageModalProps {
  visible: boolean;
  onClose: () => void;
  messages: Notification[];
  onMarkAsRead?: (messageId: string) => void;
  onDontShowAgain?: (messageId: string) => void;
  onMarkAllAsRead?: () => void;
}

export function MessageModal({
  visible,
  onClose,
  messages,
  onMarkAsRead,
  onDontShowAgain,
  onMarkAllAsRead,
}: MessageModalProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  // Animated values for swipe gestures
  const translateX = useSharedValue(0);
  const opacity = useSharedValue(1);
  const scale = useSharedValue(1);

  // Track if gesture is active
  const isGestureActive = useSharedValue(false);

  // Filter out dismissed messages
  const activeMessages = messages.filter((msg) => !dismissed.has(msg.id));
  const currentMessage = activeMessages[currentIndex];
  const totalMessages = activeMessages.length;

  // Reset index when messages change
  useEffect(() => {
    if (currentIndex >= activeMessages.length && activeMessages.length > 0) {
      setCurrentIndex(activeMessages.length - 1);
    }
  }, [activeMessages.length, currentIndex]);

  // Handle Android back button
  useEffect(() => {
    if (Platform.OS === "android" && visible) {
      const backHandler = BackHandler.addEventListener("hardwareBackPress", () => {
        onClose();
        return true;
      });

      return () => backHandler.remove();
    }
  }, [visible, onClose]);

  // Reset state when modal opens
  useEffect(() => {
    if (visible) {
      setCurrentIndex(0);
      setDismissed(new Set());
      translateX.value = 0;
      opacity.value = 1;
      scale.value = 1;
    }
  }, [visible]);

  // Navigate to previous message
  const handlePrevious = useCallback(() => {
    if (currentIndex > 0) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setCurrentIndex((prev) => prev - 1);

      // Reset animation values
      translateX.value = withSpring(0, { damping: 20, stiffness: 150 });
      opacity.value = withSpring(1, { damping: 20, stiffness: 150 });
      scale.value = withSpring(1, { damping: 20, stiffness: 150 });
    }
  }, [currentIndex, translateX, opacity, scale]);

  // Navigate to next message
  const handleNext = useCallback(() => {
    if (currentIndex < totalMessages - 1) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setCurrentIndex((prev) => prev + 1);

      // Reset animation values
      translateX.value = withSpring(0, { damping: 20, stiffness: 150 });
      opacity.value = withSpring(1, { damping: 20, stiffness: 150 });
      scale.value = withSpring(1, { damping: 20, stiffness: 150 });
    }
  }, [currentIndex, totalMessages, translateX, opacity, scale]);

  // Mark current message as read
  const handleMarkAsRead = useCallback(() => {
    if (!currentMessage) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onMarkAsRead?.(currentMessage.id);

    // Dismiss the message from the list
    setDismissed((prev) => new Set(prev).add(currentMessage.id));

    // If this was the last message, close the modal
    if (totalMessages === 1) {
      setTimeout(() => {
        onClose();
      }, 300);
    } else if (currentIndex === totalMessages - 1) {
      // If we're at the last message, go to the previous one
      setCurrentIndex((prev) => Math.max(0, prev - 1));
    }
  }, [currentMessage, totalMessages, currentIndex, onMarkAsRead, onClose]);

  // Don't show this message again
  const handleDontShowAgain = useCallback(() => {
    if (!currentMessage) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onDontShowAgain?.(currentMessage.id);

    // Dismiss the message from the list
    setDismissed((prev) => new Set(prev).add(currentMessage.id));

    // If this was the last message, close the modal
    if (totalMessages === 1) {
      setTimeout(() => {
        onClose();
      }, 300);
    } else if (currentIndex === totalMessages - 1) {
      // If we're at the last message, go to the previous one
      setCurrentIndex((prev) => Math.max(0, prev - 1));
    }
  }, [currentMessage, totalMessages, currentIndex, onDontShowAgain, onClose]);

  // Mark all as read
  const handleMarkAllAsRead = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onMarkAllAsRead?.();
    onClose();
  }, [onMarkAllAsRead, onClose]);

  // Pan gesture for swipe navigation
  const panGesture = Gesture.Pan()
    .onStart(() => {
      "worklet";
      isGestureActive.value = true;
    })
    .onUpdate((event) => {
      "worklet";
      translateX.value = event.translationX;

      // Scale down slightly while swiping
      const progress = Math.abs(event.translationX) / SCREEN_WIDTH;
      scale.value = interpolate(progress, [0, 0.5], [1, 0.95], Extrapolate.CLAMP);

      // Fade out slightly while swiping
      opacity.value = interpolate(
        Math.abs(event.translationX),
        [0, SCREEN_WIDTH / 2],
        [1, 0.7],
        Extrapolate.CLAMP
      );
    })
    .onEnd((event) => {
      "worklet";
      isGestureActive.value = false;

      const shouldNavigate =
        Math.abs(event.translationX) > SWIPE_THRESHOLD ||
        Math.abs(event.velocityX) > SWIPE_VELOCITY_THRESHOLD;

      if (shouldNavigate) {
        // Swipe right = previous, swipe left = next
        if (event.translationX > 0) {
          runOnJS(handlePrevious)();
        } else {
          runOnJS(handleNext)();
        }
      } else {
        // Spring back to center
        translateX.value = withSpring(0, { damping: 20, stiffness: 150 });
        opacity.value = withSpring(1, { damping: 20, stiffness: 150 });
        scale.value = withSpring(1, { damping: 20, stiffness: 150 });
      }
    });

  // Animated styles
  const animatedCardStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: translateX.value }, { scale: scale.value }],
      opacity: opacity.value,
    };
  });

  if (!currentMessage) {
    return null;
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <Animated.View
        entering={FadeIn.duration(transitions.normal)}
        exiting={FadeOut.duration(transitions.normal)}
        style={styles.container}
      >
        {/* Backdrop */}
        <TouchableOpacity
          style={[styles.backdrop, { backgroundColor: `rgba(0, 0, 0, 0.6)` }]}
          activeOpacity={1}
          onPress={onClose}
        />

        {/* Modal Content */}
        <View
          style={[
            styles.contentContainer,
            {
              paddingTop: insets.top + spacing.md,
              paddingBottom: insets.bottom + spacing.md,
            },
          ]}
          pointerEvents="box-none"
        >
          {/* Close Button */}
          <View style={styles.headerContainer}>
            <TouchableOpacity
              style={[
                styles.closeButton,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                },
              ]}
              onPress={onClose}
              activeOpacity={0.7}
            >
              <IconX size={24} color={colors.foreground} />
            </TouchableOpacity>

            {totalMessages > 1 && (
              <View
                style={[
                  styles.counterBadge,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                  },
                ]}
              >
                <ThemedText style={styles.counterText}>
                  {currentIndex + 1} de {totalMessages}
                </ThemedText>
              </View>
            )}
          </View>

          {/* Message Card */}
          <GestureDetector gesture={panGesture}>
            <Animated.View
              style={[animatedCardStyle, { flex: 1 }]}
              pointerEvents="box-none"
            >
              <View
                style={[
                  styles.card,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                    ...shadow.lg,
                  },
                ]}
                pointerEvents="auto"
              >
                {/* Message Header */}
                <View style={styles.messageHeader}>
                  <ThemedText style={styles.messageTitle} numberOfLines={2}>
                    {currentMessage.title}
                  </ThemedText>
                  {currentMessage.sentAt && (
                    <ThemedText
                      style={[styles.messageDate, { color: colors.mutedForeground }]}
                    >
                      {new Date(currentMessage.sentAt).toLocaleDateString("pt-BR", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </ThemedText>
                  )}
                </View>

                {/* Message Body */}
                <ThemedView style={styles.messageBody}>
                  <ThemedText style={styles.messageText}>
                    {currentMessage.body}
                  </ThemedText>
                </ThemedView>

                {/* Actions */}
                <View style={styles.actionsContainer}>
                  <Button
                    variant="default"
                    size="default"
                    onPress={handleMarkAsRead}
                    style={styles.actionButton}
                  >
                    Marcar como lida
                  </Button>

                  <Button
                    variant="ghost"
                    size="default"
                    onPress={handleDontShowAgain}
                    style={styles.actionButton}
                  >
                    Não mostrar novamente
                  </Button>

                  {totalMessages > 1 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onPress={handleMarkAllAsRead}
                      style={[styles.actionButton, styles.markAllButton]}
                    >
                      Marcar todas como lidas
                    </Button>
                  )}
                </View>

                {/* Navigation Arrows (for larger screens) */}
                {totalMessages > 1 && (
                  <View style={styles.navigationContainer}>
                    <TouchableOpacity
                      style={[
                        styles.navButton,
                        currentIndex === 0 && styles.navButtonDisabled,
                        {
                          backgroundColor: colors.card,
                          borderColor: colors.border,
                        },
                      ]}
                      onPress={handlePrevious}
                      disabled={currentIndex === 0}
                      activeOpacity={0.7}
                    >
                      <IconChevronLeft
                        size={24}
                        color={
                          currentIndex === 0 ? colors.mutedForeground : colors.foreground
                        }
                      />
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.navButton,
                        currentIndex === totalMessages - 1 && styles.navButtonDisabled,
                        {
                          backgroundColor: colors.card,
                          borderColor: colors.border,
                        },
                      ]}
                      onPress={handleNext}
                      disabled={currentIndex === totalMessages - 1}
                      activeOpacity={0.7}
                    >
                      <IconChevronRight
                        size={24}
                        color={
                          currentIndex === totalMessages - 1
                            ? colors.mutedForeground
                            : colors.foreground
                        }
                      />
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </Animated.View>
          </GestureDetector>

          {/* Swipe Indicator */}
          {totalMessages > 1 && (
            <View style={styles.swipeIndicatorContainer}>
              <ThemedText
                style={[styles.swipeIndicator, { color: colors.mutedForeground }]}
              >
                Deslize para navegar entre mensagens
              </ThemedText>
            </View>
          )}
        </View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: spacing.md,
    justifyContent: "center",
  },
  headerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.md,
    paddingHorizontal: spacing.xs,
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.full,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    ...shadow.sm,
  },
  counterBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    ...shadow.sm,
  },
  counterText: {
    fontSize: 14,
    fontWeight: "600",
  },
  card: {
    flex: 1,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    padding: spacing.lg,
    maxHeight: "80%",
  },
  messageHeader: {
    marginBottom: spacing.md,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0, 0, 0, 0.1)",
  },
  messageTitle: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: spacing.xs,
    lineHeight: 32,
  },
  messageDate: {
    fontSize: 12,
    fontWeight: "500",
  },
  messageBody: {
    flex: 1,
    marginBottom: spacing.lg,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 24,
  },
  actionsContainer: {
    gap: spacing.sm,
  },
  actionButton: {
    width: "100%",
  },
  markAllButton: {
    marginTop: spacing.xs,
  },
  navigationContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: "rgba(0, 0, 0, 0.1)",
  },
  navButton: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.full,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    ...shadow.sm,
  },
  navButtonDisabled: {
    opacity: 0.4,
  },
  swipeIndicatorContainer: {
    alignItems: "center",
    marginTop: spacing.md,
  },
  swipeIndicator: {
    fontSize: 12,
    fontWeight: "500",
    textAlign: "center",
  },
});
