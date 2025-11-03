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
import { usePaintFormulasInfinite } from '../../../../hooks';
import { spacing, fontSize, fontWeight } from "@/constants/design-system";
import { SECTOR_PRIVILEGES } from '../../../../constants';
import { hasPrivilege } from '../../../../utils';
import type { PaintFormula } from '../../../../types';

import { useDebounce } from "@/hooks/use-debounce";
import { showToast } from "@/lib/toast/use-toast";
import {
  IconFlask,
  IconDroplet,
  IconCurrencyReal,
} from "@tabler/icons-react-native";

import { UtilityDrawerWrapper } from "@/components/ui/utility-drawer";
import { useUtilityDrawer } from "@/contexts/utility-drawer-context";
import { GenericColumnDrawerContent } from "@/components/ui/generic-column-drawer-content";

export default function FormulasListScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();

  // Filter states
  const [searchQuery, setSearchQuery] = useState("");
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

  // Render formula card
  const renderFormulaCard = ({ item: formula }: { item: PaintFormula }) => {
    const componentCount = formula._count?.components || 0;
    const hasValidDensity = formula.density && Number(formula.density) > 0;
    const hasValidPrice = formula.pricePerLiter && Number(formula.pricePerLiter) > 0;

    return (
      <TouchableOpacity
        onPress={() => {
          if (formula.paintId) {
            router.push(`/pintura/catalogo/detalhes/${formula.paintId}`);
          }
        }}
      >
        <Card style={styles.formulaCard}>
          <View style={styles.cardContent}>
            <View style={styles.formulaHeader}>
              <IconFlask size={24} color={colors.primary} />
              <View style={styles.formulaInfo}>
                <ThemedText style={styles.formulaTitle} numberOfLines={1}>
                  {formula.paint?.name || "Tinta"}
                  {formula.description && ` - ${formula.description}`}
                </ThemedText>

                {formula.paint?.code && (
                  <ThemedText style={styles.formulaCode}>
                    {formula.paint.code}
                  </ThemedText>
                )}

                <View style={styles.metaInfo}>
                  {hasValidPrice && (
                    <View style={styles.metaItem}>
                      <IconCurrencyReal size={14} color={colors.muted} />
                      <ThemedText style={styles.metaText}>
                        {formatCurrency(Number(formula.pricePerLiter))}/L
                      </ThemedText>
                    </View>
                  )}
                  {hasValidDensity && (
                    <View style={styles.metaItem}>
                      <IconDroplet size={14} color={colors.muted} />
                      <ThemedText style={styles.metaText}>
                        {formatNumber(Number(formula.density), 2)} g/ml
                      </ThemedText>
                    </View>
                  )}
                </View>

                <View style={styles.badges}>
                  <Badge variant="secondary" style={styles.componentBadge}>
                    {componentCount} {componentCount === 1 ? "componente" : "componentes"}
                  </Badge>
                  {formula.paint?.paintBrand && (
                    <Badge variant="outline" style={styles.brandBadge}>
                      {formula.paint.paintBrand.name}
                    </Badge>
                  )}
                  {formula.paint?.paintType && (
                    <Badge variant="outline" style={styles.typeBadge}>
                      {formula.paint.paintType.name}
                    </Badge>
                  )}
                </View>
              </View>
            </View>
          </View>
        </Card>
      </TouchableOpacity>
    );
  };

  // Filters are now handled by the drawer - removed old FilterModal code


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

  const handleOpenFilters = () => {
    // TODO: Implement filter drawer for formulas
    showToast("Filtros em desenvolvimento", "info");
  };

  return (
    <UtilityDrawerWrapper>
      <Stack.Screen
        options={{
          title: "Fórmulas de Tinta",
          headerBackTitle: "Voltar",
        }}
      />
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
            onPress={handleOpenFilters}
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
            renderItem={renderFormulaCard}
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
                <IconFlask size={48} color={colors.muted} />
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
      </View>
    </UtilityDrawerWrapper>
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
  formulaCard: {
    marginBottom: spacing.md,
    padding: spacing.md,
  },
  cardContent: {
    gap: spacing.sm,
  },
  formulaHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  formulaInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  formulaTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    marginBottom: 4,
  },
  formulaCode: {
    fontSize: fontSize.sm,
    opacity: 0.6,
    marginBottom: 8,
  },
  metaInfo: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
    marginBottom: 8,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  metaText: {
    fontSize: fontSize.sm,
    opacity: 0.7,
  },
  badges: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
  },
  componentBadge: {
    alignSelf: "flex-start",
  },
  brandBadge: {
    alignSelf: "flex-start",
  },
  typeBadge: {
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
