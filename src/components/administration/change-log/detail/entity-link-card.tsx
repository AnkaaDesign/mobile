import React from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { router } from "expo-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ThemedText } from "@/components/ui/themed-text";
import { useTheme } from "@/lib/theme";
import { spacing, borderRadius, fontSize, fontWeight } from "@/constants/design-system";
import { routes, CHANGE_LOG_ENTITY_TYPE, CHANGE_LOG_ENTITY_TYPE_LABELS } from '../../../../constants';
import { routeToMobilePath } from "@/lib/route-mapper";
import type { ChangeLog } from '../../../../types';
import { IconLink, IconChevronRight, IconExternalLink } from "@tabler/icons-react-native";

interface EntityLinkCardProps {
  changeLog: ChangeLog;
  entityName?: string;
}

export function EntityLinkCard({ changeLog, entityName }: EntityLinkCardProps) {
  const { colors } = useTheme();

  // Map entity type to route
  const getEntityRoute = (): string | null => {
    const { entityType, entityId } = changeLog;

    switch (entityType) {
      // Administration
      case CHANGE_LOG_ENTITY_TYPE.USER:
        return routes.administration.collaborators.details(entityId);
      case CHANGE_LOG_ENTITY_TYPE.CUSTOMER:
        return routes.administration.customers.details(entityId);
      case CHANGE_LOG_ENTITY_TYPE.SECTOR:
        return routes.administration.sectors.details(entityId);
      case CHANGE_LOG_ENTITY_TYPE.FILE:
        return routes.administration.files.details(entityId);
      case CHANGE_LOG_ENTITY_TYPE.NOTIFICATION:
        return routes.administration.notifications.details(entityId);

      // Inventory
      case CHANGE_LOG_ENTITY_TYPE.ITEM:
        return routes.inventory.products.details(entityId);
      case CHANGE_LOG_ENTITY_TYPE.ITEM_BRAND:
        return routes.inventory.products.brands.details(entityId);
      case CHANGE_LOG_ENTITY_TYPE.ITEM_CATEGORY:
        return routes.inventory.products.categories.details(entityId);
      case CHANGE_LOG_ENTITY_TYPE.ORDER:
        return routes.inventory.orders.details(entityId);
      case CHANGE_LOG_ENTITY_TYPE.ORDER_SCHEDULE:
        return routes.inventory.orders.automatic.details(entityId);
      case CHANGE_LOG_ENTITY_TYPE.ACTIVITY:
        return routes.inventory.activities.details(entityId);
      case CHANGE_LOG_ENTITY_TYPE.BORROW:
        return routes.inventory.loans.details(entityId);
      case CHANGE_LOG_ENTITY_TYPE.SUPPLIER:
        return routes.inventory.suppliers.details(entityId);
      case CHANGE_LOG_ENTITY_TYPE.EXTERNAL_WITHDRAWAL:
        return routes.inventory.externalWithdrawals.details(entityId);
      case CHANGE_LOG_ENTITY_TYPE.MAINTENANCE:
        return routes.inventory.maintenance.details(entityId);
      case CHANGE_LOG_ENTITY_TYPE.PPE_CONFIG:
        return routes.inventory.ppe.details(entityId);

      // Human Resources
      case CHANGE_LOG_ENTITY_TYPE.POSITION:
        return routes.humanResources.positions.details(entityId);
      case CHANGE_LOG_ENTITY_TYPE.WARNING:
        return routes.humanResources.warnings.details(entityId);
      case CHANGE_LOG_ENTITY_TYPE.VACATION:
        return routes.humanResources.vacations.details(entityId);

      // Production
      case CHANGE_LOG_ENTITY_TYPE.TASK:
        return routes.production.schedule.details(entityId);
      case CHANGE_LOG_ENTITY_TYPE.SERVICE:
        return routes.production.services.details(entityId);
      case CHANGE_LOG_ENTITY_TYPE.SERVICE_ORDER:
        return routes.production.serviceOrders.details(entityId);
      case CHANGE_LOG_ENTITY_TYPE.TRUCK:
        return routes.production.trucks.details(entityId);
      case CHANGE_LOG_ENTITY_TYPE.AIRBRUSHING:
        return routes.production.airbrushings.details(entityId);
      case CHANGE_LOG_ENTITY_TYPE.CUT:
        return routes.production.cutting.details(entityId);

      // Painting
      case CHANGE_LOG_ENTITY_TYPE.PAINT:
        return routes.painting.catalog.details(entityId);
      case CHANGE_LOG_ENTITY_TYPE.PAINT_TYPE:
        return routes.painting.paintTypes.details(entityId);
      case CHANGE_LOG_ENTITY_TYPE.PAINT_GROUND:
        return routes.painting.paintGrounds.details(entityId);
      case CHANGE_LOG_ENTITY_TYPE.PAINT_FORMULA:
        return routes.painting.formulas.details(entityId);
      case CHANGE_LOG_ENTITY_TYPE.PAINT_PRODUCTION:
        return routes.painting.productions.details(entityId);

      default:
        return null;
    }
  };

  const entityRoute = getEntityRoute();
  const canNavigate = !!entityRoute;

  const handleEntityPress = () => {
    if (entityRoute) {
      try {
        router.push(routeToMobilePath(entityRoute) as any);
      } catch (error) {
        console.warn("Failed to navigate to entity:", error);
      }
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle style={styles.sectionTitle}>
          <View style={styles.titleRow}>
            <View style={StyleSheet.flatten([styles.titleIcon, { backgroundColor: colors.primary + "10" }])}>
              <IconLink size={18} color={colors.primary} />
            </View>
            <ThemedText style={StyleSheet.flatten([styles.titleText, { color: colors.foreground }])}>
              Entidade Afetada
            </ThemedText>
          </View>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <TouchableOpacity
          style={[
            styles.entityContainer,
            { backgroundColor: canNavigate ? colors.muted + "40" : colors.muted + "20" }
          ]}
          onPress={handleEntityPress}
          activeOpacity={0.7}
          disabled={!canNavigate}
        >
          <View style={styles.entityInfo}>
            {/* Entity Type Badge */}
            <Badge variant="default">
              {CHANGE_LOG_ENTITY_TYPE_LABELS[changeLog.entityType]}
            </Badge>

            {/* Entity Name */}
            {entityName && (
              <ThemedText style={StyleSheet.flatten([styles.entityName, { color: colors.foreground }])}>
                {entityName}
              </ThemedText>
            )}

            {/* Entity ID */}
            <View style={styles.entityIdRow}>
              <ThemedText style={StyleSheet.flatten([styles.entityIdLabel, { color: colors.mutedForeground }])}>
                ID:
              </ThemedText>
              <ThemedText
                style={StyleSheet.flatten([styles.entityIdValue, { color: colors.foreground }])}
                numberOfLines={1}
                ellipsizeMode="middle"
              >
                {changeLog.entityId}
              </ThemedText>
            </View>

            {/* Navigation hint */}
            {canNavigate ? (
              <View style={styles.navigationHint}>
                <IconExternalLink size={14} color={colors.primary} />
                <ThemedText style={StyleSheet.flatten([styles.navigationText, { color: colors.primary }])}>
                  Toque para ver detalhes
                </ThemedText>
              </View>
            ) : (
              <ThemedText style={StyleSheet.flatten([styles.noNavigationText, { color: colors.mutedForeground }])}>
                Visualização não disponível
              </ThemedText>
            )}
          </View>

          {canNavigate && (
            <IconChevronRight size={20} color={colors.mutedForeground} />
          )}
        </TouchableOpacity>
      </CardContent>
    </Card>
  );
}

const styles = StyleSheet.create({
  sectionTitle: {
    flexDirection: "row",
    alignItems: "center",
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
  entityContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: spacing.md,
    borderRadius: borderRadius.md,
    gap: spacing.md,
  },
  entityInfo: {
    flex: 1,
    gap: spacing.sm,
  },
  entityName: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
  },
  entityIdRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  entityIdLabel: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
  },
  entityIdValue: {
    fontSize: fontSize.xs,
    fontFamily: "monospace",
    flex: 1,
  },
  navigationHint: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  navigationText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
  },
  noNavigationText: {
    fontSize: fontSize.xs,
    fontStyle: "italic",
    marginTop: spacing.xs,
  },
});
