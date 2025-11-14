
import { View, StyleSheet, ScrollView } from "react-native";
import { Chip, ThemedText } from "@/components/ui";
import { COMMISSION_STATUS_LABELS } from "@/constants";
import { formatDate } from "@/utils";
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
    (filters.where?.statuses && filters.where.statuses.length > 0) ||
    (filters.where?.userIds && filters.where.userIds.length > 0) ||
    (filters.where?.taskIds && filters.where.taskIds.length > 0) ||
    filters.where?.createdAt?.gte ||
    filters.where?.createdAt?.lte ||
    searchText;

  if (!hasFilters) return null;

  const removeStatus = (status: string) => {
    const newStatuses = filters.where?.statuses?.filter((s: any /* TODO: Add proper type */) => s !== status) || [];
    onFilterChange({
      ...filters,
      where: {
        ...filters.where,
        statuses: newStatuses.length > 0 ? newStatuses : undefined
      }
    });
  };

  const removeUserId = (userId: string) => {
    const newUserIds = filters.where?.userIds?.filter((id: any /* TODO: Add proper type */) => id !== userId) || [];
    onFilterChange({
      ...filters,
      where: {
        ...filters.where,
        userIds: newUserIds.length > 0 ? newUserIds : undefined
      }
    });
  };

  const removeTaskId = (taskId: string) => {
    const newTaskIds = filters.where?.taskIds?.filter((id: any /* TODO: Add proper type */) => id !== taskId) || [];
    onFilterChange({
      ...filters,
      where: {
        ...filters.where,
        taskIds: newTaskIds.length > 0 ? newTaskIds : undefined
      }
    });
  };

  const removeDateFilter = () => {
    const newFilters = { ...filters };
    if (newFilters.where) {
      delete newFilters.where.createdAt;
    }
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

        {filters.where?.statuses?.map((status: any /* TODO: Add proper type */) => (
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

        {filters.where?.userIds?.map((userId: any /* TODO: Add proper type */, index: any /* TODO: Add proper type */) => (
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

        {filters.where?.taskIds?.map((taskId: any /* TODO: Add proper type */, index: any /* TODO: Add proper type */) => (
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

        {(filters.where?.createdAt?.gte || filters.where?.createdAt?.lte) && (
          <Chip
            onPress={removeDateFilter}
            variant="default"
            size="sm"
            icon="close"
          >
            {filters.where?.createdAt?.gte && formatDate(filters.where.createdAt.gte)}
            {filters.where?.createdAt?.gte && filters.where?.createdAt?.lte && " - "}
            {filters.where?.createdAt?.lte && formatDate(filters.where.createdAt.lte)}
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
