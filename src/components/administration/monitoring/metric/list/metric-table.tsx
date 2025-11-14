import { FlatList, View, Pressable, RefreshControl, ActivityIndicator, Dimensions, StyleSheet } from "react-native";
import { Icon } from "@/components/ui/icon";
import { ThemedText } from "@/components/ui/themed-text";
import { Badge } from "@/components/ui/badge";

import { Progress } from "@/components/ui/progress";
import { useTheme } from "@/lib/theme";
import { spacing, fontSize, fontWeight } from "@/constants/design-system";
import { formatRelativeTime } from "@/utils";
import type { SortConfig } from "@/lib/sort-utils";
import {
  IconCpu,
  IconActivity,
  IconDatabase,
  IconWifi,
  IconServer,
  IconThermometer,
  IconClock,
  IconTrendingUp,
  IconTrendingDown,
  IconMinus,
} from "@tabler/icons-react-native";

const { width: _screenWidth } = Dimensions.get("window");

export interface MetricData {
  id: string;
  name: string;
  value: number | string;
  unit: string;
  category: MetricCategory;
  usage?: number;
  trend?: number;
  lastUpdated: Date;
  description?: string;
  icon?: string;
}

export type MetricCategory = "cpu" | "memory" | "disk" | "network" | "system" | "temperature";

interface MetricTableProps {
  metrics: MetricData[];
  onMetricPress?: (metricId: string) => void;
  onRefresh?: () => Promise<void>;
  onEndReached?: () => void;
  refreshing?: boolean;
  loading?: boolean;
  loadingMore?: boolean;
  sortConfigs?: SortConfig[];
  onSort?: (configs: SortConfig[]) => void;
}

const METRIC_ICONS: Record<string, any> = {
  cpu: IconCpu,
  memory: IconActivity,
  disk: IconDatabase,
  network: IconWifi,
  system: IconServer,
  temperature: IconThermometer,
  uptime: IconClock,
};

const CATEGORY_COLORS: Record<MetricCategory, string> = {
  cpu: "#3b82f6",
  memory: "#8b5cf6",
  disk: "#06b6d4",
  network: "#10b981",
  system: "#f59e0b",
  temperature: "#ef4444",
};

