import React from "react";
import { View, Pressable, StyleSheet } from "react-native";
import { ThemedText } from "@/components/ui/themed-text";
import { Badge } from "@/components/ui/badge";
import { IconX } from "@tabler/icons-react-native";
import { useTheme } from "@/lib/theme";
import {
  SCHEDULE_FREQUENCY_LABELS,
  ORDER_STATUS_LABELS,
  USER_STATUS_LABELS
} from '../../../../constants';
import type { OrderScheduleGetManyFormData } from '../../../../schemas';

interface OrderScheduleFilterTagsProps {
  filters: Partial<OrderScheduleGetManyFormData>;
  searchText?: string;
  onFilterChange: (filters: Partial<OrderScheduleGetManyFormData>) => void;
  onSearchChange?: (text: string) => void;
  onClearAll: () => void;
}

export function OrderScheduleFilterTags({
  filters,
  searchText,
  onFilterChange,
  onSearchChange,
  onClearAll
}: OrderScheduleFilterTagsProps) {
  const { spacing, colors } = useTheme();

  const removeFilter = (key: string) => {
    const newFilters = { ...filters };
    delete newFilters[key as keyof typeof newFilters];
    onFilterChange(newFilters);
  };

  const removeSearchText = () => {
    if (onSearchChange) {
      onSearchChange("");
    }
  };

  const hasActiveFilters = Object.keys(filters).length > 0 || (searchText && searchText.length > 0);

  if (!hasActiveFilters) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.tagsContainer}>
        {/* Search text tag */}
        {searchText && searchText.length > 0 && (
          <Badge variant="secondary" style={styles.tag}>
            <ThemedText style={styles.tagText}>
              Busca: "{searchText}"
            </ThemedText>
            <Pressable
              onPress={removeSearchText}
              style={styles.removeButton}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <IconX size={12} color={colors.foreground} />
            </Pressable>
          </Badge>
        )}

        {/* Frequency filter */}
        {filters.frequency && (
          <Badge variant="secondary" style={styles.tag}>
            <ThemedText style={styles.tagText}>
              Frequência: {SCHEDULE_FREQUENCY_LABELS[filters.frequency] || filters.frequency}
            </ThemedText>
            <Pressable
              onPress={() => removeFilter("frequency")}
              style={styles.removeButton}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <IconX size={12} color={colors.foreground} />
            </Pressable>
          </Badge>
        )}

        {/* Active status filter */}
        {filters.isActive !== undefined && (
          <Badge variant="secondary" style={styles.tag}>
            <ThemedText style={styles.tagText}>
              Status: {filters.isActive ? "Ativo" : "Inativo"}
            </ThemedText>
            <Pressable
              onPress={() => removeFilter("isActive")}
              style={styles.removeButton}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <IconX size={12} color={colors.foreground} />
            </Pressable>
          </Badge>
        )}

        {/* Supplier filter */}
        {filters.supplierId && (
          <Badge variant="secondary" style={styles.tag}>
            <ThemedText style={styles.tagText}>
              Fornecedor selecionado
            </ThemedText>
            <Pressable
              onPress={() => removeFilter("supplierId")}
              style={styles.removeButton}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <IconX size={12} color={colors.foreground} />
            </Pressable>
          </Badge>
        )}

        {/* Date range filters */}
        {(filters.createdAt?.gte || filters.createdAt?.lte) && (
          <Badge variant="secondary" style={styles.tag}>
            <ThemedText style={styles.tagText}>
              Período de criação
            </ThemedText>
            <Pressable
              onPress={() => removeFilter("createdAt")}
              style={styles.removeButton}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <IconX size={12} color={colors.foreground} />
            </Pressable>
          </Badge>
        )}

        {(filters.nextRun?.gte || filters.nextRun?.lte) && (
          <Badge variant="secondary" style={styles.tag}>
            <ThemedText style={styles.tagText}>
              Período de próxima execução
            </ThemedText>
            <Pressable
              onPress={() => removeFilter("nextRun")}
              style={styles.removeButton}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <IconX size={12} color={colors.foreground} />
            </Pressable>
          </Badge>
        )}
      </View>

      {/* Clear all button */}
      <Pressable
        onPress={onClearAll}
        style={styles.clearAllButton}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <ThemedText style={styles.clearAllText}>
          Limpar tudo
        </ThemedText>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: 8,
  },
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    flex: 1,
  },
  tag: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 8,
  },
  tagText: {
    fontSize: 12,
    fontWeight: "500",
  },
  removeButton: {
    padding: 2,
  },
  clearAllButton: {
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  clearAllText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#ef4444",
  },
});