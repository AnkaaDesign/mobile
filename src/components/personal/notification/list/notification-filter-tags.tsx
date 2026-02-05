import React from "react";
import { View, ScrollView, StyleSheet, TouchableOpacity } from "react-native";
import { IconX } from "@tabler/icons-react-native";
import { Badge } from "@/components/ui/badge";
import { ThemedText } from "@/components/ui/themed-text";
import { useTheme } from "@/lib/theme";
import { spacing } from "@/constants/design-system";
import { NOTIFICATION_TYPE, NOTIFICATION_IMPORTANCE } from "@/constants";

interface NotificationFilterTagsProps {
  filters: {
    types?: string[];
    importance?: string[];
    unreadOnly?: boolean;
    dateRange?: { start?: Date; end?: Date };
  };
  searchText?: string;
  onFilterChange: (filters: any) => void;
  onSearchChange: (text: string) => void;
  onClearAll: () => void;
}

const getTypeLabel = (type: string): string => {
  switch (type) {
    case NOTIFICATION_TYPE.SYSTEM:
      return "Sistema";
    case NOTIFICATION_TYPE.PRODUCTION:
      return "Produção";
    case NOTIFICATION_TYPE.STOCK:
      return "Estoque";
    case NOTIFICATION_TYPE.USER:
      return "Usuário";
    case NOTIFICATION_TYPE.GENERAL:
      return "Geral";
    default:
      return type;
  }
};

const getImportanceLabel = (importance: string): string => {
  switch (importance) {
    case NOTIFICATION_IMPORTANCE.URGENT:
      return "Urgente";
    case NOTIFICATION_IMPORTANCE.HIGH:
      return "Alto";
    case NOTIFICATION_IMPORTANCE.NORMAL:
      return "Normal";
    case NOTIFICATION_IMPORTANCE.LOW:
      return "Baixo";
    default:
      return importance;
  }
};

export function NotificationFilterTags({
  filters,
  searchText,
  onFilterChange,
  onSearchChange,
  onClearAll,
}: NotificationFilterTagsProps) {
  const { colors } = useTheme();

  const hasFilters = React.useMemo(() => {
    return (
      (filters.types && filters.types.length > 0) ||
      (filters.importance && filters.importance.length > 0) ||
      filters.unreadOnly ||
      filters.dateRange?.start ||
      filters.dateRange?.end ||
      (searchText && searchText.length > 0)
    );
  }, [filters, searchText]);

  if (!hasFilters) return null;

  const handleRemoveType = (type: string) => {
    const newTypes = filters.types?.filter((t) => t !== type);
    onFilterChange({
      ...filters,
      types: newTypes && newTypes.length > 0 ? newTypes : undefined,
    });
  };

  const handleRemoveImportance = (importance: string) => {
    const newImportance = filters.importance?.filter((i) => i !== importance);
    onFilterChange({
      ...filters,
      importance: newImportance && newImportance.length > 0 ? newImportance : undefined,
    });
  };

  const handleRemoveUnread = () => {
    onFilterChange({
      ...filters,
      unreadOnly: undefined,
    });
  };

  const handleRemoveDateRange = () => {
    onFilterChange({
      ...filters,
      dateRange: undefined,
    });
  };

  const handleClearSearch = () => {
    onSearchChange("");
  };

  return (
    <View style={[styles.container, { borderBottomColor: colors.border }]}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Search text tag */}
        {searchText && searchText.length > 0 && (
          <Badge variant="secondary" style={styles.filterTag}>
            <View style={styles.tagContent}>
              <ThemedText style={styles.tagText}>Busca: {searchText}</ThemedText>
              <TouchableOpacity onPress={handleClearSearch} hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}>
                <IconX size={14} color={colors.foreground} />
              </TouchableOpacity>
            </View>
          </Badge>
        )}

        {/* Type filter tags */}
        {filters.types?.map((type) => (
          <Badge key={type} variant="default" style={styles.filterTag}>
            <View style={styles.tagContent}>
              <ThemedText style={styles.tagText}>{getTypeLabel(type)}</ThemedText>
              <TouchableOpacity onPress={() => handleRemoveType(type)} hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}>
                <IconX size={14} color={colors.foreground} />
              </TouchableOpacity>
            </View>
          </Badge>
        ))}

        {/* Importance filter tags */}
        {filters.importance?.map((importance) => (
          <Badge key={importance} variant="warning" style={styles.filterTag}>
            <View style={styles.tagContent}>
              <ThemedText style={styles.tagText}>{getImportanceLabel(importance)}</ThemedText>
              <TouchableOpacity onPress={() => handleRemoveImportance(importance)} hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}>
                <IconX size={14} color={colors.foreground} />
              </TouchableOpacity>
            </View>
          </Badge>
        ))}

        {/* Unread only tag */}
        {filters.unreadOnly && (
          <Badge variant="primary" style={styles.filterTag}>
            <View style={styles.tagContent}>
              <ThemedText style={styles.tagText}>Não lidas</ThemedText>
              <TouchableOpacity onPress={handleRemoveUnread} hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}>
                <IconX size={14} color={colors.foreground} />
              </TouchableOpacity>
            </View>
          </Badge>
        )}

        {/* Date range tag */}
        {(filters.dateRange?.start || filters.dateRange?.end) && (
          <Badge variant="secondary" style={styles.filterTag}>
            <View style={styles.tagContent}>
              <ThemedText style={styles.tagText}>
                {filters.dateRange.start && filters.dateRange.end
                  ? `${new Date(filters.dateRange.start).toLocaleDateString()} - ${new Date(filters.dateRange.end).toLocaleDateString()}`
                  : filters.dateRange.start
                  ? `Após ${new Date(filters.dateRange.start).toLocaleDateString()}`
                  : `Antes ${new Date(filters.dateRange.end!).toLocaleDateString()}`}
              </ThemedText>
              <TouchableOpacity onPress={handleRemoveDateRange} hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}>
                <IconX size={14} color={colors.foreground} />
              </TouchableOpacity>
            </View>
          </Badge>
        )}

        {/* Clear all button */}
        <TouchableOpacity onPress={onClearAll} style={[styles.clearButton, { backgroundColor: colors.destructive }]}>
          <ThemedText style={[styles.clearText, { color: colors.destructiveForeground }]}>Limpar tudo</ThemedText>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.sm,
    gap: spacing.xs,
    alignItems: "center",
  },
  filterTag: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  tagContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  tagText: {
    fontSize: 12,
  },
  clearButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 16,
  },
  clearText: {
    fontSize: 12,
    fontWeight: "600",
  },
});
