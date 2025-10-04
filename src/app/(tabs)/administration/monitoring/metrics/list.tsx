import React, { useState, useCallback, useMemo } from "react";
import { View, Pressable, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { IconFilter, IconActivity } from "@tabler/icons-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useSystemMetrics, useSystemHealth, useSystemHealthHistory } from "@/hooks/monitoring";
import { ThemedView, ThemedText, ErrorScreen, SearchBar, Badge, Card } from "@/components/ui";
import { MetricTable } from "@/components/administration/monitoring/metric/list/metric-table";
import type { MetricData, SortConfig } from "@/components/administration/monitoring/metric/list/metric-table";
import { MetricFilterModal } from "@/components/administration/monitoring/metric/list/metric-filter-modal";
import type { MetricFilters } from "@/components/administration/monitoring/metric/list/metric-filter-modal";
import { MetricFilterTags } from "@/components/administration/monitoring/metric/list/metric-filter-tags";
import { MetricListSkeleton } from "@/components/administration/monitoring/metric/skeleton/metric-list-skeleton";
import { useTheme } from "@/lib/theme";
import { formatRelativeTime, formatFileSize } from '../../../../../utils';

export default function MetricsListScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [displaySearchText, setDisplaySearchText] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<MetricFilters>({
    timeRange: "24h",
  });
  const [sortConfigs, setSortConfigs] = useState<SortConfig[]>([
    { columnKey: "name", direction: "asc" },
  ]);

  const {
    data: metricsData,
    isLoading: isMetricsLoading,
    error: metricsError,
    refetch: refetchMetrics,
  } = useSystemMetrics();

  const {
    data: healthData,
    isLoading: isHealthLoading,
    error: healthError,
    refetch: refetchHealth,
  } = useSystemHealth();

  const {
    data: historyData,
    isLoading: isHistoryLoading,
    error: historyError,
    refetch: refetchHistory,
  } = useSystemHealthHistory(24);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([refetchMetrics(), refetchHealth(), refetchHistory()]);
    } finally {
      setRefreshing(false);
    }
  }, [refetchMetrics, refetchHealth, refetchHistory]);

  const metrics = metricsData?.data;
  const health = healthData?.data;
  const history = historyData?.data;

  // Transform system metrics into MetricData format
  const metricsDataList = useMemo((): MetricData[] => {
    if (!metrics) return [];

    return [
      {
        id: "cpu-usage",
        name: "CPU",
        value: metrics.cpu?.usage || 0,
        unit: "%",
        category: "cpu",
        usage: metrics.cpu?.usage,
        trend: undefined,
        lastUpdated: new Date(metrics.lastUpdated),
        description: `${metrics.cpu?.cores || 0} núcleos disponíveis`,
        icon: "cpu",
      },
      {
        id: "memory-usage",
        name: "Memória",
        value: metrics.memory?.percentage || 0,
        unit: "%",
        category: "memory",
        usage: metrics.memory?.percentage,
        trend: undefined,
        lastUpdated: new Date(metrics.lastUpdated),
        description: `${formatFileSize(metrics.memory?.total || 0)} total`,
        icon: "memory",
      },
      {
        id: "disk-usage",
        name: "Disco",
        value: metrics.disk?.percentage || 0,
        unit: "%",
        category: "disk",
        usage: metrics.disk?.percentage,
        trend: undefined,
        lastUpdated: new Date(metrics.lastUpdated),
        description: `${formatFileSize(metrics.disk?.total || 0)} total`,
        icon: "disk",
      },
      {
        id: "network-rx",
        name: "Rede (RX)",
        value: metrics.network?.interfaces?.[0]?.rx
          ? (metrics.network.interfaces[0].rx / 1024 / 1024).toFixed(1)
          : "0",
        unit: "MB/s",
        category: "network",
        lastUpdated: new Date(metrics.lastUpdated),
        description: "Dados recebidos",
        icon: "network",
      },
      {
        id: "network-tx",
        name: "Rede (TX)",
        value: metrics.network?.interfaces?.[0]?.tx
          ? (metrics.network.interfaces[0].tx / 1024 / 1024).toFixed(1)
          : "0",
        unit: "MB/s",
        category: "network",
        lastUpdated: new Date(metrics.lastUpdated),
        description: "Dados enviados",
        icon: "network",
      },
      {
        id: "system-load",
        name: "Carga do Sistema",
        value: metrics.cpu?.loadAverage?.[0] || 0,
        unit: "",
        category: "system",
        lastUpdated: new Date(metrics.lastUpdated),
        description: "Média de 1 minuto",
        icon: "system",
      },
      {
        id: "cpu-temperature",
        name: "Temperatura",
        value: metrics.cpu?.temperature || 0,
        unit: "°C",
        category: "temperature",
        lastUpdated: new Date(metrics.lastUpdated),
        description: "CPU temperatura",
        icon: "temperature",
      },
      {
        id: "system-uptime",
        name: "Uptime",
        value: metrics.uptime ? Math.floor(metrics.uptime / 86400) : 0,
        unit: "dias",
        category: "system",
        lastUpdated: new Date(metrics.lastUpdated),
        description: formatRelativeTime(
          new Date(Date.now() - (metrics?.uptime || 0) * 1000)
        ),
        icon: "uptime",
      },
    ];
  }, [metrics]);

  // Filter metrics based on filters
  const filteredMetrics = useMemo(() => {
    let filtered = [...metricsDataList];

    // Filter by search
    if (searchText) {
      const search = searchText.toLowerCase();
      filtered = filtered.filter(
        (m) =>
          m.name.toLowerCase().includes(search) ||
          m.description?.toLowerCase().includes(search) ||
          m.category.toLowerCase().includes(search)
      );
    }

    // Filter by categories
    if (filters.categories && filters.categories.length > 0) {
      filtered = filtered.filter((m) => filters.categories?.includes(m.category));
    }

    // Filter by usage
    if (filters.minUsage !== undefined || filters.maxUsage !== undefined) {
      filtered = filtered.filter((m) => {
        if (m.usage === undefined) return false;
        if (
          filters.minUsage !== undefined &&
          m.usage < filters.minUsage
        )
          return false;
        if (
          filters.maxUsage !== undefined &&
          m.usage > filters.maxUsage
        )
          return false;
        return true;
      });
    }

    return filtered;
  }, [metricsDataList, searchText, filters]);

  const handleSearch = useCallback((text: string) => {
    setSearchText(text);
  }, []);

  const handleDisplaySearchChange = useCallback((text: string) => {
    setDisplaySearchText(text);
  }, []);

  const handleApplyFilters = useCallback((newFilters: MetricFilters) => {
    setFilters(newFilters);
    setShowFilters(false);
  }, []);

  const handleClearFilters = useCallback(() => {
    setFilters({ timeRange: "24h" });
    setSearchText("");
    setDisplaySearchText("");
  }, []);

  const handleSort = useCallback((configs: SortConfig[]) => {
    setSortConfigs(configs);
  }, []);

  const handleMetricPress = useCallback(
    (metricId: string) => {
      // Navigate to metric detail page if needed
      console.log("Metric pressed:", metricId);
    },
    []
  );

  // Count active filters
  const activeFiltersCount =
    (filters.categories && filters.categories.length > 0 ? 1 : 0) +
    (filters.timeRange && filters.timeRange !== "24h" ? 1 : 0) +
    (filters.minUsage !== undefined || filters.maxUsage !== undefined
      ? 1
      : 0);

  if (isMetricsLoading && !refreshing) {
    return <MetricListSkeleton />;
  }

  if (metricsError || healthError) {
    return (
      <ThemedView
        style={[
          styles.container,
          { backgroundColor: colors.background, paddingBottom: insets.bottom },
        ]}
      >
        <ErrorScreen
          message="Erro ao carregar métricas"
          detail={(metricsError || healthError)?.message}
          onRetry={handleRefresh}
        />
      </ThemedView>
    );
  }

  return (
    <ThemedView
      style={[
        styles.container,
        { backgroundColor: colors.background, paddingBottom: insets.bottom },
      ]}
    >
      {/* Search and Filter */}
      <View style={styles.searchContainer}>
        <SearchBar
          value={displaySearchText}
          onChangeText={handleDisplaySearchChange}
          onSearch={handleSearch}
          placeholder="Buscar métricas..."
          style={styles.searchBar}
          debounceMs={300}
        />
        <View style={styles.buttonContainer}>
          <Pressable
            style={({ pressed }) => [
              styles.actionButton,
              {
                backgroundColor: colors.card,
                borderWidth: 1,
                borderColor: colors.border,
              },
              pressed && styles.actionButtonPressed,
            ]}
            onPress={() => setShowFilters(true)}
          >
            <IconFilter size={24} color={colors.foreground} />
            {activeFiltersCount > 0 && (
              <Badge style={styles.actionBadge} variant="destructive" size="sm">
                <ThemedText style={[styles.actionBadgeText, { color: "white" }]}>
                  {activeFiltersCount}
                </ThemedText>
              </Badge>
            )}
          </Pressable>
        </View>
      </View>

      {/* Filter Tags */}
      <MetricFilterTags
        filters={filters}
        onFilterChange={handleApplyFilters}
        onClearAll={handleClearFilters}
      />

      {/* Summary Header */}
      <View style={styles.summarySection}>
        <Card
          style={[
            styles.summaryCard,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <View style={styles.summaryHeader}>
            <IconActivity size={24} color={colors.primary} />
            <ThemedText style={styles.summaryTitle}>
              Métricas de Performance
            </ThemedText>
            {health && (
              <Badge
                style={{
                  backgroundColor:
                    health.overall === "healthy"
                      ? colors.success
                      : colors.warning,
                }}
                variant="secondary"
              >
                <ThemedText style={[styles.badgeText, { color: "white" }]}>
                  {health.overall?.toUpperCase() || "N/A"}
                </ThemedText>
              </Badge>
            )}
          </View>

          {metrics?.lastUpdated && (
            <ThemedText style={styles.lastUpdate}>
              Última atualização:{" "}
              {formatRelativeTime(new Date(metrics.lastUpdated))}
            </ThemedText>
          )}
        </Card>
      </View>

      {/* Metrics Table */}
      <MetricTable
        metrics={filteredMetrics}
        onMetricPress={handleMetricPress}
        onRefresh={handleRefresh}
        refreshing={refreshing}
        loading={isMetricsLoading}
        sortConfigs={sortConfigs}
        onSort={handleSort}
      />

      {/* Filter Modal */}
      <MetricFilterModal
        visible={showFilters}
        onClose={() => setShowFilters(false)}
        onApply={handleApplyFilters}
        currentFilters={filters}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchContainer: {
    flexDirection: "row",
    paddingHorizontal: 8,
    paddingVertical: 8,
    gap: 8,
    alignItems: "center",
  },
  searchBar: {
    flex: 1,
  },
  buttonContainer: {
    flexDirection: "row",
    gap: 8,
  },
  actionButton: {
    height: 48,
    width: 48,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  actionBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 3,
  },
  actionBadgeText: {
    fontSize: 9,
    fontWeight: "600",
  },
  actionButtonPressed: {
    opacity: 0.8,
  },
  summarySection: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  summaryCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  summaryHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 8,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: "600",
    flex: 1,
  },
  lastUpdate: {
    fontSize: 14,
    opacity: 0.7,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "600",
  },
});