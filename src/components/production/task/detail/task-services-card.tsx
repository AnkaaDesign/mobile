import React, { useState, useMemo } from "react";
import { View, StyleSheet, TouchableOpacity, Modal, Pressable, Text as RNText } from "react-native";
import { Card } from "@/components/ui/card";
import { ThemedText } from "@/components/ui/themed-text";
import { Badge } from "@/components/ui/badge";
import { Combobox } from "@/components/ui/combobox";
import { useTheme } from "@/lib/theme";
import { useAuth } from "@/contexts/auth-context";
import { spacing, fontSize } from "@/constants/design-system";
import { SERVICE_ORDER_STATUS, SERVICE_ORDER_STATUS_LABELS, SERVICE_ORDER_TYPE, SERVICE_ORDER_TYPE_LABELS, SECTOR_PRIVILEGES, getBadgeVariant } from "@/constants";
import { hasPrivilege, formatDateShort } from "@/utils";
import { canLeaderUpdateServiceOrder } from "@/utils/permissions/entity-permissions";
import { useServiceOrderMutations } from "@/hooks";
import type { ServiceOrder } from '../../../../types';
import { IconTools, IconNote, IconUser, IconCalendar } from "@tabler/icons-react-native";

// Colors matching web badge-colors.ts for consistency
const STATUS_COLORS = {
  PENDING: { bg: '#737373', border: '#525252' }, // neutral-500
  IN_PROGRESS: { bg: '#1d4ed8', border: '#1e40af' }, // blue-700
  WAITING_APPROVE: { bg: '#9333ea', border: '#7e22ce' }, // purple-600
  COMPLETED: { bg: '#15803d', border: '#166534' }, // green-700
  CANCELLED: { bg: '#b91c1c', border: '#991b1b' }, // red-700
};

// Type colors for visual distinction
const TYPE_COLORS: Record<SERVICE_ORDER_TYPE, string> = {
  [SERVICE_ORDER_TYPE.PRODUCTION]: '#2563eb', // blue-600
  [SERVICE_ORDER_TYPE.FINANCIAL]: '#16a34a', // green-600
  [SERVICE_ORDER_TYPE.NEGOTIATION]: '#9333ea', // purple-600
  [SERVICE_ORDER_TYPE.ARTWORK]: '#ea580c', // orange-600
};

interface TaskServicesCardProps {
  services: ServiceOrder[];
  taskSectorId?: string | null;
}

