import { View, StyleSheet, TouchableOpacity, ScrollView } from "react-native";
import { ThemedText } from "@/components/ui/themed-text";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/lib/theme";
import { spacing, fontSize } from "@/constants/design-system";
import {
  IconSearch,
  IconTags,
  IconChartBar,
  IconPackage,
  IconEye,
  IconX,
} from "@tabler/icons-react-native";

interface FilterIndicatorProps {
  label: string;
  value: string;
  onRemove: () => void;
  iconType?: string;
}

function renderFilterIcon(iconType?: string, color?: string) {
  if (!iconType) return null;

  const iconProps = { size: 14, color };

  switch (iconType) {
    case "search":
      return <IconSearch {...iconProps} />;
    case "eye":
      return <IconEye {...iconProps} />;
    case "package":
      return <IconPackage {...iconProps} />;
    case "chart-bar":
      return <IconChartBar {...iconProps} />;
    case "tags":
      return <IconTags {...iconProps} />;
    default:
      return null;
  }
}

export function FilterIndicator({ label, value, onRemove, iconType }: FilterIndicatorProps) {
  const { colors } = useTheme();

  return (
    <View style={[styles.indicator, { backgroundColor: colors.primary + "15", borderColor: colors.primary }]}>
      <View style={styles.indicatorContent}>
        {iconType && renderFilterIcon(iconType, colors.primary)}
        <View style={styles.indicatorText}>
          <ThemedText style={[styles.indicatorLabel, { color: colors.primary }]}>
            {label}:
          </ThemedText>
          <ThemedText style={[styles.indicatorValue, { color: colors.primary }]} numberOfLines={1}>
            {value}
          </ThemedText>
        </View>
      </View>
      <TouchableOpacity onPress={onRemove} style={styles.removeButton}>
        <IconX size={14} color={colors.primary} />
      </TouchableOpacity>
    </View>
  );
}

interface FilterIndicatorsProps {
  filters: Array<{
    key: string;
    label: string;
    value: string;
    onRemove: () => void;
    iconType?: string;
  }>;
  onClearAll?: () => void;
}

export function FilterIndicators({ filters, onClearAll }: FilterIndicatorsProps) {
  const { colors } = useTheme();

  if (filters.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <ThemedText style={[styles.headerText, { color: colors.foreground }]}>
          Filtros Ativos ({filters.length})
        </ThemedText>
        {onClearAll && (
          <Button
            variant="ghost"
            onPress={onClearAll}
            style={styles.clearAllButton}
          >
            <ThemedText style={[styles.clearAllText, { color: colors.destructive }]}>
              Limpar Todos
            </ThemedText>
          </Button>
        )}
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filtersScroll}
      >
        {filters.map((filter) => (
          <FilterIndicator
            key={filter.key}
            label={filter.label}
            value={filter.value}
            onRemove={filter.onRemove}
            iconType={filter.iconType}
          />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.sm,
  },
  headerText: {
    fontSize: fontSize.sm,
    fontWeight: "600",
  },
  clearAllButton: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  clearAllText: {
    fontSize: fontSize.xs,
    fontWeight: "600",
  },
  filtersScroll: {
    paddingHorizontal: spacing.sm,
    gap: spacing.sm,
  },
  indicator: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 6,
    borderWidth: 1,
    gap: spacing.xs,
  },
  indicatorContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    flex: 1,
  },
  indicatorText: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    flex: 1,
  },
  indicatorLabel: {
    fontSize: fontSize.xs,
    fontWeight: "600",
  },
  indicatorValue: {
    fontSize: fontSize.xs,
    fontWeight: "400",
    flex: 1,
  },
  removeButton: {
    padding: spacing.xs,
  },
});
