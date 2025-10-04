import React from "react";
import { View, StyleSheet, ScrollView } from "react-native";
import { Chip, ThemedText } from "@/components/ui";
import { COMMISSION_STATUS_LABELS } from '../../../../constants';
import { formatDate } from '../../../../utils';
import type { CommissionGetManyFormData } from '../../../../schemas';

interface CommissionFilterTagsProps {
  filters: Partial<CommissionGetManyFormData>;
  searchText?: string;
  onFilterChange: (filters: Partial<CommissionGetManyFormData>) => void;
  onSearchChange?: (text: string) => void;
  onClearAll: () => void;
}

export function CommissionFilterTags({
  filters,
  searchText,
  onFilterChange,
  onSearchChange,
  onClearAll,
}: CommissionFilterTagsProps) {
  const hasFilters =
    (filters.statuses && filters.statuses.length > 0) ||
    (filters.userIds && filters.userIds.length > 0) ||
    (filters.taskIds && filters.taskIds.length > 0) ||
    filters.createdAt?.gte ||
    filters.createdAt?.lte ||
    searchText;

  if (!hasFilters) return null;

  const removeStatus = (status: string) => {
    const newStatuses = filters.statuses?.filter((s) => s !== status) || [];
    onFilterChange({ ...filters, statuses: newStatuses.length > 0 ? newStatuses : undefined });
  };

  const removeUserId = (userId: string) => {
    const newUserIds = filters.userIds?.filter((id) => id !== userId) || [];
    onFilterChange({ ...filters, userIds: newUserIds.length > 0 ? newUserIds : undefined });
  };

  const removeTaskId = (taskId: string) => {
    const newTaskIds = filters.taskIds?.filter((id) => id !== taskId) || [];
    onFilterChange({ ...filters, taskIds: newTaskIds.length > 0 ? newTaskIds : undefined });
  };

  const removeDateFilter = () => {
    const newFilters = { ...filters };
    delete newFilters.createdAt;
    onFilterChange(newFilters);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <ThemedText style={styles.headerText}>Filtros Ativos:</ThemedText>
        <Chip onPress={onClearAll} variant="outline" size="sm">
          Limpar Tudo
        </Chip>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tagsContainer}
      >
        {searchText && (
          <Chip
            onPress={() => onSearchChange?.("")}
            variant="default"
            size="sm"
            icon="search"
          >
            Busca: {searchText}
          </Chip>
        )}

        {filters.statuses?.map((status) => (
          <Chip
            key={status}
            onPress={() => removeStatus(status)}
            variant="default"
            size="sm"
            icon="close"
          >
            {COMMISSION_STATUS_LABELS[status as keyof typeof COMMISSION_STATUS_LABELS]}
          </Chip>
        ))}

        {filters.userIds?.map((userId, index) => (
          <Chip
            key={userId}
            onPress={() => removeUserId(userId)}
            variant="default"
            size="sm"
            icon="close"
          >
            Colaborador {index + 1}
          </Chip>
        ))}

        {filters.taskIds?.map((taskId, index) => (
          <Chip
            key={taskId}
            onPress={() => removeTaskId(taskId)}
            variant="default"
            size="sm"
            icon="close"
          >
            Serviço {index + 1}
          </Chip>
        ))}

        {(filters.createdAt?.gte || filters.createdAt?.lte) && (
          <Chip
            onPress={removeDateFilter}
            variant="default"
            size="sm"
            icon="close"
          >
            {filters.createdAt?.gte && formatDate(filters.createdAt.gte)}
            {filters.createdAt?.gte && filters.createdAt?.lte && " - "}
            {filters.createdAt?.lte && formatDate(filters.createdAt.lte)}
          </Chip>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  headerText: {
    fontSize: 12,
    fontWeight: "600",
    opacity: 0.7,
  },
  tagsContainer: {
    flexDirection: "row",
    gap: 8,
    paddingRight: 16,
  },
});
