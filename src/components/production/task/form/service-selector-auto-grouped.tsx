import { useState, useMemo, useCallback } from "react";
import { View, StyleSheet, TouchableOpacity, Modal, Pressable, TextInput, Text as RNText } from "react-native";
import { Combobox } from "@/components/ui/combobox";
import { Button } from "@/components/ui/button";
import { ThemedText } from "@/components/ui/themed-text";
import { useTheme } from "@/lib/theme";
import { SERVICE_ORDER_STATUS, SERVICE_ORDER_TYPE, USER_STATUS, SECTOR_PRIVILEGES } from "@/constants/enums";
import { SERVICE_ORDER_TYPE_LABELS, SERVICE_ORDER_STATUS_LABELS } from "@/constants/enum-labels";
import { getServiceDescriptionsByType } from "@/constants/service-descriptions";
import { spacing, fontSize } from "@/constants/design-system";
import { getUsers } from "@/api-client";
import type { User } from "@/types";
import { IconNote, IconTrash, IconPlus } from "@tabler/icons-react-native";

interface ServiceOrder {
  id?: string;
  status: string;
  statusOrder: number;
  description: string;
  type: string;
  assignedToId: string | null;
  observation?: string | null;
}

interface ServiceSelectorAutoGroupedProps {
  services: ServiceOrder[];
  onChange: (services: ServiceOrder[]) => void;
  disabled?: boolean;
  error?: string;
  userPrivilege?: string;
  currentUserId?: string;
}

