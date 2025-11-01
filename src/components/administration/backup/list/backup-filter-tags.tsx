
import { View, ScrollView, TouchableOpacity, StyleSheet } from "react-native";
import { IconX, IconSearch, IconDatabase, IconClock } from "@tabler/icons-react-native";

import { useTheme } from "@/lib/theme";
import { spacing, fontSize, fontWeight, borderRadius } from "@/constants/design-system";
import { Badge } from "@/components/ui/badge";
import { ThemedText } from "@/components/ui/themed-text";
import { Button } from "@/components/ui/button";
import type { BackupQueryParams } from '../../../../api-client';

interface BackupFilterTagsProps {
  filters: BackupQueryParams;
  searchText?: string;
  onFilterChange: (filters: BackupQueryParams) => void;
  onSearchChange?: (text: string) => void;
  onClearAll: () => void;
}

const getStatusLabel = (status: string) => {
  switch (status) {
    case "completed":
      return "Concluído";
    case "in_progress":
      return "Em Progresso";
    case "pending":
      return "Pendente";
    case "failed":
      return "Falhou";
    default:
      return status;
  }
};

const getTypeLabel = (type: string) => {
  switch (type) {
    case "database":
      return "Banco de Dados";
    case "files":
      return "Arquivos";
    case "full":
      return "Completo";
    default:
      return type;
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case "completed":
      return "#22c55e";
    case "in_progress":
      return "#eab308";
    case "pending":
      return "#737373";
    case "failed":
      return "#ef4444";
    default:
      return "#737373";
  }
};

export function BackupFilterTags({
  filters,
  searchText,
  onFilterChange,
  onSearchChange,
  onClearAll,
}: BackupFilterTagsProps) {
  const { colors } = useTheme();

  // Remove individual filter
  const removeFilter = (filterKey: keyof BackupQueryParams) => {
    const newFilters = { ...filters };
    delete newFilters[filterKey];
    onFilterChange(newFilters);
  };

  // Generate all filter tags
  const renderFilterTags = () => {
    const tags = [];

    // Search tag
    if (searchText) {
      tags.push(
        <Badge key="search" variant="secondary" style={{ ...styles.filterTag, backgroundColor: colors.muted }}>
          <View style={styles.tagContent}>
            <IconSearch size={12} color={colors.mutedForeground} />
            <ThemedText style={styles.tagText}>Busca: {searchText}</ThemedText>
            <TouchableOpacity
              onPress={() => onSearchChange?.("")}
              style={styles.removeButton}
              hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
            >
              <IconX size={12} color={colors.mutedForeground} />
            </TouchableOpacity>
          </View>
        </Badge>,
      );
    }

    // Status filter
    if (filters.status) {
      tags.push(
        <Badge
          key="status"
          variant="secondary"
          style={{
            ...styles.filterTag,
            backgroundColor: getStatusColor(filters.status) + "20",
            borderColor: getStatusColor(filters.status),
            borderWidth: 1,
          }}
        >
          <View style={styles.tagContent}>
            <IconClock size={12} color={getStatusColor(filters.status)} />
            <ThemedText style={[styles.tagText, { color: getStatusColor(filters.status) }]}>
              {getStatusLabel(filters.status)}
            </ThemedText>
            <TouchableOpacity
              onPress={() => removeFilter("status")}
              style={styles.removeButton}
              hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
            >
              <IconX size={12} color={getStatusColor(filters.status)} />
            </TouchableOpacity>
          </View>
        </Badge>,
      );
    }

    // Type filter
    if (filters.type) {
      tags.push(
        <Badge
          key="type"
          variant="secondary"
          style={{
            ...styles.filterTag,
            backgroundColor: colors.primary + "20",
            borderColor: colors.primary,
            borderWidth: 1,
          }}
        >
          <View style={styles.tagContent}>
            <IconDatabase size={12} color={colors.primary} />
            <ThemedText style={[styles.tagText, { color: colors.primary }]}>{getTypeLabel(filters.type)}</ThemedText>
            <TouchableOpacity
              onPress={() => removeFilter("type")}
              style={styles.removeButton}
              hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
            >
              <IconX size={12} color={colors.primary} />
            </TouchableOpacity>
          </View>
        </Badge>,
      );
    }

    return tags;
  };

  const tags = renderFilterTags();

  // Don't render anything if there are no active filters
  if (tags.length === 0) {
    return null;
  }

  return (
    <View style={[styles.container, { borderBottomColor: colors.border }]}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        style={styles.scrollView}
      >
        {tags}
      </ScrollView>
      {tags.length > 1 && (
        <Button variant="ghost" size="sm" onPress={onClearAll} style={styles.clearAllButton}>
          Limpar tudo
        </Button>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    gap: spacing.sm,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    gap: spacing.sm,
    paddingRight: spacing.sm,
  },
  filterTag: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  tagContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  tagText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
  },
  removeButton: {
    padding: 2,
    marginLeft: spacing.xs,
  },
  clearAllButton: {
    paddingHorizontal: spacing.sm,
    height: 32,
  },
});
