import React from "react";
import { View, StyleSheet} from "react-native";
import { Card } from "@/components/ui/card";
import { ThemedText } from "@/components/ui/themed-text";
import { useTheme } from "@/lib/theme";
import { spacing, fontSize } from "@/constants/design-system";
import { formatDateTime } from '../../../../utils';
import { ORDER_STATUS, ORDER_STATUS_LABELS } from '../../../../constants';
import type { Order, Activity } from '../../../../types';
import {
  IconCircleCheck,
  IconClock,
  IconPackage,
  IconX,
  IconTruck,
} from "@tabler/icons-react-native";

interface OrderTimelineCardProps {
  order: Order;
  activities?: Activity[];
}

export const OrderTimelineCard: React.FC<OrderTimelineCardProps> = ({ order, activities = [] }) => {
  const { colors } = useTheme();

  const getStatusIcon = (status: ORDER_STATUS) => {
    switch (status) {
      case ORDER_STATUS.CREATED:
        return IconClock;
      case ORDER_STATUS.PARTIALLY_FULFILLED:
      case ORDER_STATUS.FULFILLED:
        return IconPackage;
      case ORDER_STATUS.PARTIALLY_RECEIVED:
      case ORDER_STATUS.RECEIVED:
        return IconTruck;
      case ORDER_STATUS.CANCELLED:
        return IconX;
      default:
        return IconCircleCheck;
    }
  };

  const getStatusColor = (status: ORDER_STATUS) => {
    switch (status) {
      case ORDER_STATUS.CREATED:
        return colors.primary;
      case ORDER_STATUS.PARTIALLY_FULFILLED:
      case ORDER_STATUS.PARTIALLY_RECEIVED:
      case ORDER_STATUS.OVERDUE:
        return "#f59e0b"; // warning
      case ORDER_STATUS.FULFILLED:
        return colors.secondary;
      case ORDER_STATUS.RECEIVED:
        return "#10b981"; // success
      case ORDER_STATUS.CANCELLED:
        return "#ef4444"; // destructive
      default:
        return colors.muted;
    }
  };

  // Build timeline events
  const timelineEvents: Array<{
    id: string;
    title: string;
    description?: string;
    date: Date | string;
    icon: any;
    color: string;
  }> = [];

  // Add creation event
  timelineEvents.push({
    id: "created",
    title: "Pedido Criado",
    description: undefined,
    date: order.createdAt,
    icon: IconClock,
    color: colors.primary,
  });

  // Add current status
  if (order.status !== ORDER_STATUS.CREATED) {
    const StatusIcon = getStatusIcon(order.status);
    timelineEvents.push({
      id: "current-status",
      title: ORDER_STATUS_LABELS[order.status],
      date: order.updatedAt,
      icon: StatusIcon,
      color: getStatusColor(order.status),
    });
  }

  // Add delivery if exists
  if (order.updatedAt) {
    timelineEvents.push({
      id: "delivered",
      title: "Entregue",
      date: order.updatedAt,
      icon: IconTruck,
      color: "#10b981",
    });
  }

  // Sort by date
  timelineEvents.sort((a, b) => {
    const dateA = new Date(a.date).getTime();
    const dateB = new Date(b.date).getTime();
    return dateB - dateA; // Newest first
  });

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <ThemedText style={styles.title}>Histórico</ThemedText>
      </View>

      <View style={styles.timeline}>
        {timelineEvents.map((event, index) => {
          const Icon = event.icon;
          const isLast = index === timelineEvents.length - 1;

          return (
            <View key={event.id} style={styles.timelineItem}>
              <View style={styles.timelineLeft}>
                <View
                  style={StyleSheet.flatten([
                    styles.iconContainer,
                    { backgroundColor: event.color + "20" },
                  ])}
                >
                  <Icon size={16} color={event.color} />
                </View>
                {!isLast && <View style={StyleSheet.flatten([styles.line, { backgroundColor: colors.border }])} />}
              </View>

              <View style={styles.timelineContent}>
                <ThemedText style={styles.eventTitle}>{event.title}</ThemedText>
                {event.description && (
                  <ThemedText style={styles.eventDescription}>
                    {event.description}
                  </ThemedText>
                )}
                <ThemedText style={styles.eventDate}>
                  {formatDateTime(event.date)}
                </ThemedText>
              </View>
            </View>
          );
        })}

        {timelineEvents.length === 0 && (
          <ThemedText style={styles.emptyText}>
            Nenhum histórico disponível
          </ThemedText>
        )}
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: spacing.md,
  },
  header: {
    marginBottom: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  title: {
    fontSize: fontSize.lg,
    fontWeight: "600",
  },
  timeline: {
    paddingLeft: spacing.xs,
  },
  timelineItem: {
    flexDirection: "row",
    minHeight: 60,
  },
  timelineLeft: {
    width: 32,
    alignItems: "center",
    marginRight: spacing.md,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  line: {
    width: 1,
    flex: 1,
    marginTop: spacing.xs,
  },
  timelineContent: {
    flex: 1,
    paddingBottom: spacing.lg,
  },
  eventTitle: {
    fontSize: fontSize.md,
    fontWeight: "600",
    marginBottom: 2,
  },
  eventDescription: {
    fontSize: fontSize.sm,
    opacity: 0.8,
    marginBottom: spacing.xs,
  },
  eventDate: {
    fontSize: fontSize.xs,
    opacity: 0.6,
  },
  emptyText: {
    fontSize: fontSize.sm,
    opacity: 0.6,
    textAlign: "center",
    paddingVertical: spacing.lg,
  },
});