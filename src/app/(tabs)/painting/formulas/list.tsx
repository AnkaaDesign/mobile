import React, { useState, useMemo } from "react";
import { View, FlatList, RefreshControl, ActivityIndicator, TouchableOpacity, StyleSheet } from "react-native";
import { Stack, router } from "expo-router";
import { SearchBar } from "@/components/ui/search-bar";
import { IconButton } from "@/components/ui/icon-button";
import { ThemedText } from "@/components/ui/themed-text";
import { useTheme } from "@/lib/theme";
import { useAuth } from "@/contexts/auth-context";
import { usePaintFormulasInfinite } from '../../../../hooks';
import { spacing, fontSize, fontWeight } from "@/constants/design-system";
import { SECTOR_PRIVILEGES } from '../../../../constants';
import { hasPrivilege } from '../../../../utils';
import type { PaintFormula } from '../../../../types';
import { FilterModal, FilterTag } from "@/components/ui/filter-modal";
import { useDebounce } from "@/hooks/use-debounce";
import { showToast } from "@/lib/toast/use-toast";
import {
  IconFlask,
  IconDroplet,
  IconCurrencyReal,
} from "@tabler/icons-react-native";

export default function FormulasListScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();

  // Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState<"createdAt" | "pricePerLiter" | "density">("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Debounced search
  const debouncedSearch = useDebounce(searchQuery, 500);

  // Check user permissions
  const canView = hasPrivilege(user, SECTOR_PRIVILEGES.BASIC);

  // Build query params
  const queryParams = useMemo(() => {
    const params: any = {
      include: {
        paint: {
          include: {
            paintType: true,
            paintBrand: true,
          },
        },
        _count: {
          select: {
            components: true,
          },
        },
      },
      orderBy: { [sortBy]: sortOrder },
    };

    // Search filter
    if (debouncedSearch) {
      params.searchingFor = debouncedSearch;
    }

    return params;
  }, [debouncedSearch, sortBy, sortOrder]);

  // Fetch formulas
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    error,
    refetch,
    isRefetching,
  } = usePaintFormulasInfinite(queryParams);

  // Flatten pages data - TypeScript fix for infinite query data structure
  const formulas = (data as any)?.pages?.flatMap((page: any) => page.data || []) || [];

  // Handle refresh
  const handleRefresh = async () => {
    await refetch();
    showToast("Fórmulas atualizadas", "success");
  };

  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  // Format number with decimals
  const formatNumber = (value: number, decimals: number = 2) => {
    return value.toFixed(decimals);
  };

  // Render formula item (table row style)
  const renderFormulaItem = ({ item: formula }: { item: PaintFormula }) => {
    const componentCount = formula._count?.components || 0;
    const hasValidDensity = formula.density && Number(formula.density) > 0;
    const hasValidPrice = formula.pricePerLiter && Number(formula.pricePerLiter) > 0;

    return (
      <TouchableOpacity
        onPress={() => router.push(`/painting/formulas/details/${formula.id}`)}
        style={[styles.listItem, { backgroundColor: colors.card }]}
      >
        <View style={styles.listItemContent}>
          {/* Formula info */}
          <View style={styles.itemInfo}>
            <ThemedText style={styles.itemTitle} numberOfLines={1}>
              {formula.paint?.name || "Tinta"}
              {formula.description && ` - ${formula.description}`}
            </ThemedText>

            <View style={styles.itemMetaRow}>
              {formula.paint?.code && (
                <ThemedText style={styles.itemSubtitle}>
                  {formula.paint.code}
                </ThemedText>
              )}
              {hasValidPrice && (
                <ThemedText style={styles.itemMeta}>
                  {formatCurrency(Number(formula.pricePerLiter))}/L
                </ThemedText>
              )}
              {hasValidDensity && (
                <ThemedText style={styles.itemMeta}>
                  {formatNumber(Number(formula.density), 2)} g/ml
                </ThemedText>
              )}
            </View>

            <ThemedText style={styles.itemSubtitle}>
              {componentCount} {componentCount === 1 ? "componente" : "componentes"}
              {formula.paint?.paintBrand && ` • ${formula.paint.paintBrand.name}`}
              {formula.paint?.paintType && ` • ${formula.paint.paintType.name}`}
            </ThemedText>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  // Filter modal content
  const renderFilterModal = () => (
    <FilterModal
      visible={showFilters}
      onClose={() => setShowFilters(false)}
      title="Filtrar Fórmulas"
    >
      <View style={styles.filterSection}>
        <ThemedText style={styles.filterLabel}>Ordenar por</ThemedText>
        <View style={styles.filterOptions}>
          <FilterTag
            label="Data de Criação"
            selected={sortBy === "createdAt"}
            onPress={() => setSortBy("createdAt")}
          />
          <FilterTag
            label="Preço por Litro"
            selected={sortBy === "pricePerLiter"}
            onPress={() => setSortBy("pricePerLiter")}
          />
          <FilterTag
            label="Densidade"
            selected={sortBy === "density"}
            onPress={() => setSortBy("density")}
          />
        </View>
      </View>

      <View style={styles.filterSection}>
        <ThemedText style={styles.filterLabel}>Ordem</ThemedText>
        <View style={styles.filterOptions}>
          <FilterTag
            label="Crescente"
            selected={sortOrder === "asc"}
            onPress={() => setSortOrder("asc")}
          />
          <FilterTag
            label="Decrescente"
            selected={sortOrder === "desc"}
            onPress={() => setSortOrder("desc")}
          />
        </View>
      </View>
    </FilterModal>
  );

  // Active filter count
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (sortBy !== "createdAt") count++;
    if (sortOrder !== "desc") count++;
    return count;
  }, [sortBy, sortOrder]);

  if (!canView) {
    return (
      <View style={styles.centerContainer}>
        <ThemedText style={styles.errorText}>
          Você não tem permissão para visualizar fórmulas
        </ThemedText>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <ThemedText style={styles.errorText}>Erro ao carregar fórmulas</ThemedText>
        <IconButton
          name="refresh-cw"
          variant="default"
          onPress={() => refetch()}
          style={styles.retryButton}
        />
      </View>
    );
  }

  return (
    <View style={StyleSheet.flatten([styles.container, { backgroundColor: colors.background }])}>
        {/* Header */}
        <View style={StyleSheet.flatten([styles.header, { backgroundColor: colors.card }])}>
          <SearchBar
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Buscar fórmulas..."
            style={styles.searchBar}
          />
          <IconButton
            name="filter"
            variant="default"
            onPress={() => setShowFilters(true)}
          />
        </View>

        {/* Content */}
        {isLoading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <ThemedText style={styles.loadingText}>Carregando fórmulas...</ThemedText>
          </View>
        ) : (
          <FlatList
            data={formulas}
            renderItem={renderFormulaItem}
            keyExtractor={(formula) => formula.id}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl
                refreshing={isRefetching}
                onRefresh={handleRefresh}
                tintColor={colors.primary}
              />
            }
            onEndReached={() => {
              if (hasNextPage && !isFetchingNextPage) {
                fetchNextPage();
              }
            }}
            onEndReachedThreshold={0.1}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <ThemedText style={styles.emptyText}>Nenhuma fórmula encontrada</ThemedText>
                <ThemedText style={styles.emptySubtext}>
                  Fórmulas são composições de tintas com componentes específicos
                </ThemedText>
              </View>
            }
            ListFooterComponent={
              isFetchingNextPage ? (
                <View style={styles.loadingMore}>
                  <ActivityIndicator size="small" color={colors.primary} />
                </View>
              ) : null
            }
          />
        )}

        {/* Filter modal */}
        {renderFilterModal()}
      </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  searchBar: {
    flex: 1,
    marginRight: spacing.sm,
  },
  listContent: {
    paddingBottom: 100,
  },
  listItem: {
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.1)",
  },
  listItemContent: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  itemInfo: {
    flex: 1,
  },
  itemTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
    marginBottom: 4,
  },
  itemMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    marginBottom: 2,
  },
  itemSubtitle: {
    fontSize: fontSize.sm,
    opacity: 0.6,
  },
  itemMeta: {
    fontSize: fontSize.sm,
    opacity: 0.7,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.xl,
  },
  errorText: {
    marginBottom: spacing.md,
    textAlign: "center",
  },
  retryButton: {
    marginTop: spacing.sm,
  },
  loadingText: {
    marginTop: spacing.md,
  },
  emptyContainer: {
    alignItems: "center",
    padding: spacing.xl,
    marginTop: spacing.xl,
  },
  emptyText: {
    marginTop: spacing.md,
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
    textAlign: "center",
  },
  emptySubtext: {
    marginTop: spacing.sm,
    fontSize: fontSize.sm,
    opacity: 0.6,
    textAlign: "center",
    lineHeight: 20,
  },
  loadingMore: {
    padding: spacing.md,
    alignItems: "center",
  },
  filterSection: {
    marginBottom: spacing.lg,
  },
  filterLabel: {
    fontWeight: "600",
    marginBottom: spacing.sm,
  },
  filterOptions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
});
