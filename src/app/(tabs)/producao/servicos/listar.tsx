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
import { ServiceTable } from "@/components/production/service/list/service-table";
import { SearchBar } from "@/components/ui/search-bar";
import { FAB } from "@/components/ui/fab";
import { IconPlus, IconFilter } from "@tabler/icons-react-native";
import { useServicesInfiniteMobile } from "@/hooks/use-services-infinite-mobile";
import { useServiceMutations } from '../../../../hooks';
import { hasPrivilege } from '../../../../utils';
import { SECTOR_PRIVILEGES } from '../../../../constants';
import type { ServiceGetManyFormData } from '../../../../schemas';

export default function ServicesListScreen() {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [searchText, setSearchText] = useState("");
  const [debouncedSearchText, setDebouncedSearchText] = useState("");
  const [filters, setFilters] = useState<Partial<ServiceGetManyFormData>>({});
  const [refreshing, setRefreshing] = useState(false);
  const { delete: deleteService } = useServiceMutations();

  // Permission check - Service management is available for production and admin
  const canManageServices = useMemo(() => {
    if (!user) return false;
    return hasPrivilege(user, SECTOR_PRIVILEGES.PRODUCTION) ||
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
  } = useServicesInfiniteMobile(queryParams);

  // Handle pull to refresh
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  }, [refresh]);

  // Handle navigation to details
  const handleServicePress = useCallback((serviceId: string) => {
    router.push(`/producao/servicos/detalhes/${serviceId}`);
  }, []);

  // Handle service deletion
  const handleDelete = useCallback(async (serviceId: string) => {
    const service = items.find(s => s.id === serviceId);
    Alert.alert(
      "Excluir Serviço",
      `Tem certeza que deseja excluir o serviço "${service?.description}"? Esta ação é irreversível.`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Excluir",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteService(serviceId);
            } catch (error) {
              Alert.alert("Erro", "Não foi possível excluir o serviço");
            }
          },
        },
      ]
    );
  }, [deleteService, items]);

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
  if (!canManageServices) {
    return (
      <>
        <Stack.Screen
          options={{
            title: "Serviços",
            headerStyle: { backgroundColor: colors.card },
            headerTintColor: colors.foreground,
          }}
        />
        <ErrorScreen
          message="Acesso negado"
          detail="Você não tem permissão para acessar esta funcionalidade. É necessário privilégio de Produção ou Administrador."
        />
      </>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: "Serviços",
          headerStyle: { backgroundColor: colors.card },
          headerTintColor: colors.foreground,
        }}
      />

      <ThemedView style={styles.container}>
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <SearchBar
            value={searchText}
            onChangeText={setSearchText}
            placeholder="Buscar serviços por descrição..."
          />
        </View>

        {/* Active Filters - For future implementation */}
        {hasActiveFilters && (
          <View style={styles.filtersContainer}>
            <Button
              variant="outline"
              size="sm"
              onPress={handleClearFilters}
            >
              <ThemedText>Limpar filtros</ThemedText>
            </Button>
          </View>
        )}

        {/* Results Count */}
        {totalItemsLoaded > 0 && (
          <View style={styles.countContainer}>
            <ThemedText style={styles.countText}>
              {totalItemsLoaded} serviço{totalItemsLoaded === 1 ? "" : "s"}
            </ThemedText>
          </View>
        )}

        {/* Service Table */}
        <ServiceTable
          services={items}
          isLoading={isLoading}
          error={error}
          onServicePress={handleServicePress}
          onDelete={isAdmin ? handleDelete : undefined}
          onRefresh={handleRefresh}
          refreshing={refreshing}
          onEndReach={loadMore}
          canLoadMore={canLoadMore}
          loadingMore={isFetchingNextPage}
        />

        {/* Create FAB - Only for admin */}
        {isAdmin && (
          <FAB
            onPress={() => router.push("/producao/servicos/cadastrar")}
            style={{
              bottom: insets.bottom + spacing.lg,
              right: spacing.lg,
            }}
          >
            <IconPlus size={24} color="white" />
          </FAB>
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
  filtersContainer: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xs,
    flexDirection: "row",
    justifyContent: "flex-end",
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