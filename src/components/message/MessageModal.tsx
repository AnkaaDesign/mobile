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
import { transformMessageContent, extractPlainTextFromContent } from "@/utils/message-transformer";
import type { Notification } from "@/types";
import { useOptionalTutorial } from "@/components/tutorial";

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
  // When the tutorial is running, render an in-modal banner that tells the
  // user to close the modal before continuing. RN `<Modal>` lives in a
  // separate native window above all React-rendered siblings — the root
  // TutorialOverlay can't reach it via zIndex/elevation, so the next
  // tutorial step (the back-button spotlight) is invisible until the user
  // closes the modal. The banner is the only way to surface that hint
  // while the modal is in front.
  const tutorial = useOptionalTutorial();
  const showTutorialBanner = !!tutorial?.isActive && visible;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  // Filter out dismissed messages (with safety check for undefined)
  const activeMessages = (messages || []).filter((msg) => !dismissed.has(msg.id));
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

  // Close - just close the modal, don't dismiss the message
  // Message will show again on next app focus
  const handleClose = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onClose();
  }, [onClose]);

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

  // Get content and transform blocks like web does (direct approach)
  const messageContent = (currentMessage as any).content;
  const transformedBlocks = transformMessageContent(messageContent);

  // Fallback text extraction for when blocks are empty
  const fallbackText = transformedBlocks.length === 0 && !currentMessage.body
    ? extractPlainTextFromContent(messageContent)
    : null;

  // If the last block is a decorator, pin it to the bottom of the scroll area
  const lastBlock = transformedBlocks[transformedBlocks.length - 1];
  const hasFooterDecorator = lastBlock?.type === "decorator";
  const mainBlocks = hasFooterDecorator
    ? transformedBlocks.slice(0, -1)
    : transformedBlocks;

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

        {/* Tutorial banner — only rendered while the tutorial is active.
            Sits at the BOTTOM of the native modal window (top is where
            the X close button lives — we don't want to occlude it). The
            banner instructs the user to close the modal before
            proceeding (the next tutorial step's spotlight is on the
            Voltar button, which lives BEHIND this modal). */}
        {showTutorialBanner && (
          <View
            pointerEvents="none"
            style={{
              position: "absolute",
              bottom: insets.bottom + 12,
              left: 16,
              right: 16,
              backgroundColor: "#7C2D12",
              borderWidth: 2,
              borderColor: "#FCD34D",
              borderRadius: 12,
              paddingHorizontal: 16,
              paddingVertical: 12,
              zIndex: 1,
            }}
          >
            <ThemedText style={{ color: "#FFF7ED", fontWeight: "700", fontSize: 14, marginBottom: 4 }}>
              Tutorial em andamento
            </ThemedText>
            <ThemedText style={{ color: "#FFF7ED", fontSize: 13, lineHeight: 18 }}>
              Leia o comunicado e toque no X (canto superior direito) para fechar este modal antes de continuar com o tutorial. O próximo passo destaca o botão Voltar — que fica atrás deste modal enquanto ele estiver aberto.
            </ThemedText>
          </View>
        )}

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
                {((currentMessage as any).publishedAt || currentMessage.sentAt) && (
                  <ThemedText style={[styles.date, { color: colors.mutedForeground }]}>
                    {formatDate((currentMessage as any).publishedAt || currentMessage.sentAt)}
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
              style={[styles.body, { backgroundColor: colors.background }]}
              contentContainerStyle={[styles.bodyContent, hasFooterDecorator && { paddingBottom: 0 }]}
              showsVerticalScrollIndicator={true}
            >
              {/* Render structured content blocks like web does (direct approach) */}
              {transformedBlocks.length > 0 ? (
                <>
                  <MessageBlockRenderer blocks={mainBlocks} style={styles.blockRenderer} />
                  {hasFooterDecorator && (
                    <MessageBlockRenderer
                      blocks={[lastBlock]}
                      style={styles.footerDecoratorRenderer}
                    />
                  )}
                </>
              ) : currentMessage.body ? (
                <ThemedText style={styles.bodyText}>
                  {currentMessage.body}
                </ThemedText>
              ) : fallbackText ? (
                <ThemedText style={styles.bodyText}>
                  {fallbackText}
                </ThemedText>
              ) : (
                <ThemedText style={[styles.bodyText, { color: colors.mutedForeground }]}>
                  Esta mensagem não possui conteúdo.
                </ThemedText>
              )}
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
    minHeight: 150,
    // No horizontal padding here — the MessageBlockRenderer applies per-block padding
    // so decorators can be edge-to-edge while other blocks get 14px padding
  },
  bodyContent: {
    paddingBottom: spacing.md,
  },
  bodyText: {
    fontSize: 15,
    lineHeight: 22,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  blockRenderer: {
    paddingVertical: 0,
  },
  footerDecoratorRenderer: {
    paddingVertical: 0,
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
