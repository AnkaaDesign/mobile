import React, { useState, useMemo } from "react";
import { View, FlatList, RefreshControl, ActivityIndicator, TouchableOpacity , StyleSheet} from "react-native";
import { Stack, router } from "expo-router";
import { FAB } from "@/components/ui/fab";
import { SearchBar } from "@/components/ui/search-bar";
import { IconButton } from "@/components/ui/icon-button";
import { ThemedText } from "@/components/ui/themed-text";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useTheme } from "@/lib/theme";
import { useAuth } from "@/contexts/auth-context";
import { usePaintGroundsInfinite, usePaintGroundMutations } from '../../../../hooks';
import { spacing, fontSize, fontWeight } from "@/constants/design-system";
import { SECTOR_PRIVILEGES } from '../../../../constants';
import { hasPrivilege } from '../../../../utils';
import type { PaintGround } from '../../../../types';
import { FilterModal, FilterTag } from "@/components/ui/filter-modal";
import { useDebounce } from "@/hooks/use-debounce";
import { showToast } from "@/lib/toast/use-toast";
import { Alert } from "react-native";
import {
  IconPalette,
  IconArrowRight,
  IconLayersIntersect2,
} from "@tabler/icons-react-native";

export default function PaintGroundListScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const { delete: deletePaintGround } = usePaintGroundMutations();

  // Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState<"createdAt" | "paint" | "groundPaint">("createdAt");
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
      include: {
        paint: {
          include: {
            paintType: true,
            paintBrand: true,
          },
        },
        groundPaint: {
          include: {
            paintType: true,
            paintBrand: true,
          },
        },
      },
      orderBy: { [sortBy]: sortOrder },
    };

    const whereConditions: any[] = [];

    // Search filter
    if (debouncedSearch) {
      whereConditions.push({
        OR: [
          {
            paint: {
              name: { contains: debouncedSearch, mode: "insensitive" },
            },
          },
          {
            paint: {
              code: { contains: debouncedSearch },
            },
          },
          {
            groundPaint: {
              name: { contains: debouncedSearch, mode: "insensitive" },
            },
          },
          {
            groundPaint: {
              code: { contains: debouncedSearch },
            },
          },
        ],
      });
    }

    if (whereConditions.length > 0) {
      params.where = whereConditions.length === 1 ? whereConditions[0] : { AND: whereConditions };
    }

    return params;
  }, [debouncedSearch, sortBy, sortOrder]);

  // Fetch paint grounds
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    error,
    refetch,
    isRefetching,
  } = usePaintGroundsInfinite(queryParams);

  // Flatten pages data - TypeScript fix for infinite query data structure
  const paintGrounds = (data as any)?.pages?.flatMap((page: any) => page.data || []) || [];

  // Handle refresh
  const handleRefresh = async () => {
    await refetch();
    showToast("Bases de tinta atualizadas", "success");
  };

  // Handle actions
  const handleEdit = (paintGroundId: string) => {
    if (!canEdit) {
      showToast("Você não tem permissão para editar", "error");
      return;
    }
    router.push(`/painting/paint-grounds/edit/${paintGroundId}`);
  };

  const handleDelete = (paintGroundId: string, paintName: string, groundPaintName: string) => {
    if (!canDelete) {
      showToast("Você não tem permissão para excluir", "error");
      return;
    }

    Alert.alert(
      "Excluir Base de Tinta",
      `Tem certeza que deseja excluir a relação "${paintName}" → "${groundPaintName}"? Esta ação não pode ser desfeita.`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Excluir",
          style: "destructive",
          onPress: async () => {
            try {
              await deletePaintGround(paintGroundId);
              showToast("Base de tinta excluída com sucesso", "success");
            } catch (error) {
              showToast("Erro ao excluir base de tinta", "error");
            }
          },
        },
      ]
    );
  };

  // Render paint ground card
  const renderPaintGroundCard = ({ item: paintGround }: { item: PaintGround }) => (
    <TouchableOpacity onPress={() => router.push(`/painting/paint-grounds/details/${paintGround.id}`)}>
      <Card style={styles.paintGroundCard}>
      <View style={styles.cardHeader}>
        <ThemedText style={styles.relationTitle}>Relação de Base</ThemedText>
      </View>

      {/* Paint to Ground Paint Relationship */}
      <View style={styles.relationshipContainer}>
        {/* Main Paint */}
        <View style={styles.paintContainer}>
          <View
            style={[
              styles.colorIndicator,
              { backgroundColor: paintGround.paint?.hex || colors.muted },
            ]}
          />
          <View style={styles.paintInfo}>
            <ThemedText style={styles.paintName} numberOfLines={1}>
              {paintGround.paint?.name || "Tinta"}
            </ThemedText>
            {paintGround.paint?.code && (
              <ThemedText style={styles.paintCode}>
                {paintGround.paint.code}
              </ThemedText>
            )}
            {paintGround.paint?.paintBrand && (
              <Badge variant="outline" style={styles.brandBadge}>
                {paintGround.paint.paintBrand.name}
              </Badge>
            )}
          </View>
        </View>

        {/* Arrow */}
        <View style={styles.arrowContainer}>
          <IconArrowRight size={20} color={colors.primary} />
          <ThemedText style={styles.arrowText}>precisa</ThemedText>
        </View>

        {/* Ground Paint */}
        <View style={styles.paintContainer}>
          <View
            style={[
              styles.colorIndicator,
              { backgroundColor: paintGround.groundPaint?.hex || colors.muted },
            ]}
          />
          <View style={styles.paintInfo}>
            <ThemedText style={styles.paintName} numberOfLines={1}>
              {paintGround.groundPaint?.name || "Base"}
            </ThemedText>
            {paintGround.groundPaint?.code && (
              <ThemedText style={styles.paintCode}>
                {paintGround.groundPaint.code}
              </ThemedText>
            )}
            {paintGround.groundPaint?.paintBrand && (
              <Badge variant="outline" style={styles.brandBadge}>
                {paintGround.groundPaint.paintBrand.name}
              </Badge>
            )}
          </View>
        </View>
      </View>

      {/* Actions */}
      {(canEdit || canDelete) && (
        <View style={StyleSheet.flatten([styles.cardActions, { borderTopColor: colors.border }])}>
          {canEdit && (
            <IconButton
              name="edit"
              size="sm"
              variant="default"
              onPress={() => handleEdit(paintGround.id)}
            />
          )}
          {canDelete && (
            <IconButton
              name="trash"
              size="sm"
              variant="default"
              onPress={() =>
                handleDelete(
                  paintGround.id,
                  paintGround.paint?.name || "Tinta",
                  paintGround.groundPaint?.name || "Base"
                )
              }
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
      title="Filtrar Bases de Tinta"
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
            label="Nome da Tinta"
            selected={sortBy === "paint"}
            onPress={() => setSortBy("paint")}
          />
          <FilterTag
            label="Nome da Base"
            selected={sortBy === "groundPaint"}
            onPress={() => setSortBy("groundPaint")}
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

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <ThemedText style={styles.errorText}>Erro ao carregar bases de tinta</ThemedText>
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
          title: "Bases de Tinta",
          headerBackTitle: "Voltar",
        }}
      />
      <View style={StyleSheet.flatten([styles.container, { backgroundColor: colors.background }])}>
        {/* Header */}
        <View style={StyleSheet.flatten([styles.header, { backgroundColor: colors.card }])}>
          <SearchBar
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Buscar bases de tinta..."
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
            <ThemedText style={styles.loadingText}>Carregando bases de tinta...</ThemedText>
          </View>
        ) : (
          <FlatList
            data={paintGrounds}
            renderItem={renderPaintGroundCard}
            keyExtractor={(paintGround) => paintGround.id}
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
                <IconLayersIntersect2 size={48} color={colors.muted} />
                <ThemedText style={styles.emptyText}>Nenhuma base de tinta encontrada</ThemedText>
                <ThemedText style={styles.emptySubtext}>
                  Bases de tinta são utilizadas para definir primers necessários
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
            onPress={() => router.push("/painting/paint-grounds/create")}
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
  paintGroundCard: {
    marginBottom: spacing.md,
    padding: spacing.md,
  },
  cardHeader: {
    marginBottom: spacing.md,
  },
  relationTitle: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    opacity: 0.7,
    textAlign: "center",
  },
  relationshipContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.sm,
  },
  paintContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  colorIndicator: {
    width: 32,
    height: 32,
    borderRadius: 6,
    marginRight: spacing.sm,
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  paintInfo: {
    flex: 1,
  },
  paintName: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    marginBottom: 2,
  },
  paintCode: {
    fontSize: fontSize.xs,
    opacity: 0.6,
    marginBottom: 4,
  },
  brandBadge: {
    alignSelf: "flex-start",
  },
  arrowContainer: {
    alignItems: "center",
    marginHorizontal: spacing.sm,
    paddingHorizontal: spacing.xs,
  },
  arrowText: {
    fontSize: fontSize.xs,
    opacity: 0.6,
    marginTop: 2,
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