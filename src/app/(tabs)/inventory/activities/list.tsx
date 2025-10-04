import React, { useCallback, useMemo, useState } from "react";
import { View, StyleSheet, Alert } from "react-native";
import { Stack, router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@/contexts/auth-context";
import { useTheme } from "@/lib/theme";
import { spacing } from "@/constants/design-system";
import { ThemedView } from "@/components/ui/themed-view";
import { ThemedText } from "@/components/ui/themed-text";
import { Button } from "@/components/ui/button";
import { ErrorScreen } from "@/components/ui/error-screen";
import { ActivityTable } from "@/components/inventory/activity/list/activity-table";
import { ActivityFilterModal } from "@/components/inventory/activity/list/activity-filter-modal";
// Activity filter tags import removed
import { SearchBar } from "@/components/ui/search-bar";
import { FAB } from "@/components/ui/fab";
import { IconBox, IconPlus, IconFilter, IconLayoutList } from "@tabler/icons-react-native";
import { routes } from '../../../../constants';
import { useActivitiesInfiniteMobile } from "@/hooks/use-activities-infinite-mobile";
import { useActivityMutations } from '../../../../hooks';
import { hasPrivilege } from '../../../../utils';
import { SECTOR_PRIVILEGES } from '../../../../constants';
import type { ActivityGetManyFormData } from '../../../../schemas';

export default function ActivitiesListScreen() {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [searchText, setSearchText] = useState("");
  const [debouncedSearchText, setDebouncedSearchText] = useState("");
  const [filters, setFilters] = useState<Partial<ActivityGetManyFormData>>({});
  const [showFilters, setShowFilters] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const { deleteAsync } = useActivityMutations();

  // Permission check
  const canManageWarehouse = useMemo(() => {
    if (!user) return false;
    return hasPrivilege(user, SECTOR_PRIVILEGES.WAREHOUSE) || hasPrivilege(user, SECTOR_PRIVILEGES.ADMIN);
  }, [user]);

  // Build query with filters
  const queryParams = useMemo(() => ({
    orderBy: { createdAt: "desc" },
    ...(debouncedSearchText ? { searchingFor: debouncedSearchText } : {}),
    ...filters,
  }), [debouncedSearchText, filters]);

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
    router.push(`/(tabs)/inventory/activities/details/${activityId}` as any);
  }, []);

  // Handle activity deletion
  const handleDelete = useCallback(async (activityId: string) => {
    Alert.alert(
      "Excluir Movimentação",
      "Tem certeza que deseja excluir esta movimentação? Esta ação é irreversível e afetará o estoque.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Excluir",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteAsync(activityId);
            } catch (error) {
              Alert.alert("Erro", "Não foi possível excluir a movimentação");
            }
          },
        },
      ]
    );
  }, [deleteAsync]);

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

  // Permission gate
  if (!canManageWarehouse) {
    return (
      <>
        <Stack.Screen
          options={{
            title: "Movimentações",
            headerStyle: { backgroundColor: colors.card },
            headerTintColor: colors.foreground,
          }}
        />
        <ErrorScreen
          message="Acesso negado"
          detail="Você não tem permissão para acessar esta funcionalidade. É necessário privilégio de Almoxarifado ou Administrador."
        />
      </>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: "Movimentações",
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
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <SearchBar
            value={searchText}
            onChangeText={setSearchText}
            placeholder="Buscar por item, usuário ou descrição..."
          />
        </View>

        {/* Active Filters - Component not implemented yet */}
        {/* {hasActiveFilters && (
          <ActivityFilterTags
            filters={filters}
            searchText={debouncedSearchText}
            onClearAll={handleClearFilters}
            onRemoveFilter={(key) => {
              const newFilters = { ...filters };
              delete (newFilters as any)[key];
              setFilters(newFilters);
            }}
            onClearSearch={() => {
              setSearchText("");
              setDebouncedSearchText("");
            }}
          />
        )} */}

        {/* Results Count */}
        {totalItemsLoaded > 0 && (
          <View style={styles.countContainer}>
            <ThemedText style={styles.countText}>
              {totalItemsLoaded} movimentaç{totalItemsLoaded === 1 ? "ão" : "ões"}
            </ThemedText>
          </View>
        )}

        {/* Activity Table */}
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

        {/* Create FAB - Only for admin */}
        {hasPrivilege(user, SECTOR_PRIVILEGES.ADMIN) && (
          <FAB
            icon="plus"
            onPress={() => router.push("/(tabs)/inventory/activities/create" as any)}
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
  headerActions: {
    flexDirection: "row",
    gap: spacing.xs,
  },
  searchContainer: {
    padding: spacing.md,
    paddingBottom: 0,
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