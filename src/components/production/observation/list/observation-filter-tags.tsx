
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { IconX } from "@tabler/icons-react-native";
import { ThemedText } from "@/components/ui/themed-text";
import { useTheme } from "@/lib/theme";
import { spacing, fontSize, borderRadius } from "@/constants/design-system";
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

interface FilterTagProps {
  label: string;
  onRemove: () => void;
  variant?: "default" | "clear";
}

function FilterTag({ label, onRemove, variant = "default" }: FilterTagProps) {
  const { colors } = useTheme();

  return (
    <View
      style={[
        styles.tag,
        {
          backgroundColor: variant === "clear" ? colors.destructive : colors.muted,
          borderColor: variant === "clear" ? colors.destructive : colors.border,
        },
      ]}
    >
      <ThemedText
        style={[
          styles.tagText,
          {
            color: variant === "clear" ? colors.background : colors.foreground,
          },
        ]}
      >
        {label}
      </ThemedText>
      <TouchableOpacity onPress={onRemove} style={styles.removeButton}>
        <IconX
          size={14}
          color={variant === "clear" ? colors.background : colors.mutedForeground}
        />
      </TouchableOpacity>
    </View>
  );
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

    const newTaskIds = filters.taskIds.filter((id: any /* TODO: Add proper type */) => id !== taskId);
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

        {filters.taskIds?.map((taskId: any /* TODO: Add proper type */) => (
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
  tag: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    gap: spacing.xs,
  },
  tagText: {
    fontSize: fontSize.sm,
    fontWeight: "500",
  },
  removeButton: {
    padding: 2,
  },
});
