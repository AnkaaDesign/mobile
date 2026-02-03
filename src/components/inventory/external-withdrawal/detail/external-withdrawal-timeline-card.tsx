import React from "react";
import { View, StyleSheet } from "react-native";
import { Card } from "@/components/ui/card";
import { ThemedText } from "@/components/ui/themed-text";
import { useTheme } from "@/lib/theme";
import { spacing, fontSize, fontWeight, borderRadius } from "@/constants/design-system";
import { formatDateTime } from "@/utils";
import { EXTERNAL_WITHDRAWAL_STATUS, EXTERNAL_WITHDRAWAL_STATUS_LABELS } from "@/constants";
import type { ExternalWithdrawal } from "@/types";
import {
  IconCircleCheck,
  IconClock,
  IconX,
  IconAlertCircle,
  IconCurrencyReal,
  IconPackage,
  IconArrowBack,
  IconTruckDelivery,
} from "@tabler/icons-react-native";

interface ExternalWithdrawalTimelineCardProps {
  withdrawal: ExternalWithdrawal;
}

export const ExternalWithdrawalTimelineCard: React.FC<ExternalWithdrawalTimelineCardProps> = ({ withdrawal }) => {
  const { colors } = useTheme();

  const getStatusIcon = (status: EXTERNAL_WITHDRAWAL_STATUS) => {
    switch (status) {
      case EXTERNAL_WITHDRAWAL_STATUS.PENDING:
        return IconClock;
      case EXTERNAL_WITHDRAWAL_STATUS.PARTIALLY_RETURNED:
        return IconAlertCircle;
      case EXTERNAL_WITHDRAWAL_STATUS.FULLY_RETURNED:
        return IconCircleCheck;
      case EXTERNAL_WITHDRAWAL_STATUS.CHARGED:
        return IconCurrencyReal;
      case EXTERNAL_WITHDRAWAL_STATUS.LIQUIDATED:
        return IconCircleCheck;
      case EXTERNAL_WITHDRAWAL_STATUS.DELIVERED:
        return IconTruckDelivery;
      case EXTERNAL_WITHDRAWAL_STATUS.CANCELLED:
        return IconX;
      default:
        return IconPackage;
    }
  };

  const getStatusColor = (status: EXTERNAL_WITHDRAWAL_STATUS) => {
    switch (status) {
      case EXTERNAL_WITHDRAWAL_STATUS.PENDING:
        return colors.warning;
      case EXTERNAL_WITHDRAWAL_STATUS.PARTIALLY_RETURNED:
        return "#f97316"; // orange
      case EXTERNAL_WITHDRAWAL_STATUS.FULLY_RETURNED:
        return colors.success;
      case EXTERNAL_WITHDRAWAL_STATUS.CHARGED:
        return colors.primary;
      case EXTERNAL_WITHDRAWAL_STATUS.LIQUIDATED:
        return colors.success;
      case EXTERNAL_WITHDRAWAL_STATUS.DELIVERED:
        return colors.success;
      case EXTERNAL_WITHDRAWAL_STATUS.CANCELLED:
        return colors.destructive;
      default:
        return colors.mutedForeground;
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
    title: "Retirada Externa Criada",
    description: `Criado por ${withdrawal.withdrawerName}`,
    date: withdrawal.createdAt,
    icon: IconPackage,
    color: colors.primary,
  });

  // Add current status event if it's not the same as creation
  if (withdrawal.status !== EXTERNAL_WITHDRAWAL_STATUS.PENDING) {
    const StatusIcon = getStatusIcon(withdrawal.status);
    let description: string | undefined;

    if (withdrawal.status === EXTERNAL_WITHDRAWAL_STATUS.FULLY_RETURNED) {
      description = "Todos os itens foram devolvidos";
    } else if (withdrawal.status === EXTERNAL_WITHDRAWAL_STATUS.PARTIALLY_RETURNED) {
      description = "Alguns itens foram devolvidos";
    } else if (withdrawal.status === EXTERNAL_WITHDRAWAL_STATUS.CHARGED) {
      description = "Valor cobrado do responsável";
    } else if (withdrawal.status === EXTERNAL_WITHDRAWAL_STATUS.LIQUIDATED) {
      description = "Cobrança liquidada";
    } else if (withdrawal.status === EXTERNAL_WITHDRAWAL_STATUS.DELIVERED) {
      description = "Itens entregues (cortesia)";
    } else if (withdrawal.status === EXTERNAL_WITHDRAWAL_STATUS.CANCELLED) {
      description = "Retirada foi cancelada";
    }

    timelineEvents.push({
      id: "current-status",
      title: EXTERNAL_WITHDRAWAL_STATUS_LABELS[withdrawal.status],
      description,
      date: withdrawal.updatedAt || withdrawal.createdAt,
      icon: StatusIcon,
      color: getStatusColor(withdrawal.status),
    });
  }

  // Sort by date (newest first)
  timelineEvents.sort((a, b) => {
    const dateA = new Date(a.date).getTime();
    const dateB = new Date(b.date).getTime();
    return dateB - dateA;
  });

  return (
    <Card style={styles.card}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <View style={[styles.iconContainer, { backgroundColor: colors.primary + "20" }]}>
          <IconArrowBack size={20} color={colors.primary} />
        </View>
        <ThemedText style={styles.title}>Linha do Tempo</ThemedText>
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
                    styles.timelineIconContainer,
                    { backgroundColor: event.color + "20" },
                  ])}
                >
                  <Icon size={16} color={event.color} />
                </View>
                {!isLast && <View style={StyleSheet.flatten([styles.line, { backgroundColor: colors.border }])} />}
              </View>

              <View style={styles.timelineContent}>
                <ThemedText style={[styles.eventTitle, { color: colors.foreground }]}>{event.title}</ThemedText>
                {event.description && (
                  <ThemedText style={[styles.eventDescription, { color: colors.mutedForeground }]}>
                    {event.description}
                  </ThemedText>
                )}
                <ThemedText style={[styles.eventDate, { color: colors.mutedForeground }]}>
                  {formatDateTime(event.date)}
                </ThemedText>
              </View>
            </View>
          );
        })}

        {timelineEvents.length === 0 && (
          <ThemedText style={[styles.emptyText, { color: colors.mutedForeground }]}>
            Nenhum histórico disponível
          </ThemedText>
        )}
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: 0,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.semibold,
    marginLeft: spacing.sm,
    flex: 1,
  },
  timeline: {
    padding: spacing.md,
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
  timelineIconContainer: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.full,
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
    fontWeight: fontWeight.semibold,
    marginBottom: 2,
  },
  eventDescription: {
    fontSize: fontSize.sm,
    marginBottom: spacing.xs,
  },
  eventDate: {
    fontSize: fontSize.xs,
  },
  emptyText: {
    fontSize: fontSize.sm,
    textAlign: "center",
    paddingVertical: spacing.lg,
  },
});
