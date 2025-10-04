import React from "react";
import { View, ScrollView, TouchableOpacity , StyleSheet} from "react-native";
import { Icon } from "./icon";
import { ThemedText } from "./themed-text";
import { Badge } from "./badge";
import { useTheme } from "@/lib/theme";
import { spacing, fontSize } from "@/constants/design-system";

export interface ActiveSortConfig {
  columnKey: string;
  direction: "asc" | "desc";
}

interface ActiveSortsBarProps {
  sortConfigs: ActiveSortConfig[];
  onRemoveSort?: (columnKey: string) => void;
  onClearAll?: () => void;
  sortLabels: Record<string, string>;
}

export function ActiveSortsBar({ sortConfigs, onRemoveSort, onClearAll, sortLabels }: ActiveSortsBarProps) {
  const { colors } = useTheme();

  if (sortConfigs.length === 0) return null;

  return (
    <View style={StyleSheet.flatten([styles.container, { backgroundColor: colors.card, borderBottomColor: colors.border }])}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.tagsContainer}>
          {sortConfigs.map((config, index) => (
            <View key={`${config.columnKey}-${index}`} style={StyleSheet.flatten([styles.tag, { backgroundColor: colors.muted }])}>
              <Badge variant="outline" size="sm" style={styles.orderBadge}>
                {index + 1}
              </Badge>
              <ThemedText style={styles.tagText}>{sortLabels[config.columnKey] || config.columnKey}</ThemedText>
              <Icon name={config.direction === "asc" ? "arrow-up" : "arrow-down"} size={14} color={colors.mutedForeground} />
              {onRemoveSort && (
                <TouchableOpacity onPress={() => onRemoveSort(config.columnKey)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Icon name="x" size={16} color={colors.mutedForeground} />
                </TouchableOpacity>
              )}
            </View>
          ))}
        </View>
        {onClearAll && (
          <TouchableOpacity style={StyleSheet.flatten([styles.clearButton, { borderColor: colors.border }])} onPress={onClearAll}>
            <ThemedText style={StyleSheet.flatten([styles.clearText, { color: colors.foreground }])}>Limpar ordenação</ThemedText>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderBottomWidth: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  tagsContainer: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  tag: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 16,
    gap: spacing.xs,
  },
  orderBadge: {
    minWidth: 20,
    height: 20,
  },
  tagText: {
    fontSize: fontSize.sm,
  },
  clearButton: {
    marginLeft: spacing.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderWidth: 1,
    borderRadius: 16,
    justifyContent: "center",
  },
  clearText: {
    fontSize: fontSize.sm,
  },
});
