
import { View, StyleSheet } from "react-native";
import { Card } from "@/components/ui/card";
import { ThemedText } from "@/components/ui/themed-text";
import { Badge } from "@/components/ui/badge";
import { useTheme } from "@/lib/theme";
import { spacing, borderRadius, fontSize, fontWeight } from "@/constants/design-system";
import { IconPackage, IconCalendar, IconNumber } from "@tabler/icons-react-native";
import { formatDate } from "@/utils";
import { PPE_DELIVERY_STATUS_LABELS } from "@/constants";
import type { PpeDelivery } from '../../../../../types';

interface DeliveryCardProps {
  delivery: PpeDelivery;
}

export function DeliveryCard({ delivery }: DeliveryCardProps) {
  const { colors } = useTheme();

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "DELIVERED":
        return "success";
      case "APPROVED":
        return "info";
      case "PENDING":
        return "warning";
      case "REPROVED":
      case "CANCELLED":
        return "destructive";
      default:
        return "secondary";
    }
  };

  return (
    <Card style={styles.card}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <View style={styles.headerLeft}>
          <IconPackage size={20} color={colors.mutedForeground} />
          <ThemedText style={[styles.title, { color: colors.foreground }]}>Informações da Entrega</ThemedText>
        </View>
      </View>
      <View style={styles.content}>
        <View style={styles.infoContainer}>
          <View style={styles.infoRow}>
            <ThemedText style={StyleSheet.flatten([styles.infoLabel, { color: colors.mutedForeground }])}>Status</ThemedText>
            <Badge variant={getStatusBadgeVariant(delivery.status)}>
              <ThemedText style={styles.badgeText}>{PPE_DELIVERY_STATUS_LABELS[delivery.status]}</ThemedText>
            </Badge>
          </View>

          {delivery.scheduledDate && (
            <View style={styles.infoRow}>
              <View style={styles.infoLabelContainer}>
                <IconCalendar size={16} color={colors.mutedForeground} style={styles.infoIcon} />
                <ThemedText style={StyleSheet.flatten([styles.infoLabel, { color: colors.mutedForeground }])}>Data Agendada</ThemedText>
              </View>
              <ThemedText style={StyleSheet.flatten([styles.infoValue, { color: colors.foreground }])}>{formatDate(new Date(delivery.scheduledDate))}</ThemedText>
            </View>
          )}

          {delivery.actualDeliveryDate && (
            <View style={styles.infoRow}>
              <View style={styles.infoLabelContainer}>
                <IconCalendar size={16} color={colors.mutedForeground} style={styles.infoIcon} />
                <ThemedText style={StyleSheet.flatten([styles.infoLabel, { color: colors.mutedForeground }])}>Data de Entrega</ThemedText>
              </View>
              <ThemedText style={StyleSheet.flatten([styles.infoValue, { color: colors.foreground }])}>{formatDate(new Date(delivery.actualDeliveryDate))}</ThemedText>
            </View>
          )}

          <View style={styles.infoRow}>
            <View style={styles.infoLabelContainer}>
              <IconNumber size={16} color={colors.mutedForeground} style={styles.infoIcon} />
              <ThemedText style={StyleSheet.flatten([styles.infoLabel, { color: colors.mutedForeground }])}>Quantidade</ThemedText>
            </View>
            <ThemedText style={StyleSheet.flatten([styles.infoValue, { color: colors.foreground }])}>{delivery.quantity}</ThemedText>
          </View>
        </View>
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
    gap: spacing.sm,
  },
  infoContainer: {
    gap: spacing.md,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  infoLabelContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  infoIcon: {
    marginRight: spacing.xs,
  },
  infoLabel: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  infoValue: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },
  badgeText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
  },
});
