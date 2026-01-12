import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Modal,
  StyleSheet,
  TouchableOpacity,
  Platform,
  BackHandler,
  ScrollView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { IconX, IconChevronLeft, IconChevronRight, IconEyeOff } from "@tabler/icons-react-native";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

import { ThemedView, ThemedText } from "@/components/ui";
import { Button } from "@/components/ui/button";
import { MessageBlockRenderer } from "@/components/ui/message-block-renderer";
import { useTheme } from "@/lib/theme";
import { spacing, borderRadius, shadow } from "@/constants/design-system";
import { transformMessageContent, hasRenderableContent } from "@/utils/message-transformer";
import type { Notification } from "@/types";

export interface MessageModalProps {
  visible: boolean;
  /** Called when user closes (X button or backdrop) - dismiss for today only */
  onClose: () => void;
  messages: Notification[];
  /** Called when user clicks "Não mostrar novamente" - permanent dismiss */
  onDontShowAgain?: (messageId: string) => void;
  /** Called when user closes a specific message (for daily dismiss tracking) */
  onDismissForToday?: (messageId: string) => void;
}

export function MessageModal({
  visible,
  onClose,
  messages,
  onDontShowAgain,
  onDismissForToday,
}: MessageModalProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  // Filter out dismissed messages
  const activeMessages = messages.filter((msg) => !dismissed.has(msg.id));
  const currentMessage = activeMessages[currentIndex];
  const totalMessages = activeMessages.length;
  const hasMultipleMessages = totalMessages > 1;
  const isFirstMessage = currentIndex === 0;
  const isLastMessage = currentIndex === totalMessages - 1;

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
        handleClose();
        return true;
      });

      return () => backHandler.remove();
    }
  }, [visible]);

  // Reset state when modal opens
  useEffect(() => {
    if (visible) {
      setCurrentIndex(0);
      setDismissed(new Set());
    }
  }, [visible]);

  // Navigate to previous message
  const handlePrevious = useCallback(() => {
    if (!isFirstMessage) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setCurrentIndex((prev) => prev - 1);
    }
  }, [isFirstMessage]);

  // Navigate to next message
  const handleNext = useCallback(() => {
    if (!isLastMessage) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setCurrentIndex((prev) => prev + 1);
    }
  }, [isLastMessage]);

  // Close - dismiss for today only
  const handleClose = useCallback(() => {
    if (currentMessage) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onDismissForToday?.(currentMessage.id);
    }
    onClose();
  }, [currentMessage, onClose, onDismissForToday]);

  // Don't show this message again (permanent)
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
    } else if (isLastMessage) {
      // If we're at the last message, go to the previous one
      setCurrentIndex((prev) => Math.max(0, prev - 1));
    }
    // Otherwise stay at current index (next message will slide in)
  }, [currentMessage, totalMessages, isLastMessage, onDontShowAgain, onClose]);

  // Format date
  const formatDate = (date: Date | string | null | undefined) => {
    if (!date) return "";
    const dateObj = typeof date === "string" ? new Date(date) : date;
    return formatDistanceToNow(dateObj, { addSuffix: true, locale: ptBR });
  };

  if (!currentMessage) {
    return null;
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={handleClose}
    >
      <View style={styles.container}>
        {/* Backdrop */}
        <TouchableOpacity
          style={[styles.backdrop, { backgroundColor: "rgba(0, 0, 0, 0.6)" }]}
          activeOpacity={1}
          onPress={handleClose}
        />

        {/* Modal Content */}
        <View
          style={[
            styles.contentContainer,
            {
              paddingTop: insets.top + spacing.lg,
              paddingBottom: insets.bottom + spacing.lg,
            },
          ]}
          pointerEvents="box-none"
        >
          <Animated.View
            entering={FadeIn.duration(200)}
            exiting={FadeOut.duration(150)}
            style={[
              styles.card,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                ...shadow.lg,
              },
            ]}
          >
            {/* Header */}
            <View style={[styles.header, { borderBottomColor: colors.border }]}>
              <View style={styles.headerContent}>
                <ThemedText style={styles.title} numberOfLines={2}>
                  {currentMessage.title}
                </ThemedText>
                {currentMessage.sentAt && (
                  <ThemedText style={[styles.date, { color: colors.mutedForeground }]}>
                    {formatDate(currentMessage.sentAt)}
                  </ThemedText>
                )}
              </View>

              {/* Close Button */}
              <TouchableOpacity
                style={[styles.closeButton, { backgroundColor: colors.muted }]}
                onPress={handleClose}
                activeOpacity={0.7}
              >
                <IconX size={20} color={colors.foreground} />
              </TouchableOpacity>
            </View>

            {/* Progress indicator for multiple messages */}
            {hasMultipleMessages && (
              <View style={styles.progressContainer}>
                <View style={[styles.progressBar, { backgroundColor: colors.muted }]}>
                  <View
                    style={[
                      styles.progressFill,
                      {
                        backgroundColor: colors.primary,
                        width: `${((currentIndex + 1) / totalMessages) * 100}%`,
                      },
                    ]}
                  />
                </View>
                <ThemedText style={[styles.progressText, { color: colors.mutedForeground }]}>
                  {currentIndex + 1} de {totalMessages}
                </ThemedText>
              </View>
            )}

            {/* Message Body */}
            <ScrollView
              style={styles.body}
              contentContainerStyle={styles.bodyContent}
              showsVerticalScrollIndicator={true}
            >
              {/* Render structured content blocks if available */}
              {hasRenderableContent((currentMessage as any).content) ? (
                <MessageBlockRenderer
                  blocks={transformMessageContent((currentMessage as any).content)}
                />
              ) : currentMessage.body ? (
                <ThemedText style={styles.bodyText}>
                  {currentMessage.body}
                </ThemedText>
              ) : null}
            </ScrollView>

            {/* Footer */}
            <View style={[styles.footer, { borderTopColor: colors.border }]}>
              {/* Navigation buttons */}
              {hasMultipleMessages && (
                <View style={styles.navigationContainer}>
                  <Button
                    variant="outline"
                    size="sm"
                    onPress={handlePrevious}
                    disabled={isFirstMessage}
                    icon={<IconChevronLeft size={16} color={isFirstMessage ? colors.mutedForeground : colors.foreground} />}
                  >
                    Anterior
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onPress={handleNext}
                    disabled={isLastMessage}
                    iconPosition="right"
                    icon={<IconChevronRight size={16} color={isLastMessage ? colors.mutedForeground : colors.foreground} />}
                  >
                    Próxima
                  </Button>
                </View>
              )}

              {/* Don't show again button */}
              <Button
                variant="outline"
                size="default"
                onPress={handleDontShowAgain}
                style={styles.dontShowButton}
                icon={<IconEyeOff size={18} color={colors.foreground} />}
              >
                Não mostrar novamente
              </Button>
            </View>
          </Animated.View>
        </View>
      </View>
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
  card: {
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    maxHeight: "85%",
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    gap: spacing.md,
  },
  headerContent: {
    flex: 1,
    gap: spacing.xs,
  },
  title: {
    fontSize: 20,
    fontWeight: "600",
    lineHeight: 26,
  },
  date: {
    fontSize: 12,
    fontWeight: "500",
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.full,
    justifyContent: "center",
    alignItems: "center",
  },
  progressContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  progressBar: {
    flex: 1,
    height: 4,
    borderRadius: borderRadius.full,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: borderRadius.full,
  },
  progressText: {
    fontSize: 12,
    fontWeight: "500",
  },
  body: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  bodyContent: {
    paddingVertical: spacing.md,
  },
  bodyText: {
    fontSize: 16,
    lineHeight: 24,
  },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    gap: spacing.sm,
  },
  navigationContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  dontShowButton: {
    width: "100%",
  },
});
