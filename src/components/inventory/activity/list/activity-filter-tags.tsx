
import { View, ScrollView, TouchableOpacity , StyleSheet} from "react-native";
import { useTheme } from "@/lib/theme";
import { ThemedText } from "@/components/ui/themed-text";

import { IconX, IconSearch } from "@tabler/icons-react-native";
import { spacing } from "@/constants/design-system";
import { ACTIVITY_OPERATION, ACTIVITY_REASON, ACTIVITY_OPERATION_LABELS, ACTIVITY_REASON_LABELS } from '../../../../constants';
import type { ActivityGetManyFormData } from '../../../../schemas';

interface ActivityFilterTagsProps {
  filters: Partial<ActivityGetManyFormData>;
  searchText?: string;
  onClearAll: () => void;
  onRemoveFilter: (key: string) => void;
  onClearSearch?: () => void;
}

export const ActivityFilterTags = ({
  filters,
  searchText,
  onClearAll,
  onRemoveFilter,
  onClearSearch,
}: ActivityFilterTagsProps) => {
  const { colors } = useTheme();

  const filterTags: { key: string; label: string; value: string }[] = [];

  // Add operation filters
  if (filters.operations?.length) {
    filters.operations.forEach((op: ACTIVITY_OPERATION) => {
      filterTags.push({
        key: `operation_${op}`,
        label: "Operação",
        value: ACTIVITY_OPERATION_LABELS[op] || op,
      });
    });
  }

  // Add reason filters
  if (filters.reasons?.length) {
    filters.reasons.forEach((reason: ACTIVITY_REASON) => {
      filterTags.push({
        key: `reason_${reason}`,
        label: "Motivo",
        value: ACTIVITY_REASON_LABELS[reason] || reason,
      });
    });
  }

  // Add quantity range
  if (filters.quantityRange?.min !== undefined || filters.quantityRange?.max !== undefined) {
    const min = filters.quantityRange.min ?? 0;
    const max = filters.quantityRange.max ?? "∞";
    filterTags.push({
      key: "quantityRange",
      label: "Quantidade",
      value: `${min} - ${max}`,
    });
  }

  // Add date range
  if (filters.createdAt?.gte || filters.createdAt?.lte) {
    const start = filters.createdAt.gte ? new Date(filters.createdAt.gte).toLocaleDateString("pt-BR") : "Início";
    const end = filters.createdAt.lte ? new Date(filters.createdAt.lte).toLocaleDateString("pt-BR") : "Hoje";
    filterTags.push({
      key: "createdAt",
      label: "Período",
      value: `${start} - ${end}`,
    });
  }

  // Add item filter
  if (filters.itemIds?.length) {
    filterTags.push({
      key: "itemIds",
      label: "Item",
      value: `${filters.itemIds.length} selecionado${filters.itemIds.length > 1 ? "s" : ""}`,
    });
  }

  // Add user filter
  if (filters.userIds?.length) {
    filterTags.push({
      key: "userIds",
      label: "Usuário",
      value: `${filters.userIds.length} selecionado${filters.userIds.length > 1 ? "s" : ""}`,
    });
  }

  if (!filterTags.length && !searchText) {
    return null;
  }

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {searchText && (
          <TouchableOpacity
            style={StyleSheet.flatten([styles.tag, { backgroundColor: colors.primary }])}
            onPress={onClearSearch}
          >
            <IconSearch size={14} color={colors.primaryForeground} />
            <ThemedText style={StyleSheet.flatten([styles.tagText, { color: colors.primaryForeground }])}>
              "{searchText}"
            </ThemedText>
            <IconX size={14} color={colors.primaryForeground} />
          </TouchableOpacity>
        )}

        {filterTags.map((tag) => (
          <TouchableOpacity
            key={tag.key}
            style={StyleSheet.flatten([styles.tag, { backgroundColor: colors.muted }])}
            onPress={() => onRemoveFilter(tag.key)}
          >
            <ThemedText style={styles.tagLabel}>{tag.label}:</ThemedText>
            <ThemedText style={styles.tagValue}>{tag.value}</ThemedText>
            <IconX size={14} color={colors.mutedForeground} />
          </TouchableOpacity>
        ))}

        {filterTags.length > 0 && (
          <TouchableOpacity
            style={StyleSheet.flatten([styles.clearAllButton, { borderColor: colors.border }])}
            onPress={onClearAll}
          >
            <ThemedText style={styles.clearAllText}>Limpar tudo</ThemedText>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  scrollContent: {
    gap: spacing.sm,
  },
  tag: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 16,
  },
  tagLabel: {
    fontSize: 12,
    opacity: 0.7,
  },
  tagValue: {
    fontSize: 12,
    fontWeight: "500",
  },
  tagText: {
    fontSize: 12,
    fontWeight: "500",
  },
  clearAllButton: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 16,
    borderWidth: 1,
    justifyContent: "center",
  },
  clearAllText: {
    fontSize: 12,
    fontWeight: "500",
  },
});