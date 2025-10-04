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
import { ServiceOrderTable } from "@/components/production/service-order/list/service-order-table";
import { ServiceOrderFilterModal } from "@/components/production/service-order/list/service-order-filter-modal";
import { ServiceOrderFilterTags } from "@/components/production/service-order/list/service-order-filter-tags";
import { SearchBar } from "@/components/ui/search-bar";
import { FAB } from "@/components/ui/fab";
import { IconClipboardList, IconPlus, IconFilter } from "@tabler/icons-react-native";
import { useServiceOrdersInfiniteMobile } from "@/hooks/use-service-orders-infinite-mobile";
import { useServiceOrderMutations } from '../../../../hooks';
import { hasPrivilege } from '../../../../utils';
import { SECTOR_PRIVILEGES } from '../../../../constants';
import type { ServiceOrderGetManyFormData } from '../../../../schemas';

export default function ServiceOrderListScreen() {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [searchText, setSearchText] = useState("");
  const [debouncedSearchText, setDebouncedSearchText] = useState("");
  const [filters, setFilters] = useState<Partial<ServiceOrderGetManyFormData>>({});
  const [showFilters, setShowFilters] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const { deleteAsync } = useServiceOrderMutations();

  // Permission check
  const canManageServiceOrders = useMemo(() => {
    if (!user) return false;
    return hasPrivilege(user, SECTOR_PRIVILEGES.PRODUCTION) ||
           hasPrivilege(user, SECTOR_PRIVILEGES.LEADER) ||
           hasPrivilege(user, SECTOR_PRIVILEGES.ADMIN);
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
    error,
    loadMore,
    canLoadMore,
    isFetchingNextPage,
    refresh,
    totalItemsLoaded,
  } = useServiceOrdersInfiniteMobile(queryParams);

  // Handle pull to refresh
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  }, [refresh]);

  // Handle navigation to details
  const handleServiceOrderPress = useCallback((serviceOrderId: string) => {
    router.push(`/production/service-orders/details/${serviceOrderId}`);
  }, []);

  // Handle deletion
  const handleDelete = useCallback(async (serviceOrderId: string) => {
    Alert.alert(
      "Excluir Ordem de Serviço",
      "Tem certeza que deseja excluir esta ordem de serviço? Esta ação é irreversível.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Excluir",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteAsync(serviceOrderId);
            } catch (error) {
              Alert.alert("Erro", "Não foi possível excluir a ordem de serviço");
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
  if (!canManageServiceOrders) {
    return (
      <>
        <Stack.Screen
          options={{
            title: "Ordens de Serviço",
            headerStyle: { backgroundColor: colors.card },
            headerTintColor: colors.foreground,
          }}
        />
        <ErrorScreen
          message="Acesso negado"
          detail="Você não tem permissão para acessar esta funcionalidade. É necessário privilégio de Produção, Líder ou Administrador."
        />
      </>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: "Ordens de Serviço",
          headerStyle: { backgroundColor: colors.card },
          headerTintColor: colors.foreground,
          headerRight: () => (
            <View style={styles.headerActions}>
              <Button
                variant="ghost"
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
            placeholder="Buscar por cliente, veículo ou descrição..."
          />
        </View>

        {/* Active Filters */}
        {hasActiveFilters && (
          <ServiceOrderFilterTags
            filters={filters}
            searchText={debouncedSearchText}
            onClearAll={handleClearFilters}
            onRemoveFilter={(key) => {
              const newFilters = { ...filters };
              delete (newFilters as any)[key as string];
              setFilters(newFilters);
            }}
            onClearSearch={() => {
              setSearchText("");
              setDebouncedSearchText("");
            }}
          />
        )}

        {/* Results Count */}
        {totalItemsLoaded > 0 && (
          <View style={styles.countContainer}>
            <ThemedText style={styles.countText}>
              {totalItemsLoaded} {totalItemsLoaded === 1 ? "ordem" : "ordens"} de serviço
            </ThemedText>
          </View>
        )}

        {/* Service Orders Table */}
        <ServiceOrderTable
          serviceOrders={items}
          isLoading={isLoading}
          error={error}
          onServiceOrderPress={handleServiceOrderPress}
          onDelete={handleDelete}
          onRefresh={handleRefresh}
          refreshing={refreshing}
          onEndReach={loadMore}
          canLoadMore={canLoadMore}
          loadingMore={isFetchingNextPage}
        />

        {/* Create FAB */}
        {canManageServiceOrders && (
          <FAB
            onPress={() => router.push("/production/service-orders/create")}
            style={{
              bottom: insets.bottom + spacing.lg,
              right: spacing.lg,
            }}
          >
            <IconPlus size={24} color="white" />
          </FAB>
        )}

        {/* Filter Modal */}
        <ServiceOrderFilterModal
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