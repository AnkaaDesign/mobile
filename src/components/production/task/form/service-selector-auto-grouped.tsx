import { useState, useEffect, useMemo, useCallback } from "react";
import { View, StyleSheet } from "react-native";
import { Combobox } from "@/components/ui/combobox";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { ThemedText } from "@/components/ui/themed-text";
import { Card } from "@/components/ui/card";
import { useTheme } from "@/lib/theme";
import { SERVICE_ORDER_STATUS, SERVICE_ORDER_TYPE, USER_STATUS } from "@/constants/enums";
import { SERVICE_ORDER_TYPE_LABELS } from "@/constants/enum-labels";
import { useServiceMutations } from "@/hooks";
import { serviceService, getUsers } from "@/api-client";
import type { Service, User } from "@/types";

interface ServiceOrder {
  status: string;
  statusOrder: number;
  description: string;
  type: string;
  assignedToId: string | null;
}

interface ServiceSelectorAutoGroupedProps {
  services: ServiceOrder[];
  onChange: (services: ServiceOrder[]) => void;
  disabled?: boolean;
  error?: string;
}

export function ServiceSelectorAutoGrouped({
  services,
  onChange,
  disabled = false,
  error,
}: ServiceSelectorAutoGroupedProps) {
  const { colors } = useTheme();
  const [creatingServiceIndex, setCreatingServiceIndex] = useState<number | null>(null);

  const { createAsync: createService } = useServiceMutations();

  // Memoize callbacks
  const getOptionLabel = useCallback((service: Service) => service.description, []);
  const getOptionValue = useCallback((service: Service) => service.description, []);

  // Group services by type
  const { groupedServices, ungroupedIndices } = useMemo(() => {
    const groups: Record<string, number[]> = {
      [SERVICE_ORDER_TYPE.PRODUCTION]: [],
      [SERVICE_ORDER_TYPE.FINANCIAL]: [],
      [SERVICE_ORDER_TYPE.NEGOTIATION]: [],
      [SERVICE_ORDER_TYPE.ARTWORK]: [],
    };
    const ungrouped: number[] = [];

    services.forEach((service, index) => {
      // A service is "complete" if it has both type and description (at least 3 chars)
      // BUT: Don't group services while they're being created
      const isBeingCreated = creatingServiceIndex === index;
      const isComplete = service?.type && service?.description && service.description.trim().length >= 3 && !isBeingCreated;

      if (isComplete) {
        groups[service.type as string]?.push(index);
      } else {
        ungrouped.push(index);
      }
    });

    return { groupedServices: groups, ungroupedIndices: ungrouped };
  }, [services, creatingServiceIndex]);

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

  // Handle creating a new service
  const handleCreateService = useCallback(
    async (description: string, type: string, serviceIndex: number) => {
      try {
        setCreatingServiceIndex(serviceIndex);

        const result = await createService({
          description,
          type,
        });

        if (result && result.success && result.data) {
          return result.data;
        }
        setCreatingServiceIndex(null);
        return undefined;
      } catch (error) {
        console.error("[ServiceSelector] Error creating service:", error);
        setCreatingServiceIndex(null);
        throw error;
      }
    },
    [createService]
  );

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

  // Clear creating state callback
  const clearCreatingState = useCallback(() => {
    setCreatingServiceIndex(null);
  }, []);

  // Render a service group card
  const renderServiceGroup = (type: string) => {
    const serviceIndices = groupedServices[type];

    if (!serviceIndices || serviceIndices.length === 0) {
      return null;
    }

    return (
      <Card key={type} style={[styles.groupCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.groupHeader}>
          <ThemedText style={[styles.groupTitle, { color: colors.mutedForeground }]}>
            {SERVICE_ORDER_TYPE_LABELS[type as keyof typeof SERVICE_ORDER_TYPE_LABELS]}
          </ThemedText>
          <ThemedText style={[styles.groupCount, { color: colors.mutedForeground }]}>
            {serviceIndices.length} {serviceIndices.length === 1 ? "serviço" : "serviços"}
          </ThemedText>
        </View>

        {serviceIndices.map((index) => (
          <ServiceRow
            key={index}
            service={services[index]}
            index={index}
            type={type}
            disabled={disabled}
            isCreating={creatingServiceIndex === index}
            onRemove={() => handleRemoveService(index)}
            onCreateService={handleCreateService}
            onDescriptionChange={handleServiceDescriptionChange}
            onTypeChange={handleServiceTypeChange}
            onAssignedToChange={handleAssignedToChange}
            getOptionLabel={getOptionLabel}
            getOptionValue={getOptionValue}
            isGrouped={true}
            clearCreatingState={clearCreatingState}
          />
        ))}
      </Card>
    );
  };

  return (
    <View style={styles.container}>
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
              isCreating={creatingServiceIndex === index}
              onRemove={() => handleRemoveService(index)}
              onCreateService={handleCreateService}
              onDescriptionChange={handleServiceDescriptionChange}
              onTypeChange={handleServiceTypeChange}
              onAssignedToChange={handleAssignedToChange}
              getOptionLabel={getOptionLabel}
              getOptionValue={getOptionValue}
              isGrouped={false}
              clearCreatingState={clearCreatingState}
            />
          ))}
        </View>
      )}

      {/* Grouped services by type */}
      <View style={styles.groupedSection}>
        {Object.values(SERVICE_ORDER_TYPE).map((type) => renderServiceGroup(type))}
      </View>

      {/* Add Service Button */}
      <Button variant="outline" size="sm" onPress={handleAddService} disabled={disabled} style={styles.addButton}>
        <Icon name="plus" size={16} color={colors.foreground} />
        <ThemedText style={{ marginLeft: 4, fontSize: 14, color: colors.foreground }}>
          Adicionar Serviço
        </ThemedText>
      </Button>

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
  isCreating: boolean;
  onRemove: () => void;
  onCreateService: (description: string, type: string, index: number) => Promise<Service | undefined>;
  onDescriptionChange: (index: number, description: string | undefined) => void;
  onTypeChange: (index: number, type: string) => void;
  onAssignedToChange: (index: number, userId: string | null) => void;
  getOptionLabel: (service: Service) => string;
  getOptionValue: (service: Service) => string;
  isGrouped: boolean;
  clearCreatingState: () => void;
  initialAssignedUser?: User;
}