export function MetricTable({
  metrics,
  onMetricPress,
  onRefresh,
  onEndReached,
  refreshing = false,
  loading = false,
  loadingMore = false,
  sortConfigs: _sortConfigs = [],
  onSort: _onSort,
}: MetricTableProps) {
  const { colors } = useTheme();

  const getUsageColor = (usage: number) => {
    if (usage >= 90) return colors.destructive;
    if (usage >= 75) return colors.warning;
    if (usage >= 50) return colors.primary;
    return colors.success;
  };

  const getTrendIcon = (trend?: number) => {
    if (trend === undefined || trend === null) {
      return <IconMinus size={16} color={colors.muted} />;
    }

    if (Math.abs(trend) < 1) {
      return <IconMinus size={16} color={colors.muted} />;
    }

    return trend > 0 ? (
      <IconTrendingUp size={16} color={colors.destructive} />
    ) : (
      <IconTrendingDown size={16} color={colors.success} />
    );
  };

  const getTrendText = (trend?: number) => {
    if (trend === undefined || trend === null || Math.abs(trend) < 1) {
      return null;
    }

    const sign = trend > 0 ? "+" : "";
    return `${sign}${trend.toFixed(1)}%`;
  };

  const getMetricIcon = (metric: MetricData) => {
    const IconComponent = METRIC_ICONS[metric.icon || metric.category] || IconServer;
    const color = CATEGORY_COLORS[metric.category] || colors.primary;
    return <IconComponent size={24} color={color} />;
  };

  const renderMetricCard = ({ item: metric }: { item: MetricData }) => {
    const trendText = getTrendText(metric.trend);
    const trendIcon = getTrendIcon(metric.trend);

    return (
      <Pressable
        onPress={() => onMetricPress?.(metric.id)}
        style={({ pressed }) => [
          styles.metricCard,
          {
            backgroundColor: colors.card,
            borderColor: colors.border,
            opacity: pressed ? 0.7 : 1,
          },
        ]}
      >
        <View style={styles.metricHeader}>
          <View style={styles.metricTitleContainer}>
            {getMetricIcon(metric)}
            <View style={styles.metricTitleTextContainer}>
              <ThemedText style={styles.metricTitle}>{metric.name}</ThemedText>
              <ThemedText style={styles.metricCategory}>
                {metric.category.toUpperCase()}
              </ThemedText>
            </View>
          </View>
          <View style={styles.trendContainer}>
            {trendIcon}
            {trendText && (
              <ThemedText
                style={[
                  styles.trendText,
                  {
                    color:
                      metric.trend && metric.trend > 0
                        ? colors.destructive
                        : colors.success,
                  },
                ]}
              >
                {trendText}
              </ThemedText>
            )}
          </View>
        </View>

        <View style={styles.metricValueContainer}>
          <ThemedText style={styles.metricValue}>
            {typeof metric.value === "number" ? metric.value.toFixed(1) : metric.value}
          </ThemedText>
          <ThemedText style={styles.metricUnit}>{metric.unit}</ThemedText>
        </View>

        {metric.usage !== undefined && (
          <View style={styles.progressContainer}>
            <Progress
              value={metric.usage}
              style={styles.progress}
              indicatorStyle={{ backgroundColor: getUsageColor(metric.usage) }}
            />
            <Badge
              style={{ backgroundColor: getUsageColor(metric.usage) }}
              variant="secondary"
            >
              <ThemedText style={[styles.badgeText, { color: "white" }]}>
                {metric.usage.toFixed(0)}%
              </ThemedText>
            </Badge>
          </View>
        )}

        {metric.description && (
          <ThemedText style={styles.metricDescription} numberOfLines={1}>
            {metric.description}
          </ThemedText>
        )}

        <View style={styles.metricFooter}>
          <View style={styles.categoryBadge}>
            <View
              style={[
                styles.categoryDot,
                { backgroundColor: CATEGORY_COLORS[metric.category] },
              ]}
            />
            <ThemedText style={styles.categoryText}>
              {metric.category}
            </ThemedText>
          </View>
          <ThemedText style={styles.lastUpdated}>
            {formatRelativeTime(new Date(metric.lastUpdated))}
          </ThemedText>
        </View>
      </Pressable>
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Icon name="activity" size={48} color={colors.muted} />
      <ThemedText style={styles.emptyText}>Nenhuma métrica disponível</ThemedText>
    </View>
  );

  const renderFooter = () => {
    if (!loadingMore) return null;

    return (
      <View style={styles.loadingMoreContainer}>
        <ActivityIndicator size="small" color={colors.primary} />
        <ThemedText style={styles.loadingMoreText}>
          Carregando mais métricas...
        </ThemedText>
      </View>
    );
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <ThemedText style={styles.loadingText}>
          Carregando métricas...
        </ThemedText>
      </View>
    );
  }

  return (
    <FlatList
      data={metrics}
      renderItem={renderMetricCard}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.listContent}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={[colors.primary]}
          tintColor={colors.primary}
        />
      }
      ListEmptyComponent={renderEmpty}
      ListFooterComponent={renderFooter}
      onEndReached={onEndReached}
      onEndReachedThreshold={0.5}
      showsVerticalScrollIndicator={false}
    />
  );
}

const styles = StyleSheet.create({
  listContent: {
    padding: spacing.md,
    gap: spacing.md,
  },
  metricCard: {
    padding: spacing.lg,
    borderRadius: 12,
    borderWidth: 1,
    gap: spacing.md,
  },
  metricHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  metricTitleContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.md,
    flex: 1,
  },
  metricTitleTextContainer: {
    flex: 1,
    gap: spacing.xs,
  },
  metricTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
  },
  metricCategory: {
    fontSize: fontSize.xs,
    opacity: 0.6,
  },
  trendContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  trendText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  metricValueContainer: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: spacing.xs,
  },
  metricValue: {
    fontSize: 32,
    fontWeight: fontWeight.bold,
  },
  metricUnit: {
    fontSize: fontSize.lg,
    opacity: 0.7,
  },
  progressContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  progress: {
    flex: 1,
    height: 8,
  },
  badgeText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
  },
  metricDescription: {
    fontSize: fontSize.sm,
    opacity: 0.7,
  },
  metricFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.05)",
  },
  categoryBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  categoryDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  categoryText: {
    fontSize: fontSize.sm,
    textTransform: "capitalize",
  },
  lastUpdated: {
    fontSize: fontSize.xs,
    opacity: 0.6,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: spacing.xl * 2,
    gap: spacing.md,
  },
  emptyText: {
    fontSize: fontSize.lg,
    opacity: 0.7,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.xl,
    gap: spacing.md,
  },
  loadingText: {
    fontSize: fontSize.md,
    opacity: 0.7,
  },
  loadingMoreContainer: {
    paddingVertical: spacing.lg,
    alignItems: "center",
    gap: spacing.sm,
  },
  loadingMoreText: {
    fontSize: fontSize.sm,
    opacity: 0.7,
  },
});
// Re-export SortConfig for consumer components
export type { SortConfig } from "@/lib/sort-utils";
