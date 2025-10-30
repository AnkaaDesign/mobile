import React, { useState, useMemo } from "react";
import { View, FlatList, RefreshControl, ActivityIndicator, TouchableOpacity, StyleSheet } from "react-native";
import { Stack, router } from "expo-router";
import { SearchBar } from "@/components/ui/search-bar";
import { IconButton } from "@/components/ui/icon-button";
import { ThemedText } from "@/components/ui/themed-text";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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

  // Render production card
  const renderProductionCard = ({ item: production }: { item: PaintProduction }) => (
    <TouchableOpacity onPress={() => router.push(`/pintura/producoes/detalhes/${production.id}`)}>
      <Card style={styles.productionCard}>
        <View style={styles.cardContent}>
          {/* Header */}
          <View style={styles.productionHeader}>
            <View style={styles.iconContainer}>
              <IconFlask size={24} color={colors.primary} />
            </View>
            <View style={styles.productionInfo}>
              <ThemedText style={styles.productionTitle} numberOfLines={1}>
                {production.paint?.name || "Tinta"}
              </ThemedText>
              {production.paint?.code && (
                <ThemedText style={styles.productionCode}>
                  {production.paint.code}
                </ThemedText>
              )}
            </View>
          </View>

          {/* Details */}
          <View style={styles.detailsContainer}>
            {production.producedAt && (
              <View style={styles.detailRow}>
                <IconCalendar size={16} color={colors.muted} />
                <ThemedText style={styles.detailText}>
                  {formatDate(production.producedAt)}
                </ThemedText>
              </View>
            )}
            {production.quantity && (
              <View style={styles.detailRow}>
                <IconScale size={16} color={colors.muted} />
                <ThemedText style={styles.detailText}>
                  {formatQuantity(Number(production.quantity))}
                </ThemedText>
              </View>
            )}
            {production.producer && (
              <View style={styles.detailRow}>
                <IconUser size={16} color={colors.muted} />
                <ThemedText style={styles.detailText} numberOfLines={1}>
                  {production.producer.name}
                </ThemedText>
              </View>
            )}
          </View>

          {/* Badges */}
          <View style={styles.badges}>
            {production.paint?.paintBrand && (
              <Badge variant="outline" style={styles.brandBadge}>
                {production.paint.paintBrand.name}
              </Badge>
            )}
            {production.paint?.paintType && (
              <Badge variant="outline" style={styles.typeBadge}>
                {production.paint.paintType.name}
              </Badge>
            )}
            {production.formula && (
              <Badge variant="secondary" style={styles.formulaBadge}>
                Fórmula: {production.formula.description || "Sem descrição"}
              </Badge>
            )}
          </View>
        </View>
      </Card>
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
            renderItem={renderProductionCard}
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
                <IconFlask size={48} color={colors.muted} />
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
    padding: spacing.md,
    paddingBottom: 100,
  },
  productionCard: {
    marginBottom: spacing.md,
    padding: spacing.md,
  },
  cardContent: {
    gap: spacing.sm,
  },
  productionHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  iconContainer: {
    marginRight: spacing.sm,
  },
  productionInfo: {
    flex: 1,
  },
  productionTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    marginBottom: 4,
  },
  productionCode: {
    fontSize: fontSize.sm,
    opacity: 0.6,
  },
  detailsContainer: {
    gap: spacing.xs,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  detailText: {
    fontSize: fontSize.sm,
    opacity: 0.7,
    flex: 1,
  },
  badges: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
  },
  brandBadge: {
    alignSelf: "flex-start",
  },
  typeBadge: {
    alignSelf: "flex-start",
  },
  formulaBadge: {
    alignSelf: "flex-start",
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
