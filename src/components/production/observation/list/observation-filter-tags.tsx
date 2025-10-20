import React from "react";
import { View, StyleSheet } from "react-native";
import { FilterTag } from "@/components/ui/filter-tag";
import type { ObservationGetManyFormData } from "@/schemas";
import type { Task } from "@/types";
import { formatDate } from "@/utils";

interface ObservationFilterTagsProps {
  filters: Partial<ObservationGetManyFormData>;
  searchText?: string;
  onFilterChange: (filters: Partial<ObservationGetManyFormData>) => void;
  onSearchChange: (text: string) => void;
  onClearAll: () => void;
  tasks?: Task[];
}

export function ObservationFilterTags({
  filters,
  searchText,
  onFilterChange,
  onSearchChange,
  onClearAll,
  tasks = [],
}: ObservationFilterTagsProps) {
  const hasFilters =
    (filters.taskIds && filters.taskIds.length > 0) ||
    filters.hasFiles !== undefined ||
    filters.createdAt?.gte ||
    filters.createdAt?.lte ||
    !!searchText;

  if (!hasFilters) {
    return null;
  }

  const removeFilter = (key: keyof ObservationGetManyFormData) => {
    const newFilters = { ...filters };

    if (key === "taskIds") {
      delete newFilters.taskIds;
    } else if (key === "hasFiles") {
      delete newFilters.hasFiles;
    } else if (key === "createdAt") {
      delete newFilters.createdAt;
    }

    onFilterChange(newFilters);
  };

  const removeTaskId = (taskId: string) => {
    if (!filters.taskIds) return;

    const newTaskIds = filters.taskIds.filter((id) => id !== taskId);
    const newFilters = { ...filters };

    if (newTaskIds.length === 0) {
      delete newFilters.taskIds;
    } else {
      newFilters.taskIds = newTaskIds;
    }

    onFilterChange(newFilters);
  };

  const getTaskName = (taskId: string) => {
    const task = tasks.find((t) => t.id === taskId);
    return task?.name || taskId.substring(0, 8);
  };

  return (
    <View style={styles.container}>
      <View style={styles.tagsContainer}>
        {searchText && (
          <FilterTag
            label={`Busca: "${searchText}"`}
            onRemove={() => onSearchChange("")}
          />
        )}

        {filters.taskIds?.map((taskId) => (
          <FilterTag
            key={taskId}
            label={`Tarefa: ${getTaskName(taskId)}`}
            onRemove={() => removeTaskId(taskId)}
          />
        ))}

        {filters.hasFiles === true && (
          <FilterTag
            label="Com arquivos"
            onRemove={() => removeFilter("hasFiles")}
          />
        )}

        {filters.hasFiles === false && (
          <FilterTag
            label="Sem arquivos"
            onRemove={() => removeFilter("hasFiles")}
          />
        )}

        {(filters.createdAt?.gte || filters.createdAt?.lte) && (
          <FilterTag
            label={
              filters.createdAt?.gte && filters.createdAt?.lte
                ? `Criado: ${formatDate(filters.createdAt.gte)} - ${formatDate(filters.createdAt.lte)}`
                : filters.createdAt?.gte
                ? `Criado após: ${formatDate(filters.createdAt.gte)}`
                : `Criado antes: ${formatDate(filters.createdAt.lte!)}`
            }
            onRemove={() => removeFilter("createdAt")}
          />
        )}

        {hasFilters && (
          <FilterTag
            label="Limpar todos"
            onRemove={onClearAll}
            variant="clear"
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 8,
    paddingBottom: 8,
  },
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
});
