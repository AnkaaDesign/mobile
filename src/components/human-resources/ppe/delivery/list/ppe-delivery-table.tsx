import { memo, useCallback } from "react";
import { View, FlatList, StyleSheet, TouchableOpacity, RefreshControl, ActivityIndicator } from "react-native";
import { useTheme } from "@/lib/theme";
import { ThemedText } from "@/components/ui/themed-text";
import { Badge } from "@/components/ui/badge";
import { IconUser, IconPackage, IconCircleCheck, IconClock, IconAlertCircle, IconX } from "@tabler/icons-react-native";
import { PpeDeliveryListSkeleton } from "../skeleton/ppe-delivery-list-skeleton";
import { ErrorScreen } from "@/components/ui/error-screen";
import { spacing } from "@/constants/design-system";
import { PPE_DELIVERY_STATUS, PPE_DELIVERY_STATUS_LABELS, ENTITY_BADGE_CONFIG, BADGE_COLORS } from "@/constants";
import { formatDate, formatQuantity } from "@/utils";
import type { PpeDelivery } from '../../../../../types';

interface PpeDeliveryTableProps {
  deliveries: PpeDelivery[];
  isLoading: boolean;
  error: any;
  onDeliveryPress: (deliveryId: string) => void;
  onRefresh: () => Promise<void>;
  refreshing: boolean;
  onEndReached: () => void;
  canLoadMore: boolean;
  loadingMore: boolean;
}

export const PpeDeliveryTable = memo(({ deliveries, isLoading, error, onDeliveryPress, onRefresh, refreshing, onEndReached, canLoadMore, loadingMore }: PpeDeliveryTableProps) => {
  const { colors } = useTheme();

  // Badge colors using centralized config (matching web version exactly)
  const getStatusColor = (status: string) => {
    const variant = ENTITY_BADGE_CONFIG.PPE_DELIVERY[status as PPE_DELIVERY_STATUS];
    if (variant) {
      return BADGE_COLORS[variant]?.bg || colors.mutedForeground;
    }
    return colors.mutedForeground;
  };

  // Get text color for status badge
  const getStatusTextColor = (status: string) => {
    const variant = ENTITY_BADGE_CONFIG.PPE_DELIVERY[status as PPE_DELIVERY_STATUS];
    if (variant) {
      return BADGE_COLORS[variant]?.text || "#ffffff";
    }
    return "#ffffff";
  };

  const getStatusIcon = (status: string) => {
    const textColor = getStatusTextColor(status);
    switch (status) {
      case PPE_DELIVERY_STATUS.PENDING:
        return <IconClock size={12} color={textColor} />;
      case PPE_DELIVERY_STATUS.APPROVED:
        return <IconCircleCheck size={12} color={textColor} />;
      case PPE_DELIVERY_STATUS.DELIVERED:
        return <IconCircleCheck size={12} color={textColor} />;
      case PPE_DELIVERY_STATUS.WAITING_SIGNATURE:
        return <IconClock size={12} color={textColor} />;
      case PPE_DELIVERY_STATUS.COMPLETED:
        return <IconCircleCheck size={12} color={textColor} />;
      case PPE_DELIVERY_STATUS.REPROVED:
      case PPE_DELIVERY_STATUS.SIGNATURE_REJECTED:
        return <IconAlertCircle size={12} color={textColor} />;
      case PPE_DELIVERY_STATUS.CANCELLED:
        return <IconX size={12} color={textColor} />;
      default:
        return null;
    }
  };

  const renderItem = useCallback(
    ({ item: delivery }: { item: PpeDelivery }) => (
      <TouchableOpacity style={StyleSheet.flatten([styles.row, { backgroundColor: colors.card }])} onPress={() => onDeliveryPress(delivery.id)} activeOpacity={0.7}>
        <View style={styles.rowContent}>
          {/* Left Section - User Info */}
          <View style={styles.leftSection}>
            <IconUser size={20} color={colors.mutedForeground} />
            <View style={styles.userInfo}>
              <ThemedText style={styles.userName} numberOfLines={1}>
                {delivery.user?.name || "Funcionário"}
              </ThemedText>
            </View>
          </View>

          {/* Middle Section - PPE Info and Quantity */}
          <View style={styles.middleSection}>
            <View style={styles.ppeInfo}>
              <IconPackage size={14} color={colors.mutedForeground} />
              <ThemedText style={styles.ppeName} numberOfLines={1}>
                {delivery.item?.name || "EPI"}
              </ThemedText>
            </View>
            <ThemedText style={styles.ppeDetails} numberOfLines={1}>
              {delivery.item?.ppeType || "-"}
            </ThemedText>
            <ThemedText style={styles.quantity}>{formatQuantity(delivery.quantity)} un</ThemedText>
          </View>

          {/* Right Section - Status and Date */}
          <View style={styles.rightSection}>
            <Badge variant="default" style={StyleSheet.flatten([styles.statusBadge, { backgroundColor: getStatusColor(delivery.status), flexShrink: 0 }])}>
              <View style={styles.badgeContent}>
                {getStatusIcon(delivery.status)}
                <ThemedText style={[styles.statusText, { color: getStatusTextColor(delivery.status) }]} numberOfLines={1}>{PPE_DELIVERY_STATUS_LABELS[delivery.status]}</ThemedText>
              </View>
            </Badge>

            {/* Signature indicator */}
            {delivery.status === PPE_DELIVERY_STATUS.DELIVERED && (
              <View style={styles.signatureRow}>
                {delivery.actualDeliveryDate && (
                  <>
                    <IconCircleCheck size={12} color="#10b981" />
                    <ThemedText style={StyleSheet.flatten([styles.signatureText, { color: "#10b981" }])}>Assinado</ThemedText>
                  </>
                )}
              </View>
            )}

            <ThemedText style={styles.date}>{delivery.actualDeliveryDate ? formatDate(delivery.actualDeliveryDate) : delivery.scheduledDate ? `Agend: ${formatDate(delivery.scheduledDate)}` : "-"}</ThemedText>
          </View>
        </View>
      </TouchableOpacity>
    ),
    [colors, onDeliveryPress],
  );

  const renderEmpty = useCallback(() => {
    if (isLoading) return <PpeDeliveryListSkeleton />;

    return (
      <View style={styles.emptyContainer}>
        <IconPackage size={48} color={colors.mutedForeground} />
        <ThemedText style={styles.emptyTitle}>Nenhuma entrega encontrada</ThemedText>
        <ThemedText style={styles.emptyText}>Ajuste os filtros ou registre uma nova entrega</ThemedText>
      </View>
    );
  }, [isLoading, colors]);

  const renderFooter = useCallback(() => {
    if (!loadingMore) return null;

    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={colors.primary} />
        <ThemedText style={styles.footerText}>Carregando mais...</ThemedText>
      </View>
    );
  }, [loadingMore, colors]);

  if (error && !deliveries.length) {
    return <ErrorScreen message="Erro ao carregar entregas de EPI" detail={error.message} />;
  }

  return (
    <FlatList
      data={deliveries}
      renderItem={renderItem}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.listContent}
      ItemSeparatorComponent={() => <View style={StyleSheet.flatten([styles.separator, { backgroundColor: colors.border }])} />}
      ListEmptyComponent={renderEmpty}
      ListFooterComponent={renderFooter}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} tintColor={colors.primary} />}
      onEndReached={canLoadMore ? onEndReached : undefined}
      onEndReachedThreshold={0.2}
      removeClippedSubviews={true}
      maxToRenderPerBatch={10}
      windowSize={5}
      initialNumToRender={15}
      updateCellsBatchingPeriod={50}
      getItemLayout={(_data, index) => ({
        length: 90,
        offset: 90 * index,
        index,
      })}
      showsVerticalScrollIndicator={false}
    />
  );
});

