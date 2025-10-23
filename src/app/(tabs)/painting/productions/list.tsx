import React, { useState, useMemo } from "react";
import { View, FlatList, RefreshControl, ActivityIndicator, TouchableOpacity, StyleSheet } from "react-native";
import { Stack, router } from "expo-router";
import { SearchBar } from "@/components/ui/search-bar";
import { IconButton } from "@/components/ui/icon-button";
import { ThemedText } from "@/components/ui/themed-text";
import { useTheme } from "@/lib/theme";
import { useAuth } from "@/contexts/auth-context";
import { usePaintProductionsInfinite } from '../../../../hooks';
import { spacing, fontSize, fontWeight } from "@/constants/design-system";
import { SECTOR_PRIVILEGES } from '../../../../constants';
import { hasPrivilege } from '../../../../utils';
import type { PaintProduction } from '../../../../types';
import { FilterModal, FilterTag } from "@/components/ui/filter-modal";
import { useDebounce } from "@/hooks/use-debounce";
import { showToast } from "@/lib/toast/use-toast";
import {
  IconFlask,
  IconCalendar,
  IconUser,
  IconScale,
} from "@tabler/icons-react-native";

export default function ProductionsListScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();

  // Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState<"createdAt" | "producedAt" | "quantity">("producedAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Debounced search
  const debouncedSearch = useDebounce(searchQuery, 500);

  // Check user permissions
  const canView = hasPrivilege(user, SECTOR_PRIVILEGES.PRODUCTION);

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
        formula: true,
        producer: true,
      },
      orderBy: { [sortBy]: sortOrder },
    };

    // Search filter
    if (debouncedSearch) {
      params.searchingFor = debouncedSearch;
    }

    return params;
  }, [debouncedSearch, sortBy, sortOrder]);

  // Fetch productions
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    error,
    refetch,
    isRefetching,
  } = usePaintProductionsInfinite(queryParams);

  // Flatten pages data - TypeScript fix for infinite query data structure
  const productions = (data as any)?.pages?.flatMap((page: any) => page.data || []) || [];

  // Handle refresh
  const handleRefresh = async () => {
    await refetch();
    showToast("Produções atualizadas", "success");
  };

  // Format date
  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  // Format number with unit
  const formatQuantity = (quantity: number) => {
    return `${quantity.toFixed(2)} L`;
  };

  // Render production item (table row style)
  const renderProductionItem = ({ item: production }: { item: PaintProduction }) => (
    <TouchableOpacity
      onPress={() => router.push(`/painting/productions/details/${production.id}`)}
      style={[styles.listItem, { backgroundColor: colors.card }]}
    >
      <View style={styles.listItemContent}>
        {/* Production info */}
        <View style={styles.itemInfo}>
          <ThemedText style={styles.itemTitle} numberOfLines={1}>
            {production.paint?.name || "Tinta"}
            {production.paint?.code && ` (${production.paint.code})`}
          </ThemedText>

          <View style={styles.itemMetaRow}>
            {production.producedAt && (
              <ThemedText style={styles.itemMeta}>
                {formatDate(production.producedAt)}
              </ThemedText>
            )}
            {production.quantity && (
              <ThemedText style={styles.itemMeta}>
                {formatQuantity(Number(production.quantity))}
              </ThemedText>
            )}
            {production.producer && (
              <ThemedText style={styles.itemMeta} numberOfLines={1}>
                {production.producer.name}
              </ThemedText>
            )}
          </View>

          <ThemedText style={styles.itemSubtitle}>
            {production.paint?.paintBrand && production.paint.paintBrand.name}
            {production.paint?.paintType && ` • ${production.paint.paintType.name}`}
            {production.formula && ` • Fórmula: ${production.formula.description || "Sem descrição"}`}
          </ThemedText>
        </View>
      </View>
    </TouchableOpacity>
  );

  // Filter modal content
  const renderFilterModal = () => (
    <FilterModal
      visible={showFilters}
      onClose={() => setShowFilters(false)}
      title="Filtrar Produções"
    >
      <View style={styles.filterSection}>
        <ThemedText style={styles.filterLabel}>Ordenar por</ThemedText>
        <View style={styles.filterOptions}>
          <FilterTag
            label="Data de Produção"
            selected={sortBy === "producedAt"}
            onPress={() => setSortBy("producedAt")}
          />
          <FilterTag
            label="Quantidade"
            selected={sortBy === "quantity"}
            onPress={() => setSortBy("quantity")}
          />
          <FilterTag
            label="Data de Criação"
            selected={sortBy === "createdAt"}
            onPress={() => setSortBy("createdAt")}
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
    if (sortBy !== "producedAt") count++;
    if (sortOrder !== "desc") count++;
    return count;
  }, [sortBy, sortOrder]);

  if (!canView) {
    return (
      <View style={styles.centerContainer}>
        <ThemedText style={styles.errorText}>
          Você não tem permissão para visualizar produções
        </ThemedText>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <ThemedText style={styles.errorText}>Erro ao carregar produções</ThemedText>
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
    <>
      <Stack.Screen
        options={{
          title: "Produções de Tinta",
          headerBackTitle: "Voltar",
        }}
      />
      <View style={StyleSheet.flatten([styles.container, { backgroundColor: colors.background }])}>
        {/* Header */}
        <View style={StyleSheet.flatten([styles.header, { backgroundColor: colors.card }])}>
          <SearchBar
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Buscar produções..."
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
            <ThemedText style={styles.loadingText}>Carregando produções...</ThemedText>
          </View>
        ) : (
          <FlatList
            data={productions}
            renderItem={renderProductionItem}
            keyExtractor={(production) => production.id}
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
                <ThemedText style={styles.emptyText}>Nenhuma produção encontrada</ThemedText>
                <ThemedText style={styles.emptySubtext}>
                  Produções de tinta registram a fabricação de tintas
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
    </>
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
    gap: spacing.lg,
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
