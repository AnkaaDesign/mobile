
import { View, StyleSheet, ScrollView } from "react-native";

import { Card } from "@/components/ui/card";
import { ThemedText } from "@/components/ui/themed-text";
import { Badge } from "@/components/ui/badge";

import { useTheme } from "@/lib/theme";
import { spacing, borderRadius, fontSize, fontWeight } from "@/constants/design-system";
import { extendedColors } from "@/lib/theme/extended-colors";
import { IconHistory, IconUser, IconPackage, IconCalendar, IconCircleCheck, IconClock, IconAlertTriangle } from "@tabler/icons-react-native";
import { PPE_DELIVERY_STATUS, PPE_DELIVERY_STATUS_LABELS } from '../../../../../constants';
import { formatDate, formatRelativeTime } from '../../../../../utils';

import type { PpeDeliverySchedule } from '../../../../../types';

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
      <Card style={styles.card}>
        <View style={[styles.sectionHeader, { borderBottomColor: colors.border }]}>
          <View style={styles.titleRow}>
            <View style={[styles.titleIcon, { backgroundColor: colors.primary + "10" }]}>
              <IconHistory size={18} color={colors.primary} />
            </View>
            <ThemedText style={[styles.titleText, { color: colors.foreground }]}>
              Histórico de Entregas
            </ThemedText>
          </View>
        </View>
        <View style={styles.content}>
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
        </View>
      </Card>
    );
  }

  return (
    <Card style={styles.card}>
      <View style={[styles.sectionHeader, { borderBottomColor: colors.border }]}>
        <View style={styles.titleRow}>
          <View style={[styles.titleIcon, { backgroundColor: colors.primary + "10" }]}>
            <IconHistory size={18} color={colors.primary} />
          </View>
          <ThemedText style={[styles.titleText, { color: colors.foreground }]}>
            Histórico de Entregas
          </ThemedText>
        </View>
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
      </View>
      <View style={styles.content}>
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
                          {delivery.item.name} ({delivery.quantity}x)
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
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: spacing.md,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  titleIcon: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  titleText: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
  },
  content: {
    gap: spacing.md,
  },
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
