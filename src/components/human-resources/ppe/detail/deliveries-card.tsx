
import { View, StyleSheet } from "react-native";
import { router } from "expo-router";
import { Card } from "@/components/ui/card";
import { ThemedText } from "@/components/ui/themed-text";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/lib/theme";
import { spacing, borderRadius, fontSize, fontWeight } from "@/constants/design-system";
import { extendedColors } from "@/lib/theme/extended-colors";
import { IconTruck, IconCalendar, IconUser, IconPlus, IconPackage } from "@tabler/icons-react-native";
import { PPE_DELIVERY_STATUS_LABELS } from '../../../../constants';
import { formatDate } from '../../../../utils';
import { routes } from '../../../../constants';
import { routeToMobilePath } from "@/lib/route-mapper";
import type { Item, PpeDelivery } from '../../../../types';

interface DeliveriesCardProps {
  item: Item;
  deliveries?: PpeDelivery[];
}

export function DeliveriesCard({ deliveries = [] }: DeliveriesCardProps) {
  const { colors } = useTheme();

  const recentDeliveries = deliveries.slice(0, 5);

  const handleViewAllDeliveries = () => {
    // Navigate to deliveries list filtered by this item
    router.push(routeToMobilePath(routes.humanResources.ppe.deliveries.root) as any);
  };

  const handleAddDelivery = () => {
    // Navigate to create delivery page
    router.push(routeToMobilePath(routes.humanResources.ppe.deliveries.create) as any);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PENDING":
        return extendedColors.yellow[600];
      case "APPROVED":
        return extendedColors.blue[600];
      case "DELIVERED":
        return extendedColors.green[600];
      case "REJECTED":
        return extendedColors.red[600];
      default:
        return colors.mutedForeground;
    }
  };

  const getStatusBgColor = (status: string) => {
    switch (status) {
      case "PENDING":
        return extendedColors.yellow[100];
      case "APPROVED":
        return extendedColors.blue[100];
      case "DELIVERED":
        return extendedColors.green[100];
      case "REJECTED":
        return extendedColors.red[100];
      default:
        return colors.muted;
    }
  };

  return (
    <Card style={styles.card}>
      <View style={[styles.sectionHeader, { borderBottomColor: colors.border }]}>
        <View style={styles.titleRow}>
          <View style={[styles.titleIcon, { backgroundColor: colors.primary + "10" }]}>
            <IconTruck size={18} color={colors.primary} />
          </View>
          <ThemedText style={[styles.titleText, { color: colors.foreground }]}>
            Entregas Recentes
          </ThemedText>
        </View>
        <Button size="sm" onPress={handleAddDelivery}>
          <IconPlus size={16} color={colors.primaryForeground} />
          <ThemedText style={{ color: colors.primaryForeground, fontSize: fontSize.sm, marginLeft: spacing.xs }}>
            Nova
          </ThemedText>
        </Button>
      </View>
      <View style={styles.content}>
        {recentDeliveries.length === 0 ? (
          <View style={StyleSheet.flatten([styles.emptyState, { backgroundColor: colors.muted + "30" }])}>
            <IconPackage size={40} color={colors.mutedForeground} />
            <ThemedText style={StyleSheet.flatten([styles.emptyText, { color: colors.mutedForeground }])}>
              Nenhuma entrega registrada
            </ThemedText>
            <ThemedText style={StyleSheet.flatten([styles.emptySubtext, { color: colors.mutedForeground }])}>
              As entregas de EPI aparecerão aqui
            </ThemedText>
          </View>
        ) : (
          <>
            <View style={styles.deliveriesList}>
              {recentDeliveries.map((delivery) => (
                <View
                  key={delivery.id}
                  style={StyleSheet.flatten([styles.deliveryItem, { backgroundColor: colors.muted + "30", borderColor: colors.border }])}
                >
                  <View style={styles.deliveryHeader}>
                    <View style={styles.deliveryInfo}>
                      {delivery.user && (
                        <View style={styles.userRow}>
                          <IconUser size={16} color={colors.mutedForeground} />
                          <ThemedText style={StyleSheet.flatten([styles.userName, { color: colors.foreground }])}>
                            {delivery.user.name}
                          </ThemedText>
                        </View>
                      )}
                      <View style={styles.dateRow}>
                        <IconCalendar size={14} color={colors.mutedForeground} />
                        <ThemedText style={StyleSheet.flatten([styles.dateText, { color: colors.mutedForeground }])}>
                          {delivery.actualDeliveryDate
                            ? `Entregue em ${formatDate(delivery.actualDeliveryDate)}`
                            : delivery.scheduledDate
                              ? `Agendado para ${formatDate(delivery.scheduledDate)}`
                              : "Sem data definida"}
                        </ThemedText>
                      </View>
                    </View>
                    <Badge
                      variant="default"
                      style={StyleSheet.flatten([
                        styles.statusBadge,
                        {
                          backgroundColor: getStatusBgColor(delivery.status),
                        },
                      ])}
                    >
                      <ThemedText
                        style={StyleSheet.flatten([
                          styles.statusText,
                          {
                            color: getStatusColor(delivery.status),
                          },
                        ])}
                      >
                        {PPE_DELIVERY_STATUS_LABELS[delivery.status as keyof typeof PPE_DELIVERY_STATUS_LABELS]}
                      </ThemedText>
                    </Badge>
                  </View>

                  {delivery.quantity && (
                    <View style={styles.quantityRow}>
                      <ThemedText style={StyleSheet.flatten([styles.quantityLabel, { color: colors.mutedForeground }])}>
                        Quantidade:
                      </ThemedText>
                      <ThemedText style={StyleSheet.flatten([styles.quantityValue, { color: colors.foreground }])}>
                        {delivery.quantity} {delivery.quantity === 1 ? "unidade" : "unidades"}
                      </ThemedText>
                    </View>
                  )}
                </View>
              ))}
            </View>

            {deliveries.length > 5 && (
              <Button variant="outline" onPress={handleViewAllDeliveries}>
                <ThemedText style={{ color: colors.foreground }}>
                  Ver todas ({deliveries.length} entregas)
                </ThemedText>
              </Button>
            )}
          </>
        )}
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
    borderBottomWidth: 1,
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
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.xxl,
    borderRadius: borderRadius.md,
    gap: spacing.sm,
  },
  emptyText: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.medium,
  },
  emptySubtext: {
    fontSize: fontSize.sm,
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
    alignItems: "flex-start",
    gap: spacing.sm,
  },
  deliveryInfo: {
    flex: 1,
    gap: spacing.xs,
  },
  userRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  userName: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
  },
  dateRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  dateText: {
    fontSize: fontSize.sm,
  },
  statusBadge: {
    alignSelf: "flex-start",
  },
  statusText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
  },
  quantityRow: {
    flexDirection: "row",
    gap: spacing.xs,
  },
  quantityLabel: {
    fontSize: fontSize.sm,
  },
  quantityValue: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },
});