export const TaskServicesCard: React.FC<TaskServicesCardProps> = ({ services, taskSectorId }) => {
  const { colors } = useTheme();
  const { user } = useAuth();
  const { update } = useServiceOrderMutations();
  const [observationModal, setObservationModal] = useState<{ visible: boolean; text: string }>({
    visible: false,
    text: '',
  });

  // Check if user can edit service order status
  const canEditStatus = user && (
    hasPrivilege(user, SECTOR_PRIVILEGES.ADMIN) ||
    canLeaderUpdateServiceOrder(user, taskSectorId)
  );

  // Status options for combobox
  const statusOptions = Object.values(SERVICE_ORDER_STATUS).map(status => ({
    label: SERVICE_ORDER_STATUS_LABELS[status],
    value: status,
  }));

  // Filter out services with missing data to prevent errors
  const validServices = useMemo(() =>
    services.filter(s => s && s.id && s.status && s.description),
    [services]
  );

  // Group services by type
  const servicesByType = useMemo(() => {
    const groups: Record<SERVICE_ORDER_TYPE, ServiceOrder[]> = {
      [SERVICE_ORDER_TYPE.PRODUCTION]: [],
      [SERVICE_ORDER_TYPE.FINANCIAL]: [],
      [SERVICE_ORDER_TYPE.NEGOTIATION]: [],
      [SERVICE_ORDER_TYPE.ARTWORK]: [],
    };

    validServices.forEach((service) => {
      if (service.type && groups[service.type as SERVICE_ORDER_TYPE]) {
        groups[service.type as SERVICE_ORDER_TYPE].push(service);
      } else {
        // Default to PRODUCTION if type is missing
        groups[SERVICE_ORDER_TYPE.PRODUCTION].push(service);
      }
    });

    return groups;
  }, [validServices]);

  // Get trigger style based on status
  const getStatusTriggerStyle = (status: string) => {
    const statusKey = status as keyof typeof STATUS_COLORS;
    const colorConfig = STATUS_COLORS[statusKey];
    if (colorConfig) {
      return {
        backgroundColor: colorConfig.bg,
        textColor: '#ffffff',
        borderColor: colorConfig.border,
      };
    }
    return undefined;
  };

  // Handle status change
  const handleStatusChange = async (serviceOrderId: string, newStatus: SERVICE_ORDER_STATUS) => {
    try {
      await update({ id: serviceOrderId, data: { status: newStatus } });
    } catch (error) {
      console.error("Error updating service order status:", error);
    }
  };

  if (validServices.length === 0) {
    return null;
  }

  // Render a single service item
  const renderServiceItem = (service: ServiceOrder) => {
    const badgeVariant = service.status ? getBadgeVariant(service.status, "SERVICE_ORDER") : "default";
    const statusLabel = service.status ? (SERVICE_ORDER_STATUS_LABELS[service.status] || service.status) : "N/A";

    return (
      <View
        key={service.id}
        style={[styles.serviceItem, { borderBottomColor: colors.border }]}
      >
        {/* Row 1: Description + Observation indicator */}
        <View style={styles.descriptionRow}>
          <ThemedText
            style={[styles.serviceName, { color: colors.foreground }]}
            numberOfLines={2}
            ellipsizeMode="tail"
          >
            {service.description}
          </ThemedText>

          {/* Observation indicator */}
          {service.observation && (
            <TouchableOpacity
              style={[styles.observationButton, { borderColor: colors.border, backgroundColor: colors.card }]}
              onPress={() => setObservationModal({ visible: true, text: service.observation || '' })}
            >
              <IconNote size={14} color={colors.mutedForeground} />
              <View style={styles.observationBadge}>
                <RNText style={styles.observationBadgeText}>!</RNText>
              </View>
            </TouchableOpacity>
          )}
        </View>

        {/* Row 2: Responsible + Dates */}
        <View style={styles.metaRow}>
          {service.assignedTo && (
            <View style={styles.metaItem}>
              <IconUser size={12} color={colors.mutedForeground} />
              <ThemedText style={[styles.metaText, { color: colors.mutedForeground }]} numberOfLines={1}>
                {service.assignedTo.name}
              </ThemedText>
            </View>
          )}
          {service.startedAt && (
            <View style={styles.metaItem}>
              <IconCalendar size={12} color={colors.mutedForeground} />
              <ThemedText style={[styles.metaText, { color: colors.mutedForeground }]}>
                {formatDateShort(service.startedAt)}
              </ThemedText>
            </View>
          )}
          {service.finishedAt && (
            <View style={styles.metaItem}>
              <ThemedText style={[styles.metaText, { color: colors.mutedForeground }]}>
                - {formatDateShort(service.finishedAt)}
              </ThemedText>
            </View>
          )}
        </View>

        {/* Row 3: Status (Combobox or Badge) */}
        <View style={styles.statusRow}>
          {canEditStatus ? (
            <View style={styles.statusCombobox}>
              <Combobox
                key={`status-${service.id}`}
                options={statusOptions}
                value={service.status || undefined}
                onValueChange={(value) => {
                  handleStatusChange(service.id, value as SERVICE_ORDER_STATUS);
                }}
                placeholder="Selecionar"
                clearable={false}
                searchable={false}
                async={false}
                triggerStyle={getStatusTriggerStyle(service.status || '')}
              />
            </View>
          ) : (
            <Badge variant={badgeVariant} style={styles.statusBadge}>
              {statusLabel}
            </Badge>
          )}
        </View>
      </View>
    );
  };

  // Render a type group section
  const renderTypeGroup = (type: SERVICE_ORDER_TYPE) => {
    const typeServices = servicesByType[type];

    if (typeServices.length === 0) {
      return null;
    }

    const typeColor = TYPE_COLORS[type];
    const typeLabel = SERVICE_ORDER_TYPE_LABELS[type];

    return (
      <View key={type} style={styles.typeGroup}>
        <View style={styles.typeHeader}>
          <View style={[styles.typeIndicator, { backgroundColor: typeColor }]} />
          <ThemedText style={[styles.typeTitle, { color: colors.foreground }]}>
            {typeLabel}
          </ThemedText>
          <Badge variant="secondary" style={styles.typeCountBadge}>
            {typeServices.length}
          </Badge>
        </View>
        <View style={styles.typeContent}>
          {typeServices.map(renderServiceItem)}
        </View>
      </View>
    );
  };

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
        {Object.values(SERVICE_ORDER_TYPE).map((type) => renderTypeGroup(type as SERVICE_ORDER_TYPE))}
      </View>

      {/* Observation Modal */}
      <Modal
        visible={observationModal.visible}
        transparent
        animationType="fade"
        onRequestClose={() => setObservationModal({ visible: false, text: '' })}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setObservationModal({ visible: false, text: '' })}
        >
          <View style={[styles.modalContent, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.modalHeader}>
              <IconNote size={18} color={colors.mutedForeground} />
              <ThemedText style={[styles.modalTitle, { color: colors.foreground }]}>
                Observação
              </ThemedText>
            </View>
            <ThemedText style={[styles.modalText, { color: colors.mutedForeground }]}>
              {observationModal.text}
            </ThemedText>
            <TouchableOpacity
              style={[styles.modalCloseButton, { backgroundColor: colors.primary }]}
              onPress={() => setObservationModal({ visible: false, text: '' })}
            >
              <RNText style={styles.modalCloseButtonText}>Fechar</RNText>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>
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
    gap: spacing.lg,
  },
  // Type group styles
  typeGroup: {
    gap: spacing.xs,
  },
  typeHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  typeIndicator: {
    width: 4,
    height: 16,
    borderRadius: 2,
  },
  typeTitle: {
    fontSize: fontSize.md,
    fontWeight: "600",
    flex: 1,
  },
  typeCountBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  typeContent: {
    gap: spacing.xs,
    paddingLeft: spacing.md,
  },
  // Service item styles
  serviceItem: {
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: spacing.xs,
  },
  descriptionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: spacing.sm,
  },
  serviceName: {
    fontSize: fontSize.sm,
    fontWeight: "500",
    flex: 1,
    lineHeight: fontSize.sm * 1.4,
  },
  observationButton: {
    position: 'relative',
    width: 28,
    height: 28,
    borderRadius: 6,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  observationBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#dc2626', // red-600 destructive
    justifyContent: 'center',
    alignItems: 'center',
  },
  observationBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#ffffff',
  },
  metaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: spacing.sm,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  metaText: {
    fontSize: fontSize.xs,
  },
  statusRow: {
    marginTop: spacing.xs,
  },
  statusCombobox: {
    width: "100%",
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignSelf: "flex-start",
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  modalContent: {
    width: '100%',
    maxWidth: 320,
    borderRadius: 12,
    borderWidth: 1,
    padding: spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  modalTitle: {
    fontSize: fontSize.md,
    fontWeight: '600',
  },
  modalText: {
    fontSize: fontSize.sm,
    lineHeight: fontSize.sm * 1.5,
    marginBottom: spacing.lg,
  },
  modalCloseButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalCloseButtonText: {
    color: '#ffffff',
    fontSize: fontSize.sm,
    fontWeight: '600',
  },
});