export function ServiceSelectorAutoGrouped({
  services,
  onChange,
  disabled = false,
  error,
  userPrivilege,
  currentUserId,
}: ServiceSelectorAutoGroupedProps) {
  const { colors } = useTheme();

  // Group services by type
  const { groupedServices, ungroupedIndices } = useMemo(() => {
    const groups: Record<string, number[]> = {
      [SERVICE_ORDER_TYPE.PRODUCTION]: [],
      [SERVICE_ORDER_TYPE.FINANCIAL]: [],
      [SERVICE_ORDER_TYPE.COMMERCIAL]: [],
      [SERVICE_ORDER_TYPE.LOGISTIC]: [],
      [SERVICE_ORDER_TYPE.ARTWORK]: [],
    };
    const ungrouped: number[] = [];

    services.forEach((service, index) => {
      const isComplete = service?.type && service?.description && service.description.trim().length >= 3;

      if (isComplete) {
        groups[service.type as string]?.push(index);
      } else {
        ungrouped.push(index);
      }
    });

    return { groupedServices: groups, ungroupedIndices: ungrouped };
  }, [services]);

  // Handle adding a new service
  const handleAddService = useCallback(() => {
    onChange([
      ...services,
      {
        status: SERVICE_ORDER_STATUS.PENDING,
        statusOrder: 1,
        description: "",
        type: SERVICE_ORDER_TYPE.PRODUCTION,
        assignedToId: null,
      },
    ]);
  }, [services, onChange]);

  // Handle removing a service
  const handleRemoveService = useCallback(
    (index: number) => {
      onChange(services.filter((_, i) => i !== index));
    },
    [services, onChange]
  );

  // Handle updating service description
  const handleServiceDescriptionChange = useCallback(
    (index: number, description: string | undefined) => {
      const updated = [...services];
      updated[index] = { ...updated[index], description: description || "" };
      onChange(updated);
    },
    [services, onChange]
  );

  // Handle updating service type
  const handleServiceTypeChange = useCallback(
    (index: number, type: string) => {
      const updated = [...services];
      updated[index] = { ...updated[index], type };
      onChange(updated);
    },
    [services, onChange]
  );

  // Handle updating assigned user
  const handleAssignedToChange = useCallback(
    (index: number, userId: string | null) => {
      const updated = [...services];
      updated[index] = { ...updated[index], assignedToId: userId };
      onChange(updated);
    },
    [services, onChange]
  );

  // Handle updating service status
  const handleStatusChange = useCallback(
    (index: number, status: string) => {
      const updated = [...services];
      updated[index] = { ...updated[index], status };
      onChange(updated);
    },
    [services, onChange]
  );

  // Handle updating observation
  const handleObservationChange = useCallback(
    (index: number, observation: string) => {
      const updated = [...services];
      updated[index] = { ...updated[index], observation: observation || null };
      onChange(updated);
    },
    [services, onChange]
  );

  // Render a service group (no card wrapper)
  const renderServiceGroup = (type: string) => {
    const serviceIndices = groupedServices[type];

    if (!serviceIndices || serviceIndices.length === 0) {
      return null;
    }

    return (
      <View key={type} style={styles.typeGroup}>
        <View style={styles.groupHeader}>
          <ThemedText style={[styles.groupTitle, { color: colors.mutedForeground }]}>
            {SERVICE_ORDER_TYPE_LABELS[type as keyof typeof SERVICE_ORDER_TYPE_LABELS]}
          </ThemedText>
          <ThemedText style={[styles.groupCount, { color: colors.mutedForeground }]}>
            {serviceIndices.length} {serviceIndices.length === 1 ? "serviço" : "serviços"}
          </ThemedText>
        </View>

        <View style={styles.servicesList}>
          {serviceIndices.map((index) => (
            <ServiceRow
              key={index}
              service={services[index]}
              index={index}
              type={type}
              disabled={disabled}
              onRemove={() => handleRemoveService(index)}
              onDescriptionChange={handleServiceDescriptionChange}
              onTypeChange={handleServiceTypeChange}
              onAssignedToChange={handleAssignedToChange}
              onStatusChange={handleStatusChange}
              onObservationChange={handleObservationChange}
              isGrouped={true}
              userPrivilege={userPrivilege}
              currentUserId={currentUserId}
            />
          ))}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Add Service Button */}
      <Button variant="outline" size="sm" onPress={handleAddService} disabled={disabled} style={styles.addButton}>
        <IconPlus size={16} color={colors.foreground} />
        <ThemedText style={{ marginLeft: 4, fontSize: 14, color: colors.foreground }}>
          Adicionar Serviço
        </ThemedText>
      </Button>

      {/* Ungrouped services (being edited) */}
      {ungroupedIndices.length > 0 && (
        <View style={[styles.ungroupedSection, { borderBottomColor: colors.border }]}>
          {ungroupedIndices.map((index) => (
            <ServiceRow
              key={index}
              service={services[index]}
              index={index}
              type={services[index]?.type || SERVICE_ORDER_TYPE.PRODUCTION}
              disabled={disabled}
              onRemove={() => handleRemoveService(index)}
              onDescriptionChange={handleServiceDescriptionChange}
              onTypeChange={handleServiceTypeChange}
              onAssignedToChange={handleAssignedToChange}
              onStatusChange={handleStatusChange}
              onObservationChange={handleObservationChange}
              isGrouped={false}
              userPrivilege={userPrivilege}
              currentUserId={currentUserId}
            />
          ))}
        </View>
      )}

      {/* Grouped services by type */}
      <View style={styles.groupedSection}>
        {Object.values(SERVICE_ORDER_TYPE).map((type) => renderServiceGroup(type))}
      </View>

      {error && (
        <ThemedText style={[styles.error, { color: colors.destructive }]}>
          {error}
        </ThemedText>
      )}
    </View>
  );
}

interface ServiceRowProps {
  service: ServiceOrder;
  index: number;
  type: string;
  disabled?: boolean;
  onRemove: () => void;
  onDescriptionChange: (index: number, description: string | undefined) => void;
  onTypeChange: (index: number, type: string) => void;
  onAssignedToChange: (index: number, userId: string | null) => void;
  onStatusChange: (index: number, status: string) => void;
  onObservationChange: (index: number, observation: string) => void;
  isGrouped: boolean;
  initialAssignedUser?: User;
  userPrivilege?: string;
  currentUserId?: string;
}

