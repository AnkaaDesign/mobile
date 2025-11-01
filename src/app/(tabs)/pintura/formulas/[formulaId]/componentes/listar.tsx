import { useState, useMemo } from "react";
import { View, FlatList, RefreshControl, ActivityIndicator, TouchableOpacity , StyleSheet} from "react-native";
import { Stack, router, useLocalSearchParams } from "expo-router";
import { FAB } from "@/components/ui/fab";
import { SearchBar } from "@/components/ui/search-bar";
import { IconButton } from "@/components/ui/icon-button";
import { ThemedText } from "@/components/ui/themed-text";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useTheme } from "@/lib/theme";
import { useAuth } from "@/contexts/auth-context";
import { usePaintFormulaComponentsInfinite, usePaintFormulaComponentMutations } from '../../../../../../hooks';
import { spacing, fontSize, fontWeight } from "@/constants/design-system";
import { SECTOR_PRIVILEGES } from '../../../../../../constants';
import { hasPrivilege } from '../../../../../../utils';
import type { PaintFormulaComponent } from '../../../../../../types';
import { FilterModal, FilterTag } from "@/components/ui/filter-modal";
import { useDebounce } from "@/hooks/use-debounce";
import { showToast } from "@/lib/toast/use-toast";
import { Alert } from "react-native";
import {
  IconFlask,
  IconBarcode,
  IconPercentage,
} from "@tabler/icons-react-native";

