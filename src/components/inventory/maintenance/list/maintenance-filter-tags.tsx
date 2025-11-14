
import { View, ScrollView, TouchableOpacity } from "react-native";
import { Text } from "@/components/ui/text";
import { Icon } from "@/components/ui/icon";
import { Badge } from "@/components/ui/badge";
import {
  MAINTENANCE_STATUS_LABELS
} from "@/constants";
import { formatDate } from "@/utils";
import type { MaintenanceGetManyParams } from '../../../../types';

interface MaintenanceFilterTagsProps {
  filters: Partial<MaintenanceGetManyParams>;
  onRemoveFilter: (key: string, value?: any) => void;
  onClearAll: () => void;
}

export function MaintenanceFilterTags({
  filters,
  onRemoveFilter,
  onClearAll,
}: MaintenanceFilterTagsProps) {
  const filterTags: Array<{ key: string; label: string; value: any }> = [];

  // Status filters
  if (filters.where?.status && (filters.where.status as any)?.in && (filters.where.status as any).in.length > 0) {
    (filters.where.status as any).in.forEach((status: string) => {
      filterTags.push({
        key: "status",
        label: `Status: ${MAINTENANCE_STATUS_LABELS[status as keyof typeof MAINTENANCE_STATUS_LABELS]}`,
        value: status,
      });
    });
  }

  // Type filters - Removed as maintenance doesn't have a type field

  // Priority filter - Removed as maintenance doesn't have a priority field

  // Scheduled date range
  if ((filters.where?.scheduledFor as any)?.gte) {
    filterTags.push({
      key: "scheduledFor.gte",
      label: `Agendado desde: ${formatDate((filters.where?.scheduledFor as any).gte)}`,
      value: (filters.where?.scheduledFor as any).gte,
    });
  }
  if ((filters.where?.scheduledFor as any)?.lte) {
    filterTags.push({
      key: "scheduledFor.lte",
      label: `Agendado até: ${formatDate((filters.where?.scheduledFor as any).lte)}`,
      value: (filters.where?.scheduledFor as any).lte,
    });
  }

  // Finished date range
  if ((filters.where?.finishedAt as any)?.gte) {
    filterTags.push({
      key: "finishedAt.gte",
      label: `Concluído desde: ${formatDate((filters.where?.finishedAt as any).gte)}`,
      value: (filters.where?.finishedAt as any).gte,
    });
  }
  if ((filters.where?.finishedAt as any)?.lte) {
    filterTags.push({
      key: "finishedAt.lte",
      label: `Concluído até: ${formatDate((filters.where?.finishedAt as any).lte)}`,
      value: (filters.where?.finishedAt as any).lte,
    });
  }

  // Search term
  if (filters.searchingFor) {
    filterTags.push({
      key: "searchingFor",
      label: `Busca: "${filters.searchingFor}"`,
      value: filters.searchingFor,
    });
  }

  // Order by
  if (filters.orderBy) {
    const orderByLabel = getOrderByLabel(filters.orderBy);
    if (orderByLabel) {
      filterTags.push({
        key: "orderBy",
        label: `Ordenação: ${orderByLabel}`,
        value: filters.orderBy,
      });
    }
  }

  if (filterTags.length === 0) {
    return null;
  }

  return (
    <View className="mb-3">
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="py-2"
      >
        <View className="flex-row items-center space-x-2 px-4">
          {/* Clear All Button */}
          <TouchableOpacity
            onPress={onClearAll}
            className="mr-2"
          >
            <Badge variant="outline">
              <View className="flex-row items-center">
                <Icon name="IconX" size={14} color="#6B7280" />
                <Text className="ml-1 text-xs">Limpar</Text>
              </View>
            </Badge>
          </TouchableOpacity>

          {/* Filter Tags */}
          {filterTags.map((tag, index) => (
            <TouchableOpacity
              key={`${tag.key}-${index}`}
              onPress={() => onRemoveFilter(tag.key, tag.value)}
              className="mr-2"
            >
              <Badge variant="secondary">
                <View className="flex-row items-center">
                  <Text className="text-xs mr-1">{tag.label}</Text>
                  <Icon name="IconX" size={12} color="#6B7280" />
                </View>
              </Badge>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

function getOrderByLabel(orderBy: any): string | null {
  if (!orderBy) return null;

  const orderByMap: Record<string, string> = {
    "scheduledFor.desc": "Mais recente",
    "scheduledFor.asc": "Mais antigo",
    "finishedAt.desc": "Concluído recentemente",
    "finishedAt.asc": "Concluído há mais tempo",
    "status.asc": "Status (A-Z)",
    "status.desc": "Status (Z-A)",
    "name.asc": "Nome (A-Z)",
    "name.desc": "Nome (Z-A)",
    "createdAt.desc": "Criado recentemente",
    "createdAt.asc": "Criado há mais tempo",
  };

  // Handle object format
  if (typeof orderBy === "object") {
    const key = Object.keys(orderBy)[0];
    const direction = orderBy[key as keyof typeof orderBy];
    return orderByMap[`${key}.${direction}`] || null;
  }

  // Handle string format
  if (typeof orderBy === "string") {
    return orderByMap[orderBy] || null;
  }

  return null;
}