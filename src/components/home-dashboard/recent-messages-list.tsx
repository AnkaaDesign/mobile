import { useState, useCallback } from "react";
import { View, Text, Pressable, StyleSheet, useWindowDimensions } from "react-native";
import { useTheme } from "@/lib/theme";
import { Icon } from "@/components/ui/icon";
import { MessageBlockRenderer } from "@/components/ui/message-block-renderer";
import { MessageModal } from "@/components/message/MessageModal";
import { transformMessageContent } from "@/utils/message-transformer";
import { useMarkMessageAsViewed } from "@/hooks/useMyMessages";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { HomeDashboardMessage } from "@/types";

const CONTENT_SCALE = 0.55;
const CARD_BODY_HEIGHT = 140;
const INNER_HEIGHT = CARD_BODY_HEIGHT / CONTENT_SCALE;
const INNER_WIDTH_FACTOR = 1 / CONTENT_SCALE;

function formatDate(date: string | null): string {
  if (!date) return "";
  return formatDistanceToNow(new Date(date), { addSuffix: true, locale: ptBR });
}

interface RecentMessagesListProps {
  messages: HomeDashboardMessage[];
  unreadCount?: number;
}

export function RecentMessagesList({ messages, unreadCount }: RecentMessagesListProps) {
  const { colors } = useTheme();
  const { width: screenWidth } = useWindowDimensions();
  const [selectedMessage, setSelectedMessage] = useState<HomeDashboardMessage | null>(null);
  const { mutate: markAsViewed } = useMarkMessageAsViewed();

  const cardGap = 8;
  const cardWidth = (screenWidth - 32 - 32 - cardGap) / 2; // screen - outer padding - card padding - gap

  const handleCardPress = useCallback((message: HomeDashboardMessage) => {
    if (!message.viewedAt) {
      markAsViewed(message.id);
    }
    setSelectedMessage(message);
  }, [markAsViewed]);

  const handleModalClose = useCallback(() => {
    setSelectedMessage(null);
  }, []);

  return (
    <View style={{ gap: 10 }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
        <Icon name="message" size="sm" color="#6366f1" />
        <Text style={{ fontSize: 15, fontWeight: "600", color: colors.foreground }}>
          Mensagens Recentes
        </Text>
        {unreadCount !== undefined && unreadCount > 0 && (
          <View
            style={{
              backgroundColor: colors.primary + "1A",
              paddingHorizontal: 6,
              paddingVertical: 2,
              borderRadius: 10,
            }}
          >
            <Text style={{ fontSize: 11, fontWeight: "500", color: colors.primary }}>
              {unreadCount}
            </Text>
          </View>
        )}
      </View>

      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: cardGap }}>
        {messages.map((message) => {
          const isUnread = !message.viewedAt;
          const transformedBlocks = transformMessageContent(message.content);

          return (
            <Pressable
              key={message.id}
              onPress={() => handleCardPress(message)}
              style={{ width: cardWidth }}
            >
              <View
                style={[
                  styles.card,
                  {
                    backgroundColor: isUnread ? colors.primary + "0D" : colors.card,
                    borderColor: isUnread ? colors.primary : colors.border,
                    borderWidth: isUnread ? 1.5 : 1,
                  },
                ]}
              >
                {/* Header */}
                <View
                  style={[
                    styles.cardHeader,
                    {
                      backgroundColor: isUnread ? colors.primary + "15" : colors.muted,
                      borderBottomColor: colors.border,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.cardTitle,
                      { color: isUnread ? colors.primary : colors.foreground },
                    ]}
                    numberOfLines={1}
                  >
                    {message.title}
                  </Text>
                  <View style={styles.headerMeta}>
                    <Text
                      style={{ fontSize: 10, color: colors.mutedForeground, flex: 1 }}
                      numberOfLines={1}
                    >
                      {formatDate(message.publishedAt)}
                    </Text>
                    {isUnread && (
                      <View style={[styles.newBadge, { backgroundColor: colors.primary }]}>
                        <Text style={styles.newBadgeText}>Novo</Text>
                      </View>
                    )}
                  </View>
                </View>

                {/* Scaled-down content preview */}
                <View style={styles.cardBody}>
                  <View
                    style={{
                      width: cardWidth * INNER_WIDTH_FACTOR,
                      height: INNER_HEIGHT,
                      transform: [{ scale: CONTENT_SCALE }],
                      transformOrigin: "top left",
                      padding: 8,
                    }}
                    pointerEvents="none"
                  >
                    {transformedBlocks.length > 0 ? (
                      <MessageBlockRenderer blocks={transformedBlocks} />
                    ) : (
                      <Text style={{ fontSize: 13, color: colors.mutedForeground }}>
                        Esta mensagem não possui conteúdo.
                      </Text>
                    )}
                  </View>
                </View>
              </View>
            </Pressable>
          );
        })}
      </View>

      {/* Message Modal */}
      {selectedMessage && (
        <MessageModal
          visible={!!selectedMessage}
          onClose={handleModalClose}
          messages={[selectedMessage as any]}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 8,
    overflow: "hidden",
  },
  cardHeader: {
    paddingHorizontal: 8,
    paddingVertical: 6,
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
  newBadge: {
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
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
});
