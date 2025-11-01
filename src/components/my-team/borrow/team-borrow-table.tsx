import React, { useCallback} from "react";
import { FlatList, View, Pressable, RefreshControl, ActivityIndicator, StyleSheet } from "react-native";
import { Icon } from "@/components/ui/icon";
import type { Borrow } from '../../../types';
import { ThemedText } from "@/components/ui/themed-text";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { useTheme } from "@/lib/theme";
import { spacing, fontSize, fontWeight } from "@/constants/design-system";
import { BORROW_STATUS, BORROW_STATUS_LABELS } from '../../../constants';
import { formatDate } from '../../../utils';
import { extendedColors, badgeColors } from "@/lib/theme/extended-colors";

interface TeamBorrowTableProps {
  borrows: Borrow[];
  onBorrowPress?: (borrowId: string) => void;
  onRefresh?: () => Promise<void>;
  refreshing?: boolean;
  loading?: boolean;
}

// Helper function to get status colors
const getStatusColor = (status: string) => {
  switch (status) {
    case BORROW_STATUS.ACTIVE:
      return { background: badgeColors.info.background, text: badgeColors.info.text };
    case BORROW_STATUS.RETURNED:
      return { background: badgeColors.success.background, text: badgeColors.success.text };
    case BORROW_STATUS.LOST:
      return { background: badgeColors.error.background, text: badgeColors.error.text };
    default:
      return { background: badgeColors.muted.background, text: badgeColors.muted.text };
  }
};

export const TeamBorrowTable = React.memo<TeamBorrowTableProps>(({ borrows, onBorrowPress, onRefresh, refreshing = false, loading = false }) => {
  const { colors, isDark } = useTheme();

  // Row component
  const renderRow = useCallback(
    ({ item }: { item: Borrow }) => {
      const statusLabel = BORROW_STATUS_LABELS[item.status as keyof typeof BORROW_STATUS_LABELS] || item.status;
      const statusColor = getStatusColor(item.status);

      return (
        <Pressable onPress={() => onBorrowPress?.(item.id)} android_ripple={{ color: colors.primary + "20" }}>
          <Card style={styles.borrowCard}>
            {/* Header: User and Status */}
            <View style={styles.cardHeader}>
              <View style={styles.userSection}>
                <View style={[styles.userAvatar, { backgroundColor: isDark ? extendedColors.neutral[700] : extendedColors.neutral[200] }]}>
                  <Icon name="user" size="sm" variant="muted" />
                </View>
                <View style={styles.userInfo}>
                  <ThemedText style={styles.userName} numberOfLines={1}>
                    {item.user?.name || "Colaborador"}
                  </ThemedText>
                  <ThemedText style={styles.itemLabel} numberOfLines={1}>
                    {item.item?.name || "Item"}
                  </ThemedText>
                </View>
              </View>
              <Badge
                variant="secondary"
                size="sm"
                style={{
                  backgroundColor: statusColor.background,
                  borderWidth: 0,
                }}
              >
                <ThemedText
                  style={{
                    color: statusColor.text,
                    fontSize: fontSize.xs,
                    fontWeight: fontWeight.medium,
                  }}
                >
                  {statusLabel}
                </ThemedText>
              </Badge>
            </View>

            {/* Quantity */}
            <View style={styles.quantitySection}>
              <Icon name="package" size="xs" variant="muted" />
              <ThemedText style={styles.quantityText}>
                Quantidade: {item.quantity} {item.item?.measureUnit || 'un'}
              </ThemedText>
            </View>

            {/* Footer: Date and Return Info */}
            <View style={styles.cardFooter}>
              <View style={styles.dateSection}>
                <Icon name="calendar" size="xs" variant="muted" />
                <ThemedText style={styles.dateText}>{formatDate(item.createdAt)}</ThemedText>
              </View>
              {item.returnedAt && (
                <View style={styles.returnSection}>
                  <Icon name="check-circle" size="xs" variant="success" />
                  <ThemedText style={styles.returnText}>{formatDate(item.returnedAt)}</ThemedText>
                </View>
              )}
            </View>
          </Card>
        </Pressable>
      );
    },
    [colors, isDark, onBorrowPress],
  );

  // Empty state component
  const renderEmpty = useCallback(
    () => (
      <View style={styles.emptyContainer}>
        <Icon name="package" size="xl" variant="muted" />
        <ThemedText style={styles.emptyTitle}>Nenhum empréstimo encontrado</ThemedText>
        <ThemedText style={styles.emptySubtitle}>Os empréstimos da sua equipe aparecerão aqui</ThemedText>
      </View>
    ),
    [],
  );

  // Main loading state
  if (loading && borrows.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <ThemedText style={styles.loadingText}>Carregando empréstimos...</ThemedText>
      </View>
    );
  }

  return (
    <FlatList
      data={borrows}
      renderItem={renderRow}
      keyExtractor={(item) => item.id}
      refreshControl={onRefresh ? <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} tintColor={colors.primary} /> : undefined}
      ListEmptyComponent={renderEmpty}
      contentContainerStyle={borrows.length === 0 ? styles.emptyListContent : styles.listContent}
      showsVerticalScrollIndicator={false}
    />
  );
});

const styles = StyleSheet.create({
  borrowCard: {
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: spacing.sm,
  },
  userSection: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: spacing.sm,
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: spacing.sm,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    marginBottom: 2,
  },
  itemLabel: {
    fontSize: fontSize.sm,
    opacity: 0.7,
  },
  quantitySection: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  quantityText: {
    fontSize: fontSize.sm,
    opacity: 0.8,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: "rgba(0, 0, 0, 0.05)",
  },
  dateSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  dateText: {
    fontSize: fontSize.xs,
    opacity: 0.7,
  },
  returnSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  returnText: {
    fontSize: fontSize.xs,
    opacity: 0.7,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: spacing.md,
    paddingVertical: spacing.xxl,
  },
  loadingText: {
    fontSize: fontSize.sm,
    opacity: 0.7,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: spacing.xxl,
    gap: spacing.md,
  },
  emptyTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    textAlign: "center",
  },
  emptySubtitle: {
    fontSize: fontSize.sm,
    opacity: 0.7,
    textAlign: "center",
    paddingHorizontal: spacing.xl,
  },
  emptyListContent: {
    flexGrow: 1,
  },
  listContent: {
    paddingBottom: spacing.md,
  },
});

TeamBorrowTable.displayName = "TeamBorrowTable";
