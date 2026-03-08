
import { View, StyleSheet, ScrollView } from "react-native";
import { ThemedText } from "@/components/ui/themed-text";
import { Badge } from "@/components/ui/badge";
import { useTheme } from "@/lib/theme";
import { spacing, borderRadius, fontSize } from "@/constants/design-system";
import { extendedColors } from "@/lib/theme/extended-colors";
import { IconHistory, IconUser, IconPackage, IconCalendar, IconCircleCheck, IconClock, IconAlertTriangle } from "@tabler/icons-react-native";
import { PPE_DELIVERY_STATUS, PPE_DELIVERY_STATUS_LABELS } from "@/constants";
import { formatDate, formatRelativeTime, formatQuantity } from "@/utils";
import type { PpeDeliverySchedule } from '../../../../../types';
import { DetailCard } from "@/components/ui/detail-page-layout";

interface DeliveryHistoryCardProps {
  schedule: PpeDeliverySchedule;
  maxHeight?: number;
}

export function DeliveryHistoryCard({ schedule, maxHeight = 400 }: DeliveryHistoryCardProps) {
  const { colors, isDark } = useTheme();

  const deliveries = schedule.deliveries || [];
  const sortedDeliveries = [...deliveries].sort(
    (a, b) =>
      new Date(b.scheduledDate || b.createdAt).getTime() -
      new Date(a.scheduledDate || a.createdAt).getTime()
  );

  const getStatusColor = (status: PPE_DELIVERY_STATUS) => {
    switch (status) {
      case PPE_DELIVERY_STATUS.DELIVERED:
        return {
          bg: isDark ? extendedColors.green[900] : extendedColors.green[100],
          text: isDark ? extendedColors.green[400] : extendedColors.green[700],
          icon: isDark ? extendedColors.green[400] : extendedColors.green[600],
        };
      case PPE_DELIVERY_STATUS.PENDING:
        return {
          bg: isDark ? extendedColors.yellow[900] : extendedColors.yellow[100],
          text: isDark ? extendedColors.yellow[400] : extendedColors.yellow[700],
          icon: isDark ? extendedColors.yellow[400] : extendedColors.yellow[600],
        };
      case PPE_DELIVERY_STATUS.REPROVED:
        return {
          bg: isDark ? extendedColors.red[900] : extendedColors.red[100],
          text: isDark ? extendedColors.red[400] : extendedColors.red[700],
          icon: isDark ? extendedColors.red[400] : extendedColors.red[600],
        };
      default:
        return {
          bg: colors.muted,
          text: colors.mutedForeground,
          icon: colors.mutedForeground,
        };
    }
  };

  if (sortedDeliveries.length === 0) {
    return (
      <DetailCard title="Histórico de Entregas" icon="history">
        <View
          style={StyleSheet.flatten([
            styles.emptyState,
            { backgroundColor: colors.muted + "30" },
          ])}
        >
          <IconHistory size={40} color={colors.mutedForeground} />
          <ThemedText
            style={StyleSheet.flatten([styles.emptyText, { color: colors.mutedForeground }])}
          >
            Nenhuma entrega registrada
          </ThemedText>
        </View>
      </DetailCard>
    );
  }

  return (
    <DetailCard
      title="Histórico de Entregas"
      icon="history"
      badge={
        <Badge variant="secondary">
          <ThemedText
            style={{
              color: colors.secondaryForeground,
              fontSize: fontSize.xs,
            }}
          >
            {sortedDeliveries.length}
          </ThemedText>
        </Badge>
      }
    >
      <ScrollView
        style={StyleSheet.flatten([styles.scrollView, { maxHeight }])}
        showsVerticalScrollIndicator={true}
        nestedScrollEnabled={true}
      >
        <View style={styles.deliveriesList}>
          {sortedDeliveries.map((delivery) => {
            const statusColors = getStatusColor(delivery.status);
            return (
              <View
                key={delivery.id}
                style={StyleSheet.flatten([
                  styles.deliveryItem,
                  {
                    backgroundColor: colors.muted + "30",
                    borderColor: colors.border,
                  },
                ])}
              >
                <View style={styles.deliveryHeader}>
                  <Badge
                    variant="secondary"
                    style={{ backgroundColor: statusColors.bg }}
                  >
                    {delivery.status === PPE_DELIVERY_STATUS.DELIVERED && (
                      <IconCircleCheck size={14} color={statusColors.icon} />
                    )}
                    {delivery.status === PPE_DELIVERY_STATUS.PENDING && (
                      <IconClock size={14} color={statusColors.icon} />
                    )}
                    {delivery.status === PPE_DELIVERY_STATUS.REPROVED && (
                      <IconAlertTriangle size={14} color={statusColors.icon} />
                    )}
                    <ThemedText
                      style={{
                        color: statusColors.text,
                        fontSize: fontSize.xs,
                        marginLeft: spacing.xs,
                      }}
                    >
                      {PPE_DELIVERY_STATUS_LABELS[delivery.status]}
                    </ThemedText>
                  </Badge>
                </View>

                <View style={styles.deliveryInfo}>
                  {delivery.user && (
                    <View style={styles.infoRow}>
                      <IconUser size={14} color={colors.mutedForeground} />
                      <ThemedText
                        style={StyleSheet.flatten([
                          styles.infoText,
                          { color: colors.foreground },
                        ])}
                      >
                        {delivery.user.name}
                      </ThemedText>
                    </View>
                  )}

                  {delivery.item && (
                    <View style={styles.infoRow}>
                      <IconPackage size={14} color={colors.mutedForeground} />
                      <ThemedText
                        style={StyleSheet.flatten([
                          styles.infoText,
                          { color: colors.foreground },
                        ])}
                      >
                        {delivery.item.name} ({formatQuantity(delivery.quantity)}x)
                      </ThemedText>
                    </View>
                  )}

                  <View style={styles.infoRow}>
                    <IconCalendar size={14} color={colors.mutedForeground} />
                    <ThemedText
                      style={StyleSheet.flatten([
                        styles.infoText,
                        { color: colors.mutedForeground },
                      ])}
                    >
                      {delivery.actualDeliveryDate
                        ? `Entregue ${formatDate(new Date(delivery.actualDeliveryDate))}`
                        : delivery.scheduledDate
                          ? `Agendado ${formatDate(new Date(delivery.scheduledDate))}`
                          : formatRelativeTime(new Date(delivery.createdAt))}
                    </ThemedText>
                  </View>
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>
    </DetailCard>
  );
}

const styles = StyleSheet.create({
  emptyState: {
    padding: spacing.xl,
    borderRadius: borderRadius.md,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.md,
  },
  emptyText: {
    fontSize: fontSize.sm,
    textAlign: "center",
  },
  scrollView: {
    width: "100%",
  },
  deliveriesList: {
    gap: spacing.md,
  },
  deliveryItem: {
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    gap: spacing.sm,
  },
  deliveryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.xs,
  },
  deliveryInfo: {
    gap: spacing.xs,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  infoText: {
    fontSize: fontSize.sm,
    flex: 1,
  },
});