export default function ComponentListScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const { formulaId } = useLocalSearchParams<{ formulaId: string }>();
  const { delete: deleteComponent } = usePaintFormulaComponentMutations();

  // Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState<"ratio" | "createdAt">("ratio");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Debounced search
  const debouncedSearch = useDebounce(searchQuery, 500);

  // Check user permissions
  const canCreate = hasPrivilege(user, SECTOR_PRIVILEGES.WAREHOUSE);
  const canEdit = hasPrivilege(user, SECTOR_PRIVILEGES.WAREHOUSE);
  const canDelete = hasPrivilege(user, SECTOR_PRIVILEGES.ADMIN);

  // Build query params
  const queryParams = useMemo(() => {
    const params: any = {
      where: {
        formulaPaintId: formulaId,
      },
      include: {
        item: {
          include: {
            brand: true,
            category: true,
          }
        }
      },
      orderBy: { [sortBy]: sortOrder },
    };

    const whereConditions: any[] = [
      { formulaPaintId: formulaId }
    ];

    // Search filter
    if (debouncedSearch) {
      whereConditions.push({
        item: {
          OR: [
            { name: { contains: debouncedSearch, mode: "insensitive" } },
            { code: { contains: debouncedSearch } },
            { description: { contains: debouncedSearch, mode: "insensitive" } },
          ]
        }
      });
    }

    if (whereConditions.length > 1) {
      params.where = { AND: whereConditions };
    }

    return params;
  }, [formulaId, debouncedSearch, sortBy, sortOrder]);

  // Fetch components
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    error,
    refetch,
    isRefetching,
  } = usePaintFormulaComponentsInfinite(queryParams);

  // Flatten pages data - TypeScript fix for infinite query data structure
  const components = (data as any)?.pages?.flatMap((page: any) => page.data || []) || [];

  // Handle refresh
  const handleRefresh = async () => {
    await refetch();
    showToast("Componentes atualizados", "success");
  };

  // Handle actions
  const handleEdit = (componentId: string) => {
    if (!canEdit) {
      showToast("Você não tem permissão para editar", "error");
      return;
    }
    router.push(`/pintura/formulas/${formulaId}/componentes/editar/${componentId}`);
  };

  const handleDelete = (componentId: string, itemName: string) => {
    if (!canDelete) {
      showToast("Você não tem permissão para excluir", "error");
      return;
    }

    Alert.alert(
      "Remover Componente",
      `Tem certeza que deseja remover "${itemName}" da fórmula? Esta ação não pode ser desfeita.`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Remover",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteComponent(componentId);
              showToast("Componente removido com sucesso", "success");
            } catch (error) {
              showToast("Erro ao remover componente", "error");
            }
          },
        },
      ]
    );
  };

  // Render component card
  const renderComponentCard = ({ item: component }: { item: PaintFormulaComponent }) => (
    <TouchableOpacity onPress={() => router.push(`/pintura/formulas/${formulaId}/componentes/detalhes/${component.id}`)}>
      <Card style={styles.componentCard}>
      <View style={styles.cardHeader}>
        <View style={styles.cardTitleContainer}>
          <View style={styles.titleInfo}>
            <ThemedText style={styles.itemName} numberOfLines={1}>
              {component.item?.name || 'Item não encontrado'}
            </ThemedText>
            {component.item?.uniCode && (
              <View style={styles.codeContainer}>
                <IconBarcode size={14} color={colors.foreground} />
                <ThemedText style={styles.itemCode}>{component.item.uniCode}</ThemedText>
              </View>
            )}
          </View>
        </View>
        <View style={styles.ratioContainer}>
          <View style={styles.ratioContent}>
            <IconPercentage size={16} color={colors.primary} />
            <ThemedText style={styles.ratioValue}>{component.ratio.toFixed(2)}%</ThemedText>
          </View>
        </View>
      </View>

      {component.item?.category?.description && (
        <ThemedText style={styles.description} numberOfLines={2}>
          {component.item.category.description}
        </ThemedText>
      )}

      <View style={styles.cardInfo}>
        {component.item?.brand && (
          <Badge variant="outline" style={styles.brandBadge}>
            {component.item.brand.name}
          </Badge>
        )}

        {component.item?.category && (
          <Badge variant="outline" style={styles.categoryBadge}>
            {component.item.category.name}
          </Badge>
        )}
      </View>

      {(canEdit || canDelete) && (
        <View style={StyleSheet.flatten([styles.cardActions, { borderTopColor: colors.border }])}>
          {canEdit && (
            <IconButton
              name="edit"
              size="sm"
              variant="default"
              onPress={() => handleEdit(component.id)}
            />
          )}
          {canDelete && (
            <IconButton
              name="trash"
              size="sm"
              variant="default"
              onPress={() => handleDelete(component.id, component.item?.name || 'Item')}
            />
          )}
        </View>
      )}
      </Card>
    </TouchableOpacity>
  );

  // Filter modal content
  const renderFilterModal = () => (
    <FilterModal
      visible={showFilters}
      onClose={() => setShowFilters(false)}
      title="Filtrar Componentes"
    >
      <View style={styles.filterSection}>
        <ThemedText style={styles.filterLabel}>Ordenar por</ThemedText>
        <View style={styles.filterOptions}>
          <FilterTag
            label="Proporção"
            selected={sortBy === "ratio"}
            onPress={() => setSortBy("ratio")}
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


  if (error) {
    return (
      <View style={styles.centerContainer}>
        <ThemedText style={styles.errorText}>Erro ao carregar componentes</ThemedText>
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
          title: "Componentes da Fórmula",
          headerBackTitle: "Voltar",
        }}
      />
      <View style={StyleSheet.flatten([styles.container, { backgroundColor: colors.background }])}>
        {/* Header */}
        <View style={StyleSheet.flatten([styles.header, { backgroundColor: colors.card }])}>
          <SearchBar
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Buscar componentes..."
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
            <ThemedText style={styles.loadingText}>Carregando componentes...</ThemedText>
          </View>
        ) : (
          <FlatList
            data={components}
            renderItem={renderComponentCard}
            keyExtractor={(component) => component.id}
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
                <ThemedText style={styles.emptyText}>Nenhum componente encontrado</ThemedText>
                <ThemedText style={styles.emptySubText}>
                  Adicione componentes para criar esta fórmula
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

        {/* FAB */}
        {canCreate && (
          <FAB
            icon="plus"
            onPress={() => router.push(`/pintura/formulas/${formulaId}/componentes/cadastrar`)}
            style={styles.fab}
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
  componentCard: {
    marginBottom: spacing.md,
    padding: spacing.md,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: spacing.sm,
  },
  cardTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  titleInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
  },
  codeContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 2,
  },
  codeIcon: {
    opacity: 0.6,
    marginRight: 4,
  },
  itemCode: {
    fontSize: fontSize.sm,
    opacity: 0.7,
  },
  ratioContainer: {
    marginLeft: spacing.sm,
  },
  ratioContent: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0, 122, 255, 0.1)",
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 8,
  },
  ratioIcon: {
    marginRight: 4,
  },
  ratioValue: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: "#007AFF",
  },
  description: {
    fontSize: fontSize.sm,
    opacity: 0.7,
    marginBottom: spacing.sm,
    lineHeight: 18,
  },
  cardInfo: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  brandBadge: {
    backgroundColor: "rgba(255, 149, 0, 0.1)",
  },
  categoryBadge: {
    backgroundColor: "rgba(52, 199, 89, 0.1)",
  },
  cardActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    paddingTop: spacing.sm,
    marginTop: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: spacing.xs,
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
    opacity: 0.6,
  },
  emptySubText: {
    marginTop: spacing.xs,
    fontSize: fontSize.sm,
    opacity: 0.4,
    textAlign: "center",
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
  fab: {
    position: "absolute",
    right: spacing.md,
    bottom: spacing.xl,
  },
});