import { useMemo } from "react";
import { View, ScrollView, TouchableOpacity, StyleSheet } from "react-native";
import { IconX } from "@tabler/icons-react-native";
import { useTheme } from "@/lib/theme";
import { ThemedText } from "@/components/ui/themed-text";
import { Badge } from "@/components/ui/badge";
import { spacing, fontSize, fontWeight, borderRadius } from "@/constants/design-system";
import { formatDate } from "@/utils";
import { SERVICE_ORDER_STATUS, SERVICE_ORDER_STATUS_LABELS } from "@/constants";
import type { ServiceOrderGetManyFormData } from '../../../../schemas';

interface FilterTag {
  key: string;
  label: string;
  onRemove: () => void;
}

interface ServiceOrderFilterTagsProps {
  filters: Partial<ServiceOrderGetManyFormData>;
  searchText?: string;
  onFilterChange: (filters: Partial<ServiceOrderGetManyFormData>) => void;
  onSearchChange?: (text: string) => void;
  onClearAll: () => void;
}

export function ServiceOrderFilterTags({
  filters,
  searchText,
  onFilterChange,
  onSearchChange,
  onClearAll,
}: ServiceOrderFilterTagsProps) {
  const { colors } = useTheme();

  // Build array of active filter tags
  const filterTags = useMemo((): FilterTag[] => {
    const tags: FilterTag[] = [];

    // Search text
    if (searchText) {
      tags.push({
        key: "search",
        label: `Busca: "${searchText}"`,
        onRemove: () => onSearchChange?.(""),
      });
    }

    // Status filter
    if (filters.where?.status) {
      const statusLabel = SERVICE_ORDER_STATUS_LABELS[filters.where.status as SERVICE_ORDER_STATUS];
      tags.push({
        key: "status",
        label: `Status: ${statusLabel}`,
        onRemove: () => {
          const newWhere = { ...filters.where };
          delete newWhere.status;
          onFilterChange({ ...filters, where: newWhere });
        },
      });
    }

    // Created date filters
    if (filters.where?.createdAt?.gte) {
      tags.push({
        key: "created-start",
        label: `Criado após: ${formatDate(new Date(filters.where.createdAt.gte))}`,
        onRemove: () => {
          const newWhere = { ...filters.where };
          if (newWhere.createdAt) {
            const { gte, ...rest } = newWhere.createdAt;
            newWhere.createdAt = Object.keys(rest).length > 0 ? rest : undefined;
          }
          if (!newWhere.createdAt) delete newWhere.createdAt;
          onFilterChange({ ...filters, where: newWhere });
        },
      });
    }

    if (filters.where?.createdAt?.lte) {
      tags.push({
        key: "created-end",
        label: `Criado antes: ${formatDate(new Date(filters.where.createdAt.lte))}`,
        onRemove: () => {
          const newWhere = { ...filters.where };
          if (newWhere.createdAt) {
            const { lte, ...rest } = newWhere.createdAt;
            newWhere.createdAt = Object.keys(rest).length > 0 ? rest : undefined;
          }
          if (!newWhere.createdAt) delete newWhere.createdAt;
          onFilterChange({ ...filters, where: newWhere });
        },
      });
    }

    // Started date filters
    if (filters.where?.startedAt?.gte) {
      tags.push({
        key: "started-start",
        label: `Iniciado após: ${formatDate(new Date(filters.where.startedAt.gte))}`,
        onRemove: () => {
          const newWhere = { ...filters.where };
          if (newWhere.startedAt) {
            const { gte, ...rest } = newWhere.startedAt;
            newWhere.startedAt = Object.keys(rest).length > 0 ? rest : undefined;
          }
          if (!newWhere.startedAt) delete newWhere.startedAt;
          onFilterChange({ ...filters, where: newWhere });
        },
      });
    }

    if (filters.where?.startedAt?.lte) {
      tags.push({
        key: "started-end",
        label: `Iniciado antes: ${formatDate(new Date(filters.where.startedAt.lte))}`,
        onRemove: () => {
          const newWhere = { ...filters.where };
          if (newWhere.startedAt) {
            const { lte, ...rest } = newWhere.startedAt;
            newWhere.startedAt = Object.keys(rest).length > 0 ? rest : undefined;
          }
          if (!newWhere.startedAt) delete newWhere.startedAt;
          onFilterChange({ ...filters, where: newWhere });
        },
      });
    }

    // Finished date filters
    if (filters.where?.finishedAt?.gte) {
      tags.push({
        key: "finished-start",
        label: `Finalizado após: ${formatDate(new Date(filters.where.finishedAt.gte))}`,
        onRemove: () => {
          const newWhere = { ...filters.where };
          if (newWhere.finishedAt) {
            const { gte, ...rest } = newWhere.finishedAt;
            newWhere.finishedAt = Object.keys(rest).length > 0 ? rest : undefined;
          }
          if (!newWhere.finishedAt) delete newWhere.finishedAt;
          onFilterChange({ ...filters, where: newWhere });
        },
      });
    }

    if (filters.where?.finishedAt?.lte) {
      tags.push({
        key: "finished-end",
        label: `Finalizado antes: ${formatDate(new Date(filters.where.finishedAt.lte))}`,
        onRemove: () => {
          const newWhere = { ...filters.where };
          if (newWhere.finishedAt) {
            const { lte, ...rest } = newWhere.finishedAt;
            newWhere.finishedAt = Object.keys(rest).length > 0 ? rest : undefined;
          }
          if (!newWhere.finishedAt) delete newWhere.finishedAt;
          onFilterChange({ ...filters, where: newWhere });
        },
      });
    }

    return tags;
  }, [filters, searchText, onFilterChange, onSearchChange]);

  // Don't render if no active filters
  if (filterTags.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {filterTags.map((tag) => (
          <Badge
            key={tag.key}
            variant="secondary"
            style={StyleSheet.flatten([
              styles.filterTag,
              {
                backgroundColor: colors.secondary,
                borderColor: colors.border,
              }
            ])}
          >
            <ThemedText style={[styles.filterTagText, { color: colors.secondaryForeground }]}>
              {tag.label}
            </ThemedText>
            <TouchableOpacity
              onPress={tag.onRemove}
              style={styles.removeButton}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              activeOpacity={0.7}
            >
              <IconX size={14} color={colors.secondaryForeground} />
            </TouchableOpacity>
          </Badge>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: spacing.sm,
    minHeight: 44,
  },
  scrollContent: {
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
    alignItems: "center",
  },
  filterTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingLeft: spacing.sm,
    paddingRight: spacing.xs,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    minHeight: 32,
  },
  filterTagText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  removeButton: {
    padding: spacing.xs,
    marginLeft: spacing.xxs,
    borderRadius: borderRadius.sm,
  },
});