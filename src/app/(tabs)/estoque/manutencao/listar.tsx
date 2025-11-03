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
import { MaintenanceTable } from "@/components/inventory/maintenance/list/maintenance-table";

import { MaintenanceFilterTags } from "@/components/inventory/maintenance/list/maintenance-filter-tags";
import { SearchBar } from "@/components/ui/search-bar";
import { FAB } from "@/components/ui/fab";
import { IconFilter } from "@tabler/icons-react-native";
import { useMaintenanceInfiniteMobile } from "@/hooks/use-maintenance-infinite-mobile";
import { hasPrivilege } from '../../../../utils';
import { SECTOR_PRIVILEGES } from '../../../../constants';
import type { MaintenanceGetManyFormData } from '../../../../schemas';

import { UtilityDrawerWrapper } from "@/components/ui/utility-drawer";
import { useUtilityDrawer } from "@/contexts/utility-drawer-context";
import { GenericColumnDrawerContent } from "@/components/ui/generic-column-drawer-content";

export default function InventoryMaintenanceListScreen() {
  const { colors } = useTheme();

  const { user } = useAuth();
  const [searchText, setSearchText] = useState("");
  const [debouncedSearchText, setDebouncedSearchText] = useState("");
  const [filters, setFilters] = useState<Partial<MaintenanceGetManyFormData>>({});
  const [refreshing, setRefreshing] = useState(false);

  // Permission check - Maintenance management is available for maintenance and admin
  const canManageMaintenance = useMemo(() => {
    if (!user) return false;
    return hasPrivilege(user, SECTOR_PRIVILEGES.MAINTENANCE) || hasPrivilege(user, SECTOR_PRIVILEGES.ADMIN);
  }, [user]);

  const isAdmin = useMemo(() => {
    if (!user) return false;
    return hasPrivilege(user, SECTOR_PRIVILEGES.ADMIN);
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
    loadMore,
    canLoadMore,
    isFetchingNextPage,
    refresh,
    totalItemsLoaded,
  } = useMaintenanceInfiniteMobile(queryParams);

  // Handle pull to refresh
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  }, [refresh]);


  // Handle search with debounce
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchText(searchText);
    }, 300);
    return (
    <UtilityDrawerWrapper>
    ) => clearTimeout(timer
    </UtilityDrawerWrapper>
  );
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
  if (!canManageMaintenance) {
    return (
      <>
        <Stack.Screen
          options={{
            title: "Manutenções",
            headerStyle: { backgroundColor: colors.card },
            headerTintColor: colors.foreground,
          }}
        />
        <ErrorScreen
          message="Acesso negado"
          detail="Você não tem permissão para acessar esta funcionalidade. É necessário privilégio de Manutenção ou Administrador."
        />
      </>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: "Manutenções",
          headerStyle: { backgroundColor: colors.card },
          headerTintColor: colors.foreground,
          headerRight: () => (
            <View style={styles.headerActions}>
              <Button
                variant="ghost"
                size="icon"
                onPress={handleOpenFilters}
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
            placeholder="Buscar por veículo, descrição ou responsável..."
          />
        </View>

        {/* Active Filters */}
        {hasActiveFilters && (
          <MaintenanceFilterTags
            filters={filters}
            onClearAll={handleClearFilters}
            onRemoveFilter={(key) => {
              const newFilters = { ...filters };
              delete (newFilters as any)[key as string];
              setFilters(newFilters);
            }}
          />
        )}

        {/* Results Count */}
        {totalItemsLoaded > 0 && (
          <View style={styles.countContainer}>
            <ThemedText style={styles.countText}>
              {totalItemsLoaded} manutenç{totalItemsLoaded === 1 ? "ão" : "ões"}
            </ThemedText>
          </View>
        )}

        {/* Maintenance Table */}
        <MaintenanceTable
          maintenances={items}
          isLoading={isLoading}
          isRefreshing={refreshing}
          onRefresh={handleRefresh}
          onLoadMore={loadMore}
          hasNextPage={canLoadMore}
          isFetchingNextPage={isFetchingNextPage}
        />

        {/* Create FAB - Only for admin */}
        {isAdmin && (
          <FAB
            icon="plus"
            onPress={() => router.push("/estoque/manutencao/cadastrar")}
          />
        )}
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