import React from "react";
import { View, StyleSheet } from "react-native";
import { Card } from "@/components/ui/card";
import { ThemedText } from "@/components/ui/themed-text";
import { Badge } from "@/components/ui/badge";
import { Combobox } from "@/components/ui/combobox";
import { useTheme } from "@/lib/theme";
import { useAuth } from "@/contexts/auth-context";
import { spacing, fontSize } from "@/constants/design-system";
import { SERVICE_ORDER_STATUS, SERVICE_ORDER_STATUS_LABELS, SECTOR_PRIVILEGES } from "@/constants";
import { hasPrivilege } from "@/utils";
import { useServiceOrderMutations } from "@/hooks";
import { showToast } from "@/components/ui/toast";
import { badgeColors } from "@/lib/theme/extended-colors";
import type { ServiceOrder } from '../../../../types';
import { IconTools } from "@tabler/icons-react-native";

interface TaskServicesCardProps {
  services: ServiceOrder[];
}

export const TaskServicesCard: React.FC<TaskServicesCardProps> = ({ services }) => {
  const { colors } = useTheme();
  const { user } = useAuth();
  const { update } = useServiceOrderMutations();

  // Check if user has admin or leader privileges
  const canEditStatus = user && (
    hasPrivilege(user, SECTOR_PRIVILEGES.ADMIN) ||
    hasPrivilege(user, SECTOR_PRIVILEGES.LEADER)
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
      showToast({ message: "Status atualizado com sucesso", type: "success" });
    } catch (error) {
      console.error("Error updating service order status:", error);
      showToast({ message: "Erro ao atualizar status", type: "error" });
    }
  };

  // Get badge variant based on status
  const getStatusVariant = (status: SERVICE_ORDER_STATUS) => {
    switch (status) {
      case SERVICE_ORDER_STATUS.COMPLETED:
        return "success";
      case SERVICE_ORDER_STATUS.IN_PROGRESS:
        return "warning";
      case SERVICE_ORDER_STATUS.CANCELLED:
        return "destructive";
      default:
        return "default";
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
        <View style={[styles.iconWrapper, { backgroundColor: colors.primary + "10" }]}>
          <IconTools size={18} color={colors.primary} />
        </View>
        <ThemedText style={styles.title}>Serviços</ThemedText>
        <Badge variant="secondary" style={styles.countBadge}>
          {validServices.length}
        </Badge>
      </View>

      <View style={styles.content}>
        {validServices.map((service, index) => {
          const statusVariant = getStatusVariant(service.status);
          const badgeColor = badgeColors[statusVariant];
          const statusLabel = SERVICE_ORDER_STATUS_LABELS[service.status] || service.status;

          return (
            <View
              key={service.id}
              style={[
                styles.serviceItem,
                index < validServices.length - 1 && styles.serviceItemBorder,
                { borderBottomColor: colors.border }
              ]}
            >
              <View style={styles.serviceInfo}>
                <ThemedText
                  style={[styles.serviceName, { color: colors.foreground }]}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  {service.description}
                </ThemedText>
              </View>
              {canEditStatus ? (
                <View style={styles.statusCombobox}>
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
                <View style={styles.statusCombobox}>
                  <Badge
                    variant={statusVariant}
                    style={styles.statusBadge}
                  >
                    <ThemedText style={[
                      styles.statusBadgeText,
                      badgeColor?.text ? { color: badgeColor.text } : { color: colors.foreground }
                    ]}>
                      {statusLabel}
                    </ThemedText>
                  </Badge>
                </View>
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
  iconWrapper: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
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
    paddingVertical: spacing.md,
    gap: spacing.md,
  },
  serviceItemBorder: {
    borderBottomWidth: 1,
  },
  serviceInfo: {
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
  statusCombobox: {
    flex: 1,
    justifyContent: "center",
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