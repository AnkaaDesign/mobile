import React from "react";
import { View, StyleSheet, Alert } from "react-native";
import { Card } from "@/components/ui/card";
import { ThemedText } from "@/components/ui/themed-text";
import { Badge } from "@/components/ui/badge";
import { Combobox } from "@/components/ui/combobox";
import { useTheme } from "@/lib/theme";
import { useAuth } from "@/contexts/auth-context";
import { spacing, fontSize } from "@/constants/design-system";
import { SERVICE_ORDER_STATUS, SERVICE_ORDER_STATUS_LABELS, SECTOR_PRIVILEGES, getBadgeVariant } from "@/constants";
import { hasPrivilege } from "@/utils";
import { canLeaderUpdateServiceOrder } from "@/utils/permissions/entity-permissions";
import { useServiceOrderMutations } from "@/hooks";
// import { showToast } from "@/components/ui/toast";
import type { ServiceOrder } from '../../../../types';
import { IconTools } from "@tabler/icons-react-native";

interface TaskServicesCardProps {
  services: ServiceOrder[];
  taskSectorId?: string | null;
}

export const TaskServicesCard: React.FC<TaskServicesCardProps> = ({ services, taskSectorId }) => {
  const { colors } = useTheme();
  const { user } = useAuth();
  const { update } = useServiceOrderMutations();

  // Check if user can edit service order status
  // ADMIN: can always edit
  // LEADER: can only edit for tasks in their MANAGED sector (NOT null sectors)
  // PRODUCTION and others: cannot edit (show badge only)
  const canEditStatus = user && (
    hasPrivilege(user, SECTOR_PRIVILEGES.ADMIN) ||
    canLeaderUpdateServiceOrder(user, taskSectorId)
  );

  // Status options for combobox
  const statusOptions = Object.values(SERVICE_ORDER_STATUS).map(status => ({
    label: SERVICE_ORDER_STATUS_LABELS[status],
    value: status,
  }));

  console.log('[TaskServicesCard] Status options:', statusOptions);
  console.log('[TaskServicesCard] Services:', services.map(s => ({ id: s.id, status: s.status, description: s.description })));
  console.log('[TaskServicesCard] Can edit status:', canEditStatus);

  // Handle status change
  const handleStatusChange = async (serviceOrderId: string, newStatus: SERVICE_ORDER_STATUS) => {
    console.log('[TaskServicesCard] handleStatusChange called:', { serviceOrderId, newStatus });
    try {
      await update({ id: serviceOrderId, data: { status: newStatus } });
      // API client already shows success alert
    } catch (error) {
      console.error("Error updating service order status:", error);
      // API client already shows error alert
    }
  };


  // Filter out services with missing data to prevent errors
  const validServices = services.filter(s => s && s.id && s.status && s.description);

  if (validServices.length === 0) {
    return null; // Don't render if no valid services
  }

  return (
    <Card style={styles.card}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
<IconTools size={20} color={colors.primary} />
        <ThemedText style={styles.title}>Serviços</ThemedText>
        <Badge variant="secondary" style={styles.countBadge}>
          {validServices.length}
        </Badge>
      </View>

      <View style={styles.content}>
        {validServices.map((service, index) => {
          // Use centralized badge configuration
          const badgeVariant = getBadgeVariant(service.status, "SERVICE_ORDER");
          const statusLabel = SERVICE_ORDER_STATUS_LABELS[service.status] || service.status;

          return (
            <View
              key={service.id}
              style={canEditStatus ? styles.serviceItemEditable : styles.serviceItem}
            >
              <View style={canEditStatus ? styles.serviceInfoEditable : styles.serviceInfo}>
                <ThemedText
                  style={[styles.serviceName, { color: colors.foreground }]}
                  numberOfLines={canEditStatus ? 2 : 1}
                  ellipsizeMode="tail"
                >
                  {service.description}
                </ThemedText>
              </View>
              {canEditStatus ? (
                <View style={styles.statusComboboxEditable}>
                  <Combobox
                    key={`status-${service.id}`}
                    options={statusOptions}
                    value={service.status}
                    onValueChange={(value) => {
                      console.log('[TaskServicesCard] Combobox onValueChange:', { serviceId: service.id, value });
                      handleStatusChange(service.id, value as SERVICE_ORDER_STATUS);
                    }}
                    placeholder="Selecionar"
                    clearable={false}
                    searchable={false}
                    async={false}
                  />
                </View>
              ) : (
                <Badge variant={badgeVariant} style={styles.statusBadge}>
                  {statusLabel}
                </Badge>
              )}
            </View>
          );
        })}
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: spacing.md,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    marginBottom: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: fontSize.lg,
    fontWeight: "600",
    flex: 1,
  },
  countBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  content: {
    gap: spacing.xs,
  },
  serviceItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: spacing.xs,
    gap: spacing.sm,
  },
  serviceItemEditable: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.xs,
    gap: spacing.sm,
  },
  serviceInfo: {
    flex: 1,
    justifyContent: "center",
    alignItems: "flex-start",
  },
  serviceInfoEditable: {
    flex: 1,
    justifyContent: "center",
    alignItems: "flex-start",
  },
  serviceName: {
    fontSize: fontSize.sm,
    fontWeight: "500",
  },
  serviceDescription: {
    fontSize: fontSize.xs,
    opacity: 0.7,
    marginTop: 2,
  },
  statusComboboxEditable: {
    width: "50%",
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  statusBadgeText: {
    fontSize: fontSize.xs,
    fontWeight: "500",
  },
});