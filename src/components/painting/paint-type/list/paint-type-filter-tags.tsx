import React, { useMemo } from "react";
import { View, Pressable, StyleSheet } from "react-native";
import { ThemedText } from "@/components/ui/themed-text";
import { Badge } from "@/components/ui/badge";
import { IconX } from "@tabler/icons-react-native";
import { useTheme } from "@/lib/theme";
import { spacing, fontSize } from "@/constants/design-system";

interface FilterTag {
  id: string;
  label: string;
  value: string;
  onRemove: () => void;
}

interface PaintTypeFilterTagsProps {
  filters: {
    needGround?: boolean;
  };
  searchText?: string;
  onFilterChange: (filters: Record<string, boolean | undefined>) => void;
  onSearchChange: (text: string) => void;
  onClearAll: () => void;
}

export function PaintTypeFilterTags({
  filters,
  searchText,
  onFilterChange,
  onSearchChange,
  onClearAll,
}: PaintTypeFilterTagsProps) {
  const { colors } = useTheme();

  const tags = useMemo(() => {
    const result: FilterTag[] = [];

    // Search tag
    if (searchText) {
      result.push({
        id: "search",
        label: "Busca",
        value: searchText,
        onRemove: () => onSearchChange(""),
      });
    }

    // Need ground filter
    if (filters.needGround !== undefined) {
      result.push({
        id: "needGround",
        label: "Necessita Primer",
        value: filters.needGround ? "Sim" : "Não",
        onRemove: () => onFilterChange({ ...filters, needGround: undefined }),
      });
    }

    return result;
  }, [filters, searchText, onFilterChange, onSearchChange]);

  if (tags.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.tagsContainer}>
        {tags.map((tag) => (
          <Badge key={tag.id} variant="secondary" style={styles.tag}>
            <ThemedText style={styles.tagLabel}>{tag.label}:</ThemedText>
            <ThemedText style={styles.tagValue}> {tag.value}</ThemedText>
            <Pressable
              onPress={tag.onRemove}
              style={styles.removeButton}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <IconX size={14} color={colors.mutedForeground} />
            </Pressable>
          </Badge>
        ))}
      </View>
      {tags.length > 1 && (
        <Pressable onPress={onClearAll} style={styles.clearAllButton}>
          <ThemedText style={[styles.clearAllText, { color: colors.primary }]}>
            Limpar tudo
          </ThemedText>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  tagsContainer: {
    flex: 1,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
  },
  tag: {
    flexDirection: "row",
    alignItems: "center",
    paddingRight: spacing.xs,
  },
  tagLabel: {
    fontSize: fontSize.sm,
    fontWeight: "500",
  },
  tagValue: {
    fontSize: fontSize.sm,
  },
  removeButton: {
    marginLeft: spacing.xs,
    padding: spacing.xxs,
  },
  clearAllButton: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  clearAllText: {
    fontSize: fontSize.sm,
    fontWeight: "500",
  },
});
