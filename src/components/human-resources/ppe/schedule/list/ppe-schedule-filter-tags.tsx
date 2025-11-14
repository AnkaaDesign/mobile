// apps/mobile/src/components/human-resources/ppe/schedule/list/ppe-schedule-filter-tags.tsx

import { View, StyleSheet, ScrollView } from "react-native";
import { Chip } from "@/components/ui/chip";
import { SCHEDULE_FREQUENCY_LABELS } from "@/constants";
import type { PpeDeliveryScheduleGetManyFormData } from '../../../../../schemas';

interface PpeScheduleFilterTagsProps {
  filters: Partial<PpeDeliveryScheduleGetManyFormData>;
  searchText?: string;
  onFilterChange: (filters: Partial<PpeDeliveryScheduleGetManyFormData>) => void;
  onSearchChange: (text: string) => void;
  onClearAll: () => void;
}

export function PpeScheduleFilterTags({ filters, searchText, onFilterChange, onSearchChange, onClearAll }: PpeScheduleFilterTagsProps) {
  const hasFilters = Boolean(
    searchText || filters.userIds?.length || filters.itemIds?.length || filters.categoryIds?.length || filters.frequencies?.length || filters.isActive !== undefined,
  );

  if (!hasFilters) {
    return null;
  }

  const removeFilter = (key: string) => {
    const newFilters = { ...filters };
    delete (newFilters as any)[key];
    onFilterChange(newFilters);
  };

  return (
    <View style={styles.container}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {searchText && (
          <Chip variant="secondary" onRemove={() => onSearchChange("")}>
            Busca: {searchText}
          </Chip>
        )}

        {filters.userIds && filters.userIds.length > 0 && (
          <Chip variant="secondary" onRemove={() => removeFilter("userIds")}>
            {filters.userIds.length} Funcionário(s)
          </Chip>
        )}

        {filters.itemIds && filters.itemIds.length > 0 && (
          <Chip variant="secondary" onRemove={() => removeFilter("itemIds")}>
            {filters.itemIds.length} Item(ns)
          </Chip>
        )}

        {filters.categoryIds && filters.categoryIds.length > 0 && (
          <Chip variant="secondary" onRemove={() => removeFilter("categoryIds")}>
            {filters.categoryIds.length} Categoria(s)
          </Chip>
        )}

        {filters.frequencies && filters.frequencies.length > 0 && (
          <Chip variant="secondary" onRemove={() => removeFilter("frequencies")}>
            {filters.frequencies.length === 1 ? SCHEDULE_FREQUENCY_LABELS[filters.frequencies[0] as keyof typeof SCHEDULE_FREQUENCY_LABELS] : `${filters.frequencies.length} Frequências`}
          </Chip>
        )}

        {filters.isActive !== undefined && (
          <Chip variant="secondary" onRemove={() => removeFilter("isActive")}>
            {filters.isActive ? "Ativos" : "Inativos"}
          </Chip>
        )}

        {hasFilters && (
          <Chip variant="destructive" onPress={onClearAll}>
            Limpar Tudo
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
  scrollContent: {
    gap: 8,
    paddingHorizontal: 8,
  },
});
