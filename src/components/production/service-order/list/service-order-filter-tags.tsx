import React, { useMemo } from "react";
import { View, ScrollView , StyleSheet} from "react-native";
import { Chip } from "@/components/ui/chip";
import { Button } from "@/components/ui/button";
import { ThemedText } from "@/components/ui/themed-text";
import { spacing, fontSize } from "@/constants/design-system";
import { useTheme } from "@/lib/theme";
import { formatDate } from '../../../../utils';
import { SERVICE_ORDER_STATUS, SERVICE_ORDER_STATUS_LABELS } from '../../../../constants';
import type { ServiceOrderGetManyFormData } from '../../../../schemas';

interface FilterTag {
  key: string;
  label: string;
  value: string;
}

interface ServiceOrderFilterTagsProps {
  filters: Partial<ServiceOrderGetManyFormData>;
  searchText?: string;
  onClearAll: () => void;
  onRemoveFilter: (key: string) => void;
  onClearSearch: () => void;
}

export const ServiceOrderFilterTags: React.FC<ServiceOrderFilterTagsProps> = ({
  filters,
  searchText,
  onClearAll,
  onRemoveFilter,
  onClearSearch,
}) => {
  const { colors } = useTheme();

  const filterTags = useMemo(() => {
    const tags: FilterTag[] = [];

    // Status filter
    if (filters.where?.status) {
      tags.push({
        key: "status",
        label: "Status",
        value: SERVICE_ORDER_STATUS_LABELS[filters.where.status as SERVICE_ORDER_STATUS],
      });
    }

    // Created date filters
    if (filters.where?.createdAt?.gte) {
      tags.push({
        key: "createdAt.gte",
        label: "Criado após",
        value: formatDate(new Date(filters.where.createdAt.gte)),
      });
    }

    if (filters.where?.createdAt?.lte) {
      tags.push({
        key: "createdAt.lte",
        label: "Criado antes",
        value: formatDate(new Date(filters.where.createdAt.lte)),
      });
    }

    // Started date filters
    if (filters.where?.startedAt?.gte) {
      tags.push({
        key: "startedAt.gte",
        label: "Iniciado após",
        value: formatDate(new Date(filters.where.startedAt.gte)),
      });
    }

    if (filters.where?.startedAt?.lte) {
      tags.push({
        key: "startedAt.lte",
        label: "Iniciado antes",
        value: formatDate(new Date(filters.where.startedAt.lte)),
      });
    }

    // Finished date filters
    if (filters.where?.finishedAt?.gte) {
      tags.push({
        key: "finishedAt.gte",
        label: "Finalizado após",
        value: formatDate(new Date(filters.where.finishedAt.gte)),
      });
    }

    if (filters.where?.finishedAt?.lte) {
      tags.push({
        key: "finishedAt.lte",
        label: "Finalizado antes",
        value: formatDate(new Date(filters.where.finishedAt.lte)),
      });
    }

    return tags;
  }, [filters]);

  const handleRemoveFilter = (key: string) => {
    // Handle nested keys like "createdAt.gte"
    if (key.includes(".")) {
      const [parentKey, childKey] = key.split(".");
      onRemoveFilter(`where.${parentKey}.${childKey}`);
    } else {
      onRemoveFilter(`where.${key}`);
    }
  };

  const hasFilters = filterTags.length > 0 || !!searchText;

  if (!hasFilters) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <ThemedText style={styles.title}>Filtros ativos:</ThemedText>
        <Button
          variant="ghost"
          size="sm"
          onPress={onClearAll}
          style={styles.clearButton}
        >
          <ThemedText style={StyleSheet.flatten([styles.clearText, { color: colors.destructive }])}>
            Limpar todos
          </ThemedText>
        </Button>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tagsContainer}
      >
        {/* Search tag */}
        {searchText && (
          <Chip
            label={`Busca: "${searchText}"`}
            onRemove={onClearSearch}
            variant="secondary"
          />
        )}

        {/* Filter tags */}
        {filterTags.map((tag) => (
          <Chip
            key={tag.key}
            label={`${tag.label}: ${tag.value}`}
            onRemove={() => handleRemoveFilter(tag.key)}
            variant="secondary"
          />
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.xs,
  },
  title: {
    fontSize: fontSize.sm,
    fontWeight: "600",
  },
  clearButton: {
    paddingHorizontal: 0,
    paddingVertical: 0,
    minHeight: 20,
  },
  clearText: {
    fontSize: fontSize.xs,
  },
  tagsContainer: {
    flexDirection: "row",
    gap: spacing.xs,
    paddingRight: spacing.md,
  },
});