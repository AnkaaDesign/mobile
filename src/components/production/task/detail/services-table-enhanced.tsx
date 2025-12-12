import React, { useState, useCallback, useMemo } from "react";
import { View, StyleSheet, Alert, TouchableOpacity, ScrollView } from "react-native";
import { Card } from "@/components/ui/card";
import { ThemedText } from "@/components/ui/themed-text";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { useTheme } from "@/lib/theme";
import { spacing, fontSize, fontWeight, borderRadius } from "@/constants/design-system";
import { formatDateTime } from "@/utils";
import type { ServiceOrder } from '../../../../types';
import {
  IconCheck,
  IconClock,
  IconDeviceFloppy,
  IconReload,
  IconClipboardList,
  IconAlertCircle,
  IconPlayerPlay,
  IconPlayerPause,
  IconX,
} from "@tabler/icons-react-native";
import { SERVICE_ORDER_STATUS, SERVICE_ORDER_STATUS_LABELS } from "@/constants";
import { useServiceOrderMutations } from "@/hooks";
// import { showToast } from "@/components/ui/toast";
import { useAuth } from "@/contexts/auth-context";
import { isTeamLeader } from "@/utils/user";
import { hasPrivilege } from "@/utils";
import { SECTOR_PRIVILEGES } from "@/constants";

interface ServicesTableEnhancedProps {
  services: ServiceOrder[];
  onServicesUpdate?: () => void;
}

interface ServiceChanges {
  [serviceId: string]: {
    status: SERVICE_ORDER_STATUS;
  };
}

