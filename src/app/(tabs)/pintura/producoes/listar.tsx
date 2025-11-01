import { useState, useMemo } from "react";
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
  // Fixed: PaintProduction doesn't have paint or producer relations directly
  // The correct structure is: formula.paint (not paint directly)
  const queryParams = useMemo(() => {
    const params: any = {
      include: {
        formula: {
          include: {
            paint: {
              include: {
                paintType: true,
                paintBrand: true,
              },
            },
          },
        },
      },
      // Fixed: sortBy should use valid fields (volumeLiters or createdAt, not producedAt or quantity)
      orderBy: { [sortBy === 'producedAt' || sortBy === 'quantity' ? 'createdAt' : sortBy]: sortOrder },
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


  // Render production card
  // FIXME: PaintProduction schema changed - properties like paint, producedAt, quantity, producer don't exist
  // The correct structure is: production.formula.paint (not production.paint)
  // PaintProduction only has: volumeLiters, formulaId, formula, id, createdAt, updatedAt
  // This entire component needs to be refactored to match the web version
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
                {/* Fixed: Access paint via formula.paint instead of paint directly */}
                {(production as any).formula?.paint?.name || "Tinta"}
              </ThemedText>
              {(production as any).formula?.paint?.code && (
                <ThemedText style={styles.productionCode}>
                  {(production as any).formula.paint.code}
                </ThemedText>
              )}
            </View>
          </View>

          {/* Details */}
          <View style={styles.detailsContainer}>
            {/* Fixed: producedAt doesn't exist, use createdAt instead */}
            {production.createdAt && (
              <View style={styles.detailRow}>
                <IconCalendar size={16} color={colors.muted} />
                <ThemedText style={styles.detailText}>
                  {formatDate(production.createdAt)}
                </ThemedText>
              </View>
            )}
            {/* Fixed: quantity doesn't exist, use volumeLiters instead */}
            {production.volumeLiters && (
              <View style={styles.detailRow}>
                <IconScale size={16} color={colors.muted} />
                <ThemedText style={styles.detailText}>
                  {production.volumeLiters.toFixed(2)} L
                </ThemedText>
              </View>
            )}
            {/* producer property doesn't exist and has no equivalent - removing for now */}
          </View>

          {/* Badges */}
          <View style={styles.badges}>
            {/* Fixed: Access paintBrand via formula.paint.paintBrand */}
            {(production as any).formula?.paint?.paintBrand && (
              <Badge variant="outline" style={styles.brandBadge}>
                {(production as any).formula.paint.paintBrand.name}
              </Badge>
            )}
            {/* Fixed: Access paintType via formula.paint.paintType */}
            {(production as any).formula?.paint?.paintType && (
              <Badge variant="outline" style={styles.typeBadge}>
                {(production as any).formula.paint.paintType.name}
              </Badge>
            )}
            {(production as any).formula && (
              <Badge variant="secondary" style={styles.formulaBadge}>
                Fórmula: {(production as any).formula.description || "Sem descrição"}
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
