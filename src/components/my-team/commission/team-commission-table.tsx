import React from "react";
import { FlatList, View, TouchableOpacity, RefreshControl, StyleSheet } from "react-native";
import type { Task } from '../../../types';
import { ThemedText } from "@/components/ui/themed-text";
import { Badge } from "@/components/ui/badge";
import { useTheme } from "@/lib/theme";
import { COMMISSION_STATUS_LABELS } from '../../../constants';
import { formatCurrency, formatDate } from '../../../utils';
import { IconUser, IconBriefcase } from "@tabler/icons-react-native";

interface TeamCommissionTableProps {
  tasks: Task[];
  onTaskPress?: (taskId: string) => void;
  onRefresh?: () => Promise<void>;
  onEndReached?: () => void;
  refreshing?: boolean;
  loading?: boolean;
  loadingMore?: boolean;
}

export function TeamCommissionTable({
  tasks,
  onTaskPress,
  onRefresh,
  onEndReached,
  refreshing,
  loading,
  loadingMore,
}: TeamCommissionTableProps) {
  const { colors } = useTheme();

  const getCommissionBadgeVariant = (status: string) => {
    switch (status) {
      case "FULL_COMMISSION":
        return "success";
      case "PARTIAL_COMMISSION":
        return "warning";
      case "SUSPENDED_COMMISSION":
        return "destructive";
      default:
        return "secondary";
    }
  };

  const getCommissionValue = (task: Task): string => {
    if (!task.price) return "R$ 0,00";

    switch (task.commission) {
      case "FULL_COMMISSION":
        return formatCurrency(task.price);
      case "PARTIAL_COMMISSION":
        // Assuming 50% for partial commission
        return formatCurrency(task.price * 0.5);
      default:
        return "R$ 0,00";
    }
  };

  const renderTask = ({ item }: { item: Task }) => {
    return (
      <TouchableOpacity
        style={[styles.row, { backgroundColor: colors.card, borderColor: colors.border }]}
        onPress={() => onTaskPress?.(item.id)}
        activeOpacity={0.7}
      >
        <View style={styles.mainContent}>
          {/* Header: Team Member and Status */}
          <View style={styles.header}>
            <View style={styles.userInfo}>
              <View style={[styles.iconContainer, { backgroundColor: colors.border }]}>
                <IconUser size={16} color={colors.text} />
              </View>
              <ThemedText style={styles.userName} numberOfLines={1}>
                {item.createdBy?.name || "Colaborador"}
              </ThemedText>
            </View>
            <Badge variant={getCommissionBadgeVariant(item.commission)} size="sm">
              <ThemedText style={styles.badgeText}>
                {COMMISSION_STATUS_LABELS[item.commission as keyof typeof COMMISSION_STATUS_LABELS] || item.commission}
              </ThemedText>
            </Badge>
          </View>

          {/* Task Reference */}
          <View style={styles.taskInfo}>
            <View style={[styles.iconContainer, { backgroundColor: colors.border }]}>
              <IconBriefcase size={14} color={colors.text} />
            </View>
            <ThemedText style={styles.taskName} numberOfLines={1}>
              {item.name || `#${item.serialNumber || item.id.substring(0, 8)}`}
            </ThemedText>
          </View>

          {/* Customer Info (if available) */}
          {item.customer && (
            <ThemedText style={styles.customerName} numberOfLines={1}>
              Cliente: {item.customer.name}
            </ThemedText>
          )}

          {/* Bottom Row: Value and Date */}
          <View style={styles.footer}>
            <View style={styles.valueContainer}>
              <ThemedText style={styles.valueLabel}>Comissão:</ThemedText>
              <ThemedText style={[styles.value, { color: item.commission === "NO_COMMISSION" ? colors.text : "#10b981" }]}>
                {getCommissionValue(item)}
              </ThemedText>
            </View>
            <ThemedText style={styles.date}>
              {formatDate(new Date(item.createdAt))}
            </ThemedText>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderFooter = () => {
    if (!loadingMore) return null;
    return (
      <View style={styles.footerLoader}>
        <ThemedText style={styles.footerText}>Carregando mais...</ThemedText>
      </View>
    );
  };

  const renderEmpty = () => {
    if (loading) return null;
    return (
      <View style={styles.empty}>
        <ThemedText style={styles.emptyText}>Nenhum serviço com comissão encontrado</ThemedText>
        <ThemedText style={styles.emptySubtext}>
          Os serviços realizados pela sua equipe aparecerão aqui
        </ThemedText>
      </View>
    );
  };

  return (
    <FlatList
      data={tasks}
      renderItem={renderTask}
      keyExtractor={(item) => item.id}
      refreshControl={
        <RefreshControl refreshing={refreshing || false} onRefresh={onRefresh} tintColor={colors.primary} />
      }
      onEndReached={onEndReached}
      onEndReachedThreshold={0.5}
      ListFooterComponent={renderFooter}
      ListEmptyComponent={renderEmpty}
      contentContainerStyle={[styles.listContent, tasks.length === 0 && styles.emptyList]}
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
    marginBottom: 12,
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: 8,
  },
  iconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  userName: {
    fontSize: 16,
    fontWeight: "600",
    flex: 1,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "600",
  },
  taskInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  taskName: {
    fontSize: 14,
    flex: 1,
  },
  customerName: {
    fontSize: 13,
    opacity: 0.7,
    marginBottom: 8,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(128, 128, 128, 0.1)",
  },
  valueContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  valueLabel: {
    fontSize: 13,
    opacity: 0.6,
  },
  value: {
    fontSize: 16,
    fontWeight: "700",
  },
  date: {
    fontSize: 12,
    opacity: 0.5,
  },
  footerLoader: {
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
    opacity: 0.7,
    marginBottom: 8,
    textAlign: "center",
  },
  emptySubtext: {
    fontSize: 14,
    opacity: 0.5,
    textAlign: "center",
  },
});