function ServiceRow({
  service,
  index,
  type,
  disabled,
  isCreating,
  onRemove,
  onCreateService,
  onDescriptionChange,
  onTypeChange,
  onAssignedToChange,
  getOptionLabel,
  getOptionValue,
  isGrouped,
  clearCreatingState,
  initialAssignedUser,
}: ServiceRowProps) {
  const { colors } = useTheme();

  // Get initial options for this service
  const getInitialOptions = useCallback(() => {
    if (!service?.description) return [];
    return [
      {
        id: `temp-${service.description}`,
        description: service.description,
        type: service.type,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as Service,
    ];
  }, [service]);

  // Get initial user options for assigned user
  const getUserInitialOptions = useMemo(() => {
    if (!initialAssignedUser) return [];
    return [{
      value: initialAssignedUser.id,
      label: initialAssignedUser.name,
    }];
  }, [initialAssignedUser?.id]);

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
  }, []);

  // Search function for Combobox - filtered by type
  const searchServices = async (
    search: string,
    page: number = 1
  ): Promise<{
    data: Service[];
    hasMore: boolean;
  }> => {
    const params: any = {
      orderBy: { description: "asc" },
      page: page,
      take: 50,
      type: service.type,
    };

    if (search && search.trim()) {
      params.searchingFor = search.trim();
    }

    try {
      const response = await serviceService.getServices(params);
      const servicesList = response.data || [];
      const hasMore = response.meta?.hasNextPage || false;

      // If this is the first page and no search, ensure existing description is in the results
      if (page === 1 && (!search || !search.trim()) && service.description && service.description.trim()) {
        const existsInResults = servicesList.some((s) => s.description === service.description);

        if (!existsInResults) {
          const existingService: Service = {
            id: `temp-${service.description}`,
            description: service.description,
            type: service.type,
            createdAt: new Date(),
            updatedAt: new Date(),
          };

          return {
            data: [existingService, ...servicesList],
            hasMore: hasMore,
          };
        }
      }

      return {
        data: servicesList,
        hasMore: hasMore,
      };
    } catch (error) {
      console.error("[ServiceRow] Error fetching services:", error);
      return { data: [], hasMore: false };
    }
  };

  return (
    <View style={styles.serviceRow}>
      {/* Type Field - Only show if not grouped */}
      {!isGrouped && (
        <View style={styles.typeContainer}>
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

      {/* Description Field */}
      <View style={[styles.descriptionContainer, !isGrouped && styles.descriptionWithType]}>
        <Combobox<Service>
          value={service.description}
          onValueChange={(newValue) => {
            // Update the service description
            onDescriptionChange(index, newValue as string | undefined);

            // CRITICAL: DON'T clear creating state immediately
            // Wait for much longer to ensure form value is fully propagated
            // and the Combobox is displaying the correct value BEFORE re-grouping
            setTimeout(() => {
              // Only clear if the description is actually set
              if (service.description && service.description === newValue) {
                clearCreatingState();
              } else {
                // Try again after a delay
                setTimeout(() => {
                  clearCreatingState();
                }, 500);
              }
            }, 1000); // Wait 1 full second
          }}
          placeholder="Selecione ou crie um serviço"
          emptyText="Digite para criar um novo serviço"
          searchPlaceholder="Pesquisar serviços..."
          disabled={disabled || isCreating}
          async={true}
          allowCreate={true}
          createLabel={(value) => `Criar serviço "${value}"`}
          onCreate={async (value) => {
            const newService = await onCreateService(value, service.type, index);

            if (newService) {
              // Return the full service object
              // The Combobox will handle setting the value after caching
              return newService;
            }

            return undefined;
          }}
          isCreating={isCreating}
          queryKey={["serviceOrders", "search", index, service.type]}
          queryFn={searchServices}
          initialOptions={getInitialOptions()}
          getOptionLabel={getOptionLabel}
          getOptionValue={getOptionValue}
          minSearchLength={0}
          pageSize={50}
          debounceMs={300}
          clearable={false}
          hideDescription={true}
        />
      </View>

      {/* Assigned User Field */}
      <View style={styles.userContainer}>
        <Combobox
          value={service.assignedToId || ""}
          onValueChange={(value) => onAssignedToChange(index, value ? (value as string) : null)}
          placeholder="Responsável"
          emptyText="Nenhum usuário encontrado"
          searchPlaceholder="Buscar usuário..."
          disabled={disabled}
          async={true}
          queryKey={["users", "service-order", index]}
          queryFn={searchUsers}
          initialOptions={getUserInitialOptions}
          minSearchLength={0}
          pageSize={50}
          debounceMs={300}
          clearable={true}
          searchable={true}
        />
      </View>

      {/* Remove Button */}
      <Button
        variant="ghost"
        size="sm"
        onPress={onRemove}
        disabled={disabled}
        style={styles.removeButton}
      >
        <Icon name="trash" size={18} color={colors.destructive} />
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 16, // spacing.md
  },
  ungroupedSection: {
    gap: 8, // spacing.sm
    paddingBottom: 16, // spacing.md
    borderBottomWidth: 1,
  },
  groupedSection: {
    gap: 16, // spacing.md
  },
  groupCard: {
    padding: 16, // spacing.md
    gap: 8, // spacing.sm
    borderWidth: 1,
    borderRadius: 8,
  },
  groupHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4, // spacing.xs
  },
  groupTitle: {
    fontSize: 14, // fontSize.sm
    fontWeight: "500",
  },
  groupCount: {
    fontSize: 12, // fontSize.xs
  },
  serviceRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 4, // spacing.xs
    flexWrap: "wrap",
  },
  typeContainer: {
    width: 140,
  },
  descriptionContainer: {
    flex: 1,
    minWidth: 150,
  },
  descriptionWithType: {
    // Additional styles when type selector is visible
  },
  userContainer: {
    width: 140,
  },
  removeButton: {
    minWidth: 0,
    paddingHorizontal: 4, // spacing.xs
    marginTop: 0,
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  error: {
    fontSize: 12, // fontSize.xs
    marginTop: 4, // spacing.xs
  },
});

// Maintain compatibility with existing imports
export const ServiceSelector = ServiceSelectorAutoGrouped;
