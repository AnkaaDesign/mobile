import { useState } from "react";
import { View, ScrollView, Modal, TouchableOpacity } from "react-native";
import { Text } from "@/components/ui/text";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { DatePicker } from "@/components/ui/date-picker";
import { Checkbox } from "@/components/ui/checkbox";
import {
  MAINTENANCE_STATUS,
  MAINTENANCE_STATUS_LABELS
} from '../../../../constants';
import type { MaintenanceGetManyParams } from '../../../../types';

interface MaintenanceFilterModalProps {
  visible: boolean;
  onClose: () => void;
  filters: Partial<MaintenanceGetManyParams>;
  onApplyFilters: (filters: Partial<MaintenanceGetManyParams>) => void;
  onClearFilters: () => void;
}

export function MaintenanceFilterModal({
  visible,
  onClose,
  filters,
  onApplyFilters,
  onClearFilters,
}: MaintenanceFilterModalProps) {
  const [localFilters, setLocalFilters] = useState<Partial<MaintenanceGetManyParams>>(filters);

  const handleApply = () => {
    // Clean up empty filters
    const cleanedFilters: Partial<MaintenanceGetManyParams> = {};

    if (localFilters.where) {
      cleanedFilters.where = localFilters.where;
    }
    if (localFilters.include) {
      cleanedFilters.include = localFilters.include;
    }
    if (localFilters.orderBy) {
      cleanedFilters.orderBy = localFilters.orderBy;
    }
    if (localFilters.skip !== undefined) {
      cleanedFilters.skip = localFilters.skip;
    }
    if (localFilters.take !== undefined) {
      cleanedFilters.take = localFilters.take;
    }
    if (localFilters.searchingFor) {
      cleanedFilters.searchingFor = localFilters.searchingFor;
    }

    onApplyFilters(cleanedFilters);
    onClose();
  };

  const handleClear = () => {
    setLocalFilters({});
    onClearFilters();
    onClose();
  };

  const handleStatusChange = (status: string) => {
    const currentStatuses = (localFilters.where?.status as any)?.in || [];
    const newStatuses = currentStatuses.includes(status)
      ? currentStatuses.filter((s: string) => s !== status)
      : [...currentStatuses, status];

    setLocalFilters({
      ...localFilters,
      where: {
        ...localFilters.where,
        status: newStatuses.length > 0 ? { in: newStatuses } as any : undefined,
      },
    });
  };

  // Remove type filter functionality as maintenance doesn't have a type field
  // This was likely copied from another entity that has a type field

  // Remove priority filter functionality as maintenance doesn't have a priority field
  // This was likely copied from another entity that has a priority field

  const handleDateRangeChange = (field: "scheduledFor" | "finishedAt", type: "from" | "to", date: Date | null) => {
    setLocalFilters({
      ...localFilters,
      where: {
        ...localFilters.where,
        [field]: {
          ...(localFilters.where?.[field] as any),
          [type === "from" ? "gte" : "lte"]: date || undefined,
        },
      },
    });
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-background">
        {/* Header */}
        <View className="flex-row items-center justify-between p-4 border-b border-border">
          <Text className="text-lg font-semibold">Filtros</Text>
          <TouchableOpacity onPress={onClose}>
            <Icon name="IconX" size={24} color="#6B7280" />
          </TouchableOpacity>
        </View>

        <ScrollView className="flex-1 px-4">
          {/* Status Filter */}
          <View className="py-4">
            <Text className="text-base font-medium mb-3">Status</Text>
            <View className="space-y-2">
              {Object.entries(MAINTENANCE_STATUS).map(([key, value]) => (
                <TouchableOpacity
                  key={key}
                  onPress={() => handleStatusChange(value)}
                  className="flex-row items-center"
                >
                  <Checkbox
                    checked={(localFilters.where?.status as any)?.in?.includes(value) || false}
                    onCheckedChange={() => handleStatusChange(value)}
                  />
                  <Text className="ml-3">{MAINTENANCE_STATUS_LABELS[value as keyof typeof MAINTENANCE_STATUS_LABELS]}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Type Filter - Removed as maintenance doesn't have a type field */}

          {/* Priority Filter - Removed as maintenance doesn't have a priority field */}

          {/* Scheduled Date Range */}
          <View className="py-4">
            <Text className="text-base font-medium mb-3">Data Agendada</Text>
            <View className="space-y-2">
              <DatePicker
                label="De"
                value={(localFilters.where?.scheduledFor as any)?.gte || undefined}
                onChange={(date) => handleDateRangeChange("scheduledFor", "from", date ?? null)}
                placeholder="Data inicial"
              />
              <DatePicker
                label="Até"
                value={(localFilters.where?.scheduledFor as any)?.lte || undefined}
                onChange={(date) => handleDateRangeChange("scheduledFor", "to", date ?? null)}
                placeholder="Data final"
              />
            </View>
          </View>

          {/* Finished Date Range */}
          <View className="py-4">
            <Text className="text-base font-medium mb-3">Data de Conclusão</Text>
            <View className="space-y-2">
              <DatePicker
                label="De"
                value={(localFilters.where?.finishedAt as any)?.gte || undefined}
                onChange={(date) => handleDateRangeChange("finishedAt", "from", date ?? null)}
                placeholder="Data inicial"
              />
              <DatePicker
                label="Até"
                value={(localFilters.where?.finishedAt as any)?.lte || undefined}
                onChange={(date) => handleDateRangeChange("finishedAt", "to", date ?? null)}
                placeholder="Data final"
              />
            </View>
          </View>

          {/* Cost Filter - Removed as maintenance doesn't have cost fields in the current schema */}
        </ScrollView>

        {/* Footer Actions */}
        <View className="flex-row justify-between p-4 border-t border-border">
          <Button
            variant="outline"
            onPress={handleClear}
            className="flex-1 mr-2"
          >
            Limpar
          </Button>
          <Button
            onPress={handleApply}
            className="flex-1 ml-2"
          >
            Aplicar
          </Button>
        </View>
      </View>
    </Modal>
  );
}