import React, { useState, useMemo, useCallback } from "react";
import { View, StyleSheet, Alert } from "react-native";
import { Combobox } from "@/components/ui/combobox";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { ThemedText } from "@/components/ui/themed-text";
import { Label } from "@/components/ui/label";
import { useTheme } from "@/lib/theme";
import { spacing, fontSize } from "@/constants/design-system";
import { useServices, useServiceMutations } from "@/hooks";
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
  const [searchText, setSearchText] = useState("");
  const [page, setPage] = useState(1);
  const [isCreating, setIsCreating] = useState(false);
  const pageSize = 50;

  const { createAsync } = useServiceMutations();

  // Fetch available services
  const { data: servicesResponse, isLoading } = useServices({
    searchingFor: searchText,
    orderBy: { description: "asc" },
    page,
    take: pageSize,
  });

  const availableServices = servicesResponse?.data || [];
  const hasMore = servicesResponse?.meta?.hasNextPage || false;

  // Combine existing service descriptions with fetched services
  const allServices = useMemo(() => {
    const serviceList = [...availableServices];

    // Add existing services that aren't in the fetched list
    const existingDescriptions = services.map((s) => s.description).filter(Boolean);
    existingDescriptions.forEach((description) => {
      if (!serviceList.some((s) => s.description === description)) {
        serviceList.unshift({
          id: `temp-${description}`,
          description,
          createdAt: new Date(),
          updatedAt: new Date(),
        } as Service);
      }
    });

    return serviceList;
  }, [availableServices, services]);

  // Map to combobox options
  const getOptions = useCallback((index: number) => {
    return allServices.map((service) => ({
      value: service.description,
      label: service.description,
    }));
  }, [allServices]);

  // Handle load more - debounced to prevent multiple rapid calls
  const handleEndReached = useCallback(() => {
    if (!isLoading && hasMore) {
      console.log("[ServiceSelector] Loading more services, current page:", page);
      setPage((prev) => prev + 1);
    }
  }, [isLoading, hasMore, page]);

  // Handle search change - reset pagination
  const handleSearchChange = useCallback((text: string) => {
    console.log("[ServiceSelector] Search changed:", text);
    setSearchText(text);
    setPage(1);
  }, []);

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
      <Label>Serviços *</Label>

      <View style={styles.servicesContainer}>
        {services.map((service, index) => (
          <View key={index} style={styles.serviceRow}>
            {/* Service Combobox */}
            <View style={styles.comboboxContainer}>
              <Combobox
                value={service.description}
                onValueChange={(value) => handleServiceChange(index, value)}
                options={getOptions(index)}
                placeholder="Selecione ou crie um serviço"
                searchPlaceholder="Pesquisar serviços..."
                emptyText="Digite para criar um novo serviço"
                disabled={disabled || isCreating}
                loading={isLoading && page === 1}
                onSearchChange={handleSearchChange}
                onEndReached={handleEndReached}
                onCreate={async (value) => {
                  const newDescription = await handleCreateService(value);
                  if (newDescription) {
                    handleServiceChange(index, newDescription);
                  }
                }}
                clearable={false}
              />
            </View>

            {/* Action Buttons */}
            <View style={styles.actionButtons}>
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

              {/* Add Button (only on last row) */}
              {index === services.length - 1 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onPress={handleAddService}
                  disabled={disabled}
                  style={styles.actionButton}
                >
                  <Icon name="plus" size={18} color={colors.primary} />
                </Button>
              )}
            </View>
          </View>
        ))}
      </View>

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
    gap: spacing.sm,
  },
  servicesContainer: {
    gap: spacing.sm,
  },
  serviceRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.xs,
  },
  comboboxContainer: {
    flex: 1,
  },
  actionButtons: {
    flexDirection: "row",
    gap: 2,
    paddingTop: 4,
  },
  actionButton: {
    minWidth: 0,
    paddingHorizontal: spacing.xs,
  },
  error: {
    fontSize: fontSize.xs,
    marginTop: spacing.xs,
  },
});
