import { useState, useMemo } from "react";
import { View, FlatList, RefreshControl, ActivityIndicator, TouchableOpacity, StyleSheet, TextInput, ScrollView } from "react-native";
import { Stack, router } from "expo-router";
import { ThemedText } from "@/components/ui/themed-text";
import { Card } from "@/components/ui/card";
import { useTheme } from "@/lib/theme";
import { usePaintsInfiniteMobile } from "@/hooks/use-paints-infinite-mobile";
import { spacing } from "@/constants/design-system";
import { PAINT_FINISH_LABELS, TRUCK_MANUFACTURER_LABELS } from '@/constants';
import type { Paint } from '@/types';
import { useDebounce } from "@/hooks/useDebouncedSearch";
import { useToast } from "@/hooks/use-toast";
import { SortSelector, type SortOption } from "@/components/painting/catalog/list/sort-selector";
import { PaintFilterDrawer } from "@/components/painting/catalog/list/paint-filter-drawer";
import { SlideInPanel } from "@/components/ui/slide-in-panel";
import { PaintPreview } from "@/components/painting/preview/painting-preview";
import {
  IconPalette,
  IconFlask,
  IconClipboardList,
  IconArrowsSort,
  IconFilter,
  IconX,
  IconSearch,
} from "@tabler/icons-react-native";

// Badge colors - unified neutral, more subtle (for type, brand, finish, manufacturer)
const BADGE_COLORS = {
  light: { bg: 'rgba(229, 229, 229, 0.7)', text: '#525252' },  // neutral-200/70, neutral-600
  dark: { bg: 'rgba(64, 64, 64, 0.5)', text: '#d4d4d4' },      // neutral-700/50, neutral-300
};
// Tag badge colors - inverted (dark in light mode, light in dark mode)
const TAG_BADGE_COLORS = {
  light: { bg: '#404040', text: '#f5f5f5' },  // neutral-700, neutral-100
  dark: { bg: '#d4d4d4', text: '#262626' },   // neutral-300, neutral-800
};

/**
 * View-Only Catalog List Screen for Leaders
 *
 * This screen provides a read-only view of the paint catalog for sector leaders.
 * Features:
 * - No FAB (create button)
 * - No context menu on long press
 * - No editing capabilities
 * - View-only access to paint details
 */
