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
import { SearchBar } from "@/components/ui/search-bar";
import { FAB } from "@/components/ui/fab";
import { IconBrush, IconPlus, IconFilter } from "@tabler/icons-react-native";
import { useAirbrushingsInfinite, useAirbrushingMutations } from '../../../../hooks';
import { hasPrivilege } from '../../../../utils';
import { SECTOR_PRIVILEGES } from '../../../../constants';
import type { AirbrushingGetManyFormData } from '../../../../schemas';
import { AirbrushingTable } from "@/components/production/airbrushing/list/airbrushing-table";
import { AirbrushingFilterModal } from "@/components/production/airbrushing/list/airbrushing-filter-modal";
import { AirbrushingFilterTags } from "@/components/production/airbrushing/list/airbrushing-filter-tags";

export default function AirbrushingListScreen() {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [searchText, setSearchText] = useState("");
  const [debouncedSearchText, setDebouncedSearchText] = useState("");
  const [filters, setFilters] = useState<Partial<AirbrushingGetManyFormData>>({});
  const [showFilters, setShowFilters] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const { deleteAsync } = useAirbrushingMutations();

  // Permission check
  const canManageAirbrushing = useMemo(() => {
    if (!user) return false;
    return hasPrivilege(user, SECTOR_PRIVILEGES.PRODUCTION) ||
           hasPrivilege(user, SECTOR_PRIVILEGES.LEADER) ||
           hasPrivilege(user, SECTOR_PRIVILEGES.ADMIN);
  }, [user]);

  const isAdmin = useMemo(() => {
    if (!user) return false;
    return hasPrivilege(user, SECTOR_PRIVILEGES.ADMIN);
  }, [user]);

  // Build query with filters and include task relationship
  const queryParams = useMemo(() => ({
    orderBy: { createdAt: "desc" },
    include: {
      task: {
        include: {
          customer: true,
          truck: true,
        },
      },
    },
    ...(debouncedSearchText ? { searchingFor: debouncedSearchText } : {}),
    ...filters,
  }), [debouncedSearchText, filters]);

  const {
    data: airbrushings = [],
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
  } = useAirbrushingsInfinite(queryParams);

  // Flatten paginated data
  const items = useMemo(() => {
    return Array.isArray(airbrushings) ? airbrushings.flatMap(page => page.data || []) : [];
  }, [airbrushings]);

  const totalItemsLoaded = items.length;

  // Handle pull to refresh
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  // Handle navigation to details
  const handleAirbrushingPress = useCallback((airbrushingId: string) => {
    router.push(`/producao/aerografia/detalhes/${airbrushingId}`);
  }, []);

  // Handle deletion
  const handleDelete = useCallback(async (airbrushingId: string) => {
    Alert.alert(
      "Excluir Airbrushing",
      "Tem certeza que deseja excluir este airbrushing? Esta ação é irreversível.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Excluir",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteAsync(airbrushingId);
            } catch (error) {
              Alert.alert("Erro", "Não foi possível excluir o airbrushing");
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

  // Load more data
  const handleLoadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Permission gate
  if (!canManageAirbrushing) {
    return (
      <>
        <Stack.Screen
          options={{
            title: "Airbrushing",
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
          title: "Airbrushing",
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
            placeholder="Buscar por tarefa, cliente ou veículo..."
          />
        </View>

        {/* Active Filters */}
        {hasActiveFilters && (
          <AirbrushingFilterTags
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
              {totalItemsLoaded} {totalItemsLoaded === 1 ? "airbrushing" : "airbrushings"}
            </ThemedText>
          </View>
        )}

        {/* Airbrushing Table */}
        <AirbrushingTable
          airbrushings={items}
          isLoading={isLoading}
          error={error}
          onAirbrushingPress={handleAirbrushingPress}
          onDelete={isAdmin ? handleDelete : undefined}
          onRefresh={handleRefresh}
          refreshing={refreshing}
          onEndReach={handleLoadMore}
          canLoadMore={hasNextPage}
          loadingMore={isFetchingNextPage}
        />

        {/* Create FAB */}
        {canManageAirbrushing && (
          <FAB
            onPress={() => router.push("/producao/aerografia/cadastrar")}
            style={{
              bottom: insets.bottom + spacing.lg,
              right: spacing.lg,
            }}
          >
            <IconPlus size={24} color="white" />
          </FAB>
        )}

        {/* Filter Modal */}
        <AirbrushingFilterModal
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