import React, { useCallback, useMemo, useState } from "react";
import { View, StyleSheet } from "react-native";
import { Stack } from "expo-router";
import { useAuth } from "@/contexts/auth-context";
import { useTheme } from "@/lib/theme";
import { spacing } from "@/constants/design-system";
import { ThemedView } from "@/components/ui/themed-view";
import { ThemedText } from "@/components/ui/themed-text";
import { Button } from "@/components/ui/button";
import { ErrorScreen } from "@/components/ui/error-screen";
import { EmptyState } from "@/components/ui/empty-state";
import { BorrowTable } from "@/components/inventory/borrow/list/borrow-table";
import { BorrowFilterModal } from "@/components/inventory/borrow/list/borrow-filter-modal";
import { SearchBar } from "@/components/ui/search-bar";
import { IconFilter, IconPackage, IconAlertCircle } from "@tabler/icons-react-native";
import { useBorrowsInfiniteMobile } from "@/hooks/use-borrows-infinite-mobile";
import { BORROW_STATUS } from "@/constants";
import type { BorrowGetManyFormData } from "@/schemas";

export default function MyBorrowsListScreen() {
  const { colors, isDark } = useTheme();
  const { user } = useAuth();
  const [searchText, setSearchText] = useState("");
  const [debouncedSearchText, setDebouncedSearchText] = useState("");
  const [filters, setFilters] = useState<Partial<BorrowGetManyFormData>>({});
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
  } = useBorrowsInfiniteMobile(queryParams);

  // Calculate stats
  const stats = useMemo(() => {
    const active = items.filter(b => b.status === BORROW_STATUS.ACTIVE).length;
    const overdue = items.filter(b => {
      if (b.status !== BORROW_STATUS.ACTIVE) return false;
      const createdDate = new Date(b.createdAt);
      const now = new Date();
      const daysDiff = Math.floor((now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
      return daysDiff > 30;
    }).length;

    return { active, overdue };
  }, [items]);

  // Handle pull to refresh
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  }, [refresh]);

  // Handle navigation to details (currently disabled)
  const handleBorrowPress = useCallback((borrowId: string) => {
    // Navigate to borrow details if needed
    // router.push(`/(tabs)/personal/my-borrows/details/${borrowId}` as any);
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
            title: "Meus Empréstimos",
            headerStyle: { backgroundColor: colors.card },
            headerTintColor: colors.foreground,
          }}
        />
        <ErrorScreen
          message="Usuário não encontrado"
          detail="Você precisa estar autenticado para visualizar seus empréstimos."
        />
      </>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: "Meus Empréstimos",
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
            <IconPackage size={24} color={colors.primary} />
            <View style={styles.headerTextContainer}>
              <ThemedText style={styles.headerTitle}>Meus Empréstimos</ThemedText>
              <ThemedText style={styles.headerSubtitle}>
                Acompanhe seus itens emprestados do estoque
              </ThemedText>
            </View>
          </View>

          {/* Stats Cards */}
          {totalItemsLoaded > 0 && (
            <View style={styles.statsContainer}>
              <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <ThemedText style={styles.statValue}>{stats.active}</ThemedText>
                <ThemedText style={styles.statLabel}>Ativos</ThemedText>
              </View>
              {stats.overdue > 0 && (
                <View style={[styles.statCard, styles.statCardWarning, { borderColor: "#f59e0b" }]}>
                  <View style={styles.statCardHeader}>
                    <IconAlertCircle size={16} color="#f59e0b" />
                    <ThemedText style={[styles.statValue, { color: "#f59e0b" }]}>
                      {stats.overdue}
                    </ThemedText>
                  </View>
                  <ThemedText style={[styles.statLabel, { color: "#f59e0b" }]}>
                    Atrasados
                  </ThemedText>
                </View>
              )}
            </View>
          )}
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <SearchBar
            value={searchText}
            onChangeText={setSearchText}
            placeholder="Buscar por item ou código..."
          />
        </View>

        {/* Results Count */}
        {totalItemsLoaded > 0 && (
          <View style={styles.countContainer}>
            <ThemedText style={styles.countText}>
              {totalItemsLoaded} empréstimo{totalItemsLoaded === 1 ? "" : "s"}
            </ThemedText>
          </View>
        )}

        {/* Borrow Table */}
        {items.length > 0 ? (
          <BorrowTable
            borrows={items}
            isLoading={isLoading}
            error={error}
            onBorrowPress={handleBorrowPress}
            onRefresh={handleRefresh}
            refreshing={refreshing}
            onEndReach={loadMore}
            canLoadMore={canLoadMore}
            loadingMore={isFetchingNextPage}
            readOnly={true}
          />
        ) : (
          <EmptyState
            icon="hand-stop"
            title="Nenhum empréstimo encontrado"
            description={
              hasActiveFilters
                ? "Tente ajustar os filtros para ver mais resultados"
                : "Seus empréstimos de itens aparecerão aqui quando você solicitar empréstimos"
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
  header: {
    padding: spacing.md,
    paddingBottom: spacing.sm,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
    marginBottom: spacing.md,
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
  statsContainer: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  statCard: {
    flex: 1,
    padding: spacing.md,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
  },
  statCardWarning: {
    backgroundColor: "#fffbeb",
  },
  statCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  statValue: {
    fontSize: 24,
    fontWeight: "700",
  },
  statLabel: {
    fontSize: 12,
    opacity: 0.7,
    marginTop: 4,
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
