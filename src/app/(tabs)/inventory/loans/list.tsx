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
import { BorrowTable } from "@/components/inventory/borrow/list/borrow-table";
import { BorrowFilterModal } from "@/components/inventory/borrow/list/borrow-filter-modal";
import { BorrowFilterTags } from "@/components/inventory/borrow/list/borrow-filter-tags";
import { SearchBar } from "@/components/ui/search-bar";
import { FAB } from "@/components/ui/fab";
import { IconPackage, IconPlus, IconFilter } from "@tabler/icons-react-native";
import { routes } from '../../../../constants';
import { useBorrowsInfiniteMobile } from "@/hooks/use-borrows-infinite-mobile";
import { useBorrowMutations } from '../../../../hooks';
import { hasPrivilege } from '../../../../utils';
import { SECTOR_PRIVILEGES, BORROW_STATUS } from '../../../../constants';
import type { BorrowGetManyFormData } from '../../../../schemas';

export default function EstoqueEmprestimosListarScreen() {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [searchText, setSearchText] = useState("");
  const [debouncedSearchText, setDebouncedSearchText] = useState("");
  const [filters, setFilters] = useState<Partial<BorrowGetManyFormData>>({
    // Default to showing only active borrows
    statuses: [BORROW_STATUS.ACTIVE],
  });
  const [showFilters, setShowFilters] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const { deleteAsync, update } = useBorrowMutations();

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
  } = useBorrowsInfiniteMobile(queryParams);

  // Handle pull to refresh
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  }, [refresh]);

  // Handle navigation to details
  const handleBorrowPress = useCallback((borrowId: string) => {
    router.push(`/inventory/loans/details/${borrowId}`);
  }, []);

  // Handle borrow return
  const handleReturn = useCallback(async (borrowId: string) => {
    Alert.alert(
      "Devolver Item",
      "Confirma a devolução deste item?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Devolver",
          style: "default",
          onPress: async () => {
            try {
              await update({
                id: borrowId,
                data: {
                  status: BORROW_STATUS.RETURNED,
                  returnedAt: new Date(),
                },
              });
            } catch (error) {
              Alert.alert("Erro", "Não foi possível devolver o item");
            }
          },
        },
      ]
    );
  }, [update]);

  // Handle mark as lost
  const handleMarkAsLost = useCallback(async (borrowId: string) => {
    Alert.alert(
      "Marcar como Perdido",
      "Tem certeza que deseja marcar este item como perdido? Esta ação é irreversível.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Marcar como Perdido",
          style: "destructive",
          onPress: async () => {
            try {
              await update({
                id: borrowId,
                data: { status: BORROW_STATUS.LOST },
              });
            } catch (error) {
              Alert.alert("Erro", "Não foi possível marcar o item como perdido");
            }
          },
        },
      ]
    );
  }, [update]);

  // Handle borrow deletion
  const handleDelete = useCallback(async (borrowId: string) => {
    Alert.alert(
      "Excluir Empréstimo",
      "Tem certeza que deseja excluir este empréstimo? Esta ação é irreversível.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Excluir",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteAsync(borrowId);
            } catch (error) {
              Alert.alert("Erro", "Não foi possível excluir o empréstimo");
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
    setFilters({ statuses: [BORROW_STATUS.ACTIVE] });
    setSearchText("");
    setDebouncedSearchText("");
  }, []);

  // Check active filters
  const hasActiveFilters = useMemo(() => {
    const defaultFilters = { statuses: [BORROW_STATUS.ACTIVE] };
    return Object.keys(filters).some(key => {
      if (!(key in defaultFilters)) return true; // If not in defaults, it's active

      // Type-safe property access
      if (key === 'statuses') {
        return JSON.stringify(filters.statuses) !== JSON.stringify(defaultFilters.statuses);
      }

      // For other properties, they are considered active since they're not in defaults
      return true;
    }) || !!debouncedSearchText;
  }, [filters, debouncedSearchText]);

  // Permission gate
  if (!canManageWarehouse) {
    return (
      <>
        <Stack.Screen
          options={{
            title: "Empréstimos",
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
          title: "Empréstimos",
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
          <BorrowFilterTags
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
              {totalItemsLoaded} empréstimo{totalItemsLoaded === 1 ? "" : "s"}
            </ThemedText>
          </View>
        )}

        {/* Borrow Table */}
        <BorrowTable
          borrows={items}
          isLoading={isLoading}
          error={error}
          onBorrowPress={handleBorrowPress}
          onReturn={handleReturn}
          onMarkAsLost={handleMarkAsLost}
          onDelete={handleDelete}
          onRefresh={handleRefresh}
          refreshing={refreshing}
          onEndReach={loadMore}
          canLoadMore={canLoadMore}
          loadingMore={isFetchingNextPage}
        />

        {/* Create FAB */}
        <FAB
          icon="plus"
          onPress={() => router.push("/inventory/loans/create")}
        />

        {/* Filter Modal */}
        <BorrowFilterModal
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

