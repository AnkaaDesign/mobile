import { useState, useMemo } from "react";
import { View, FlatList, RefreshControl, ActivityIndicator, TouchableOpacity, StyleSheet } from "react-native";
import { LinearGradient } from 'expo-linear-gradient';
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
import { spacing, fontSize, fontWeight } from "@/constants/design-system";
import { SECTOR_PRIVILEGES, PAINT_TYPE_ENUM, PAINT_TYPE_ENUM_LABELS, PAINT_FINISH_LABELS } from '../../../../constants';
import { hasPrivilege } from '../../../../utils';
import type { Paint } from '../../../../types';
import { FilterModal } from "@/components/ui/filter-modal";
import { Chip } from "@/components/ui/chip";
import { useDebounce } from "@/hooks/use-debounce";
import { useToast } from "@/lib/toast/use-toast";
import {
  IconPalette,
  IconBarcode,
  IconTag,
  IconBuildingFactory,
  IconDroplet,
  IconSparkles,
} from "@tabler/icons-react-native";

export default function CatalogListScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const { toast } = useToast();

  // Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTypes, setSelectedTypes] = useState<PAINT_TYPE_ENUM[]>([]);
  const [_selectedBrand, _setSelectedBrand] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState<"name" | "code" | "createdAt">("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  // Debounced search
  const debouncedSearch = useDebounce(searchQuery, 500);

  // Check user permissions
  const canCreate = hasPrivilege(user, SECTOR_PRIVILEGES.WAREHOUSE);

  // Build query params
  const queryParams = useMemo(() => {
    const params: any = {
      include: {
        paintType: true,
        paintBrand: true,
        formulas: true,
        _count: {
          select: {
            logoTasks: true,
            generalPaintings: true,
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
    if (_selectedBrand) {
      whereConditions.push({ brandId: _selectedBrand });
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
  }, [selectedTypes, _selectedBrand, debouncedSearch, sortBy, sortOrder]);

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

  // Render paint card
  const renderPaintCard = ({ item: paint }: { item: Paint }) => {
    const formulaCount = paint.formulas?.length || 0;
    const taskCount = (paint._count?.logoTasks || 0) + (paint._count?.generalPaintings || 0);

    return (
      <TouchableOpacity onPress={() => router.push(`/pintura/catalogo/detalhes/${paint.id}`)}>
        <Card style={styles.paintCard}>
          {/* Color Preview */}
          <View style={[styles.colorPreview, { backgroundColor: paint.hex || colors.muted }]}>
            {/* Gradient overlay for finish effect */}
            {paint.finish && (
              <LinearGradient
                colors={
                  paint.finish === 'METALLIC'
                    ? ['rgba(255,255,255,0.4)', 'rgba(255,255,255,0)', 'rgba(0,0,0,0.1)']
                    : paint.finish === 'MATTE'
                    ? ['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.05)']
                    : ['rgba(255,255,255,0.2)', 'rgba(255,255,255,0)', 'rgba(0,0,0,0.05)']
                }
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.finishGradient}
              />
            )}
            <View style={styles.hexOverlay}>
              <ThemedText style={styles.hexText}>{paint.hex}</ThemedText>
            </View>
          </View>

          {/* Card Content */}
          <View style={styles.cardContent}>
            {/* Paint Name */}
            <ThemedText style={styles.paintName} numberOfLines={2}>
              {paint.name}
            </ThemedText>

            {/* Badges */}
            <View style={styles.badgeContainer}>
              {paint.paintType?.name && (
                <Badge variant="secondary" style={styles.badge}>
                  <View style={styles.badgeContent}>
                    <IconDroplet size={12} color={colors.foreground} />
                    <ThemedText style={styles.badgeText}>{paint.paintType.name}</ThemedText>
                  </View>
                </Badge>
              )}

              {paint.finish && (
                <Badge variant="secondary" style={styles.badge}>
                  <View style={styles.badgeContent}>
                    <IconSparkles size={12} color={colors.foreground} />
                    <ThemedText style={styles.badgeText}>{PAINT_FINISH_LABELS[paint.finish] || paint.finish}</ThemedText>
                  </View>
                </Badge>
              )}

              {paint.paintBrand?.name && (
                <Badge variant="outline" style={styles.badge}>
                  <ThemedText style={styles.badgeText}>{paint.paintBrand.name}</ThemedText>
                </Badge>
              )}
            </View>

            {/* Tags */}
            {paint.tags && paint.tags.length > 0 && (
              <View style={styles.badgeContainer}>
                {paint.tags.slice(0, 3).map((tag, index) => (
                  <Badge key={index} variant="secondary" style={styles.badge}>
                    <View style={styles.badgeContent}>
                      <IconTag size={12} color={colors.foreground} />
                      <ThemedText style={styles.badgeText}>{tag}</ThemedText>
                    </View>
                  </Badge>
                ))}
                {paint.tags.length > 3 && (
                  <Badge variant="secondary" style={styles.badge}>
                    <ThemedText style={styles.badgeText}>+{paint.tags.length - 3}</ThemedText>
                  </Badge>
                )}
              </View>
            )}

            {/* Formula Count */}
            <View style={styles.infoRow}>
              <IconBarcode size={16} color={formulaCount > 0 ? "#16a34a" : "#dc2626"} />
              <ThemedText style={[styles.infoText, formulaCount > 0 ? styles.infoTextActive : styles.infoTextMuted]}>
                {formulaCount} fórmula{formulaCount !== 1 ? "s" : ""}
              </ThemedText>
            </View>

            {/* Task Count */}
            <View style={styles.infoRow}>
              <IconBuildingFactory size={16} color={taskCount > 0 ? "#2563eb" : colors.mutedForeground} />
              <ThemedText style={[styles.infoText, taskCount > 0 ? styles.infoTextActive : styles.infoTextMuted]}>
                {taskCount} tarefa{taskCount !== 1 ? "s" : ""}
              </ThemedText>
            </View>
          </View>
        </Card>
      </TouchableOpacity>
    );
  };

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
            onPress={() => router.push("/pintura/catalogo/cadastrar")}
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
    padding: 0,
    overflow: "hidden",
  },
  colorPreview: {
    height: 100,
    position: "relative",
  },
  finishGradient: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  hexOverlay: {
    position: "absolute",
    bottom: 8,
    right: 8,
    backgroundColor: "rgba(0,0,0,0.7)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  hexText: {
    fontSize: fontSize.xs,
    fontFamily: "monospace",
    color: "#FFFFFF",
  },
  cardContent: {
    padding: spacing.md,
    gap: spacing.sm,
  },
  paintName: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
  },
  badgeContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  badgeContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  badgeText: {
    fontSize: fontSize.xs,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  infoText: {
    fontSize: fontSize.sm,
  },
  infoTextActive: {
    opacity: 1,
  },
  infoTextMuted: {
    opacity: 0.6,
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
