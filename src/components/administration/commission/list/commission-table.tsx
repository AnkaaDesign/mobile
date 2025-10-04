import React from "react";
import { FlatList, View, TouchableOpacity, RefreshControl, StyleSheet } from "react-native";
import type { Commission } from '../../../../types';
import { ThemedText, ThemedView } from "@/components/ui";
import { Badge } from "@/components/ui/badge";
import { useTheme } from "@/lib/theme";
import { COMMISSION_STATUS_LABELS } from '../../../../constants';
import { formatCurrency, formatDate } from '../../../../utils';
import { CommissionTableRowSwipe } from "./commission-table-row-swipe";

interface CommissionTableProps {
  commissions: Commission[];
  onCommissionPress?: (commissionId: string) => void;
  onCommissionEdit?: (commissionId: string) => void;
  onCommissionDelete?: (commissionId: string) => void;
  onRefresh?: () => Promise<void>;
  onEndReached?: () => void;
  refreshing?: boolean;
  loading?: boolean;
  loadingMore?: boolean;
  enableSwipeActions?: boolean;
}

export function CommissionTable({
  commissions,
  onCommissionPress,
  onCommissionEdit,
  onCommissionDelete,
  onRefresh,
  onEndReached,
  refreshing,
  loading,
  loadingMore,
  enableSwipeActions = true,
}: CommissionTableProps) {
  const { colors } = useTheme();

  const renderCommission = ({ item }: { item: Commission }) => {
    const content = (
      <TouchableOpacity
        style={[styles.row, { backgroundColor: colors.card, borderColor: colors.border }]}
        onPress={() => onCommissionPress?.(item.id)}
        activeOpacity={0.7}
      >
        <View style={styles.mainContent}>
          {/* User and Task Info */}
          <View style={styles.header}>
            <ThemedText style={styles.userName} numberOfLines={1}>
              {item.user?.name || "Colaborador"}
            </ThemedText>
            <Badge
              variant={
                item.status === "FULL_COMMISSION"
                  ? "success"
                  : item.status === "PARTIAL_COMMISSION"
                    ? "warning"
                    : item.status === "SUSPENDED_COMMISSION"
                      ? "destructive"
                      : "secondary"
              }
              size="sm"
            >
              <ThemedText style={styles.badgeText}>
                {COMMISSION_STATUS_LABELS[item.status as keyof typeof COMMISSION_STATUS_LABELS] || item.status}
              </ThemedText>
            </Badge>
          </View>

          {/* Task Reference */}
          {item.task && (
            <ThemedText style={styles.taskName} numberOfLines={1}>
              Serviço: {item.task.name || `#${item.taskId}`}
            </ThemedText>
          )}

          {/* Reason (if exists) */}
          {item.reason && (
            <ThemedText style={styles.reason} numberOfLines={2}>
              {item.reason}
            </ThemedText>
          )}

          {/* Date */}
          <ThemedText style={styles.date} numberOfLines={1}>
            {formatDate(new Date(item.createdAt))}
          </ThemedText>
        </View>
      </TouchableOpacity>
    );

    if (enableSwipeActions) {
      return (
        <CommissionTableRowSwipe
          commission={item}
          onEdit={onCommissionEdit}
          onDelete={onCommissionDelete}
        >
          {content}
        </CommissionTableRowSwipe>
      );
    }

    return content;
  };

  const renderFooter = () => {
    if (!loadingMore) return null;
    return (
      <View style={styles.footer}>
        <ThemedText style={styles.footerText}>Carregando mais...</ThemedText>
      </View>
    );
  };

  const renderEmpty = () => {
    if (loading) return null;
    return (
      <View style={styles.empty}>
        <ThemedText style={styles.emptyText}>Nenhuma comissão encontrada</ThemedText>
      </View>
    );
  };

  return (
    <FlatList
      data={commissions}
      renderItem={renderCommission}
      keyExtractor={(item) => item.id}
      refreshControl={
        <RefreshControl
          refreshing={refreshing || false}
          onRefresh={onRefresh}
          tintColor={colors.primary}
        />
      }
      onEndReached={onEndReached}
      onEndReachedThreshold={0.5}
      ListFooterComponent={renderFooter}
      ListEmptyComponent={renderEmpty}
      contentContainerStyle={[styles.listContent, commissions.length === 0 && styles.emptyList]}
      showsVerticalScrollIndicator={false}
    />
  );
}

const styles = StyleSheet.create({
  listContent: {
    padding: 8,
  },
  emptyList: {
    flexGrow: 1,
  },
  row: {
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    overflow: "hidden",
  },
  mainContent: {
    padding: 16,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  userName: {
    fontSize: 16,
    fontWeight: "600",
    flex: 1,
    marginRight: 8,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "600",
  },
  taskName: {
    fontSize: 14,
    opacity: 0.7,
    marginBottom: 4,
  },
  reason: {
    fontSize: 13,
    opacity: 0.6,
    marginTop: 4,
    fontStyle: "italic",
  },
  date: {
    fontSize: 12,
    opacity: 0.5,
    marginTop: 8,
  },
  footer: {
    padding: 16,
    alignItems: "center",
  },
  footerText: {
    fontSize: 14,
    opacity: 0.7,
  },
  empty: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  emptyText: {
    fontSize: 16,
    opacity: 0.5,
  },
});