export default function CatalogViewOnlyListScreen() {
  const { colors, isDark } = useTheme();
  const badgeStyle = isDark ? BADGE_COLORS.dark : BADGE_COLORS.light;
  const tagBadgeStyle = isDark ? TAG_BADGE_COLORS.dark : TAG_BADGE_COLORS.light;
  const { toast } = useToast();

  // Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [searchDisplay, setSearchDisplay] = useState("");
  const [filters, setFilters] = useState<any>({});
  const [showFilters, setShowFilters] = useState(false);
  const [showSort, setShowSort] = useState(false);
  const [currentSort, setCurrentSort] = useState<SortOption>("color"); // Default to color sort

  // Debounced search
  const debouncedSearch = useDebounce(searchQuery, 300);

  // Build query params
  const queryParams = useMemo(() => {
    // Build orderBy based on current sort
    let orderBy: any = {};
    switch (currentSort) {
      case "name":
        orderBy = { name: "asc" };
        break;
      case "color":
        orderBy = { palette: "asc", paletteOrder: "asc" };
        break;
      case "type":
        orderBy = { paintType: { name: "asc" } };
        break;
      case "paintBrand":
        orderBy = { paintBrand: { name: "asc" } };
        break;
      case "finish":
        orderBy = { finish: "asc" };
        break;
      case "manufacturer":
        orderBy = { manufacturer: "asc" };
        break;
    }

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
      orderBy,
    };

    // Use searchingFor parameter for text search (handled by service layer)
    if (debouncedSearch) {
      params.searchingFor = debouncedSearch;
    }

    const whereConditions: any[] = [];

    // Paint Type filter
    if (filters.paintTypeIds?.length > 0) {
      whereConditions.push({ paintTypeId: { in: filters.paintTypeIds } });
    }

    // Paint Brand filter
    if (filters.paintBrandIds?.length > 0) {
      whereConditions.push({ paintBrandId: { in: filters.paintBrandIds } });
    }

    // Finish filter
    if (filters.finishes?.length > 0) {
      whereConditions.push({ finish: { in: filters.finishes } });
    }

    // Manufacturer filter
    if (filters.manufacturers?.length > 0) {
      whereConditions.push({ manufacturer: { in: filters.manufacturers } });
    }

    // Palette filter
    if (filters.palettes?.length > 0) {
      whereConditions.push({ palette: { in: filters.palettes } });
    }

    // Has formulas filter
    if (filters.hasFormulas !== undefined) {
      whereConditions.push({
        formulas: filters.hasFormulas ? { some: {} } : { none: {} },
      });
    }

    // Similar color filter
    if (filters.similarColor && filters.similarColor !== "#000000") {
      params.similarColor = filters.similarColor;
      if (filters.similarColorThreshold !== undefined) {
        params.similarColorThreshold = filters.similarColorThreshold;
      }
    }

    if (whereConditions.length > 0) {
      params.where = whereConditions.length === 1 ? whereConditions[0] : { AND: whereConditions };
    }

    return params;
  }, [filters, debouncedSearch, currentSort]);

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
    totalItemsLoaded,
    totalCount,
  } = usePaintsInfiniteMobile(queryParams);

  // Handle refresh
  const handleRefresh = async () => {
    await refresh();
    toast({ title: "Catálogo atualizado", variant: "success" });
  };

  // Helper function to get contrasting text color based on luminance
  const getContrastingTextColor = (hexColor: string) => {
    if (!hexColor) return "#000000";
    const hex = hexColor.replace("#", "");
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.5 ? "#000000" : "#FFFFFF";
  };

  // Get adaptive background for paint code overlay
  const getCodeOverlayStyle = (hexColor: string) => {
    const textColor = getContrastingTextColor(hexColor);
    if (textColor === "#FFFFFF") {
      return { backgroundColor: "rgba(255,255,255,0.9)", color: "#000000" };
    } else {
      return { backgroundColor: "rgba(0,0,0,0.75)", color: "#FFFFFF" };
    }
  };

  // Render paint card - VIEW ONLY (no long press, no context menu)
  const renderPaintCard = ({ item: paint }: { item: Paint }) => {
    const formulaCount = paint.formulas?.length || 0;
    const taskCount = (paint._count?.logoTasks || 0) + (paint._count?.generalPaintings || 0);
    const codeOverlayStyle = getCodeOverlayStyle(paint.hex);

    return (
      <Card style={styles.paintCard}>
        {/* Touchable area for navigation - VIEW ONLY */}
        <TouchableOpacity
          onPress={() => router.push(`/catalogo/detalhes/${paint.id}`)}
          activeOpacity={0.7}
        >
          {/* Color Preview - uses stored image if available, falls back to hex */}
          <View style={styles.colorPreview}>
            <PaintPreview
              paint={paint}
              baseColor={paint.hex || colors.muted}
              width={500}
              height={128}
              borderRadius={0}
              style={{ width: '100%', height: '100%' }}
            />
            {/* Paint code overlay - only shown if code exists */}
            {paint.code && (
              <View style={[styles.codeOverlay, { backgroundColor: codeOverlayStyle.backgroundColor }]}>
                <ThemedText style={[styles.codeText, { color: codeOverlayStyle.color }]}>{paint.code}</ThemedText>
              </View>
            )}
          </View>

          {/* Card Content - touchable part */}
          <View style={styles.cardContent}>
            {/* Paint Name */}
            <ThemedText style={styles.paintName} numberOfLines={2}>
              {paint.name}
            </ThemedText>

            {/* Badges - unified neutral style, no icons */}
            <View style={styles.badgeRow}>
              {paint.paintType?.name && (
                <View style={[styles.paintBadge, { backgroundColor: badgeStyle.bg }]}>
                  <ThemedText style={[styles.paintBadgeText, { color: badgeStyle.text }]}>{paint.paintType.name}</ThemedText>
                </View>
              )}

              {paint.finish && (
                <View style={[styles.paintBadge, { backgroundColor: badgeStyle.bg }]}>
                  <ThemedText style={[styles.paintBadgeText, { color: badgeStyle.text }]}>{PAINT_FINISH_LABELS[paint.finish] || paint.finish}</ThemedText>
                </View>
              )}

              {paint.paintBrand?.name && (
                <View style={[styles.paintBadge, { backgroundColor: badgeStyle.bg }]}>
                  <ThemedText style={[styles.paintBadgeText, { color: badgeStyle.text }]}>{paint.paintBrand.name}</ThemedText>
                </View>
              )}

              {paint.manufacturer && (
                <View style={[styles.paintBadge, styles.manufacturerBadge, { backgroundColor: badgeStyle.bg }]}>
                  <ThemedText style={[styles.paintBadgeText, { color: badgeStyle.text }]} numberOfLines={1}>{TRUCK_MANUFACTURER_LABELS[paint.manufacturer] || paint.manufacturer}</ThemedText>
                </View>
              )}
            </View>
          </View>
        </TouchableOpacity>

        {/* Tags - OUTSIDE TouchableOpacity for proper scroll */}
        {paint.tags && paint.tags.length > 0 && (
          <View style={styles.tagsContainer}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.tagsScrollContent}
            >
              {paint.tags.map((tag, index) => (
                <View key={index} style={[styles.paintBadge, { backgroundColor: tagBadgeStyle.bg }]}>
                  <ThemedText style={[styles.paintBadgeText, { color: tagBadgeStyle.text }]}>{tag}</ThemedText>
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Formula and Task Counts - touchable to navigate */}
        <TouchableOpacity
          onPress={() => router.push(`/catalogo/detalhes/${paint.id}`)}
          activeOpacity={0.7}
          style={styles.countsContainer}
        >
          <View style={styles.countsRow}>
            <View style={styles.infoRow}>
              <IconFlask size={14} color={formulaCount > 0 ? "#16a34a" : "#ef4444"} />
              <ThemedText style={[styles.infoText, { color: formulaCount > 0 ? colors.foreground : colors.mutedForeground }]}>
                {formulaCount} fórmula{formulaCount !== 1 ? "s" : ""}
              </ThemedText>
            </View>

            <View style={styles.infoRow}>
              <IconClipboardList size={14} color={taskCount > 0 ? "#2563eb" : colors.mutedForeground} />
              <ThemedText style={[styles.infoText, { color: taskCount > 0 ? colors.foreground : colors.mutedForeground }]}>
                {taskCount} tarefa{taskCount !== 1 ? "s" : ""}
              </ThemedText>
            </View>
          </View>
        </TouchableOpacity>
      </Card>
    );
  };

  // Handle filter changes
  const handleFilterChange = (newFilters: any) => {
    setFilters(newFilters);
  };

  const handleClearFilters = () => {
    setFilters({});
  };

  // Handle search
  const handleSearchChange = (text: string) => {
    setSearchDisplay(text);
    setSearchQuery(text);
  };

  const handleClearSearch = () => {
    setSearchDisplay("");
    setSearchQuery("");
  };

  // Count active filters
  const activeFiltersCount = Object.keys(filters).filter(key => {
    const value = filters[key];
    return value !== undefined && value !== null && (!Array.isArray(value) || value.length > 0);
  }).length;

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <ThemedText style={styles.errorText}>Erro ao carregar catálogo</ThemedText>
        <TouchableOpacity
          onPress={() => refetch()}
          style={[styles.retryButton, { backgroundColor: colors.primary }]}
          activeOpacity={0.7}
        >
          <ThemedText style={{ color: "#FFFFFF", fontWeight: "600" }}>Tentar novamente</ThemedText>
        </TouchableOpacity>
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
        {/* Header - matching customer list design */}
        <View style={styles.header}>
          {/* Search Container */}
          <View style={styles.searchContainer}>
            <View style={[styles.searchInput, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <IconSearch size={20} color={colors.mutedForeground} />
              <TextInput
                value={searchDisplay}
                onChangeText={handleSearchChange}
                placeholder="Buscar tintas..."
                placeholderTextColor={colors.mutedForeground}
                style={[styles.textInput, { color: colors.foreground }]}
                returnKeyType="search"
                autoCapitalize="none"
                autoCorrect={false}
              />
              {/* Count display */}
              {!isLoading && totalCount !== undefined && (
                <ThemedText style={[styles.countText, { color: colors.mutedForeground }]}>
                  {totalItemsLoaded} de {totalCount}
                </ThemedText>
              )}
              {searchDisplay.length > 0 && (
                <TouchableOpacity onPress={handleClearSearch} style={styles.clearButton}>
                  <IconX size={20} color={colors.mutedForeground} />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actions}>
            {/* Sort Button */}
            <TouchableOpacity
              onPress={() => setShowSort(true)}
              style={[styles.actionButton, { backgroundColor: colors.card, borderColor: colors.border }]}
              activeOpacity={0.7}
            >
              <IconArrowsSort size={20} color={colors.foreground} />
            </TouchableOpacity>

            {/* Filter Button */}
            <TouchableOpacity
              onPress={() => setShowFilters(true)}
              style={[styles.actionButton, { backgroundColor: colors.card, borderColor: colors.border }]}
              activeOpacity={0.7}
            >
              <IconFilter size={20} color={colors.foreground} />
              {activeFiltersCount > 0 && (
                <View style={[styles.badge, { backgroundColor: colors.destructive }]}>
                  <ThemedText style={styles.badgeText}>{activeFiltersCount}</ThemedText>
                </View>
              )}
            </TouchableOpacity>
          </View>
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

        {/* NO FAB - View only mode */}

        {/* Sort Modal */}
        <SortSelector
          currentSort={currentSort}
          onSortChange={(sort) => {
            setCurrentSort(sort);
            setShowSort(false);
          }}
          isOpen={showSort}
          onClose={() => setShowSort(false)}
        />

        {/* Filter drawer */}
        <SlideInPanel isOpen={showFilters} onClose={() => setShowFilters(false)}>
          <PaintFilterDrawer
            filters={filters}
            onFiltersChange={handleFilterChange}
            onClear={handleClearFilters}
            activeFiltersCount={activeFiltersCount}
            onClose={() => setShowFilters(false)}
          />
        </SlideInPanel>

        {/* NO Context Menu - View only mode */}
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
    paddingHorizontal: 8,
    paddingVertical: 8,
    gap: 8,
    alignItems: "center",
  },
  searchContainer: {
    flex: 1,
  },
  searchInput: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    gap: 8,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    padding: 0,
    margin: 0,
  },
  countText: {
    fontSize: 14,
    fontWeight: "500",
    marginRight: 4,
  },
  clearButton: {
    padding: 2,
  },
  actions: {
    flexDirection: "row",
    gap: 8,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  badge: {
    position: "absolute",
    top: -6,
    right: -6,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 4,
  },
  badgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "700",
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
    height: 128,
    position: "relative",
    overflow: "hidden",
  },
  codeOverlay: {
    position: "absolute",
    bottom: 8,
    right: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  codeText: {
    fontSize: 12,
    fontFamily: "monospace",
  },
  cardContent: {
    padding: spacing.md,
    gap: spacing.sm,
  },
  paintName: {
    fontSize: 16,
    fontWeight: "600",
  },
  badgeRow: {
    flexDirection: "row",
    flexWrap: "nowrap",
    overflow: "hidden",
    gap: 4,
  },
  paintBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  paintBadgeText: {
    fontSize: 11,
    fontWeight: "500",
  },
  manufacturerBadge: {
    maxWidth: 100,
  },
  tagsContainer: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
  },
  tagsScrollContent: {
    gap: 4,
    paddingRight: spacing.md,
  },
  countsContainer: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
  },
  countsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  infoText: {
    fontSize: 12,
    fontWeight: "500",
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
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: 8,
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
    fontSize: 16,
    opacity: 0.6,
  },
  loadingMore: {
    padding: spacing.md,
    alignItems: "center",
  },
});
