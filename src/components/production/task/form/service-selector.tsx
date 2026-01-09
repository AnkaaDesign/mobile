import { useCallback, useState } from "react";
import { View, StyleSheet, Alert } from "react-native";
import { Combobox } from "@/components/ui/combobox";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { ThemedText } from "@/components/ui/themed-text";
import { Label } from "@/components/ui/label";
import { useTheme } from "@/lib/theme";
import { useServiceMutations } from "@/hooks";
import { serviceService } from "@/api-client";
import type { Service } from "@/types";

interface ServiceSelectorProps {
  services: Array<{ description: string; status?: string }>;
  onChange: (services: Array<{ description: string; status?: string }>) => void;
  disabled?: boolean;
  error?: string;
}

export function ServiceSelector({
  services,
  onChange,
  disabled = false,
  error,
}: ServiceSelectorProps) {
  const { colors } = useTheme();
  const [isCreating, setIsCreating] = useState(false);

  const { createAsync } = useServiceMutations();

  // Memoize callbacks for service selector
  const getOptionLabel = useCallback((service: Service) => service.description, []);
  const getOptionValue = useCallback((service: Service) => service.description, []);

  // Get initial options from current services
  const getInitialOptions = useCallback((index: number) => {
    const currentService = services[index];
    if (!currentService?.description) return [];

    return [{
      id: `temp-${currentService.description}`,
      description: currentService.description,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as Service];
  }, [services]);

  // Search function for services
  const searchServices = async (
    search: string,
    page: number = 1,
  ): Promise<{
    data: Service[];
    hasMore: boolean;
  }> => {
    const params: any = {
      orderBy: { description: "asc" },
      page: page,
      take: 50,
    };

    // Only add search filter if there's a search term
    if (search && search.trim()) {
      params.searchingFor = search.trim();
    }

    try {
      const response = await serviceService.getServices(params);
      const servicesList = response.data || [];
      const hasMore = response.meta?.hasNextPage || false;

      return {
        data: servicesList,
        hasMore: hasMore,
      };
    } catch (error) {
      console.error('[ServiceSelector] Error fetching services:', error);
      return { data: [], hasMore: false };
    }
  };

  // Handle creating a new service
  const handleCreateService = useCallback(async (description: string) => {
    try {
      setIsCreating(true);
      const result = await createAsync({ description });
      if (result?.success && result.data) {
        return result.data.description;
      }
      return description; // Fallback to user input
    } catch (error: any) {
      console.error("Error creating service:", error);
      Alert.alert("Erro", "Não foi possível criar o serviço");
      return null;
    } finally {
      setIsCreating(false);
    }
  }, [createAsync]);

  // Add new service
  const handleAddService = useCallback(() => {
    onChange([...services, { description: "", status: "PENDING" }]);
  }, [services, onChange]);

  // Remove service
  const handleRemoveService = useCallback(
    (index: number) => {
      if (services.length === 1) {
        // Clear the last one instead of removing
        onChange([{ description: "", status: "PENDING" }]);
      } else {
        onChange(services.filter((_, i) => i !== index));
      }
    },
    [services, onChange]
  );

  // Update service description
  const handleServiceChange = useCallback(
    (index: number, description: string | undefined) => {
      const updated = [...services];
      updated[index] = { ...updated[index], description: description || "" };
      onChange(updated);
    },
    [services, onChange]
  );

  return (
    <View style={styles.container}>
      <View style={styles.servicesContainer}>
        {services.map((service, index) => (
          <View key={index} style={styles.serviceRow}>
            {/* Service Combobox */}
            <View style={styles.comboboxContainer}>
              <Combobox<Service>
                value={service.description || ""}
                onValueChange={(value) => handleServiceChange(index, value as string | undefined)}
                placeholder="Selecione ou crie um serviço"
                searchPlaceholder="Pesquisar serviços..."
                emptyText="Digite para criar um novo serviço"
                disabled={disabled || isCreating}
                async={true}
                queryKey={["services", "search", index]}
                queryFn={searchServices}
                initialOptions={getInitialOptions(index)}
                getOptionLabel={getOptionLabel}
                getOptionValue={getOptionValue}
                allowCreate={true}
                onCreate={async (value) => {
                  const newDescription = await handleCreateService(value);
                  if (newDescription) {
                    handleServiceChange(index, newDescription);
                  }
                }}
                isCreating={isCreating}
                clearable={false}
                minSearchLength={0}
                pageSize={50}
                debounceMs={300}
                hideDescription={true}
              />
            </View>

            {/* Remove Button */}
            <Button
              variant="ghost"
              size="sm"
              onPress={() => handleRemoveService(index)}
              disabled={disabled}
              style={styles.actionButton}
            >
              <Icon name="trash" size={18} color={colors.destructive} />
            </Button>
          </View>
        ))}
      </View>

      {/* Add Service Button - full width at bottom (matching web) */}
      <Button
        variant="outline"
        size="sm"
        onPress={handleAddService}
        disabled={disabled}
        style={styles.addButton}
      >
        <Icon name="plus" size={16} color={colors.foreground} />
        <ThemedText style={{ marginLeft: 4, fontSize: 14, color: colors.foreground }}>
          Adicionar
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

const styles = StyleSheet.create({
  container: {
    gap: 8, // spacing.sm
  },
  servicesContainer: {
    gap: 8, // spacing.sm
  },
  serviceRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 4, // spacing.xs
  },
  comboboxContainer: {
    flex: 1,
  },
  actionButton: {
    minWidth: 0,
    paddingHorizontal: 4, // spacing.xs
    marginTop: 6,
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4, // spacing.xs
  },
  error: {
    fontSize: 12, // fontSize.xs
    marginTop: 4, // spacing.xs
  },
});
