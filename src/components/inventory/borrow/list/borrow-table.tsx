import React, { memo, useCallback } from "react";
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
import { IconHandStop, IconCheck, IconX, IconUser, IconPackage } from "@tabler/icons-react-native";
import { BorrowTableRowSwipe } from "./borrow-table-row-swipe";
import { BorrowListSkeleton } from "../skeleton/borrow-list-skeleton";
import { ErrorScreen } from "@/components/ui/error-screen";
import { spacing } from "@/constants/design-system";
import { BORROW_STATUS, BORROW_STATUS_LABELS } from '../../../../constants';
import { formatDate, formatDateTime } from '../../../../utils';
import type { Borrow } from '../../../../types';

interface BorrowTableProps {
  borrows: Borrow[];
  isLoading: boolean;
  error: any;
  onBorrowPress: (borrowId: string) => void;
  onReturn: (borrowId: string) => void;
  onMarkAsLost: (borrowId: string) => void;
  onDelete: (borrowId: string) => void;
  onRefresh: () => Promise<void>;
  refreshing: boolean;
  onEndReach: () => void;
  canLoadMore: boolean;
  loadingMore: boolean;
}

export const BorrowTable = memo(({
  borrows,
  isLoading,
  error,
  onBorrowPress,
  onReturn,
  onMarkAsLost,
  onDelete,
  onRefresh,
  refreshing,
  onEndReach,
  canLoadMore,
  loadingMore,
}: BorrowTableProps) => {
  const { colors } = useTheme();

  const getStatusColor = (status: string) => {
    switch (status) {
      case BORROW_STATUS.ACTIVE:
        return "#3b82f6";
      case BORROW_STATUS.RETURNED:
        return "#10b981";
      case BORROW_STATUS.LOST:
        return "#ef4444";
      default:
        return colors.mutedForeground;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case BORROW_STATUS.ACTIVE:
        return <IconHandStop size={12} color="white" />;
      case BORROW_STATUS.RETURNED:
        return <IconCheck size={12} color="white" />;
      case BORROW_STATUS.LOST:
        return <IconX size={12} color="white" />;
      default:
        return null;
    }
  };

  const renderItem = useCallback(({ item: borrow }: { item: Borrow }) => (
    <BorrowTableRowSwipe
      borrowId={borrow.id}
      borrowDescription={`${borrow.item?.name || "Item"} - ${borrow.quantity} un`}
      status={borrow.status}
      onReturn={() => onReturn(borrow.id)}
      onMarkAsLost={() => onMarkAsLost(borrow.id)}
      onDelete={() => onDelete(borrow.id)}
      disabled={borrow.status !== BORROW_STATUS.ACTIVE}
    >
      {(isActive) => (
        <TouchableOpacity
          style={StyleSheet.flatten([
            styles.row,
            { backgroundColor: isActive ? colors.muted : colors.card },
          ])}
          onPress={() => onBorrowPress(borrow.id)}
          activeOpacity={0.7}
        >
          <View style={styles.rowContent}>
            {/* Left Section - Item Info */}
            <View style={styles.leftSection}>
              <IconPackage size={20} color={colors.mutedForeground} />
              <View style={styles.itemInfo}>
                <ThemedText style={styles.itemName} numberOfLines={1}>
                  {borrow.item?.name || "Item não encontrado"}
                </ThemedText>
                <ThemedText style={styles.itemCode} numberOfLines={1}>
                  {borrow.item?.uniCode || "-"}
                </ThemedText>
              </View>
            </View>

            {/* Middle Section - User and Quantity */}
            <View style={styles.middleSection}>
              <View style={styles.userInfo}>
                <IconUser size={14} color={colors.mutedForeground} />
                <ThemedText style={styles.userName} numberOfLines={1}>
                  {borrow.user?.name || "Usuário"}
                </ThemedText>
              </View>
              <ThemedText style={styles.quantity}>
                {borrow.quantity} un
              </ThemedText>
            </View>

            {/* Right Section - Status and Date */}
            <View style={styles.rightSection}>
              <Badge
                variant="default"
                style={StyleSheet.flatten([styles.statusBadge, { backgroundColor: getStatusColor(borrow.status) }])}
              >
                <View style={styles.badgeContent}>
                  {getStatusIcon(borrow.status)}
                  <ThemedText style={styles.statusText}>
                    {BORROW_STATUS_LABELS[borrow.status]}
                  </ThemedText>
                </View>
              </Badge>
              <ThemedText style={styles.date}>
                {borrow.returnedAt
                  ? `Devolvido: ${formatDate(borrow.returnedAt)}`
                  : `Emprestado: ${formatDate(borrow.createdAt)}`}
              </ThemedText>
            </View>
          </View>
        </TouchableOpacity>
      )}
    </BorrowTableRowSwipe>
  ), [colors, onBorrowPress, onReturn, onMarkAsLost, onDelete]);

  const renderEmpty = useCallback(() => {
    if (isLoading) return <BorrowListSkeleton />;

    return (
      <View style={styles.emptyContainer}>
        <IconHandStop size={48} color={colors.mutedForeground} />
        <ThemedText style={styles.emptyTitle}>Nenhum empréstimo encontrado</ThemedText>
        <ThemedText style={styles.emptyText}>
          Ajuste os filtros ou faça um novo empréstimo
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

  if (error && !borrows.length) {
    return <ErrorScreen message="Erro ao carregar empréstimos" detail={error.message} />;
  }

  return (
    <FlatList
      data={borrows}
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
        length: 80, // Fixed row height based on styles.row minHeight
        offset: 80 * index,
        index,
      })}
      showsVerticalScrollIndicator={false}
    />
  );
});

BorrowTable.displayName = "BorrowTable";

const styles = StyleSheet.create({
  listContent: {
    flexGrow: 1,
  },
  row: {
    minHeight: 80,
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
    flex: 1.2,
    gap: spacing.xs,
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  userName: {
    fontSize: 13,
    opacity: 0.8,
    flex: 1,
  },
  quantity: {
    fontSize: 12,
    fontWeight: "500",
    opacity: 0.7,
  },
  rightSection: {
    flex: 1,
    alignItems: "flex-end",
    gap: spacing.xs,
  },
  statusBadge: {
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
  },
  badgeContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  statusText: {
    fontSize: 11,
    color: "white",
    fontWeight: "600",
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