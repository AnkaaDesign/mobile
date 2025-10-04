import React, { memo, useCallback, useMemo } from "react";
import {
  View,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { useTheme } from "@/lib/theme";
import { ThemedText } from "@/components/ui/themed-text";
import { Badge } from "@/components/ui/badge";
import { IconBox, IconArrowUp, IconArrowDown } from "@tabler/icons-react-native";
import { ActivityTableRowSwipe } from "./activity-table-row-swipe";
import { ActivityListSkeleton } from "../skeleton/activity-list-skeleton";
import { ErrorScreen } from "@/components/ui/error-screen";
import { spacing } from "@/constants/design-system";
import { ACTIVITY_OPERATION, ACTIVITY_OPERATION_LABELS, ACTIVITY_REASON_LABELS } from '../../../../constants';
import { formatDate, formatCurrency } from '../../../../utils';
import type { Activity } from '../../../../types';

interface ActivityTableProps {
  activities: Activity[];
  isLoading: boolean;
  error: any;
  onActivityPress: (activityId: string) => void;
  onDelete: (activityId: string) => void;
  onRefresh: () => Promise<void>;
  refreshing: boolean;
  onEndReach: () => void;
  canLoadMore: boolean;
  loadingMore: boolean;
}

export const ActivityTable = memo(({
  activities,
  isLoading,
  error,
  onActivityPress,
  onDelete,
  onRefresh,
  refreshing,
  onEndReach,
  canLoadMore,
  loadingMore,
}: ActivityTableProps) => {
  const { colors, isDark } = useTheme();

  const renderItem = useCallback(({ item: activity }: { item: Activity }) => (
    <ActivityTableRowSwipe
      activityId={activity.id}
      activityDescription={`${activity.item?.name || "Item"} - ${activity.quantity} un`}
      onDelete={() => onDelete(activity.id)}
      disabled={false}
    >
      {(isActive) => (
        <TouchableOpacity
          style={StyleSheet.flatten([
            styles.row,
            { backgroundColor: isActive ? colors.muted : colors.card },
          ])}
          onPress={() => onActivityPress(activity.id)}
          activeOpacity={0.7}
        >
          <View style={styles.rowContent}>
            {/* Operation Icon and Item Info */}
            <View style={styles.leftSection}>
              <View style={StyleSheet.flatten([
                styles.operationIcon,
                { backgroundColor: activity.operation === ACTIVITY_OPERATION.INBOUND ? "#10b981" : "#ef4444" }
              ])}>
                {activity.operation === ACTIVITY_OPERATION.INBOUND ? (
                  <IconArrowDown size={16} color="white" />
                ) : (
                  <IconArrowUp size={16} color="white" />
                )}
              </View>
              <View style={styles.itemInfo}>
                <ThemedText style={styles.itemName} numberOfLines={1}>
                  {activity.item?.name || "Item não encontrado"}
                </ThemedText>
                <ThemedText style={styles.itemCode} numberOfLines={1}>
                  {activity.item?.uniCode || "-"}
                </ThemedText>
              </View>
            </View>

            {/* Middle Section - Quantity and Reason */}
            <View style={styles.middleSection}>
              <ThemedText style={StyleSheet.flatten([
                styles.quantity,
                { color: activity.operation === ACTIVITY_OPERATION.INBOUND ? "#10b981" : "#ef4444" }
              ])}>
                {activity.operation === ACTIVITY_OPERATION.INBOUND ? "+" : "-"}{activity.quantity}
              </ThemedText>
              {activity.reason && (
                <Badge variant="outline" style={styles.reasonBadge}>
                  <ThemedText style={styles.reasonText} numberOfLines={1}>
                    {ACTIVITY_REASON_LABELS[activity.reason] || activity.reason}
                  </ThemedText>
                </Badge>
              )}
            </View>

            {/* Right Section - User and Date */}
            <View style={styles.rightSection}>
              {activity.user && (
                <ThemedText style={styles.userName} numberOfLines={1}>
                  {activity.user.name}
                </ThemedText>
              )}
              <ThemedText style={styles.date}>
                {formatDate(activity.createdAt)}
              </ThemedText>
            </View>
          </View>
        </TouchableOpacity>
      )}
    </ActivityTableRowSwipe>
  ), [colors, onActivityPress, onDelete]);

  const renderEmpty = useCallback(() => {
    if (isLoading) return <ActivityListSkeleton />;

    return (
      <View style={styles.emptyContainer}>
        <IconBox size={48} color={colors.mutedForeground} />
        <ThemedText style={styles.emptyTitle}>Nenhuma movimentação encontrada</ThemedText>
        <ThemedText style={styles.emptyText}>
          Ajuste os filtros ou faça uma nova busca
        </ThemedText>
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

  if (error && !activities.length) {
    return <ErrorScreen message="Erro ao carregar movimentações" detail={error.message} />;
  }

  return (
    <FlatList
      data={activities}
      renderItem={renderItem}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.listContent}
      ItemSeparatorComponent={() => <View style={StyleSheet.flatten([styles.separator, { backgroundColor: colors.border }])} />}
      ListEmptyComponent={renderEmpty}
      ListFooterComponent={renderFooter}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={[colors.primary]}
          tintColor={colors.primary}
        />
      }
      onEndReached={canLoadMore ? onEndReach : undefined}
      onEndReachedThreshold={0.2}
      removeClippedSubviews={true}
      maxToRenderPerBatch={10}
      windowSize={5}
      initialNumToRender={15}
      updateCellsBatchingPeriod={50}
      getItemLayout={(data, index) => ({
        length: 72, // Fixed row height based on styles.row minHeight
        offset: 72 * index,
        index,
      })}
      showsVerticalScrollIndicator={false}
    />
  );
});

ActivityTable.displayName = "ActivityTable";

const styles = StyleSheet.create({
  listContent: {
    flexGrow: 1,
  },
  row: {
    minHeight: 72,
    justifyContent: "center",
  },
  rowContent: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.md,
  },
  leftSection: {
    flex: 1.5,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  operationIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 14,
    fontWeight: "600",
  },
  itemCode: {
    fontSize: 12,
    opacity: 0.6,
  },
  middleSection: {
    flex: 1,
    alignItems: "center",
    gap: spacing.xs,
  },
  quantity: {
    fontSize: 16,
    fontWeight: "700",
  },
  reasonBadge: {
    paddingHorizontal: spacing.xs,
    height: 20,
  },
  reasonText: {
    fontSize: 10,
  },
  rightSection: {
    flex: 1,
    alignItems: "flex-end",
  },
  userName: {
    fontSize: 12,
    opacity: 0.8,
  },
  date: {
    fontSize: 11,
    opacity: 0.6,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.xxl * 2,
    gap: spacing.sm,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "600",
    opacity: 0.8,
  },
  emptyText: {
    fontSize: 14,
    opacity: 0.6,
    textAlign: "center",
  },
  footerLoader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.lg,
    gap: spacing.sm,
  },
  footerText: {
    fontSize: 14,
    opacity: 0.7,
  },
});