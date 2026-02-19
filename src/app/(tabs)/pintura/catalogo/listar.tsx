import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { View, FlatList, RefreshControl, ActivityIndicator, TouchableOpacity, StyleSheet, TextInput, ScrollView, Alert, GestureResponderEvent, useWindowDimensions } from "react-native";
import type { FlatList as FlatListType } from "react-native";
import { Stack, router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { usePageTracker } from "@/hooks/use-page-tracker";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from "react-native-reanimated";
import { FAB } from "@/components/ui/fab";
import { ThemedText } from "@/components/ui/themed-text";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useTheme } from "@/lib/theme";
import { useAuth } from "@/contexts/auth-context";
import { usePaintsInfiniteMobile } from "@/hooks/use-paints-infinite-mobile";
import { usePaintMutations, useScreenReady} from '@/hooks';
import { spacing } from "@/constants/design-system";
import { SECTOR_PRIVILEGES, PAINT_FINISH_LABELS, TRUCK_MANUFACTURER_LABELS } from '../../../../constants';
import { hasAnyPrivilege } from '../../../../utils';
import type { Paint } from '../../../../types';
import { useDebounce } from "@/hooks/useDebouncedSearch";
// import { useToast } from "@/hooks/use-toast";
// import { showToast } from "@/components/ui/toast";
import { SortSelector, type SortOption } from "@/components/painting/catalog/list/sort-selector";
import { PaintFilterDrawer } from "@/components/painting/catalog/list/paint-filter-drawer";
import { SlideInPanel } from "@/components/ui/slide-in-panel";
import { PaintPreview } from "@/components/painting/preview/painting-preview";
import { PaintGridMinimized } from "@/components/painting/catalog/list/paint-grid-minimized";
import { ContextMenuPopover, type ContextMenuItem } from "@/components/ui/context-menu-popover";
import {
  IconPalette,
  IconFlask,
  IconClipboardList,
  IconArrowsSort,
  IconFilter,
  IconX,
  IconSearch,
  IconLayoutGrid,
  IconLayoutList,
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

// Tablet detection threshold (lowered to support smaller tablets)
const TABLET_WIDTH_THRESHOLD = 624;

export default function CatalogListScreen() {
  const { colors, isDark } = useTheme();
  const { user } = useAuth();
  const { width: screenWidth } = useWindowDimensions();
  const isTablet = screenWidth >= TABLET_WIDTH_THRESHOLD;
  const badgeStyle = isDark ? BADGE_COLORS.dark : BADGE_COLORS.light;
  const tagBadgeStyle = isDark ? TAG_BADGE_COLORS.dark : TAG_BADGE_COLORS.light;
  // const { toast } = useToast();
  const { delete: deletePaint } = usePaintMutations();

  // Track page access for recents/most accessed
  usePageTracker({ title: "Catálogo de Tintas" });

  // Check user permissions - only WAREHOUSE and ADMIN can edit/create
  // Team leaders have READ-ONLY access to the catalogue (they use catalogo-basico route)
  const canCreate = hasAnyPrivilege(user, [SECTOR_PRIVILEGES.WAREHOUSE, SECTOR_PRIVILEGES.ADMIN]);
  const canEdit = hasAnyPrivilege(user, [SECTOR_PRIVILEGES.WAREHOUSE, SECTOR_PRIVILEGES.ADMIN]);
  const canDelete = hasAnyPrivilege(user, [SECTOR_PRIVILEGES.WAREHOUSE, SECTOR_PRIVILEGES.ADMIN]);

  // View state - minimized (grid) or maximized (cards)
  const [isMinimized, setIsMinimized] = useState(true); // Default to minimized (grid view)
  const [viewLoaded, setViewLoaded] = useState(false);

  // Load view preference from AsyncStorage on mount
  useEffect(() => {
    const loadViewPreference = async () => {
      try {
        const savedView = await AsyncStorage.getItem("paintCatalogueView");
        if (savedView !== null) {
          setIsMinimized(savedView === "minimized");
        }
      } catch (error) {
        console.warn("Failed to load view preference:", error);
      } finally {
        setViewLoaded(true);
      }
    };
    loadViewPreference();
  }, []);

  // Toggle view and persist preference
  const toggleView = useCallback(async () => {
    const newIsMinimized = !isMinimized;
    setIsMinimized(newIsMinimized);
    try {
      await AsyncStorage.setItem("paintCatalogueView", newIsMinimized ? "minimized" : "maximized");
    } catch (error) {
      console.warn("Failed to save view preference:", error);
    }
  }, [isMinimized]);

  // Ref for the maximized FlatList to scroll to specific items
  const maximizedListRef = useRef<FlatListType<Paint>>(null);
  const [scrollToPaintIndex, setScrollToPaintIndex] = useState<number | undefined>(undefined);

  // Use shared value for INSTANT overlay display (UI thread, no React state delay)
  const overlayOpacity = useSharedValue(0);
  const isTransitioning = useRef(false);

  // Animated style for overlay - updates on UI thread instantly
  const overlayAnimatedStyle = useAnimatedStyle(() => ({
    opacity: overlayOpacity.value,
    pointerEvents: overlayOpacity.value > 0 ? 'auto' as const : 'none' as const,
  }));

  // Show overlay instantly (runs on UI thread)
  const showOverlay = useCallback(() => {
    overlayOpacity.value = withTiming(1, { duration: 100, easing: Easing.out(Easing.ease) });
  }, [overlayOpacity]);

  // Hide overlay
  const hideOverlay = useCallback(() => {
    overlayOpacity.value = withTiming(0, { duration: 150, easing: Easing.in(Easing.ease) });
  }, [overlayOpacity]);

  // Estimated card height for getItemLayout (preview 128 + content + badges + tags + counts + margins)
  // Adjusted based on actual scroll behavior
  const ESTIMATED_CARD_HEIGHT = 250;

  // Number of columns for maximized view
  const maximizedNumColumns = isTablet ? 3 : 1;

  // Calculate card width for tablet to prevent single cards from stretching
  // screenWidth - padding (spacing.md * 2) - gaps (spacing.md * (numColumns - 1)) / numColumns
  const cardWidth = isTablet
    ? (screenWidth - spacing.md * 2 - spacing.md * (maximizedNumColumns - 1)) / maximizedNumColumns
    : undefined;

  // getItemLayout for FlatList - enables scrollToIndex to work for non-rendered items
  // For multi-column layouts, we calculate based on row position
  const getMaximizedItemLayout = useCallback(
    (_: any, index: number) => {
      const row = Math.floor(index / maximizedNumColumns);
      return {
        length: ESTIMATED_CARD_HEIGHT,
        offset: ESTIMATED_CARD_HEIGHT * row,
        index,
      };
    },
    [maximizedNumColumns]
  );

  // Reset states when switching to minimized
  useEffect(() => {
    if (isMinimized) {
      isTransitioning.current = false;
    }
  }, [isMinimized]);

  // Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [searchDisplay, setSearchDisplay] = useState("");
  const [filters, setFilters] = useState<any>({});
  const [showFilters, setShowFilters] = useState(false);
  const [showSort, setShowSort] = useState(false);
  const [currentSort, setCurrentSort] = useState<SortOption>("color"); // Default to color sort

  // Context menu state
  const [contextMenuPaint, setContextMenuPaint] = useState<Paint | null>(null);
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [contextMenuPosition, setContextMenuPosition] = useState({ x: 0, y: 0 });

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
        orderBy = { colorOrder: "asc" };
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
      // Use select instead of include for 90% data reduction
      // NEVER include formulas in catalogue - only count them!
      select: {
        id: true,
        name: true,
        code: true,
        hex: true,
        hexColor: true,
        finish: true,
        colorPreview: true,
        description: true,
        colorOrder: true,
        manufacturer: true,
        createdAt: true,
        updatedAt: true,
        paintType: {
          select: {
            id: true,
            name: true,
          },
        },
        paintBrand: {
          select: {
            id: true,
            name: true,
          },
        },
        // Only count formulas, don't fetch them! 90% reduction
        _count: {
          select: {
            formulas: true,
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

    // Has formulas filter
    if (filters.hasFormulas !== undefined) {
      whereConditions.push({
        formulas: filters.hasFormulas ? { some: {} } : { none: {} },
      });
    }

    // Similar color filter - validate hex format before adding
    // API schema requires: /^#[0-9A-Fa-f]{6}$/ format
    const isValidHex = (hex: string | undefined): boolean => {
      if (!hex || hex === "" || hex === "#000000") return false;
      return /^#[0-9A-Fa-f]{6}$/.test(hex);
    };

    if (isValidHex(filters.similarColor)) {
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

  // Page size that's a multiple of all column counts (10, 5, 3, 1) = LCM is 30
  // Use 60 for better performance (2 pages worth of rows)
  const pageSize = 60;

  // Fetch paints
  const {
    items: rawPaints,
    isLoading,
    error,
    refetch,
    refresh,
    loadMore,
    canLoadMore,
    isFetchingNextPage,
    totalItemsLoaded,
    totalCount,
  } = usePaintsInfiniteMobile(queryParams, pageSize);

  useScreenReady(!isLoading);

  // Apply client-side sorting (matching web version and view-only catalog)
  const paints = useMemo(() => {
    if (!rawPaints || rawPaints.length === 0) return [];

    // Check if color similarity filter is active (API already sorted by similarity)
    const hasSimilarColorFilter = filters.similarColor &&
                                   filters.similarColor.trim() !== "" &&
                                   filters.similarColor !== "#000000";

    if (hasSimilarColorFilter) {
      return rawPaints;
    }

    // Helper function for null-safe colorOrder comparison
    const getColorOrder = (paint: Paint): number => paint.colorOrder ?? Number.MAX_SAFE_INTEGER;

    // Always apply client-side sorting to ensure consistent ordering
    let sorted = [...rawPaints];

    switch (currentSort) {
      case "color":
        sorted.sort((a, b) => getColorOrder(a) - getColorOrder(b));
        break;

      case "paintBrand":
        sorted.sort((a, b) => {
          const brandA = a.paintBrand?.name || '';
          const brandB = b.paintBrand?.name || '';
          const brandCompare = brandA.localeCompare(brandB);
          if (brandCompare !== 0) return brandCompare;
          return getColorOrder(a) - getColorOrder(b);
        });
        break;

      case "type":
        sorted.sort((a, b) => {
          const typeA = a.paintType?.name || '';
          const typeB = b.paintType?.name || '';
          const typeCompare = typeA.localeCompare(typeB);
          if (typeCompare !== 0) return typeCompare;
          return getColorOrder(a) - getColorOrder(b);
        });
        break;

      case "finish":
        sorted.sort((a, b) => {
          const finishA = a.finish || '';
          const finishB = b.finish || '';
          const finishCompare = finishA.localeCompare(finishB);
          if (finishCompare !== 0) return finishCompare;
          return getColorOrder(a) - getColorOrder(b);
        });
        break;

      case "manufacturer":
        sorted.sort((a, b) => {
          const manuA = a.manufacturer || '';
          const manuB = b.manufacturer || '';
          const manuCompare = manuA.localeCompare(manuB);
          if (manuCompare !== 0) return manuCompare;
          return getColorOrder(a) - getColorOrder(b);
        });
        break;

      case "name":
        sorted.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
        break;
    }

    return sorted;
  }, [rawPaints, currentSort, filters.similarColor]);

  // Handle paint press from minimized view - switch to maximized and scroll
  // This must be defined after paints is available
  const handleMinimizedPaintPress = useCallback((paint: Paint) => {
    if (isTransitioning.current) return; // Prevent double-tap

    const index = paints.findIndex(p => p.id === paint.id);
    if (index !== -1) {
      isTransitioning.current = true;
      setScrollToPaintIndex(index);
    }
    setIsMinimized(false);
    // Also persist the view change
    AsyncStorage.setItem("paintCatalogueView", "maximized").catch(() => {});
  }, [paints]);

  // Callback to show overlay instantly from PaintSquare (runs on press)
  const handlePaintPressStart = useCallback(() => {
    if (!isTransitioning.current) {
      showOverlay();
    }
  }, [showOverlay]);

  // Scroll to the paint when switching to maximized view
  useEffect(() => {
    if (!isMinimized && scrollToPaintIndex !== undefined && maximizedListRef.current) {
      // For multi-column layouts, calculate based on row position
      const row = Math.floor(scrollToPaintIndex / maximizedNumColumns);
      const offset = row * ESTIMATED_CARD_HEIGHT;

      // Wait for FlatList to mount and render
      setTimeout(() => {
        maximizedListRef.current?.scrollToOffset({ offset, animated: true });

        // Hide overlay after scroll animation completes
        // Scroll animation takes ~300-400ms
        setTimeout(() => {
          hideOverlay();
          setScrollToPaintIndex(undefined);
          isTransitioning.current = false;
        }, 400);
      }, 100);
    }
  }, [isMinimized, scrollToPaintIndex, hideOverlay, maximizedNumColumns]);

  // Handle refresh
  const handleRefresh = async () => {
    await refresh();
    Alert.alert("Sucesso", "Catálogo atualizado");
  };

  // Context menu handler for long press
  const handleLongPress = useCallback((paint: Paint, event: GestureResponderEvent) => {
    const { pageX, pageY } = event.nativeEvent;
    setContextMenuPosition({ x: pageX, y: pageY });
    setContextMenuPaint(paint);
    setShowContextMenu(true);
  }, []);

  // Handle delete confirmation
  const handleDeletePaint = useCallback((paint: Paint) => {
    Alert.alert(
      "Excluir Tinta",
      `Tem certeza que deseja excluir "${paint.name}"? Esta ação não pode ser desfeita.`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Excluir",
          style: "destructive",
          onPress: async () => {
            try {
              await deletePaint(paint.id);
              Alert.alert("Sucesso", "Tinta excluída com sucesso");
            } catch (_error) {
              // API client already shows error alert
            }
          },
        },
      ]
    );
  }, [deletePaint]);

  // Build context menu items based on permissions
  const contextMenuItems: ContextMenuItem[] = useMemo(() => {
    if (!contextMenuPaint) return [];

    const items: ContextMenuItem[] = [
      {
        id: "details",
        label: "Ver Detalhes",
        icon: "eye",
        onPress: () => router.push(`/pintura/catalogo/detalhes/${contextMenuPaint.id}`),
      },
    ];

    if (canEdit) {
      items.push({
        id: "edit",
        label: "Editar",
        icon: "edit",
        onPress: () => router.push(`/pintura/catalogo/editar/${contextMenuPaint.id}`),
      });
    }

    if (canDelete) {
      items.push({
        id: "delete",
        label: "Excluir",
        icon: "trash",
        destructive: true,
        onPress: () => handleDeletePaint(contextMenuPaint),
      });
    }

    return items;
  }, [contextMenuPaint, canEdit, canDelete, handleDeletePaint]);

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

  // Render paint card
  const renderPaintCard = ({ item: paint }: { item: Paint }) => {
    const formulaCount = paint._count?.formulas || 0;
    const taskCount = (paint._count?.logoTasks || 0) + (paint._count?.generalPaintings || 0);
    const codeOverlayStyle = getCodeOverlayStyle(paint.hex);

    // On tablet, use fixed width to prevent single cards from stretching
    const cardStyle = cardWidth
      ? [styles.paintCard, { width: cardWidth, flex: undefined }]
      : styles.paintCard;

    return (
      <Card style={cardStyle}>
        {/* Touchable area for navigation - covers preview and main content */}
        <TouchableOpacity
          onPress={() => router.push(`/pintura/catalogo/detalhes/${paint.id}`)}
          onLongPress={(e) => handleLongPress(paint, e)}
          delayLongPress={500}
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
          onPress={() => router.push(`/pintura/catalogo/detalhes/${paint.id}`)}
          onLongPress={(e) => handleLongPress(paint, e)}
          delayLongPress={500}
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
            {/* View Toggle Button */}
            <TouchableOpacity
              onPress={toggleView}
              style={[styles.actionButton, { backgroundColor: colors.card, borderColor: colors.border }]}
              activeOpacity={0.7}
            >
              {isMinimized ? (
                <IconLayoutList size={20} color={colors.foreground} />
              ) : (
                <IconLayoutGrid size={20} color={colors.foreground} />
              )}
            </TouchableOpacity>

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
        {isLoading || !viewLoaded ? (
          <View style={{ flex: 1, padding: spacing.md, gap: spacing.md }}>
            {/* Paint card skeletons matching the catalogue layout */}
            {[1, 2, 3].map((i) => (
              <View key={i} style={[styles.paintCard, { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }]}>
                {/* Color preview skeleton */}
                <Skeleton style={{ height: 128, borderRadius: 0 }} />
                {/* Card content */}
                <View style={{ padding: spacing.md, gap: spacing.sm }}>
                  <Skeleton style={{ height: 18, width: '60%', borderRadius: 4 }} />
                  <View style={{ flexDirection: 'row', gap: 4 }}>
                    <Skeleton style={{ height: 22, width: 60, borderRadius: 4 }} />
                    <Skeleton style={{ height: 22, width: 50, borderRadius: 4 }} />
                    <Skeleton style={{ height: 22, width: 70, borderRadius: 4 }} />
                  </View>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Skeleton style={{ height: 14, width: 80, borderRadius: 4 }} />
                    <Skeleton style={{ height: 14, width: 60, borderRadius: 4 }} />
                  </View>
                </View>
              </View>
            ))}
          </View>
        ) : (
          <>
            {/* Minimized View - 6 column grid */}
            {isMinimized && (
              <View style={styles.animatedContainer}>
                <PaintGridMinimized
                  paints={paints}
                  isLoading={isLoading}
                  onPaintPressStart={handlePaintPressStart}
                  onPaintPress={handleMinimizedPaintPress}
                  onEndReached={() => {
                    if (canLoadMore && !isFetchingNextPage) {
                      loadMore();
                    }
                  }}
                  isFetchingNextPage={isFetchingNextPage}
                  numColumns={5}
                />
              </View>
            )}

            {/* Maximized View - Full cards */}
            {!isMinimized && (
              <View style={styles.animatedContainer}>
              <FlatList
                ref={maximizedListRef}
                data={paints}
                renderItem={renderPaintCard}
                keyExtractor={(paint) => paint.id}
                numColumns={maximizedNumColumns}
                key={isTablet ? 'tablet' : 'phone'}
                columnWrapperStyle={isTablet ? styles.cardRow : undefined}
                contentContainerStyle={styles.listContent}
                getItemLayout={getMaximizedItemLayout}
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
                onEndReachedThreshold={0.3}
                removeClippedSubviews={!isMinimized}
                maxToRenderPerBatch={12}
                windowSize={10}
                initialNumToRender={10}
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
              </View>
            )}
          </>
        )}

        {/* FAB */}
        {canCreate && (
          <FAB
            icon="plus"
            onPress={() => router.push("/pintura/catalogo/cadastrar")}
          />
        )}

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

        {/* Context Menu Popover */}
        <ContextMenuPopover
          visible={showContextMenu}
          onClose={() => {
            setShowContextMenu(false);
            setContextMenuPaint(null);
          }}
          items={contextMenuItems}
          position={contextMenuPosition}
        />

        {/* Loading overlay during scroll transition - uses Reanimated for instant display */}
        <Animated.View style={[styles.scrollingOverlay, overlayAnimatedStyle]}>
          <View style={[styles.scrollingContent, { backgroundColor: colors.card }]}>
            <ActivityIndicator size="large" color={colors.primary} />
            <ThemedText style={styles.scrollingText}>Carregando...</ThemedText>
          </View>
        </Animated.View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  animatedContainer: {
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
  cardRow: {
    gap: spacing.md,
  },
  paintCard: {
    flex: 1,
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
  scrollingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 100,
  },
  scrollingContent: {
    padding: spacing.xl,
    borderRadius: 12,
    alignItems: "center",
    gap: spacing.md,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  scrollingText: {
    fontSize: 14,
    fontWeight: "500",
  },
});