PpeDeliveryTable.displayName = "PpeDeliveryTable";

const styles = StyleSheet.create({
  listContent: {
    flexGrow: 1,
  },
  row: {
    minHeight: 90,
    justifyContent: "center",
  },
  rowContent: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.md,
    gap: spacing.sm,
  },
  leftSection: {
    flex: 1.2,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 14,
    fontWeight: "600",
  },
  userPosition: {
    fontSize: 11,
    opacity: 0.6,
    marginTop: 2,
  },
  middleSection: {
    flex: 1.3,
    gap: spacing.xs,
  },
  ppeInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  ppeName: {
    fontSize: 13,
    fontWeight: "500",
    flex: 1,
  },
  ppeDetails: {
    fontSize: 11,
    opacity: 0.6,
  },
  quantity: {
    fontSize: 12,
    fontWeight: "600",
  },
  rightSection: {
    flex: 1,
    alignItems: "flex-end",
    gap: spacing.xs,
  },
  statusBadge: {
    paddingHorizontal: spacing.xs,
    paddingVertical: 4,
  },
  badgeContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "600",
  },
  signatureRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  signatureText: {
    fontSize: 10,
    fontWeight: "500",
  },
  date: {
    fontSize: 11,
    opacity: 0.6,
  },
  separator: {
    height: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: spacing.xl * 2,
    gap: spacing.md,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  emptyText: {
    fontSize: 14,
    opacity: 0.6,
    textAlign: "center",
    paddingHorizontal: spacing.xl,
  },
  footerLoader: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: spacing.lg,
    gap: spacing.sm,
  },
  footerText: {
    fontSize: 14,
    opacity: 0.6,
  },
});
