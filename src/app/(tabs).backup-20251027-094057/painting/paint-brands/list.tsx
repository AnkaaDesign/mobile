import React, { useState, useMemo } from "react";
import { View, FlatList, RefreshControl, ActivityIndicator, TouchableOpacity, StyleSheet } from "react-native";
import { Stack, router } from "expo-router";
import { FAB } from "@/components/ui/fab";
import { SearchBar } from "@/components/ui/search-bar";
import { IconButton } from "@/components/ui/icon-button";
import { ThemedText } from "@/components/ui/themed-text";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useTheme } from "@/lib/theme";
import { useAuth } from "@/contexts/auth-context";
import { usePaintBrandsInfinite, usePaintBrandMutations } from '../../../../hooks';
import { spacing, fontSize, fontWeight } from "@/constants/design-system";
import { SECTOR_PRIVILEGES } from '../../../../constants';
import { hasPrivilege } from '../../../../utils';
import type { PaintBrand } from '../../../../types';
import { FilterModal, FilterTag } from "@/components/ui/filter-modal";
import { useDebounce } from "@/hooks/use-debounce";
import { showToast } from "@/lib/toast/use-toast";
import { Alert } from "react-native";
import {
  IconTag,
  IconPalette,
} from "@tabler/icons-react-native";

export default function PaintBrandListScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const { delete: deletePaintBrand } = usePaintBrandMutations();

  // Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState<"name" | "createdAt">("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  // Debounced search
  const debouncedSearch = useDebounce(searchQuery, 500);

  // Check user permissions
  const canCreate = hasPrivilege(user, SECTOR_PRIVILEGES.BASIC);
  const canEdit = hasPrivilege(user, SECTOR_PRIVILEGES.BASIC);
  const canDelete = hasPrivilege(user, SECTOR_PRIVILEGES.ADMIN);

  // Build query params
  const queryParams = useMemo(() => {
    const params: any = {
      include: {
        _count: {
          select: {
            paints: true,
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

  // Fetch paint brands
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    error,
    refetch,
    isRefetching,
  } = usePaintBrandsInfinite(queryParams);

  // Flatten pages data - TypeScript fix for infinite query data structure
  const paintBrands = (data as any)?.pages?.flatMap((page: any) => page.data || []) || [];

  // Handle refresh
  const handleRefresh = async () => {
    await refetch();
    showToast("Marcas de tinta atualizadas", "success");
  };

  // Handle actions
  const handleEdit = (paintBrandId: string) => {
    if (!canEdit) {
      showToast("Você não tem permissão para editar", "error");
      return;
    }
    router.push(`/painting/paint-brands/edit/${paintBrandId}`);
  };

  const handleDelete = (paintBrandId: string, brandName: string) => {
    if (!canDelete) {
      showToast("Você não tem permissão para excluir", "error");
      return;
    }

    Alert.alert(
      "Excluir Marca de Tinta",
      `Tem certeza que deseja excluir a marca "${brandName}"? Esta ação não pode ser desfeita.`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Excluir",
          style: "destructive",
          onPress: async () => {
            try {
              await deletePaintBrand(paintBrandId);
              showToast("Marca de tinta excluída com sucesso", "success");
            } catch (error) {
              showToast("Erro ao excluir marca de tinta", "error");
            }
          },
        },
      ]
    );
  };

  // Render paint brand card
  const renderPaintBrandCard = ({ item: paintBrand }: { item: PaintBrand }) => (
    <TouchableOpacity onPress={() => router.push(`/painting/paint-brands/details/${paintBrand.id}`)}>
      <Card style={styles.paintBrandCard}>
        <View style={styles.cardContent}>
          <View style={styles.iconContainer}>
            <IconTag size={24} color={colors.primary} />
          </View>

          <View style={styles.brandInfo}>
            <ThemedText style={styles.brandName} numberOfLines={1}>
              {paintBrand.name}
            </ThemedText>
            {paintBrand._count?.paints !== undefined && (
              <ThemedText style={styles.paintCount}>
                {paintBrand._count.paints} {paintBrand._count.paints === 1 ? "tinta" : "tintas"}
              </ThemedText>
            )}
          </View>

          {/* Actions */}
          {(canEdit || canDelete) && (
            <View style={styles.cardActions}>
              {canEdit && (
                <IconButton
                  name="edit"
                  size="sm"
                  variant="ghost"
                  onPress={() => handleEdit(paintBrand.id)}
                />
              )}
              {canDelete && (
                <IconButton
                  name="trash"
                  size="sm"
                  variant="ghost"
                  onPress={() => handleDelete(paintBrand.id, paintBrand.name)}
                />
              )}
            </View>
          )}
        </View>
      </Card>
    </TouchableOpacity>
  );

  // Filter modal content
  const renderFilterModal = () => (
    <FilterModal
      visible={showFilters}
      onClose={() => setShowFilters(false)}
      title="Filtrar Marcas de Tinta"
    >
      <View style={styles.filterSection}>
        <ThemedText style={styles.filterLabel}>Ordenar por</ThemedText>
        <View style={styles.filterOptions}>
          <FilterTag
            label="Nome"
            selected={sortBy === "name"}
            onPress={() => setSortBy("name")}
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
    if (sortBy !== "name") count++;
    if (sortOrder !== "asc") count++;
    return count;
  }, [sortBy, sortOrder]);

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <ThemedText style={styles.errorText}>Erro ao carregar marcas de tinta</ThemedText>
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
          title: "Marcas de Tinta",
          headerBackTitle: "Voltar",
        }}
      />
      <View style={StyleSheet.flatten([styles.container, { backgroundColor: colors.background }])}>
        {/* Header */}
        <View style={StyleSheet.flatten([styles.header, { backgroundColor: colors.card }])}>
          <SearchBar
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Buscar marcas de tinta..."
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
            <ThemedText style={styles.loadingText}>Carregando marcas de tinta...</ThemedText>
          </View>
        ) : (
          <FlatList
            data={paintBrands}
            renderItem={renderPaintBrandCard}
            keyExtractor={(paintBrand) => paintBrand.id}
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
                <IconTag size={48} color={colors.muted} />
                <ThemedText style={styles.emptyText}>Nenhuma marca de tinta encontrada</ThemedText>
                <ThemedText style={styles.emptySubtext}>
                  Marcas de tinta são utilizadas para categorizar tintas
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
            onPress={() => router.push("/painting/paint-brands/create")}
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
  paintBrandCard: {
    marginBottom: spacing.md,
    padding: spacing.md,
  },
  cardContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconContainer: {
    marginRight: spacing.md,
  },
  brandInfo: {
    flex: 1,
  },
  brandName: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    marginBottom: 4,
  },
  paintCount: {
    fontSize: fontSize.sm,
    opacity: 0.6,
  },
  cardActions: {
    flexDirection: "row",
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
  fab: {
    position: "absolute",
    right: spacing.md,
    bottom: spacing.xl,
  },
});