export const ServicesTableEnhanced: React.FC<ServicesTableEnhancedProps> = ({
  services,
  onServicesUpdate,
}) => {
  const { colors } = useTheme();
  const { user } = useAuth();
  const [serviceChanges, setServiceChanges] = useState<ServiceChanges>({});
  const [isSaving, setIsSaving] = useState(false);
  const { update } = useServiceOrderMutations();

  // Check if user can edit service orders (Admin or team leaders only)
  // Note: Team leadership is now determined by managedSector relationship (user.managedSector?.id)
  const canEditServiceOrders = useMemo(() => {
    return user && (
      isTeamLeader(user) ||
      hasPrivilege(user, SECTOR_PRIVILEGES.ADMIN)
    );
  }, [user]);

  // Filter to show only relevant statuses (not archived)
  const filteredServices = useMemo(() => {
    return services.filter(
      (service) =>
        service.status === SERVICE_ORDER_STATUS.PENDING ||
        service.status === SERVICE_ORDER_STATUS.IN_PROGRESS ||
        service.status === SERVICE_ORDER_STATUS.COMPLETED
    );
  }, [services]);

  // Check if there are unsaved changes
  const hasChanges = useMemo(() => {
    return Object.keys(serviceChanges).length > 0;
  }, [serviceChanges]);

  // Get the current value for a service (either changed or original)
  const getServiceValue = useCallback(
    (service: ServiceOrder) => {
      if (serviceChanges[service.id]) {
        return serviceChanges[service.id];
      }
      return {
        status: service.status,
      };
    },
    [serviceChanges]
  );

  // Handle status change
  const handleStatusChange = useCallback(
    (serviceId: string, newStatus: SERVICE_ORDER_STATUS) => {
      setServiceChanges((prev) => ({
        ...prev,
        [serviceId]: {
          status: newStatus,
        },
      }));
    },
    []
  );

  // Reset changes
  const handleReset = useCallback(() => {
    setServiceChanges({});
    // Local operation - changes discarded without API call
  }, []);

  // Save changes
  const handleSave = useCallback(async () => {
    if (!hasChanges) return;

    setIsSaving(true);
    try {
      // Update each changed service order sequentially
      for (const [serviceId, changes] of Object.entries(serviceChanges)) {
        const service = services.find((s) => s.id === serviceId);
        if (!service) continue;

        const updateData: any = { status: changes.status };

        // Add dates based on status transition
        if (changes.status === SERVICE_ORDER_STATUS.IN_PROGRESS && !service.startedAt) {
          updateData.startedAt = new Date();
        }
        if (changes.status === SERVICE_ORDER_STATUS.COMPLETED && !service.finishedAt) {
          updateData.finishedAt = new Date();
        }

        await update({ id: serviceId, data: updateData });
      }

      // API client already shows success alert
      setServiceChanges({});
      onServicesUpdate?.();
    } catch (error) {
      Alert.alert("Erro", "Não foi possível atualizar as ordens de serviço");
      console.error("Error updating service orders:", error);
    } finally {
      setIsSaving(false);
    }
  }, [serviceChanges, hasChanges, services, update, onServicesUpdate]);

  // Get status badge info
  const getServiceStatus = (service: ServiceOrder) => {
    const currentValues = getServiceValue(service);
    const hasServiceChanges = Boolean(serviceChanges[service.id]);

    if (hasServiceChanges) {
      return { icon: IconClock, color: colors.warning, label: "Alterado" };
    }

    switch (currentValues.status) {
      case SERVICE_ORDER_STATUS.COMPLETED:
        return { icon: IconCheck, color: colors.primary, label: SERVICE_ORDER_STATUS_LABELS[SERVICE_ORDER_STATUS.COMPLETED] };
      case SERVICE_ORDER_STATUS.IN_PROGRESS:
        return { icon: IconPlayerPlay, color: colors.secondary, label: SERVICE_ORDER_STATUS_LABELS[SERVICE_ORDER_STATUS.IN_PROGRESS] };
      case SERVICE_ORDER_STATUS.PENDING:
        return { icon: IconPlayerPause, color: colors.mutedForeground, label: SERVICE_ORDER_STATUS_LABELS[SERVICE_ORDER_STATUS.PENDING] };
      case SERVICE_ORDER_STATUS.CANCELLED:
        return { icon: IconX, color: colors.destructive, label: SERVICE_ORDER_STATUS_LABELS[SERVICE_ORDER_STATUS.CANCELLED] };
      default:
        return { icon: IconClock, color: colors.mutedForeground, label: "Indefinido" };
    }
  };

  // Status options for the select dropdown
  const statusOptions = useMemo(
    () => [
      { value: SERVICE_ORDER_STATUS.PENDING, label: SERVICE_ORDER_STATUS_LABELS[SERVICE_ORDER_STATUS.PENDING] },
      { value: SERVICE_ORDER_STATUS.IN_PROGRESS, label: SERVICE_ORDER_STATUS_LABELS[SERVICE_ORDER_STATUS.IN_PROGRESS] },
      { value: SERVICE_ORDER_STATUS.COMPLETED, label: SERVICE_ORDER_STATUS_LABELS[SERVICE_ORDER_STATUS.COMPLETED] },
      { value: SERVICE_ORDER_STATUS.CANCELLED, label: SERVICE_ORDER_STATUS_LABELS[SERVICE_ORDER_STATUS.CANCELLED] },
    ],
    []
  );

  if (filteredServices.length === 0) {
    return null;
  }

  return (
    <Card style={styles.card}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <View style={styles.headerLeft}>
          <IconClipboardList size={20} color={colors.primary} />
          <ThemedText style={styles.title}>Ordens de Serviço</ThemedText>
        </View>
        <Badge size="sm">
          <ThemedText style={styles.countText}>{filteredServices.length} {filteredServices.length === 1 ? 'ordem' : 'ordens'}</ThemedText>
        </Badge>
      </View>

      {/* Action Buttons */}
      {canEditServiceOrders && hasChanges && (
        <View style={styles.actionsContainer}>
          <Button
            variant="default"
            size="sm"
            onPress={handleSave}
            disabled={isSaving}
            style={styles.actionButton}
          >
            <IconDeviceFloppy size={16} color="#fff" />
            <ThemedText style={styles.actionButtonTextPrimary}>
              Salvar ({Object.keys(serviceChanges).length})
            </ThemedText>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onPress={handleReset}
            disabled={isSaving}
            style={styles.actionButton}
          >
            <IconReload size={16} color={colors.foreground} />
            <ThemedText style={styles.actionButtonText}>Desfazer</ThemedText>
          </Button>
        </View>
      )}

      {/* Unsaved changes warning */}
      {hasChanges && (
        <View style={[styles.warningBanner, { backgroundColor: colors.warning + '20', borderColor: colors.warning }]}>
          <IconAlertCircle size={20} color={colors.warning} />
          <View style={styles.warningContent}>
            <ThemedText style={[styles.warningTitle, { color: colors.warning }]}>
              Alterações não salvas
            </ThemedText>
            <ThemedText style={[styles.warningText, { color: colors.warning }]}>
              Você tem {Object.keys(serviceChanges).length} {Object.keys(serviceChanges).length === 1 ? 'ordem alterada' : 'ordens alteradas'}
            </ThemedText>
          </View>
        </View>
      )}

      {/* Services List */}
      <ScrollView style={styles.servicesList} showsVerticalScrollIndicator={false}>
        {filteredServices.map((service, index) => {
          const status = getServiceStatus(service);
          const StatusIcon = status.icon;
          const currentValues = getServiceValue(service);
          const hasServiceChanges = Boolean(serviceChanges[service.id]);

          return (
            <View
              key={service.id}
              style={StyleSheet.flatten([
                styles.serviceItem,
                { borderBottomColor: colors.border },
                index < filteredServices.length - 1 && styles.serviceItemBorder,
                hasServiceChanges && { backgroundColor: colors.warning + '10' },
              ])}
            >
              {/* Service Header */}
              <View style={styles.serviceHeader}>
                <View style={styles.serviceTitleRow}>
                  <ThemedText style={styles.serviceName} numberOfLines={2}>
                    {service.description}
                  </ThemedText>
                </View>
                <View style={StyleSheet.flatten([styles.statusBadge, { backgroundColor: status.color + "20" }])}>
                  <StatusIcon size={14} color={status.color} />
                  <ThemedText style={StyleSheet.flatten([styles.statusText, { color: status.color }])}>
                    {status.label}
                  </ThemedText>
                </View>
              </View>

              {/* Service Details */}
              <View style={styles.serviceDetails}>
                {/* Timing Information */}
                {(service.startedAt || service.finishedAt) && (
                  <View style={styles.timingInfo}>
                    {service.startedAt && (
                      <View style={styles.timingRow}>
                        <IconClock size={14} color={colors.mutedForeground} />
                        <ThemedText style={styles.timingLabel}>Iniciado:</ThemedText>
                        <ThemedText style={styles.timingValue}>
                          {formatDateTime(service.startedAt)}
                        </ThemedText>
                      </View>
                    )}
                    {service.finishedAt && (
                      <View style={styles.timingRow}>
                        <IconCheck size={14} color={colors.primary} />
                        <ThemedText style={styles.timingLabel}>Finalizado:</ThemedText>
                        <ThemedText style={styles.timingValue}>
                          {formatDateTime(service.finishedAt)}
                        </ThemedText>
                      </View>
                    )}
                  </View>
                )}

                {/* Status Select - Only for admin/team leaders */}
                {canEditServiceOrders && (
                  <View style={styles.statusSelectContainer}>
                    <ThemedText style={styles.statusSelectLabel}>Alterar Status:</ThemedText>
                    <Select
                      value={currentValues.status}
                      onValueChange={(value) => handleStatusChange(service.id, value as SERVICE_ORDER_STATUS)}
                      disabled={isSaving}
                    >
                      <SelectTrigger style={styles.statusSelect}>
                        <SelectValue placeholder="Selecione o status" />
                      </SelectTrigger>
                      <SelectContent>
                        {statusOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value} label={option.label}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </View>
                )}
              </View>
            </View>
          );
        })}
      </ScrollView>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: spacing.md,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
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
    fontWeight: "600",
  },
  countText: {
    fontSize: fontSize.xs,
    color: "#fff",
  },
  actionsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  actionButtonText: {
    fontSize: fontSize.sm,
  },
  actionButtonTextPrimary: {
    fontSize: fontSize.sm,
    color: "#fff",
  },
  warningBanner: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    marginBottom: spacing.md,
  },
  warningContent: {
    flex: 1,
  },
  warningTitle: {
    fontSize: fontSize.sm,
    fontWeight: "600",
    marginBottom: 2,
  },
  warningText: {
    fontSize: fontSize.xs,
  },
  servicesList: {
    maxHeight: 600,
  },
  serviceItem: {
    paddingBottom: spacing.md,
  },
  serviceItemBorder: {
    borderBottomWidth: 1,
    marginBottom: spacing.md,
  },
  serviceHeader: {
    marginBottom: spacing.sm,
  },
  serviceTitleRow: {
    marginBottom: spacing.xs,
  },
  serviceName: {
    fontSize: fontSize.md,
    fontWeight: "600",
    marginBottom: spacing.xs,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    gap: spacing.xs,
    alignSelf: "flex-start",
  },
  statusText: {
    fontSize: fontSize.xs,
    fontWeight: "600",
  },
  serviceDetails: {
    gap: spacing.sm,
  },
  timingInfo: {
    gap: spacing.xs,
  },
  timingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  timingLabel: {
    fontSize: fontSize.xs,
    opacity: 0.7,
  },
  timingValue: {
    fontSize: fontSize.xs,
    fontWeight: "500",
  },
  statusSelectContainer: {
    marginTop: spacing.sm,
  },
  statusSelectLabel: {
    fontSize: fontSize.sm,
    fontWeight: "500",
    marginBottom: spacing.xs,
  },
  statusSelect: {
    width: "100%",
  },
});
