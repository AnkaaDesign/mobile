
import { View, ScrollView, TouchableOpacity, StyleSheet } from "react-native";
import { IconX } from "@tabler/icons-react-native";
import { useTheme } from "@/lib/theme";
import { ThemedText } from "@/components/ui/themed-text";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { spacing, fontSize, fontWeight, borderRadius } from "@/constants/design-system";
import type { FilterIconComponent } from "@/lib/filter-icon-mapping";

export interface Tag {
  key: string;
  label: string;
  value: string;
  icon?: FilterIconComponent;
  variant?: "default" | "secondary" | "destructive" | "outline";
}

interface FilterTagProps {
  tags: Tag[];
  onRemove: (key: string) => void;
  onClearAll: () => void;
}

export function FilterTag({ tags, onRemove, onClearAll }: FilterTagProps) {
  const { colors } = useTheme();

  if (tags.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        {tags.map((tag) => {
          const Icon = tag.icon;
          return (
            <Badge
              key={tag.key}
              variant={tag.variant || "secondary"}
              style={StyleSheet.flatten([
                styles.filterTag,
                { backgroundColor: colors.muted }
              ])}
            >
              <View style={styles.tagContent}>
                {Icon && <Icon size={12} color={colors.mutedForeground} />}
                <ThemedText style={styles.tagLabel}>{tag.label}:</ThemedText>
                <ThemedText style={styles.tagValue}>{tag.value}</ThemedText>
                <TouchableOpacity
                  onPress={() => onRemove(tag.key)}
                  style={styles.removeButton}
                  hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
                >
                  <IconX size={12} color={colors.mutedForeground} />
                </TouchableOpacity>
              </View>
            </Badge>
          );
        })}
      </ScrollView>

      <Button
        variant="default"
        size="default"
        onPress={onClearAll}
        style={styles.clearButton}
      >
        <ThemedText style={[styles.clearButtonText, { color: colors.primary }]}>
          Limpar todos
        </ThemedText>
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    gap: spacing.xs,
  },
  filterTag: {
    marginRight: spacing.xs,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
    minHeight: 24,
  },
  tagContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  tagLabel: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    lineHeight: fontSize.xs * 1.2,
  },
  tagValue: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
    lineHeight: fontSize.xs * 1.2,
  },
  removeButton: {
    padding: 2,
  },
  clearButton: {
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    minHeight: 24,
    borderRadius: borderRadius.md,
    minWidth: 60,
  },
  clearButtonText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
    lineHeight: fontSize.xs * 1.2,
  },
});
