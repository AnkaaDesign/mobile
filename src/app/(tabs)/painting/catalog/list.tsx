import React, { useState, useMemo } from "react";
import { View, FlatList, RefreshControl, ActivityIndicator, TouchableOpacity , StyleSheet} from "react-native";
import { Stack, router } from "expo-router";
import { FloatingActionButton } from "@/components/ui/floating-action-button";
import { SearchBar } from "@/components/ui/search-bar";
import { IconButton } from "@/components/ui/icon-button";
import { ThemedText } from "@/components/ui/themed-text";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useTheme } from "@/lib/theme";
import { useAuth } from "@/contexts/auth-context";
import { usePaintsInfiniteMobile } from "@/hooks/use-paints-infinite-mobile";
import { usePaintMutations } from '../../../../hooks';
import { spacing, fontSize, fontWeight } from "@/constants/design-system";
import { SECTOR_PRIVILEGES, PAINT_TYPE_ENUM, PAINT_TYPE_ENUM_LABELS } from '../../../../constants';
import { hasPrivilege, formatCurrency } from '../../../../utils';
import type { Paint } from '../../../../types';
import { FilterModal } from "@/components/ui/filter-modal";
import { Chip } from "@/components/ui/chip";
import { useDebounce } from "@/hooks/use-debounce";
import { useToast } from "@/lib/toast/use-toast";
import { Alert } from "react-native";
import {
  IconPalette,
  IconBarcode,
  IconTag,
  IconBuildingFactory,
  IconDroplet,
} from "@tabler/icons-react-native";

