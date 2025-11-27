import { useState, useMemo, useCallback } from "react";
import { View, StyleSheet, ActivityIndicator, ScrollView } from "react-native";
import { Card } from "@/components/ui/card";
import { ThemedText } from "@/components/ui/themed-text";
import { Badge } from "@/components/ui/badge";
import { useTheme } from "@/lib/theme";
import { spacing, fontSize, borderRadius } from "@/constants/design-system";
import { IconClipboardList, IconAlertCircle, IconClock, IconLoader, IconCircleCheckFilled, IconX } from "@tabler/icons-react-native";
import type { Customer, ServiceOrder } from '../../../../types';
import { formatDate } from "@/utils";
import { SERVICE_ORDER_STATUS, SERVICE_ORDER_STATUS_LABELS } from "@/constants";

interface ServiceOrdersTableProps {
  customer: Customer;
  maxHeight?: number;
}

// Status config for mobile
const SERVICE_ORDER_STATUS_CONFIG: Record<
  string,
  {
    icon: any;
    badgeVariant: "default" | "secondary" | "outline" | "success" | "warning" | "destructive";
  }
> = {
  [SERVICE_ORDER_STATUS.PENDING]: {
    icon: IconClock,
    badgeVariant: "secondary",
  },
  [SERVICE_ORDER_STATUS.IN_PROGRESS]: {
    icon: IconLoader,
    badgeVariant: "default",
  },
  [SERVICE_ORDER_STATUS.COMPLETED]: {
    icon: IconCircleCheckFilled,
    badgeVariant: "success",
  },
  [SERVICE_ORDER_STATUS.CANCELLED]: {
    icon: IconX,
    badgeVariant: "destructive",
  },
};

