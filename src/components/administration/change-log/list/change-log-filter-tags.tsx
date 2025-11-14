import { useMemo } from "react";
import { View, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { Badge } from "@/components/ui/badge";
import { ThemedText } from "@/components/ui/themed-text";
import { IconX } from "@tabler/icons-react-native";
import { useTheme } from "@/lib/theme";
import { spacing } from "@/constants/design-system";
import {
  CHANGE_LOG_ACTION,
  CHANGE_LOG_ENTITY_TYPE,
  CHANGE_LOG_ACTION_LABELS,
  CHANGE_LOG_ENTITY_TYPE_LABELS,
} from "@/constants";
import { formatDate } from "@/utils";
import type { ChangeLogGetManyFormData } from '../../../../schemas';

interface ChangeLogFilterTagsProps {
  filters: Partial<ChangeLogGetManyFormData>;
  searchText?: string;
  onFilterChange: (filters: Partial<ChangeLogGetManyFormData>) => void;
  onSearchChange?: (text: string) => void;
  onClearAll: () => void;
}

export const ChangeLogFilterTags = ({
  filters,
  searchText,
  onFilterChange,
  onSearchChange,
  onClearAll,
}: ChangeLogFilterTagsProps) => {
  const { colors } = useTheme();

  const hasFilters = useMemo(() => {
    const hasSearch = !!searchText;
    const hasActions = filters.actions && filters.actions.length > 0;
    const hasEntityTypes = filters.entityTypes && filters.entityTypes.length > 0;
    const hasUserIds = filters.userIds && filters.userIds.length > 0;
    const hasDateRange = filters.createdAt?.gte || filters.createdAt?.lte;

    return hasSearch || hasActions || hasEntityTypes || hasUserIds || hasDateRange;
  }, [filters, searchText]);

  if (!hasFilters) {
    return null;
  }

  const removeAction = (action: string) => {
    onFilterChange({
      ...filters,
      actions: filters.actions?.filter((a: CHANGE_LOG_ACTION) => a !== action),
    });
  };

  const removeEntityType = (entityType: string) => {
    onFilterChange({
      ...filters,
      entityTypes: filters.entityTypes?.filter((et: CHANGE_LOG_ENTITY_TYPE) => et !== entityType),
    });
  };

  const removeUser = () => {
    onFilterChange({
      ...filters,
      userIds: undefined,
    });
  };

  const removeDateRange = () => {
    onFilterChange({
      ...filters,
      createdAt: undefined,
    });
  };

  const clearSearch = () => {
    if (onSearchChange) {
      onSearchChange("");
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tagsContainer}
      >
        {/* Search Tag */}
        {searchText && (
          <TouchableOpacity onPress={clearSearch}>
            <Badge variant="secondary" style={styles.tag}>
              <ThemedText style={styles.tagText} numberOfLines={1}>
                Busca: {searchText}
              </ThemedText>
              <IconX size={14} color={colors.secondaryForeground} />
            </Badge>
          </TouchableOpacity>
        )}

        {/* Action Tags */}
        {filters.actions?.map((action: CHANGE_LOG_ACTION) => (
          <TouchableOpacity key={action} onPress={() => removeAction(action)}>
            <Badge variant="secondary" style={styles.tag}>
              <ThemedText style={styles.tagText} numberOfLines={1}>
                Ação: {CHANGE_LOG_ACTION_LABELS[action] || action}
              </ThemedText>
              <IconX size={14} color={colors.secondaryForeground} />
            </Badge>
          </TouchableOpacity>
        ))}

        {/* Entity Type Tags */}
        {filters.entityTypes?.map((entityType: CHANGE_LOG_ENTITY_TYPE) => (
          <TouchableOpacity key={entityType} onPress={() => removeEntityType(entityType)}>
            <Badge variant="secondary" style={styles.tag}>
              <ThemedText style={styles.tagText} numberOfLines={1}>
                {CHANGE_LOG_ENTITY_TYPE_LABELS[entityType] || entityType}
              </ThemedText>
              <IconX size={14} color={colors.secondaryForeground} />
            </Badge>
          </TouchableOpacity>
        ))}

        {/* User Tag */}
        {filters.userIds && filters.userIds.length > 0 && (
          <TouchableOpacity onPress={removeUser}>
            <Badge variant="secondary" style={styles.tag}>
              <ThemedText style={styles.tagText} numberOfLines={1}>
                Usuário selecionado
              </ThemedText>
              <IconX size={14} color={colors.secondaryForeground} />
            </Badge>
          </TouchableOpacity>
        )}

        {/* Date Range Tag */}
        {(filters.createdAt?.gte || filters.createdAt?.lte) && (
          <TouchableOpacity onPress={removeDateRange}>
            <Badge variant="secondary" style={styles.tag}>
              <ThemedText style={styles.tagText} numberOfLines={1}>
                Período: {filters.createdAt?.gte ? formatDate(filters.createdAt.gte) : "..."} - {filters.createdAt?.lte ? formatDate(filters.createdAt.lte) : "..."}
              </ThemedText>
              <IconX size={14} color={colors.secondaryForeground} />
            </Badge>
          </TouchableOpacity>
        )}

        {/* Clear All Tag */}
        <TouchableOpacity onPress={onClearAll}>
          <Badge variant="destructive" style={styles.clearAllTag}>
            <ThemedText style={{ ...styles.tagText, color: colors.destructiveForeground }}>
              Limpar Tudo
            </ThemedText>
            <IconX size={14} color={colors.destructiveForeground} />
          </Badge>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: spacing.sm,
  },
  tagsContainer: {
    flexDirection: "row",
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
  },
  tag: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  clearAllTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  tagText: {
    fontSize: 12,
    fontWeight: "500",
  },
});