export default function CatalogListScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const { delete: deletePaint } = usePaintMutations();
  const { toast } = useToast();

  // Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTypes, setSelectedTypes] = useState<PAINT_TYPE_ENUM[]>([]);
  const [selectedBrand, setSelectedBrand] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState<"name" | "code" | "createdAt">("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  // Debounced search
  const debouncedSearch = useDebounce(searchQuery, 500);

  // Check user permissions
  const canCreate = hasPrivilege(user, SECTOR_PRIVILEGES.WAREHOUSE);
  const canEdit = hasPrivilege(user, SECTOR_PRIVILEGES.WAREHOUSE);
  const canDelete = hasPrivilege(user, SECTOR_PRIVILEGES.ADMIN);

  // Build query params
  const queryParams = useMemo(() => {
    const params: any = {
      include: {
        brand: true,
        _count: {
          select: {
            formulas: true,
            productions: true,
          },
        },
      },
      orderBy: { [sortBy]: sortOrder },
    };

    const whereConditions: any[] = [];

    // Type filter
    if (selectedTypes.length > 0) {
      whereConditions.push({ type: { in: selectedTypes } });
    }

    // Brand filter
    if (selectedBrand) {
      whereConditions.push({ brandId: selectedBrand });
    }

    // Search filter
    if (debouncedSearch) {
      whereConditions.push({
        OR: [
          { name: { contains: debouncedSearch, mode: "insensitive" } },
          { code: { contains: debouncedSearch } },
          { description: { contains: debouncedSearch, mode: "insensitive" } },
        ],
      });
    }

    if (whereConditions.length > 0) {
      params.where = whereConditions.length === 1 ? whereConditions[0] : { AND: whereConditions };
    }

    return params;
  }, [selectedTypes, selectedBrand, debouncedSearch, sortBy, sortOrder]);

  // Fetch paints
  const {
    items: paints,
    isLoading,
    error,
    refetch,
    refresh,
    loadMore,
    canLoadMore,
    isFetchingNextPage,
  } = usePaintsInfiniteMobile({ ...queryParams, enabled: true });

  // Handle refresh
  const handleRefresh = async () => {
    await refresh();
    toast({ title: "Catálogo atualizado", variant: "success" });
  };

  // Handle actions
  const handleEdit = (paintId: string) => {
    if (!canEdit) {
      toast({ title: "Você não tem permissão para editar", variant: "destructive" });
      return;
    }
    router.push(`/painting/catalog/edit/${paintId}`);
  };

  const handleDelete = (paintId: string, paintName: string) => {
    if (!canDelete) {
      toast({ title: "Você não tem permissão para excluir", variant: "destructive" });
      return;
    }

    Alert.alert(
      "Excluir Tinta",
      `Tem certeza que deseja excluir "${paintName}"? Esta ação não pode ser desfeita.`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Excluir",
          style: "destructive",
          onPress: async () => {
            try {
              await deletePaint(paintId);
              toast({ title: "Tinta excluída com sucesso", variant: "success" });
            } catch (error) {
              toast({ title: "Erro ao excluir tinta", variant: "destructive" });
            }
          },
        },
      ]
    );
  };

  // Render paint card
  const renderPaintCard = ({ item: paint }: { item: Paint }) => (
    <TouchableOpacity onPress={() => router.push(`/painting/catalog/details/${paint.id}`)}>
      <Card style={styles.paintCard}>
      <View style={styles.cardHeader}>
        <View style={styles.cardTitleContainer}>
          <View
            style={[
              styles.colorIndicator,
              { backgroundColor: paint.hex || colors.muted },
            ]}
          />
          <View style={styles.titleInfo}>
            <ThemedText style={styles.paintName} numberOfLines={1}>
              {paint.name}
            </ThemedText>
            <View style={styles.codeContainer}>
              <IconBarcode size={14} color={colors.foreground} />
              <ThemedText style={styles.paintCode}>{paint.code || "Sem código"}</ThemedText>
            </View>
          </View>
        </View>
        <Badge variant="default" style={styles.typeBadge}>
          {paint.paintType?.name || "Tipo não informado"}
        </Badge>
      </View>

      {paint.paintType?.name && (
        <ThemedText style={styles.description} numberOfLines={2}>
          Tipo: {paint.paintType.name}
        </ThemedText>
      )}

      <View style={styles.cardInfo}>
        {paint.paintBrand && (
          <View style={styles.infoItem}>
            <IconBuildingFactory size={14} color={colors.foreground} />
            <ThemedText style={styles.infoText}>{paint.paintBrand.name}</ThemedText>
          </View>
        )}

        {paint.code && (
          <View style={styles.infoItem}>
            <IconDroplet size={14} color={colors.foreground} />
            <ThemedText style={styles.infoText}>{paint.code}</ThemedText>
          </View>
        )}

        {paint.hex && (
          <View style={styles.infoItem}>
            <IconTag size={14} color={colors.foreground} />
            <ThemedText style={styles.infoText}>{paint.hex}</ThemedText>
          </View>
        )}
      </View>

      <View style={styles.cardStats}>
        <View style={styles.statItem}>
          <ThemedText style={styles.statValue}>{paint.formulas?.length || 0}</ThemedText>
          <ThemedText style={styles.statLabel}>Fórmulas</ThemedText>
        </View>
        <View style={StyleSheet.flatten([styles.statDivider, { backgroundColor: colors.border }])} />
        <View style={styles.statItem}>
          <ThemedText style={styles.statValue}>0</ThemedText>
          <ThemedText style={styles.statLabel}>Produções</ThemedText>
        </View>
      </View>

      {(canEdit || canDelete) && (
        <View style={StyleSheet.flatten([styles.cardActions, { borderTopColor: colors.border }])}>
          {canEdit && (
            <IconButton
              name="edit"
              size="sm"
              variant="default"
              onPress={() => handleEdit(paint.id)}
            />
          )}
          {canDelete && (
            <IconButton
              name="trash"
              size="sm"
              variant="default"
              onPress={() => handleDelete(paint.id, paint.name)}
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
      title="Filtrar Tintas"
    >
      <View style={styles.filterSection}>
        <ThemedText style={styles.filterLabel}>Tipo de Tinta</ThemedText>
        <View style={styles.filterOptions}>
          {Object.values(PAINT_TYPE_ENUM).map((type) => (
            <Chip
              key={type}
              label={PAINT_TYPE_ENUM_LABELS[type as keyof typeof PAINT_TYPE_ENUM_LABELS]}
              onRemove={() => {
                if (selectedTypes.includes(type)) {
                  setSelectedTypes(selectedTypes.filter((t) => t !== type));
                } else {
                  setSelectedTypes([...selectedTypes, type]);
                }
              }}
              variant={selectedTypes.includes(type) ? "primary" : "default"}
              removable={selectedTypes.includes(type)}
              style={{ marginBottom: 8, marginRight: 8 }}
            />
          ))}
        </View>
      </View>

      <View style={styles.filterSection}>
        <ThemedText style={styles.filterLabel}>Ordenar por</ThemedText>
        <View style={styles.filterOptions}>
          <Chip
            label="Nome"
            variant={sortBy === "name" ? "primary" : "default"}
            removable={false}
            onRemove={() => setSortBy("name")}
          />
          <Chip
            label="Código"
            variant={sortBy === "code" ? "primary" : "default"}
            removable={false}
            onRemove={() => setSortBy("code")}
          />
          <Chip
            label="Data de Criação"
            variant={sortBy === "createdAt" ? "primary" : "default"}
            removable={false}
            onRemove={() => setSortBy("createdAt")}
          />
        </View>
      </View>

      <View style={styles.filterSection}>
        <ThemedText style={styles.filterLabel}>Ordem</ThemedText>
        <View style={styles.filterOptions}>
          <Chip
            label="Crescente"
            variant={sortOrder === "asc" ? "primary" : "default"}
            removable={false}
            onRemove={() => setSortOrder("asc")}
          />
          <Chip
            label="Decrescente"
            variant={sortOrder === "desc" ? "primary" : "default"}
            removable={false}
            onRemove={() => setSortOrder("desc")}
          />
        </View>
      </View>
    </FilterModal>
  );

  // Active filter count
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (selectedTypes.length > 0) count++;
    if (selectedBrand) count++;
    if (sortBy !== "name") count++;
    if (sortOrder !== "asc") count++;
    return count;
  }, [selectedTypes, selectedBrand, sortBy, sortOrder]);

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <ThemedText style={styles.errorText}>Erro ao carregar catálogo</ThemedText>
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
          title: "Catálogo de Tintas",
          headerBackTitle: "Voltar",
        }}
      />
      <View style={StyleSheet.flatten([styles.container, { backgroundColor: colors.background }])}>
        {/* Header */}
        <View style={StyleSheet.flatten([styles.header, { backgroundColor: colors.card }])}>
          <SearchBar
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Buscar tintas..."
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
            <ThemedText style={styles.loadingText}>Carregando catálogo...</ThemedText>
          </View>
        ) : (
          <FlatList
            data={paints}
            renderItem={renderPaintCard}
            keyExtractor={(paint) => paint.id}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl
                refreshing={isLoading}
                onRefresh={handleRefresh}
                tintColor={colors.primary}
              />
            }
            onEndReached={() => {
              if (canLoadMore && !isFetchingNextPage) {
                loadMore();
              }
            }}
            onEndReachedThreshold={0.1}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <IconPalette size={48} color={colors.muted} />
                <ThemedText style={styles.emptyText}>Nenhuma tinta encontrada</ThemedText>
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
          <FloatingActionButton
            icon="plus"
            onPress={() => router.push("/painting/catalog/create")}
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
  paintCard: {
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
  colorIndicator: {
    width: 40,
    height: 40,
    borderRadius: 8,
    marginRight: spacing.sm,
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  titleInfo: {
    flex: 1,
  },
  paintName: {
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
  paintCode: {
    fontSize: fontSize.sm,
    opacity: 0.7,
  },
  typeBadge: {
    marginLeft: spacing.sm,
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
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  infoIcon: {
    opacity: 0.6,
    marginRight: 4,
  },
  infoText: {
    fontSize: fontSize.sm,
  },
  cardStats: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    paddingVertical: spacing.sm,
    marginTop: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  statItem: {
    alignItems: "center",
  },
  statValue: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
  },
  statLabel: {
    fontSize: fontSize.xs,
    opacity: 0.6,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 30,
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
