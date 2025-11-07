import React, { useState, useCallback, useMemo } from "react";
import { View, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { IconFilter, IconList } from "@tabler/icons-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useWarningsInfiniteMobile } from '@/hooks/use-warnings-infinite-mobile';
import { useAuth } from "@/contexts/auth-context";

import { ThemedView, FAB, ErrorScreen, EmptyState, ListActionButton, SearchBar } from "@/components/ui";
import { MyWarningTable, createColumnDefinitions } from "@/components/personal/warning/list/my-warning-table";

import { MyWarningFilterTags } from "@/components/personal/warning/list/my-warning-filter-tags";
import { TableErrorBoundary } from "@/components/ui/table-error-boundary";
import { ItemsCountDisplay } from "@/components/ui/items-count-display";
import { useTheme } from "@/lib/theme";

// New hooks and components
import { useTableSort } from "@/hooks/useTableSort";
import { useColumnVisibility } from "@/hooks/useColumnVisibility";

// Import slide panel components
import { SlideInPanel } from "@/components/ui/slide-in-panel";
import { MyWarningFilterDrawerContent } from "@/components/personal/warning/list/my-warning-filter-drawer-content";
import { MyWarningColumnDrawerContent } from "@/components/personal/warning/list/my-warning-column-drawer-content";

export default function MyWarningsScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [displaySearchText, setDisplaySearchText] = useState("");
  const [selectedWarnings, setSelectedWarnings] = useState<Set<string>>(new Set());
  const [showSelection, setShowSelection] = useState(false);
  const searchInputRef = React.useRef<any>(null);

  // Slide panel state
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
  const [isColumnPanelOpen, setIsColumnPanelOpen] = useState(false);

  // Filter state
  const [filters, setFilters] = useState<{
    severity?: string[];
    category?: string[];
    isActive?: boolean;
    followUpDate?: { gte?: Date; lte?: Date };
    createdAt?: { gte?: Date; lte?: Date };
  }>({});

  const { sortConfigs, handleSort, buildOrderBy } = useTableSort(
    [{ columnKey: "createdAt", direction: "desc", order: 0 }],
    1, // Single column sort only
    false
  );

  const {
    visibleColumns,
    setVisibleColumns,
  } = useColumnVisibility(
    "my-warnings",
    ["severity", "category", "reason"],
    ["severity", "category", "reason", "description", "supervisor", "followUpDate", "isActive", "createdAt"]
  );

  // Build API query
  const buildWhereClause = useCallback(() => {
    const where: any = {
      collaboratorId: user?.id, // Always filter by current user
    };

    if (filters.severity?.length) {
      where.severity = { in: filters.severity };
    }

    if (filters.category?.length) {
      where.category = { in: filters.category };
    }

    if (filters.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    if (filters.followUpDate?.gte || filters.followUpDate?.lte) {
      where.followUpDate = {};
      if (filters.followUpDate.gte) {
        where.followUpDate.gte = filters.followUpDate.gte;
      }
      if (filters.followUpDate.lte) {
        where.followUpDate.lte = filters.followUpDate.lte;
      }
    }

    if (filters.createdAt?.gte || filters.createdAt?.lte) {
      where.createdAt = {};
      if (filters.createdAt.gte) {
        where.createdAt.gte = filters.createdAt.gte;
      }
      if (filters.createdAt.lte) {
        where.createdAt.lte = filters.createdAt.lte;
      }
    }

    return where;
  }, [filters, user?.id]);

  const queryParams = useMemo(() => ({
    orderBy: buildOrderBy(
      {
        severity: "severity",
        category: "category",
        reason: "reason",
        followUpDate: "followUpDate",
        isActive: "isActive",
        createdAt: "createdAt",
      },
      { createdAt: "desc" }
    ),
    ...(searchText ? { searchingFor: searchText } : {}),
    where: buildWhereClause(),
    include: {
      supervisor: true,
      collaborator: true,
    },
  }), [searchText, buildWhereClause, buildOrderBy]);

  const {
    items: warnings,
    isLoading,
    error,
    isRefetching,
    loadMore,
    hasNextPage,
    isFetchingNextPage,
    totalItemsLoaded,
    totalCount,
    refetch,
    prefetchNext,
    shouldPrefetch,
  } = useWarningsInfiniteMobile(queryParams);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refetch();
    } finally {
      setRefreshing(false);
    }
  }, [refetch]);

  const handleWarningPress = (warningId: string) => {
    router.push(`/pessoal/minhas-advertencias/detalhes/${warningId}` as any);
  };

  const handleEditWarning = (warningId: string) => {
    // Navigation to edit is typically not allowed for personal warnings
    // But we keep the handler for future requirements
    console.log("Edit warning:", warningId);
  };

  const handleDeleteWarning = useCallback(
    async (warningId: string) => {
      // Delete is typically not allowed for personal warnings
      // But we keep the handler for future requirements
      console.log("Delete warning:", warningId);
      if (selectedWarnings.has(warningId)) {
        const newSelection = new Set(selectedWarnings);
        newSelection.delete(warningId);
        setSelectedWarnings(newSelection);
      }
    },
    [selectedWarnings],
  );

  const handleSelectionChange = useCallback((newSelection: Set<string>) => {
    setSelectedWarnings(newSelection);
  }, []);

  const handleSearch = useCallback((text: string) => {
    setSearchText(text);
  }, []);

  const handleDisplaySearchChange = useCallback((text: string) => {
    setDisplaySearchText(text);
  }, []);

  const handleClearFilters = useCallback(() => {
    setFilters({});
    setSearchText("");
    setDisplaySearchText("");
    setSelectedWarnings(new Set());
    setShowSelection(false);
  }, []);

  const handleColumnsChange = useCallback((newColumns: Set<string>) => {
    setVisibleColumns(newColumns);
  }, [setVisibleColumns]);

  const handleOpenFilters = useCallback(() => {
    setIsColumnPanelOpen(false); // Close column panel if open
    setIsFilterPanelOpen(true);
  }, []);

  const handleCloseFilters = useCallback(() => {
    setIsFilterPanelOpen(false);
  }, []);

  const handleOpenColumns = useCallback(() => {
    setIsFilterPanelOpen(false); // Close filter panel if open
    setIsColumnPanelOpen(true);
  }, []);

  const handleCloseColumns = useCallback(() => {
    setIsColumnPanelOpen(false);
  }, []);

  // Get all column definitions
  const allColumns = useMemo(() => createColumnDefinitions(), []);

  // Count active filters
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filters.severity?.length) count++;
    if (filters.category?.length) count++;
    if (filters.isActive !== undefined) count++;
    if (filters.followUpDate?.gte || filters.followUpDate?.lte) count++;
    if (filters.createdAt?.gte || filters.createdAt?.lte) count++;
    return count;
  }, [filters]);

  // Only show skeleton on initial load, not on refetch/sort/search
  // This prevents the entire page from remounting during search
  const isInitialLoad = isLoading && warnings.length === 0;

  if (isInitialLoad) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ThemedView style={styles.skeleton} />
        </View>
      </ThemedView>
    );
  }

  if (error && warnings.length === 0) {
    return (
      <ThemedView style={styles.container}>
        <ErrorScreen message="Erro ao carregar advertências" detail={error.message} onRetry={handleRefresh} />
      </ThemedView>
    );
  }

  const hasWarnings = Array.isArray(warnings) && warnings.length > 0;

  return (
    <>
      <ThemedView style={[styles.container, { backgroundColor: colors.background, paddingBottom: insets.bottom }]}>
      {/* Search and Filter */}
      <View style={[styles.searchContainer]}>
        <SearchBar
          ref={searchInputRef}
          value={displaySearchText}
          onChangeText={handleDisplaySearchChange}
          onSearch={handleSearch}
          placeholder="Buscar advertências..."
          style={styles.searchBar}
          debounceMs={300}
          loading={isRefetching && !isFetchingNextPage}
        />
        <View style={styles.buttonContainer}>
          <ListActionButton
            icon={<IconList size={20} color={colors.foreground} />}
            onPress={handleOpenColumns}
            badgeCount={visibleColumns.size}
            badgeVariant="primary"
          />
          <ListActionButton
            icon={<IconFilter size={20} color={colors.foreground} />}
            onPress={handleOpenFilters}
            badgeCount={activeFiltersCount}
            badgeVariant="destructive"
            showBadge={activeFiltersCount > 0}
          />
        </View>
      </View>

      {/* Individual filter tags */}
      <MyWarningFilterTags
        filters={filters}
        searchText={searchText}
        onFilterChange={setFilters}
        onSearchChange={(text) => {
          setSearchText(text);
          setDisplaySearchText(text);
        }}
        onClearAll={handleClearFilters}
      />

      {hasWarnings ? (
        <TableErrorBoundary onRetry={handleRefresh}>
          <MyWarningTable
            warnings={warnings}
            onWarningPress={handleWarningPress}
            onWarningEdit={undefined} // Disable edit for personal warnings
            onWarningDelete={undefined} // Disable delete for personal warnings
            onRefresh={handleRefresh}
            onEndReached={hasNextPage ? loadMore : undefined}
            onPrefetch={shouldPrefetch ? prefetchNext : undefined}
            refreshing={refreshing || isRefetching}
            loading={false}
            loadingMore={isFetchingNextPage}
            showSelection={showSelection}
            selectedWarnings={selectedWarnings}
            onSelectionChange={handleSelectionChange}
            sortConfigs={sortConfigs}
            onSort={(configs) => {
              // Handle empty array (clear sort)
              if (configs.length === 0) {
                handleSort("createdAt"); // Reset to default
              } else {
                handleSort(configs[0].columnKey);
              }
            }}
            visibleColumnKeys={Array.from(visibleColumns) as string[]}
            enableSwipeActions={false} // Disable swipe actions for personal warnings
          />
        </TableErrorBoundary>
      ) : (
        <View style={styles.emptyContainer}>
          <EmptyState
            icon={searchText ? "search" : "alert-circle"}
            title={searchText ? "Nenhuma advertência encontrada" : "Nenhuma advertência registrada"}
            description={
              searchText ? `Nenhum resultado para "${searchText}"` : "Parabéns! Você não possui advertências registradas."
            }
          />
        </View>
      )}

      {/* Items count */}
      {hasWarnings && <ItemsCountDisplay loadedCount={totalItemsLoaded} totalCount={totalCount} isLoading={isFetchingNextPage} />}
    </ThemedView>

      {/* Slide-in panels */}
      <SlideInPanel isOpen={isFilterPanelOpen} onClose={handleCloseFilters}>
        <MyWarningFilterDrawerContent
          filters={filters}
          onFiltersChange={setFilters}
          onClear={handleClearFilters}
          activeFiltersCount={activeFiltersCount}
        />
      </SlideInPanel>

      <SlideInPanel isOpen={isColumnPanelOpen} onClose={handleCloseColumns}>
        <MyWarningColumnDrawerContent
          columns={allColumns}
          visibleColumns={visibleColumns}
          onVisibilityChange={handleColumnsChange}
        />
      </SlideInPanel>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchContainer: {
    flexDirection: "row",
    paddingHorizontal: 8,
    paddingVertical: 8,
    gap: 8,
    alignItems: "center",
  },
  searchBar: {
    flex: 1,
  },
  buttonContainer: {
    flexDirection: "row",
    gap: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  skeleton: {
    width: "100%",
    height: 200,
    borderRadius: 8,
    opacity: 0.3,
  },
});
