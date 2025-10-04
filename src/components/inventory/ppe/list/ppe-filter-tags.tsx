import React from "react";
import { View, StyleSheet, ScrollView, Pressable } from "react-native";
import { useTheme } from "@/lib/theme";
import { spacing } from "@/constants/design-system";
import { ThemedText } from "@/components/ui/themed-text";
import { Badge } from "@/components/ui/badge";
import { IconX } from "@tabler/icons-react-native";
import { formatDate } from '../../../../utils';
import type { PpeDeliveryGetManyFormData } from '../../../../schemas';

interface PpeFilterTagsProps {
  filters: Partial<PpeDeliveryGetManyFormData>;
  searchText: string;
  onClearAll: () => void;
  onRemoveFilter: (key: keyof PpeDeliveryGetManyFormData) => void;
  onClearSearch: () => void;
}

export const PpeFilterTags: React.FC<PpeFilterTagsProps> = ({
  filters,
  searchText,
  onClearAll,
  onRemoveFilter,
  onClearSearch,
}) => {
  const { colors } = useTheme();

  const tags: { key: string; label: string; value: string; onRemove: () => void }[] = [];

  // Search text tag
  if (searchText) {
    tags.push({
      key: "search",
      label: "Busca",
      value: searchText,
      onRemove: onClearSearch,
    });
  }




  // Date range tags
  if (filters.createdFrom || filters.createdTo) {
    const from = filters.createdFrom ? formatDate(filters.createdFrom) : "Início";
    const to = filters.createdTo ? formatDate(filters.createdTo) : "Hoje";
    tags.push({
      key: "created",
      label: "Criado",
      value: `${from} - ${to}`,
      onRemove: () => {
        onRemoveFilter("createdFrom");
        onRemoveFilter("createdTo");
      },
    });
  }


  if (tags.length === 0) return null;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
      style={styles.scrollView}
    >
      {tags.map((tag) => (
        <Badge
          key={tag.key}
          variant="secondary"
          style={styles.tag}
        >
          <View style={styles.tagContent}>
            <ThemedText style={styles.tagLabel}>{tag.label}:</ThemedText>
            <ThemedText style={styles.tagValue}>{tag.value}</ThemedText>
            <Pressable onPress={tag.onRemove} style={styles.removeButton}>
              <IconX size={14} color={colors.mutedForeground} />
            </Pressable>
          </View>
        </Badge>
      ))}

      {tags.length > 1 && (
        <Pressable onPress={onClearAll} style={styles.clearAllButton}>
          <ThemedText style={styles.clearAllText}>Limpar tudo</ThemedText>
        </Pressable>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollView: {
    maxHeight: 40,
  },
  container: {
    flexDirection: "row",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    gap: spacing.xs,
    alignItems: "center",
  },
  tag: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    height: 28,
  },
  tagContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  tagLabel: {
    fontSize: 12,
    fontWeight: "600",
  },
  tagValue: {
    fontSize: 12,
  },
  removeButton: {
    marginLeft: spacing.xs,
    padding: 2,
  },
  clearAllButton: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  clearAllText: {
    fontSize: 12,
    color: "#ef4444",
    fontWeight: "600",
  },
});