function ServiceRow({
  service,
  index,
  type,
  disabled,
  onRemove,
  onDescriptionChange,
  onTypeChange,
  onAssignedToChange,
  onStatusChange,
  onObservationChange,
  isGrouped,
  initialAssignedUser,
  userPrivilege,
}: ServiceRowProps) {
  const { colors } = useTheme();
  const [observationModal, setObservationModal] = useState<{ visible: boolean; text: string }>({
    visible: false,
    text: service.observation || '',
  });

  // Determine which status options are available based on type and user privilege
  // IMPORTANT: WAITING_APPROVE status is ONLY available for ARTWORK service orders
  // This is because only artwork has the designer → admin approval workflow
  const getAvailableStatuses = useMemo(() => {
    const isArtworkType = service.type === SERVICE_ORDER_TYPE.ARTWORK;

    // Admin can set any status, but WAITING_APPROVE only for ARTWORK
    if (userPrivilege === SECTOR_PRIVILEGES.ADMIN) {
      if (isArtworkType) {
        // ARTWORK: All statuses including WAITING_APPROVE (approval workflow)
        return [
          SERVICE_ORDER_STATUS.PENDING,
          SERVICE_ORDER_STATUS.IN_PROGRESS,
          SERVICE_ORDER_STATUS.WAITING_APPROVE,
          SERVICE_ORDER_STATUS.COMPLETED,
          SERVICE_ORDER_STATUS.CANCELLED,
        ];
      } else {
        // Non-ARTWORK: All statuses EXCEPT WAITING_APPROVE (simple workflow)
        return [
          SERVICE_ORDER_STATUS.PENDING,
          SERVICE_ORDER_STATUS.IN_PROGRESS,
          SERVICE_ORDER_STATUS.COMPLETED,
          SERVICE_ORDER_STATUS.CANCELLED,
        ];
      }
    }

    // ARTWORK type has special two-step approval - designer can only go to WAITING_APPROVE
    if (isArtworkType && userPrivilege === SECTOR_PRIVILEGES.DESIGNER) {
      return [
        SERVICE_ORDER_STATUS.PENDING,
        SERVICE_ORDER_STATUS.IN_PROGRESS,
        SERVICE_ORDER_STATUS.WAITING_APPROVE,
        // Note: No COMPLETED - designer must submit for admin approval
        // Note: No CANCELLED - only admin can cancel
      ];
    }

    // For other users/types, return simple workflow statuses (no WAITING_APPROVE, no CANCELLED)
    return [
      SERVICE_ORDER_STATUS.PENDING,
      SERVICE_ORDER_STATUS.IN_PROGRESS,
      SERVICE_ORDER_STATUS.COMPLETED,
    ];
  }, [userPrivilege, service.type]);

  // Get description options from enums based on service type
  const descriptionOptions = useMemo(() => {
    const descriptions = getServiceDescriptionsByType(service.type as SERVICE_ORDER_TYPE);
    return descriptions.map((description) => ({
      value: description,
      label: description,
    }));
  }, [service.type]);

  // Get initial user options for assigned user
  const getUserInitialOptions = useMemo(() => {
    if (!initialAssignedUser) return [];
    return [{
      value: initialAssignedUser.id,
      label: initialAssignedUser.name,
    }];
  }, [initialAssignedUser?.id]);

  // Determine which sector privileges to include based on service order type
  // Each service order type has specific sectors that can be assigned
  const includeSectorPrivileges = useMemo(() => {
    switch (service.type) {
      case SERVICE_ORDER_TYPE.PRODUCTION:
        // Production service orders: only production sector users
        return [SECTOR_PRIVILEGES.PRODUCTION];
      case SERVICE_ORDER_TYPE.LOGISTIC:
        // Logistic service orders: logistic and admin users
        return [SECTOR_PRIVILEGES.LOGISTIC, SECTOR_PRIVILEGES.ADMIN];
      case SERVICE_ORDER_TYPE.COMMERCIAL:
        // Commercial service orders: commercial and admin users
        return [SECTOR_PRIVILEGES.COMMERCIAL, SECTOR_PRIVILEGES.ADMIN];
      case SERVICE_ORDER_TYPE.ARTWORK:
        // Artwork service orders: designer and admin users
        return [SECTOR_PRIVILEGES.DESIGNER, SECTOR_PRIVILEGES.ADMIN];
      case SERVICE_ORDER_TYPE.FINANCIAL:
        // Financial service orders: commercial, financial, and admin users
        return [SECTOR_PRIVILEGES.COMMERCIAL, SECTOR_PRIVILEGES.FINANCIAL, SECTOR_PRIVILEGES.ADMIN];
      default:
        return undefined;
    }
  }, [service.type]);

  // Search function for users
  const searchUsers = useCallback(async (
    searchTerm: string,
    page: number = 1
  ): Promise<{
    data: { value: string; label: string }[];
    hasMore: boolean;
  }> => {
    try {
      const queryParams: any = {
        statuses: [
          USER_STATUS.EXPERIENCE_PERIOD_1,
          USER_STATUS.EXPERIENCE_PERIOD_2,
          USER_STATUS.EFFECTED
        ],
        orderBy: { name: "asc" },
        page: page,
        take: 50,
      };

      if (searchTerm && searchTerm.trim()) {
        queryParams.searchingFor = searchTerm.trim();
      }

      // Add sector privilege filter to include only specific sectors based on service order type
      if (includeSectorPrivileges && includeSectorPrivileges.length > 0) {
        queryParams.includeSectorPrivileges = includeSectorPrivileges;
      }

      const response = await getUsers(queryParams);
      const users = response.data || [];
      const hasMore = response.meta?.hasNextPage || false;

      return {
        data: users.map((user) => ({
          value: user.id,
          label: user.name,
        })),
        hasMore,
      };
    } catch (error) {
      console.error("[ServiceRow] Error fetching users:", error);
      return { data: [], hasMore: false };
    }
  }, [includeSectorPrivileges]);

  // Handle saving observation from modal
  const handleSaveObservation = () => {
    onObservationChange(index, observationModal.text);
    setObservationModal({ visible: false, text: observationModal.text });
  };

  const hasObservation = !!service.observation && service.observation.trim().length > 0;

  return (
    <View style={styles.serviceRow}>
      {/* Row 1: Type (if not grouped) */}
      {!isGrouped && (
        <View style={styles.typeRow}>
          <Combobox
            value={service.type || SERVICE_ORDER_TYPE.PRODUCTION}
            onValueChange={(value) => onTypeChange(index, value as string)}
            disabled={disabled}
            options={Object.values(SERVICE_ORDER_TYPE).map((t) => ({
              value: t,
              label: SERVICE_ORDER_TYPE_LABELS[t as keyof typeof SERVICE_ORDER_TYPE_LABELS],
            }))}
            placeholder="Tipo"
            searchable={false}
            clearable={false}
          />
        </View>
      )}

      {/* Row 2: Description (full width) */}
      <View style={styles.descriptionRow}>
        <Combobox
          value={service.description}
          onValueChange={(newValue) => {
            onDescriptionChange(index, newValue as string | undefined);
          }}
          placeholder="Selecione o serviço..."
          emptyText="Nenhum serviço encontrado"
          searchPlaceholder="Pesquisar serviços..."
          disabled={disabled}
          options={descriptionOptions}
          searchable={true}
          clearable={false}
        />
      </View>

      {/* Row 3: Responsible + Status + Observation + Trash */}
      <View style={styles.controlsRow}>
        {/* Responsible */}
        <View style={styles.responsibleContainer}>
          <Combobox
            value={service.assignedToId || ""}
            onValueChange={(value) => onAssignedToChange(index, value ? (value as string) : null)}
            placeholder="Resp."
            emptyText="Nenhum usuário encontrado"
            searchPlaceholder="Buscar usuário..."
            disabled={disabled}
            async={true}
            queryKey={["users", "service-order", index, includeSectorPrivileges?.join(",") ?? ""]}
            queryFn={searchUsers}
            initialOptions={getUserInitialOptions}
            minSearchLength={0}
            pageSize={50}
            debounceMs={300}
            clearable={true}
            searchable={true}
            size="sm"
          />
        </View>

        {/* Status */}
        <View style={styles.statusContainer}>
          <Combobox
            value={service.status || SERVICE_ORDER_STATUS.PENDING}
            onValueChange={(value) => onStatusChange(index, value as string)}
            disabled={disabled}
            options={getAvailableStatuses.map((status) => ({
              value: status,
              label: SERVICE_ORDER_STATUS_LABELS[status as keyof typeof SERVICE_ORDER_STATUS_LABELS],
            }))}
            placeholder="Status"
            searchable={false}
            clearable={false}
            size="sm"
          />
        </View>

        {/* Observation Button */}
        <TouchableOpacity
          style={[
            styles.observationButton,
            {
              borderColor: hasObservation ? colors.primary : colors.border,
              backgroundColor: hasObservation ? colors.primary + '15' : colors.card
            }
          ]}
          onPress={() => setObservationModal({ visible: true, text: service.observation || '' })}
          disabled={disabled}
        >
          <IconNote size={18} color={hasObservation ? colors.primary : colors.mutedForeground} />
          {hasObservation && (
            <View style={styles.observationIndicator}>
              <RNText style={styles.observationIndicatorText}>!</RNText>
            </View>
          )}
        </TouchableOpacity>

        {/* Remove Button */}
        <TouchableOpacity
          style={[styles.removeButton, { borderColor: colors.border }]}
          onPress={onRemove}
          disabled={disabled}
        >
          <IconTrash size={18} color={colors.destructive} />
        </TouchableOpacity>
      </View>

      {/* Observation Modal */}
      <Modal
        visible={observationModal.visible}
        transparent
        animationType="fade"
        onRequestClose={() => setObservationModal({ visible: false, text: service.observation || '' })}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setObservationModal({ visible: false, text: service.observation || '' })}
        >
          <Pressable
            style={[styles.modalContent, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.modalHeader}>
              <IconNote size={20} color={colors.mutedForeground} />
              <ThemedText style={[styles.modalTitle, { color: colors.foreground }]}>
                Observação
              </ThemedText>
            </View>
            <TextInput
              value={observationModal.text}
              onChangeText={(text) => setObservationModal({ ...observationModal, text })}
              placeholder="Adicione uma observação (use para justificar reprovações ou adicionar notas)"
              placeholderTextColor={colors.mutedForeground}
              multiline
              numberOfLines={4}
              style={[
                styles.modalTextInput,
                {
                  backgroundColor: colors.background,
                  borderColor: colors.border,
                  color: colors.foreground,
                },
              ]}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalCancelButton, { borderColor: colors.border }]}
                onPress={() => setObservationModal({ visible: false, text: service.observation || '' })}
              >
                <ThemedText style={{ color: colors.foreground }}>Cancelar</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalSaveButton, { backgroundColor: colors.primary }]}
                onPress={handleSaveObservation}
              >
                <RNText style={styles.modalSaveButtonText}>Salvar</RNText>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.lg,
  },
  ungroupedSection: {
    gap: spacing.lg,
    paddingBottom: spacing.lg,
    borderBottomWidth: 1,
  },
  groupedSection: {
    gap: spacing.xl,
  },
  typeGroup: {
    gap: spacing.md,
  },
  groupHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  groupTitle: {
    fontSize: fontSize.sm,
    fontWeight: "600",
  },
  groupCount: {
    fontSize: fontSize.xs,
  },
  servicesList: {
    gap: spacing.lg,
  },
  serviceRow: {
    gap: spacing.xs,
  },
  typeRow: {
    marginBottom: spacing.xs,
  },
  descriptionRow: {
    width: "100%",
  },
  controlsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  responsibleContainer: {
    flex: 1,
    minWidth: 80,
  },
  statusContainer: {
    width: 100,
  },
  observationButton: {
    width: 36,
    height: 36,
    borderRadius: 6,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    flexShrink: 0,
  },
  observationIndicator: {
    position: 'absolute',
    top: -3,
    right: -3,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#dc2626',
    justifyContent: 'center',
    alignItems: 'center',
  },
  observationIndicatorText: {
    fontSize: 8,
    fontWeight: '700',
    color: '#ffffff',
  },
  removeButton: {
    width: 36,
    height: 36,
    borderRadius: 6,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  error: {
    fontSize: fontSize.xs,
    marginTop: spacing.xs,
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
    maxWidth: 400,
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
    fontSize: fontSize.lg,
    fontWeight: '600',
  },
  modalTextInput: {
    fontSize: fontSize.sm,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    minHeight: 100,
    textAlignVertical: 'top',
    marginBottom: spacing.md,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'flex-end',
  },
  modalCancelButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 8,
    borderWidth: 1,
  },
  modalSaveButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: 8,
  },
  modalSaveButtonText: {
    color: '#ffffff',
    fontSize: fontSize.sm,
    fontWeight: '600',
  },
});

// Maintain compatibility with existing imports
export const ServiceSelector = ServiceSelectorAutoGrouped;
