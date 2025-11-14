import React, { useCallback } from "react";
import { FlatList, View, Pressable, RefreshControl, ActivityIndicator, StyleSheet } from "react-native";
import { Icon } from "@/components/ui/icon";
import type { PpeDelivery } from '../../../types';
import { ThemedText } from "@/components/ui/themed-text";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { useTheme } from "@/lib/theme";
import { spacing, fontSize, fontWeight } from "@/constants/design-system";
import { PPE_DELIVERY_STATUS } from "@/constants";
import { formatDate } from "@/utils";
import { extendedColors, badgeColors } from "@/lib/theme/extended-colors";

interface TeamPpeDeliveryTableProps {
  deliveries: PpeDelivery[];
  onDeliveryPress?: (deliveryId: string) => void;
  onRefresh?: () => Promise<void>;
  refreshing?: boolean;
  loading?: boolean;
}

// Helper function to get status colors
const getStatusColor = (status: string) => {
  switch (status) {
    case PPE_DELIVERY_STATUS.PENDING:
      return { background: badgeColors.warning.background, text: badgeColors.warning.text };
    case PPE_DELIVERY_STATUS.APPROVED:
      return { background: badgeColors.info.background, text: badgeColors.info.text };
    case PPE_DELIVERY_STATUS.DELIVERED:
      return { background: badgeColors.success.background, text: badgeColors.success.text };
    case PPE_DELIVERY_STATUS.REPROVED:
      return { background: badgeColors.error.background, text: badgeColors.error.text };
    case PPE_DELIVERY_STATUS.CANCELLED:
      return { background: badgeColors.muted.background, text: badgeColors.muted.text };
    default:
      return { background: badgeColors.muted.background, text: badgeColors.muted.text };
  }
};

// Helper function to get status label
const getStatusLabel = (status: string) => {
  switch (status) {
    case PPE_DELIVERY_STATUS.PENDING:
      return "Pendente";
    case PPE_DELIVERY_STATUS.APPROVED:
      return "Aprovado";
    case PPE_DELIVERY_STATUS.DELIVERED:
      return "Entregue";
    case PPE_DELIVERY_STATUS.REPROVED:
      return "Reprovado";
    case PPE_DELIVERY_STATUS.CANCELLED:
      return "Cancelado";
    default:
      return status;
  }
};

export const TeamPpeDeliveryTable = React.memo<TeamPpeDeliveryTableProps>(
  ({ deliveries, onDeliveryPress, onRefresh, refreshing = false, loading = false }) => {
    const { colors, isDark } = useTheme();

    // Row component
    const renderRow = useCallback(
      ({ item }: { item: PpeDelivery }) => {
        const statusColor = getStatusColor(item.status);
        const statusLabel = getStatusLabel(item.status);

        return (
          <Pressable onPress={() => onDeliveryPress?.(item.id)} android_ripple={{ color: colors.primary + "20" }}>
            <Card style={styles.deliveryCard}>
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

              {/* Details Section */}
              <View style={styles.detailsSection}>
                <View style={styles.detailRow}>
                  <ThemedText style={styles.detailLabel}>Quantidade:</ThemedText>
                  <ThemedText style={styles.detailValue}>{item.quantity}</ThemedText>
                </View>
                {item.scheduledDate && (
                  <View style={styles.detailRow}>
                    <ThemedText style={styles.detailLabel}>Data Programada:</ThemedText>
                    <ThemedText style={styles.detailValue}>{formatDate(item.scheduledDate)}</ThemedText>
                  </View>
                )}
                {item.actualDeliveryDate && (
                  <View style={styles.detailRow}>
                    <ThemedText style={styles.detailLabel}>Data de Entrega:</ThemedText>
                    <ThemedText style={styles.detailValue}>{formatDate(item.actualDeliveryDate)}</ThemedText>
                  </View>
                )}
              </View>

              {/* Footer: Date */}
              <View style={styles.cardFooter}>
                <View style={styles.dateSection}>
                  <Icon name="calendar" size="xs" variant="muted" />
                  <ThemedText style={styles.dateText}>{formatDate(item.createdAt)}</ThemedText>
                </View>
                {item.user?.sector?.name && (
                  <ThemedText style={styles.sectorText} numberOfLines={1}>
                    {item.user.sector.name}
                  </ThemedText>
                )}
              </View>
            </Card>
          </Pressable>
        );
      },
      [colors, isDark, onDeliveryPress],
    );

    // Empty state component
    const renderEmpty = useCallback(
      () => (
        <View style={styles.emptyContainer}>
          <Icon name="shield-check" size="xl" variant="muted" />
          <ThemedText style={styles.emptyTitle}>Nenhuma entrega encontrada</ThemedText>
          <ThemedText style={styles.emptySubtitle}>As entregas de EPI da sua equipe aparecerão aqui</ThemedText>
        </View>
      ),
      [],
    );

    // Main loading state
    if (loading && deliveries.length === 0) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <ThemedText style={styles.loadingText}>Carregando entregas...</ThemedText>
        </View>
      );
    }

    return (
      <FlatList
        data={deliveries}
        renderItem={renderRow}
        keyExtractor={(item) => item.id}
        refreshControl={onRefresh ? <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} tintColor={colors.primary} /> : undefined}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={deliveries.length === 0 ? styles.emptyListContent : styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    );
  }
);

const styles = StyleSheet.create({
  deliveryCard: {
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
  detailsSection: {
    marginBottom: spacing.sm,
    gap: spacing.xs,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  detailLabel: {
    fontSize: fontSize.sm,
    opacity: 0.7,
  },
  detailValue: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
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
  sectorText: {
    fontSize: fontSize.xs,
    opacity: 0.7,
    maxWidth: "50%",
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

TeamPpeDeliveryTable.displayName = "TeamPpeDeliveryTable";
