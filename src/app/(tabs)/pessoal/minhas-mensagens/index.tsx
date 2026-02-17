import React, { useState, useCallback } from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  useWindowDimensions,
} from "react-native";
import { IconInbox } from "@tabler/icons-react-native";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Card } from "@/components/ui/card";
import { ThemedText } from "@/components/ui/themed-text";
import { ThemedView } from "@/components/ui/themed-view";
import { MessageBlockRenderer } from "@/components/ui/message-block-renderer";
import { MessageModal } from "@/components/message/MessageModal";
import { useTheme } from "@/lib/theme";
import { spacing, borderRadius, fontSize } from "@/constants/design-system";
import { transformMessageContent } from "@/utils/message-transformer";
import { useMyMessages, useMarkMessageAsViewed } from "@/hooks/useMyMessages";

type MessageWithViewStatus = any;

const CONTENT_SCALE = 0.55;
// The card body has a fixed height; we render the content at 1/SCALE size
// then scale it down so the full message fits visually in the small card.
const CARD_BODY_HEIGHT = 180;
const INNER_HEIGHT = CARD_BODY_HEIGHT / CONTENT_SCALE;
const INNER_WIDTH_FACTOR = 1 / CONTENT_SCALE;

export default function MinhasMensagensScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();
  const { data: messages, isLoading, error, refetch } = useMyMessages();
  const { mutate: markAsViewed } = useMarkMessageAsViewed();
  const [selectedMessage, setSelectedMessage] = useState<MessageWithViewStatus | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // 2 columns with padding accounted for
  const gridPadding = spacing.md; // outer padding
  const cardGap = spacing.sm; // gap between cards
  const cardWidth = (screenWidth - gridPadding * 2 - cardGap) / 2;

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const handleCardPress = useCallback(
    (message: MessageWithViewStatus) => {
      if (!message.viewedAt) {
        markAsViewed(message.id);
      }
      setSelectedMessage(message);
    },
    [markAsViewed]
  );

  const handleModalClose = useCallback(() => {
    setSelectedMessage(null);
  }, []);

  const formatDate = (date: Date | string | null | undefined) => {
    if (!date) return "";
    const dateObj = typeof date === "string" ? new Date(date) : date;
    return formatDistanceToNow(dateObj, { addSuffix: true, locale: ptBR });
  };

  // Loading state
  if (isLoading && !messages) {
    return (
      <ThemedView style={[styles.container, { paddingBottom: insets.bottom }]}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[styles.scrollContent, { paddingHorizontal: gridPadding }]}
        >
          <View style={styles.grid}>
            {[1, 2, 3, 4].map((i) => (
              <View key={i} style={[styles.cardWrapper, { width: cardWidth }]}>
                <Card style={styles.skeletonCard}>
                  <View style={[styles.skeletonLine, { width: "80%", backgroundColor: colors.muted }]} />
                  <View style={[styles.skeletonLine, { width: "50%", height: 6, backgroundColor: colors.muted }]} />
                  <View style={[styles.skeletonLine, { width: "100%", height: 100, backgroundColor: colors.muted }]} />
                </Card>
              </View>
            ))}
          </View>
        </ScrollView>
      </ThemedView>
    );
  }

  // Error state
  if (error) {
    return (
      <ThemedView style={[styles.container, { paddingBottom: insets.bottom }]}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[styles.scrollContent, { paddingHorizontal: gridPadding }]}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          <Card style={styles.emptyCard}>
            <ThemedText style={[styles.errorText, { color: colors.destructive }]}>
              Erro ao carregar mensagens
            </ThemedText>
          </Card>
        </ScrollView>
      </ThemedView>
    );
  }

  // Empty state
  if (!messages || messages.length === 0) {
    return (
      <ThemedView style={[styles.container, { paddingBottom: insets.bottom }]}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[styles.scrollContent, { paddingHorizontal: gridPadding }]}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          <Card style={styles.emptyCard}>
            <View style={[styles.emptyIconContainer, { backgroundColor: colors.muted }]}>
              <IconInbox size={32} color={colors.mutedForeground} />
            </View>
            <ThemedText style={styles.emptyTitle}>Nenhuma mensagem</ThemedText>
            <ThemedText style={[styles.emptyDescription, { color: colors.mutedForeground }]}>
              Você não possui mensagens no momento. Quando houver comunicados ou
              avisos importantes, eles aparecerão aqui.
            </ThemedText>
          </Card>
        </ScrollView>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={[styles.container, { paddingBottom: insets.bottom }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingHorizontal: gridPadding }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.grid}>
          {messages.map((message: MessageWithViewStatus) => {
            const isViewed = !!message.viewedAt;
            const transformedBlocks = transformMessageContent(message.content);

            return (
              <View key={message.id} style={[styles.cardWrapper, { width: cardWidth }]}>
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => handleCardPress(message)}
                >
                  <Card
                    style={[
                      styles.messageCard,
                      !isViewed && {
                        borderColor: colors.primary,
                        borderWidth: 1.5,
                      },
                    ]}
                  >
                    {/* Compact header */}
                    <View
                      style={[
                        styles.cardHeader,
                        {
                          backgroundColor: !isViewed
                            ? `${colors.primary}15`
                            : colors.muted,
                          borderBottomColor: colors.border,
                        },
                      ]}
                    >
                      <ThemedText
                        style={[
                          styles.cardTitle,
                          !isViewed && { color: colors.primary },
                        ]}
                        numberOfLines={1}
                      >
                        {message.title}
                      </ThemedText>
                      <View style={styles.headerMeta}>
                        <ThemedText
                          style={[styles.cardDate, { color: colors.mutedForeground }]}
                          numberOfLines={1}
                        >
                          {formatDate(message.publishedAt)}
                        </ThemedText>
                        {!isViewed && (
                          <View
                            style={[
                              styles.newBadge,
                              { backgroundColor: colors.primary },
                            ]}
                          >
                            <ThemedText style={styles.newBadgeText}>Novo</ThemedText>
                          </View>
                        )}
                      </View>
                    </View>

                    {/* Scaled-down full content */}
                    <View style={styles.cardBody}>
                      <View
                        style={[
                          styles.contentScaler,
                          {
                            width: cardWidth * INNER_WIDTH_FACTOR,
                            height: INNER_HEIGHT,
                            transform: [{ scale: CONTENT_SCALE }],
                          },
                        ]}
                        pointerEvents="none"
                      >
                        {transformedBlocks.length > 0 ? (
                          <MessageBlockRenderer blocks={transformedBlocks} />
                        ) : (
                          <ThemedText
                            style={[styles.bodyText, { color: colors.mutedForeground }]}
                          >
                            {message.body || "Esta mensagem não possui conteúdo."}
                          </ThemedText>
                        )}
                      </View>
                    </View>
                  </Card>
                </TouchableOpacity>
              </View>
            );
          })}
        </View>
      </ScrollView>

      {/* Message Modal */}
      {selectedMessage && (
        <MessageModal
          visible={!!selectedMessage}
          onClose={handleModalClose}
          messages={[selectedMessage]}
        />
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingVertical: spacing.md,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  cardWrapper: {
    // width set dynamically
  },
  messageCard: {
    overflow: "hidden",
    borderRadius: borderRadius.md,
  },
  cardHeader: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerMeta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 1,
  },
  cardTitle: {
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 16,
  },
  cardDate: {
    fontSize: 10,
    lineHeight: 13,
    flex: 1,
  },
  newBadge: {
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  newBadgeText: {
    color: "#ffffff",
    fontSize: 8,
    fontWeight: "700",
    lineHeight: 10,
  },
  cardBody: {
    height: CARD_BODY_HEIGHT,
    overflow: "hidden",
  },
  contentScaler: {
    transformOrigin: "top left",
    padding: spacing.sm,
  },
  bodyText: {
    fontSize: fontSize.sm,
    lineHeight: fontSize.sm * 1.5,
  },
  // Loading skeleton
  skeletonCard: {
    padding: spacing.xs,
    gap: spacing.xs,
    height: CARD_BODY_HEIGHT + 30,
  },
  skeletonLine: {
    height: 8,
    borderRadius: borderRadius.sm,
  },
  // Empty state
  emptyCard: {
    paddingVertical: spacing.xl * 2,
    paddingHorizontal: spacing.lg,
    alignItems: "center",
    gap: spacing.md,
  },
  emptyIconContainer: {
    width: 64,
    height: 64,
    borderRadius: borderRadius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyTitle: {
    fontSize: fontSize.lg,
    fontWeight: "600",
  },
  emptyDescription: {
    fontSize: fontSize.sm,
    textAlign: "center",
    lineHeight: fontSize.sm * 1.5,
    maxWidth: 300,
  },
  errorText: {
    textAlign: "center",
    fontSize: fontSize.base,
  },
});
