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
import { PpeTable } from "@/components/inventory/ppe/list/ppe-table";
import { PpeFilterModal } from "@/components/inventory/ppe/list/ppe-filter-modal";
import { PpeFilterTags } from "@/components/inventory/ppe/list/ppe-filter-tags";
import { SearchBar } from "@/components/ui/search-bar";
import { FAB } from "@/components/ui/fab";
import { IconShield, IconPlus, IconFilter } from "@tabler/icons-react-native";
import { usePpeDeliveryMutations, usePpeDeliveriesInfinite } from '../../../../hooks';
import { hasPrivilege } from '../../../../utils';
import { SECTOR_PRIVILEGES } from '../../../../constants';
import type { PpeDeliveryGetManyFormData } from '../../../../schemas';

export default function PPEListScreen() {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [searchText, setSearchText] = useState("");
  const [debouncedSearchText, setDebouncedSearchText] = useState("");
  const [filters, setFilters] = useState<Partial<PpeDeliveryGetManyFormData>>({});
  const [showFilters, setShowFilters] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const { deleteMutation } = usePpeDeliveryMutations();

  // Permission check - PPE management is available for HR, warehouse and admin
  const canManagePpe = useMemo(() => {
    if (!user) return false;
    return hasPrivilege(user, SECTOR_PRIVILEGES.HUMAN_RESOURCES) ||
           hasPrivilege(user, SECTOR_PRIVILEGES.WAREHOUSE) ||
           hasPrivilege(user, SECTOR_PRIVILEGES.ADMIN);
  }, [user]);

  const isAdmin = useMemo(() => {
    if (!user) return false;
    return hasPrivilege(user, SECTOR_PRIVILEGES.ADMIN);
  }, [user]);

  // Build query with filters
  const queryParams = useMemo(() => ({
    orderBy: { createdAt: "desc" },
    include: {
      item: {
        include: {
          category: true,
          brand: true,
          supplier: true,
        }
      },
      user: {
        include: {
          position: true,
          sector: true,
        }
      },
    },
    ...(debouncedSearchText ? { searchingFor: debouncedSearchText } : {}),
    ...filters,
  }), [debouncedSearchText, filters]);

  // Use the actual PPE deliveries infinite hook
  const query = usePpeDeliveriesInfinite(queryParams);

  // Extract the data properly from infinite query
  const ppeDeliveries = query.data?.data || [];
  const totalItemsLoaded = ppeDeliveries.length;
  const canLoadMore = query.hasNextPage;
  const isFetchingNextPage = query.isFetchingNextPage;
  const loadMore = query.fetchNextPage;
  const isLoading = query.isLoading;
  const error = query.error;
  const refresh = query.refresh;

  // Handle pull to refresh
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  }, [refresh]);

  // Handle navigation to details
  const handlePpePress = useCallback((ppeId: string) => {
    router.push(`/inventory/ppe/details/${ppeId}`);
  }, []);

  // Handle PPE delivery deletion
  const handleDelete = useCallback(async (deliveryId: string) => {
    Alert.alert(
      "Excluir Entrega de EPI",
      "Tem certeza que deseja excluir esta entrega de EPI? Esta ação é irreversível.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Excluir",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteMutation.mutateAsync(deliveryId);
            } catch (error) {
              Alert.alert("Erro", "Não foi possível excluir a entrega de EPI");
            }
          },
        },
      ]
    );
  }, [deleteMutation]);

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
  if (!canManagePpe) {
    return (
      <>
        <Stack.Screen
          options={{
            title: "Entregas de EPI",
            headerStyle: { backgroundColor: colors.card },
            headerTintColor: colors.foreground,
          }}
        />
        <ErrorScreen
          message="Acesso negado"
          detail="Você não tem permissão para acessar esta funcionalidade. É necessário privilégio de RH, Almoxarifado ou Administrador."
        />
      </>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: "Entregas de EPI",
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
            placeholder="Buscar por item ou usuário..."
          />
        </View>

        {/* Active Filters */}
        {hasActiveFilters && (
          <PpeFilterTags
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
        )}

        {/* Results Count */}
        {totalItemsLoaded > 0 && (
          <View style={styles.countContainer}>
            <ThemedText style={styles.countText}>
              {totalItemsLoaded} Entrega{totalItemsLoaded === 1 ? "" : "s"} de EPI
            </ThemedText>
          </View>
        )}

        {/* PPE Deliveries Table */}
        <PpeTable
          ppes={ppeDeliveries}
          isLoading={isLoading}
          error={error}
          onPpePress={handlePpePress}
          onDelete={handleDelete}
          onRefresh={handleRefresh}
          refreshing={refreshing}
          onEndReach={loadMore}
          canLoadMore={canLoadMore}
          loadingMore={isFetchingNextPage}
        />

        {/* Create FAB - Only for admin */}
        {isAdmin && (
          <FAB
            onPress={() => router.push("/inventory/ppe/deliveries/create")}
            style={{
              bottom: insets.bottom + spacing.lg,
              right: spacing.lg,
            }}
          >
            <IconPlus size={24} color="white" />
          </FAB>
        )}

        {/* Filter Modal */}
        <PpeFilterModal
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