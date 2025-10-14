import React, { useCallback, useMemo, useState } from "react";
import { View, StyleSheet } from "react-native";
import { Stack, router } from "expo-router";
import { useAuth } from "@/contexts/auth-context";
import { useTheme } from "@/lib/theme";
import { spacing } from "@/constants/design-system";
import { ThemedView } from "@/components/ui/themed-view";
import { ThemedText } from "@/components/ui/themed-text";
import { Button } from "@/components/ui/button";
import { ErrorScreen } from "@/components/ui/error-screen";
import { EmptyState } from "@/components/ui/empty-state";
import { ActivityTable } from "@/components/inventory/activity/list/activity-table";
import { ActivityFilterModal } from "@/components/inventory/activity/list/activity-filter-modal";
import { SearchBar } from "@/components/ui/search-bar";
import { IconFilter, IconActivity } from "@tabler/icons-react-native";
import { useActivitiesInfiniteMobile } from "@/hooks/use-activities-infinite-mobile";
import type { ActivityGetManyFormData } from "@/schemas";

export default function MyActivitiesListScreen() {
  const { colors, isDark } = useTheme();
  const { user } = useAuth();
  const [searchText, setSearchText] = useState("");
  const [debouncedSearchText, setDebouncedSearchText] = useState("");
  const [filters, setFilters] = useState<Partial<ActivityGetManyFormData>>({});
  const [showFilters, setShowFilters] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Build query with user filter and additional filters
  const queryParams = useMemo(() => ({
    orderBy: { createdAt: "desc" as const },
    where: {
      userId: user?.id,
    },
    ...(debouncedSearchText ? { searchingFor: debouncedSearchText } : {}),
    ...filters,
  }), [user?.id, debouncedSearchText, filters]);

  const {
    items,
    isLoading,
    error,
    loadMore,
    canLoadMore,
    isFetchingNextPage,
    refresh,
    totalItemsLoaded,
  } = useActivitiesInfiniteMobile(queryParams);

  // Handle pull to refresh
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  }, [refresh]);

  // Handle navigation to details
  const handleActivityPress = useCallback((activityId: string) => {
    // Navigate to activity details if needed
    // router.push(`/(tabs)/personal/my-activities/details/${activityId}` as any);
  }, []);

  // Handle activity deletion - disabled for personal view
  const handleDelete = useCallback(async (activityId: string) => {
    // No delete for personal activities view
  }, []);

  // Handle search with debounce
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchText(searchText);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchText]);

  // Clear all filters
  const handleClearFilters = useCallback(() => {
    setFilters({});
    setSearchText("");
    setDebouncedSearchText("");
  }, []);

  // Check active filters
  const hasActiveFilters = useMemo(() => {
    return Object.keys(filters).length > 0 || !!debouncedSearchText;
  }, [filters, debouncedSearchText]);

  // Loading check
  if (!user) {
    return (
      <>
        <Stack.Screen
          options={{
            title: "Minhas Movimentações",
            headerStyle: { backgroundColor: colors.card },
            headerTintColor: colors.foreground,
          }}
        />
        <ErrorScreen
          message="Usuário não encontrado"
          detail="Você precisa estar autenticado para visualizar suas movimentações."
        />
      </>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: "Minhas Movimentações",
          headerStyle: { backgroundColor: colors.card },
          headerTintColor: colors.foreground,
          headerRight: () => (
            <View style={styles.headerActions}>
              <Button
                variant="default"
                size="icon"
                onPress={() => setShowFilters(true)}
              >
                <IconFilter size={20} color={colors.foreground} />
              </Button>
            </View>
          ),
        }}
      />

      <ThemedView style={styles.container}>
        {/* Header Section */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <IconActivity size={24} color={colors.primary} />
            <View style={styles.headerTextContainer}>
              <ThemedText style={styles.headerTitle}>Minhas Movimentações</ThemedText>
              <ThemedText style={styles.headerSubtitle}>
                Acompanhe todo o histórico de movimentações realizadas
              </ThemedText>
            </View>
          </View>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <SearchBar
            value={searchText}
            onChangeText={setSearchText}
            placeholder="Buscar por item, motivo ou código..."
          />
        </View>

        {/* Results Count */}
        {totalItemsLoaded > 0 && (
          <View style={styles.countContainer}>
            <ThemedText style={styles.countText}>
              {totalItemsLoaded} movimentaç{totalItemsLoaded === 1 ? "ão" : "ões"}
            </ThemedText>
          </View>
        )}

        {/* Activity Table */}
        {items.length > 0 ? (
          <ActivityTable
            activities={items}
            isLoading={isLoading}
            error={error}
            onActivityPress={handleActivityPress}
            onDelete={handleDelete}
            onRefresh={handleRefresh}
            refreshing={refreshing}
            onEndReach={loadMore}
            canLoadMore={canLoadMore}
            loadingMore={isFetchingNextPage}
          />
        ) : (
          <EmptyState
            icon="activity"
            title="Nenhuma movimentação encontrada"
            description={
              hasActiveFilters
                ? "Tente ajustar os filtros para ver mais resultados"
                : "Suas movimentações de estoque aparecerão aqui quando você realizar operações"
            }
            action={
              hasActiveFilters
                ? {
                    label: "Limpar Filtros",
                    onPress: handleClearFilters,
                  }
                : undefined
            }
          />
        )}

        {/* Filter Modal */}
        <ActivityFilterModal
          visible={showFilters}
          onClose={() => setShowFilters(false)}
          onApply={(newFilters) => {
            setFilters(newFilters);
            setShowFilters(false);
          }}
          currentFilters={filters}
        />
      </ThemedView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: spacing.md,
    paddingBottom: spacing.sm,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    opacity: 0.7,
    lineHeight: 20,
  },
  headerActions: {
    flexDirection: "row",
    gap: spacing.xs,
  },
  searchContainer: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
  },
  countContainer: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xs,
  },
  countText: {
    fontSize: 14,
    opacity: 0.7,
  },
});
