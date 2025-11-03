import React, { useCallback, useMemo, useState } from "react";
import { View, StyleSheet } from "react-native";
import { Stack, router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@/contexts/auth-context";
import { useTheme } from "@/lib/theme";
import { spacing } from "@/constants/design-system";
import { ThemedView } from "@/components/ui/themed-view";
import { ThemedText } from "@/components/ui/themed-text";
import { Button } from "@/components/ui/button";
import { ErrorScreen } from "@/components/ui/error-screen";
import { PaintTable } from "@/components/production/paint/list/paint-table";

import { PaintFilterTags } from "@/components/production/paint/list/paint-filter-tags";
import { SearchBar } from "@/components/ui/search-bar";
import { FAB } from "@/components/ui/fab";
import { IconPlus, IconFilter } from "@tabler/icons-react-native";
import { usePaintsInfiniteMobile } from "@/hooks/use-paints-infinite-mobile";
import { hasPrivilege } from '../../../../utils';
import { SECTOR_PRIVILEGES } from '../../../../constants';
import type { PaintGetManyFormData } from '../../../../schemas';

import { UtilityDrawerWrapper } from "@/components/ui/utility-drawer";
import { useUtilityDrawer } from "@/contexts/utility-drawer-context";
import { GenericColumnDrawerContent } from "@/components/ui/generic-column-drawer-content";
import { PaintFilterDrawerContent } from "@/components/production/paint/list/paint-filter-drawer-content";

export default function PaintsListScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { openFilterDrawer, openColumnDrawer } = useUtilityDrawer();
  const { user } = useAuth();
  const [searchText, setSearchText] = useState("");
  const [debouncedSearchText, setDebouncedSearchText] = useState("");
  const [filters, setFilters] = useState<Partial<PaintGetManyFormData>>({});
  const [_refreshing] = useState(false);

  // Permission check - Paint management is available for production and admin
  const canManagePaints = useMemo(() => {
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
    
    
    
    refresh,
    totalItemsLoaded,
  } = usePaintsInfiniteMobile(queryParams);

  // Handle pull to refresh
  const handleRefresh = useCallback(async () => {
    await refresh();
  }, [refresh]);

  // Handle navigation to details
  const handlePaintPress = useCallback((paintId: string) => {
    router.push(`/producao/tintas/detalhes/${paintId}`);
  }, []);

  // Handle paint deletion
  // const handleDelete = useCallback(async (paintId: string) => {
  //   Alert.alert(
  //     "Excluir Tinta",
  //     "Tem certeza que deseja excluir esta tinta? Esta ação é irreversível.",
  //     [
  //       { text: "Cancelar", style: "cancel" },
  //       {
  //         text: "Excluir",
  //         style: "destructive",
  //         onPress: async () => {
  //           try {
  //             await deleteAsync(paintId);
  //           } catch (error) {
  //             Alert.alert("Erro", "Não foi possível excluir a tinta");
  //           }
  //         },
  //       },
  //     ]
  //   );
  // }, [deleteAsync]);

  // Handle search with debounce
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchText(searchText);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchText]);

  // Check active filters
  const hasActiveFilters = useMemo(() => {
    return Object.keys(filters).length > 0 || !!debouncedSearchText;
  }, [filters, debouncedSearchText]);

  const activeFiltersCount = useMemo(() => {
    return Object.keys(filters).filter(key => filters[key as keyof typeof filters] !== undefined).length;
  }, [filters]);

  const handleClearFilters = useCallback(() => {
    setFilters({});
    setSearchText("");
    setDebouncedSearchText("");
  }, []);

  const handleOpenFilters = useCallback(() => {
    openFilterDrawer(() => (
      <PaintFilterDrawerContent
        filters={filters}
        onFiltersChange={setFilters}
        onClear={handleClearFilters}
        activeFiltersCount={activeFiltersCount}
      />
    ));
  }, [openFilterDrawer, filters, handleClearFilters, activeFiltersCount]);

  // Permission gate
  if (!canManagePaints) {
    return (
      <>
        <Stack.Screen
          options={{
            title: "Tintas",
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
    <UtilityDrawerWrapper>
      <>
        <Stack.Screen
          options={{
            title: "Tintas",
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
            placeholder="Buscar por código, nome ou marca..."
          />
        </View>

        {/* Active Filters */}
        {hasActiveFilters && (
          <PaintFilterTags
            filters={filters}
            onRemove={(key) => {
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
              {totalItemsLoaded} tinta{totalItemsLoaded === 1 ? "" : "s"}
            </ThemedText>
          </View>
        )}

        {/* Paint Table */}
        <PaintTable
          data={items}
          isLoading={isLoading}
          error={error}
          onRefresh={handleRefresh}
          onItemPress={handlePaintPress}
        />

        {/* Create FAB - Only for admin */}
        {isAdmin && (
          <FAB
            onPress={() => router.push("/producao/tintas/cadastrar")}
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
    </UtilityDrawerWrapper>
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