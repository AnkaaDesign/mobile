import React, { useCallback, useMemo } from "react";
import { FlatList, View, Pressable, RefreshControl, ActivityIndicator, StyleSheet } from "react-native";
import { Icon } from "@/components/ui/icon";
import type { Activity } from '../../../types';
import { ThemedText } from "@/components/ui/themed-text";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { useTheme } from "@/lib/theme";
import { spacing, fontSize, fontWeight } from "@/constants/design-system";
import { ACTIVITY_OPERATION, ACTIVITY_OPERATION_LABELS, ACTIVITY_REASON_LABELS } from '../../../constants';
import { formatDate } from '../../../utils';
import { extendedColors, badgeColors } from "@/lib/theme/extended-colors";

interface TeamActivityTableProps {
  activities: Activity[];
  onActivityPress?: (activityId: string) => void;
  onRefresh?: () => Promise<void>;
  refreshing?: boolean;
  loading?: boolean;
}

// Helper function to get operation colors
const getOperationColor = (operation: string) => {
  switch (operation) {
    case ACTIVITY_OPERATION.INBOUND:
      return { background: badgeColors.success.background, text: badgeColors.success.text };
    case ACTIVITY_OPERATION.OUTBOUND:
      return { background: badgeColors.error.background, text: badgeColors.error.text };
    default:
      return { background: badgeColors.muted.background, text: badgeColors.muted.text };
  }
};

export const TeamActivityTable = React.memo<TeamActivityTableProps>(({ activities, onActivityPress, onRefresh, refreshing = false, loading = false }) => {
  const { colors, isDark } = useTheme();

  // Row component
  const renderRow = useCallback(
    ({ item }: { item: Activity }) => {
      const operationLabel = ACTIVITY_OPERATION_LABELS[item.operation as keyof typeof ACTIVITY_OPERATION_LABELS] || item.operation;
      const reasonLabel = ACTIVITY_REASON_LABELS[item.reason as keyof typeof ACTIVITY_REASON_LABELS] || item.reason;
      const operationColor = getOperationColor(item.operation);

      return (
        <Pressable onPress={() => onActivityPress?.(item.id)} android_ripple={{ color: colors.primary + "20" }}>
          <Card style={styles.activityCard}>
            {/* Header: Item and Operation */}
            <View style={styles.cardHeader}>
              <View style={styles.itemSection}>
                <View style={[styles.itemIcon, { backgroundColor: isDark ? extendedColors.neutral[700] : extendedColors.neutral[200] }]}>
                  <Icon name="package" size="sm" variant="muted" />
                </View>
                <View style={styles.itemInfo}>
                  <ThemedText style={styles.itemName} numberOfLines={1}>
                    {item.item?.name || "Item"}
                  </ThemedText>
                  <ThemedText style={styles.reasonLabel} numberOfLines={1}>
                    {reasonLabel}
                  </ThemedText>
                </View>
              </View>
              <Badge
                variant="secondary"
                size="sm"
                style={{
                  backgroundColor: operationColor.background,
                  borderWidth: 0,
                }}
              >
                <ThemedText
                  style={{
                    color: operationColor.text,
                    fontSize: fontSize.xs,
                    fontWeight: fontWeight.medium,
                  }}
                >
                  {operationLabel}
                </ThemedText>
              </Badge>
            </View>

            {/* Quantity and User */}
            <View style={styles.detailsSection}>
              <View style={styles.quantityRow}>
                <Icon name="hash" size="xs" variant="muted" />
                <ThemedText style={styles.detailText}>
                  Quantidade: {item.quantity} {item.item?.measureUnit || 'un'}
                </ThemedText>
              </View>
              {item.user && (
                <View style={styles.userRow}>
                  <Icon name="user" size="xs" variant="muted" />
                  <ThemedText style={styles.detailText} numberOfLines={1}>
                    {item.user.name}
                  </ThemedText>
                </View>
              )}
            </View>

            {/* Footer: Date */}
            <View style={styles.cardFooter}>
              <View style={styles.dateSection}>
                <Icon name="calendar" size="xs" variant="muted" />
                <ThemedText style={styles.dateText}>{formatDate(item.createdAt)}</ThemedText>
              </View>
            </View>
          </Card>
        </Pressable>
      );
    },
    [colors, isDark, onActivityPress],
  );

  // Empty state component
  const renderEmpty = useCallback(
    () => (
      <View style={styles.emptyContainer}>
        <Icon name="activity" size="xl" variant="muted" />
        <ThemedText style={styles.emptyTitle}>Nenhuma atividade encontrada</ThemedText>
        <ThemedText style={styles.emptySubtitle}>As atividades da sua equipe aparecerão aqui</ThemedText>
      </View>
    ),
    [],
  );

  // Main loading state
  if (loading && activities.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <ThemedText style={styles.loadingText}>Carregando atividades...</ThemedText>
      </View>
    );
  }

  return (
    <FlatList
      data={activities}
      renderItem={renderRow}
      keyExtractor={(item) => item.id}
      refreshControl={onRefresh ? <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} tintColor={colors.primary} /> : undefined}
      ListEmptyComponent={renderEmpty}
      contentContainerStyle={activities.length === 0 ? styles.emptyListContent : styles.listContent}
      showsVerticalScrollIndicator={false}
    />
  );
});

const styles = StyleSheet.create({
  activityCard: {
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: spacing.sm,
  },
  itemSection: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: spacing.sm,
  },
  itemIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: spacing.sm,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    marginBottom: 2,
  },
  reasonLabel: {
    fontSize: fontSize.sm,
    opacity: 0.7,
  },
  detailsSection: {
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  quantityRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  userRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  detailText: {
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

TeamActivityTable.displayName = "TeamActivityTable";