export function ServiceOrdersTable({ customer, maxHeight = 400 }: ServiceOrdersTableProps) {
  const { colors } = useTheme();
  const [isLoading] = useState(false);

  // Get service orders through tasks (same logic as web)
  const serviceOrders = useMemo(() => {
    if (!customer.tasks) return [];

    const orders: ServiceOrder[] = [];
    customer.tasks.forEach((task) => {
      if (task.services) {
        orders.push(...task.services);
      }
    });
    return orders;
  }, [customer.tasks]);

  // Sort service orders by status priority and date
  const sortedServiceOrders = useMemo(() => {
    return [...serviceOrders].sort((a, b) => {
      const statusPriority: Record<string, number> = {
        [SERVICE_ORDER_STATUS.IN_PROGRESS]: 1,
        [SERVICE_ORDER_STATUS.PENDING]: 2,
        [SERVICE_ORDER_STATUS.COMPLETED]: 3,
        [SERVICE_ORDER_STATUS.CANCELLED]: 4,
      };

      const aPriority = a.status ? (statusPriority[a.status] ?? 5) : 5;
      const bPriority = b.status ? (statusPriority[b.status] ?? 5) : 5;

      if (aPriority !== bPriority) return aPriority - bPriority;

      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [serviceOrders]);

  // Calculate statistics
  const statistics = useMemo(() => {
    const totalOrders = serviceOrders.length;
    const activeOrders = serviceOrders.filter((order) =>
      order.status &&
      order.status !== SERVICE_ORDER_STATUS.CANCELLED &&
      order.status !== SERVICE_ORDER_STATUS.COMPLETED
    ).length;
    const completedOrders = serviceOrders.filter((order) =>
      order.status === SERVICE_ORDER_STATUS.COMPLETED
    ).length;

    const statusCounts = serviceOrders.reduce(
      (acc, order) => {
        if (order.status) {
          acc[order.status] = (acc[order.status] || 0) + 1;
        }
        return acc;
      },
      {} as Record<string, number>,
    );

    return {
      totalOrders,
      activeOrders,
      completedOrders,
      statusCounts,
    };
  }, [serviceOrders]);

  // Don't show if no service orders
  if (!isLoading && serviceOrders.length === 0) {
    return null;
  }

  return (
    <Card style={styles.card}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <View style={styles.headerLeft}>
          <IconClipboardList size={20} color={colors.mutedForeground} />
          <ThemedText style={styles.title}>
            Ordens de Serviço {serviceOrders.length > 0 && `(${serviceOrders.length})`}
          </ThemedText>
        </View>
      </View>

      <View style={styles.content}>
        {/* Statistics Summary */}
        {serviceOrders.length > 0 && (
          <View style={styles.statsContainer}>
            <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <ThemedText style={[styles.statLabel, { color: colors.mutedForeground }]}>
                Total
              </ThemedText>
              <ThemedText style={[styles.statValue, { color: colors.foreground }]}>
                {statistics.totalOrders}
              </ThemedText>
            </View>

            <View style={[styles.statCard, { backgroundColor: colors.primary + "10", borderColor: colors.primary + "40" }]}>
              <ThemedText style={[styles.statLabel, { color: colors.primary }]}>
                Ativas
              </ThemedText>
              <ThemedText style={[styles.statValue, { color: colors.primary }]}>
                {statistics.activeOrders}
              </ThemedText>
            </View>

            <View style={[styles.statCard, { backgroundColor: colors.success + "10", borderColor: colors.success + "40" }]}>
              <ThemedText style={[styles.statLabel, { color: colors.success }]}>
                Finalizadas
              </ThemedText>
              <ThemedText style={[styles.statValue, { color: colors.success }]}>
                {statistics.completedOrders}
              </ThemedText>
            </View>
          </View>
        )}

        {/* Service Orders List */}
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <ThemedText style={[styles.loadingText, { color: colors.mutedForeground }]}>
              Carregando ordens de serviço...
            </ThemedText>
          </View>
        ) : sortedServiceOrders.length === 0 ? (
          <View style={[styles.emptyState, { backgroundColor: colors.muted + "20" }]}>
            <IconAlertCircle size={48} color={colors.mutedForeground} />
            <ThemedText style={[styles.emptyText, { color: colors.mutedForeground }]}>
              Nenhuma ordem de serviço associada a este cliente.
            </ThemedText>
          </View>
        ) : (
          <ScrollView
            style={[styles.scrollContainer, { maxHeight }]}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.ordersList}>
              {sortedServiceOrders.map((serviceOrder: any, index) => {
                const status = serviceOrder.status || SERVICE_ORDER_STATUS.PENDING;
                const config = SERVICE_ORDER_STATUS_CONFIG[status];
                const StatusIcon = config.icon;
                const serviceOrderDescription = serviceOrder.description ||
                  `Ordem #${serviceOrder.id.slice(-8).toUpperCase()}`;

                return (
                  <View
                    key={serviceOrder.id}
                    style={[
                      styles.orderCard,
                      {
                        backgroundColor: colors.card,
                        borderColor: colors.border
                      },
                      index < sortedServiceOrders.length - 1 && styles.orderCardMargin
                    ]}
                  >
                    {/* Order Header */}
                    <View style={styles.orderHeader}>
                      <View style={styles.orderTitleRow}>
                        <StatusIcon size={16} color={colors.primary} />
                        <ThemedText
                          style={[styles.orderTitle, { color: colors.foreground }]}
                          numberOfLines={1}
                        >
                          {serviceOrderDescription}
                        </ThemedText>
                      </View>
                      <Badge variant={config.badgeVariant} style={styles.statusBadge}>
                        {SERVICE_ORDER_STATUS_LABELS[status as SERVICE_ORDER_STATUS]}
                      </Badge>
                    </View>

                    {/* Task Info */}
                    {serviceOrder.task && (
                      <View style={styles.taskInfo}>
                        <ThemedText style={[styles.taskLabel, { color: colors.mutedForeground }]}>
                          Tarefa:
                        </ThemedText>
                        <ThemedText
                          style={[styles.taskValue, { color: colors.foreground }]}
                          numberOfLines={1}
                        >
                          {serviceOrder.task.name || serviceOrder.task.details ||
                            `#${serviceOrder.task.id.slice(-8).toUpperCase()}`}
                        </ThemedText>
                      </View>
                    )}

                    {/* Order Footer */}
                    <View style={styles.orderFooter}>
                      <View style={styles.dateInfo}>
                        <IconClock size={14} color={colors.mutedForeground} />
                        <ThemedText style={[styles.dateText, { color: colors.mutedForeground }]}>
                          {formatDate(serviceOrder.createdAt)}
                        </ThemedText>
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>
          </ScrollView>
        )}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: spacing.md,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  title: {
    fontSize: fontSize.lg,
    fontWeight: "500",
  },
  content: {
    gap: spacing.md,
  },
  statsContainer: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  statCard: {
    flex: 1,
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    alignItems: "center",
  },
  statLabel: {
    fontSize: fontSize.xs,
    fontWeight: "500",
  },
  statValue: {
    fontSize: fontSize.xl,
    fontWeight: "700",
    marginTop: spacing.xs / 2,
  },
  scrollContainer: {
    flex: 1,
  },
  ordersList: {
    gap: spacing.md,
  },
  orderCard: {
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    gap: spacing.sm,
  },
  orderCardMargin: {
    marginBottom: spacing.sm,
  },
  orderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: spacing.sm,
  },
  orderTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    flex: 1,
  },
  orderTitle: {
    fontSize: fontSize.base,
    fontWeight: "600",
    flex: 1,
  },
  statusBadge: {
    // Badge styles from theme
  },
  taskInfo: {
    flexDirection: "row",
    gap: spacing.xs,
    alignItems: "center",
  },
  taskLabel: {
    fontSize: fontSize.xs,
    fontWeight: "500",
  },
  taskValue: {
    fontSize: fontSize.xs,
    flex: 1,
  },
  orderFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.05)",
  },
  dateInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs / 2,
  },
  dateText: {
    fontSize: fontSize.xs,
  },
  loadingContainer: {
    paddingVertical: spacing.xxl,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.md,
  },
  loadingText: {
    fontSize: fontSize.sm,
  },
  emptyState: {
    paddingVertical: spacing.xl,
    borderRadius: borderRadius.lg,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.md,
  },
  emptyText: {
    fontSize: fontSize.sm,
    textAlign: "center",
  },
});
