import { useMemo, useCallback } from "react";
import { View, ScrollView, TouchableOpacity, StyleSheet } from "react-native";
import { IconX } from "@tabler/icons-react-native";
import { useTheme } from "@/lib/theme";
import { ThemedText } from "@/components/ui/themed-text";
import { Badge } from "@/components/ui/badge";
import { BRAZILIAN_STATE_NAMES, type BrazilianState } from '../../../../constants';
import { spacing, fontSize, fontWeight, borderRadius } from "@/constants/design-system";
import type { CustomerGetManyFormData } from '../../../../schemas';
import { formatDate } from '../../../../utils';

interface CustomerFilterTagsProps {
  filters: Partial<CustomerGetManyFormData>;
  searchText?: string;
  onFilterChange: (filters: Partial<CustomerGetManyFormData>) => void;
  onSearchChange?: (text: string) => void;
  onClearAll: () => void;
}

interface FilterTag {
  key: string;
  label: string;
  onRemove: () => void;
}

export function CustomerFilterTags({
  filters,
  searchText,
  onFilterChange,
  onSearchChange,
  onClearAll,
}: CustomerFilterTagsProps) {
  const { colors, isDark } = useTheme();

  // Memoized handlers for better performance
  const handleClearAll = useCallback(() => {
    onClearAll();
  }, [onClearAll]);

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

    // Where clause filters
    const where = filters.where as any;
    if (where) {
      // States
      if (where.state?.in) {
        const states = where.state.in as string[];
        states.forEach((state) => {
          tags.push({
            key: `state-${state}`,
            label: `Estado: ${BRAZILIAN_STATE_NAMES[state as BrazilianState] || state}`,
            onRemove: () => {
              const newStates = states.filter((s) => s !== state);
              const newWhere = { ...where };
              if (newStates.length === 0) {
                delete newWhere.state;
              } else {
                newWhere.state = { in: newStates };
              }
              onFilterChange({ ...filters, where: newWhere });
            },
          });
        });
      }

      // City
      if (where.city?.contains) {
        tags.push({
          key: "city",
          label: `Cidade: ${where.city.contains}`,
          onRemove: () => {
            const newWhere = { ...where };
            delete newWhere.city;
            onFilterChange({ ...filters, where: newWhere });
          },
        });
      }

      // Tags
      if (where.tags?.hasSome) {
        const customerTags = where.tags.hasSome as string[];
        customerTags.forEach((tag, index) => {
          tags.push({
            key: `tag-${index}`,
            label: `Tag: ${tag}`,
            onRemove: () => {
              const newTags = customerTags.filter((t) => t !== tag);
              const newWhere = { ...where };
              if (newTags.length === 0) {
                delete newWhere.tags;
              } else {
                newWhere.tags = { hasSome: newTags };
              }
              onFilterChange({ ...filters, where: newWhere });
            },
          });
        });
      }

      // Document filters
      if (where.cnpj?.not === null) {
        tags.push({
          key: "has-cnpj",
          label: "Com CNPJ",
          onRemove: () => {
            const newWhere = { ...where };
            delete newWhere.cnpj;
            onFilterChange({ ...filters, where: newWhere });
          },
        });
      }

      if (where.cpf?.not === null) {
        tags.push({
          key: "has-cpf",
          label: "Com CPF",
          onRemove: () => {
            const newWhere = { ...where };
            delete newWhere.cpf;
            onFilterChange({ ...filters, where: newWhere });
          },
        });
      }

      // Date filters
      if (where.createdAt) {
        if (where.createdAt.gte) {
          tags.push({
            key: "created-start",
            label: `Cadastrado após: ${formatDate(new Date(where.createdAt.gte))}`,
            onRemove: () => {
              const newWhere = { ...where };
              if (where.createdAt.lte) {
                newWhere.createdAt = { lte: where.createdAt.lte };
              } else {
                delete newWhere.createdAt;
              }
              onFilterChange({ ...filters, where: newWhere });
            },
          });
        }

        if (where.createdAt.lte) {
          tags.push({
            key: "created-end",
            label: `Cadastrado antes: ${formatDate(new Date(where.createdAt.lte))}`,
            onRemove: () => {
              const newWhere = { ...where };
              if (where.createdAt.gte) {
                newWhere.createdAt = { gte: where.createdAt.gte };
              } else {
                delete newWhere.createdAt;
              }
              onFilterChange({ ...filters, where: newWhere });
            },
          });
        }
      }

      if (where.updatedAt) {
        if (where.updatedAt.gte) {
          tags.push({
            key: "updated-start",
            label: `Atualizado após: ${formatDate(new Date(where.updatedAt.gte))}`,
            onRemove: () => {
              const newWhere = { ...where };
              if (where.updatedAt.lte) {
                newWhere.updatedAt = { lte: where.updatedAt.lte };
              } else {
                delete newWhere.updatedAt;
              }
              onFilterChange({ ...filters, where: newWhere });
            },
          });
        }

        if (where.updatedAt.lte) {
          tags.push({
            key: "updated-end",
            label: `Atualizado antes: ${formatDate(new Date(where.updatedAt.lte))}`,
            onRemove: () => {
              const newWhere = { ...where };
              if (where.updatedAt.gte) {
                newWhere.updatedAt = { gte: where.updatedAt.gte };
              } else {
                delete newWhere.updatedAt;
              }
              onFilterChange({ ...filters, where: newWhere });
            },
          });
        }
      }
    }

    // Convenience filters - hasTasks
    if (filters.hasTasks !== undefined) {
      tags.push({
        key: "has-tasks",
        label: filters.hasTasks ? "Com Tarefas" : "Sem Tarefas",
        onRemove: () => {
          const newFilters = { ...filters };
          delete newFilters.hasTasks;
          onFilterChange(newFilters);
        },
      });
    }

    // Convenience filters - taskCount
    if (filters.taskCount !== undefined) {
      tags.push({
        key: "task-count",
        label: `Tarefas: ${filters.taskCount}`,
        onRemove: () => {
          const newFilters = { ...filters };
          delete newFilters.taskCount;
          onFilterChange(newFilters);
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
        {/* Clear all button */}
        <TouchableOpacity
          onPress={handleClearAll}
          style={[
            styles.clearAllButton,
            {
              borderColor: colors.border,
              backgroundColor: isDark ? colors.card : colors.background,
            }
          ]}
          activeOpacity={0.7}
        >
          <ThemedText style={[styles.clearAllText, { color: colors.destructive }]}>
            Limpar tudo
          </ThemedText>
        </TouchableOpacity>

        {/* Individual filter tags */}
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
    minHeight: 44, // Ensure consistent height
  },
  scrollContent: {
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
    alignItems: "center",
  },
  clearAllButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    minHeight: 32,
    justifyContent: "center",
    alignItems: "center",
  },
  clearAllText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
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
