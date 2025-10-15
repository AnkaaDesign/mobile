# List and Detail Page Design System

**Version:** 1.0.0
**Last Updated:** 2025-10-14
**Based on:** User, Customer, and Items pages analysis

---

## Table of Contents

1. [Overview](#overview)
2. [Standard Page Structure](#standard-page-structure)
3. [Component Hierarchy](#component-hierarchy)
4. [List Pages Architecture](#list-pages-architecture)
5. [Detail Pages Architecture](#detail-pages-architecture)
6. [Filter System Architecture](#filter-system-architecture)
7. [Table Components](#table-components)
8. [State Management Patterns](#state-management-patterns)
9. [Styling Patterns](#styling-patterns)
10. [Navigation Patterns](#navigation-patterns)
11. [Performance Optimization](#performance-optimization)
12. [Accessibility Guidelines](#accessibility-guidelines)
13. [Implementation Checklist](#implementation-checklist)
14. [File Structure Template](#file-structure-template)

---

## Overview

This design system provides a comprehensive blueprint for creating consistent list and detail pages across the mobile application. It defines reusable patterns, component structures, and best practices derived from the User, Customer, and Items pages.

### Design Principles

- **Consistency**: All entity pages follow the same structural patterns
- **Modularity**: Components are composable and reusable
- **Performance**: Optimized for large datasets with infinite scroll
- **Accessibility**: WCAG 2.1 compliant interactions
- **Maintainability**: Clear separation of concerns and naming conventions

---

## Standard Page Structure

### List Page Structure

```
┌─────────────────────────────────────┐
│ Screen Container (ThemedView)       │
│ ┌─────────────────────────────────┐ │
│ │ Search & Filter Bar             │ │
│ │ - SearchBar (debounced)         │ │
│ │ - Filter Button (with badge)    │ │
│ │ - Column Manager Button         │ │
│ └─────────────────────────────────┘ │
│ ┌─────────────────────────────────┐ │
│ │ Filter Tags (horizontal scroll)  │ │
│ │ - Individual filter chips        │ │
│ │ - Clear all button              │ │
│ └─────────────────────────────────┘ │
│ ┌─────────────────────────────────┐ │
│ │ Content Area                     │ │
│ │ ┌─────────────────────────────┐ │ │
│ │ │ Table/List Component         │ │ │
│ │ │ - Header (sortable)          │ │ │
│ │ │ - Rows (swipeable)           │ │ │
│ │ │ - Infinite scroll            │ │ │
│ │ └─────────────────────────────┘ │ │
│ │ OR                               │ │
│ │ ┌─────────────────────────────┐ │ │
│ │ │ Empty State                  │ │ │
│ │ │ - Icon                       │ │ │
│ │ │ - Message                    │ │ │
│ │ │ - Action button              │ │ │
│ │ └─────────────────────────────┘ │ │
│ └─────────────────────────────────┘ │
│ ┌─────────────────────────────────┐ │
│ │ Items Count Display (sticky)     │ │
│ └─────────────────────────────────┘ │
│ ┌─────────────────────────────────┐ │
│ │ FAB (Create Action)              │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

### Detail Page Structure

```
┌─────────────────────────────────────┐
│ Screen Container                     │
│ ┌─────────────────────────────────┐ │
│ │ Header (optional)                │ │
│ │ - Entity name/title              │ │
│ │ - Back button                    │ │
│ │ - Actions (Refresh, Edit)        │ │
│ └─────────────────────────────────┘ │
│ ┌─────────────────────────────────┐ │
│ │ ScrollView (RefreshControl)      │ │
│ │ ┌─────────────────────────────┐ │ │
│ │ │ Main Entity Card             │ │ │
│ │ │ - Avatar/Icon                │ │ │
│ │ │ - Primary info               │ │ │
│ │ │ - Badges/Status              │ │ │
│ │ │ - Quick info grid            │ │ │
│ │ └─────────────────────────────┘ │ │
│ │ ┌─────────────────────────────┐ │ │
│ │ │ Additional Info Cards        │ │ │
│ │ │ - Login Info                 │ │ │
│ │ │ - Stats                      │ │ │
│ │ │ - Metrics                    │ │ │
│ │ │ - Related items              │ │ │
│ │ └─────────────────────────────┘ │ │
│ │ ┌─────────────────────────────┐ │ │
│ │ │ System Info Card             │ │ │
│ │ │ - ID                         │ │ │
│ │ │ - Created/Updated dates      │ │ │
│ │ └─────────────────────────────┘ │ │
│ │ ┌─────────────────────────────┐ │ │
│ │ │ Changelog Timeline Card      │ │ │
│ │ └─────────────────────────────┘ │ │
│ │ Bottom Spacing (for navigation) │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

---

## Component Hierarchy

### Shared Components (Base Layer)

These components are used across all entity pages:

```
/src/components/ui/
├── avatar.tsx                    # User/entity avatars
├── badge.tsx                     # Status indicators, counts
├── button.tsx                    # All button variants
├── card.tsx                      # Card, CardContent, CardHeader, CardTitle
├── checkbox.tsx                  # Selection checkboxes
├── empty-state.tsx               # No data states
├── error-screen.tsx              # Error handling
├── fab.tsx                       # Floating action button
├── icon.tsx                      # Icon wrapper
├── input.tsx                     # Text inputs
├── label.tsx                     # Form labels
├── loading.tsx                   # LoadingSpinner, LoadingOverlay, SkeletonCard
├── multi-combobox.tsx            # Multi-select dropdowns
├── progress-with-markers.tsx     # Progress bars with markers
├── search-bar.tsx                # Debounced search
├── separator.tsx                 # Visual dividers
├── switch.tsx                    # Toggle switches
├── themed-text.tsx               # Themed typography
├── themed-view.tsx               # Themed containers
├── drawer.tsx                    # Side drawer/modal
├── changelog-timeline.tsx        # Change history
├── items-count-display.tsx       # Item counters
└── table-error-boundary.tsx      # Table error handling
```

### Entity-Specific Components (Feature Layer)

```
/src/components/{module}/{entity}/
├── detail/
│   ├── {entity}-card.tsx                    # Main entity info card
│   ├── index.ts                             # Exports for detail components
│   └── [optional-specific-cards].tsx        # Additional detail cards
├── list/
│   ├── {entity}-table.tsx                   # Main table component
│   ├── {entity}-table-row-swipe.tsx         # Swipeable row wrapper
│   ├── {entity}-filter-modal.tsx            # Filter modal (simple)
│   ├── {entity}-filter-drawer.tsx           # Filter drawer (complex)
│   ├── {entity}-filter-drawer-v2.tsx        # Enhanced drawer version
│   ├── {entity}-filter-tags.tsx             # Active filter chips
│   ├── {entity}-column-visibility-drawer.tsx # Column management
│   └── column-visibility-manager.ts         # Column visibility logic
├── form/
│   ├── {entity}-form.tsx                    # Create form
│   └── {entity}-edit-form.tsx               # Edit form
└── skeleton/
    ├── {entity}-list-skeleton.tsx           # List loading state
    └── {entity}-detail-skeleton.tsx         # Detail loading state
```

### Naming Conventions

1. **Files**: kebab-case (e.g., `user-filter-modal.tsx`)
2. **Components**: PascalCase (e.g., `UserFilterModal`)
3. **Hooks**: camelCase with `use` prefix (e.g., `useUserMutations`)
4. **Types**: PascalCase (e.g., `UserTableProps`)
5. **Constants**: UPPER_SNAKE_CASE (e.g., `USER_STATUS`)

---

## List Pages Architecture

### Core Implementation Pattern

```typescript
// /src/app/(tabs)/{module}/{entity}/list.tsx

import React, { useState, useCallback } from "react";
import { View, Pressable, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { IconFilter } from "@tabler/icons-react-native";

// Hooks
import { use{Entity}Mutations } from '@/hooks';
import { use{Entity}sInfiniteMobile } from "@/hooks";

// UI Components
import {
  ThemedView,
  ThemedText,
  FAB,
  ErrorScreen,
  EmptyState,
  SearchBar,
  Badge
} from "@/components/ui";

// Entity Components
import { {Entity}Table } from "@/components/{module}/{entity}/list/{entity}-table";
import { {Entity}FilterModal } from "@/components/{module}/{entity}/list/{entity}-filter-modal";
import { {Entity}FilterTags } from "@/components/{module}/{entity}/list/{entity}-filter-tags";
import { {Entity}ListSkeleton } from "@/components/{module}/{entity}/skeleton/{entity}-list-skeleton";

// Utils
import { useTheme } from "@/lib/theme";
import { routes } from '@/constants';
import { routeToMobilePath } from "@/lib/route-mapper";

export default function {Entity}ListScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();

  // State
  const [refreshing, setRefreshing] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [displaySearchText, setDisplaySearchText] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<Partial<{Entity}GetManyFormData>>({});
  const [sortConfigs, setSortConfigs] = useState<SortConfig[]>([
    { columnKey: "name", direction: "asc" }
  ]);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [showSelection, setShowSelection] = useState(false);

  // Build query parameters
  const queryParams = {
    orderBy: buildOrderBy(),
    ...(searchText ? { searchingFor: searchText } : {}),
    ...filters,
    include: {
      // Define relationships to include
    },
  };

  // Data fetching
  const {
    items,
    isLoading,
    error,
    refetch,
    isRefetching,
    loadMore,
    canLoadMore,
    isFetchingNextPage,
    totalItemsLoaded,
    refresh
  } = use{Entity}sInfiniteMobile(queryParams);

  const { delete: delete{Entity} } = use{Entity}Mutations();

  // Event handlers
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refresh();
    } finally {
      setRefreshing(false);
    }
  }, [refresh]);

  const handleCreate{Entity} = () => {
    router.push(routeToMobilePath(routes.{module}.{entity}.create) as any);
  };

  const handle{Entity}Press = (id: string) => {
    router.push(routeToMobilePath(routes.{module}.{entity}.details(id)) as any);
  };

  const handleEdit{Entity} = (id: string) => {
    router.push(routeToMobilePath(routes.{module}.{entity}.edit(id)) as any);
  };

  const handleDelete{Entity} = useCallback(async (id: string) => {
    try {
      await delete{Entity}(id);
      // Clear from selection if selected
      if (selectedItems.has(id)) {
        const newSelection = new Set(selectedItems);
        newSelection.delete(id);
        setSelectedItems(newSelection);
      }
    } catch (error) {
      Alert.alert("Erro", "Não foi possível excluir o item.");
    }
  }, [delete{Entity}, selectedItems]);

  const handleApplyFilters = useCallback((newFilters) => {
    setFilters(newFilters);
    setShowFilters(false);
  }, []);

  const handleClearFilters = useCallback(() => {
    setFilters({});
    setSearchText("");
    setDisplaySearchText("");
    setSelectedItems(new Set());
    setShowSelection(false);
  }, []);

  // Count active filters
  const activeFiltersCount = Object.entries(filters).filter(
    ([key, value]) => value !== undefined && value !== null &&
    (Array.isArray(value) ? value.length > 0 : true)
  ).length;

  // Loading state
  if (isLoading && !isRefetching) {
    return <{Entity}ListSkeleton />;
  }

  // Error state
  if (error) {
    return (
      <ThemedView style={styles.container}>
        <ErrorScreen
          message="Erro ao carregar dados"
          detail={error.message}
          onRetry={handleRefresh}
        />
      </ThemedView>
    );
  }

  const hasItems = Array.isArray(items) && items.length > 0;

  return (
    <ThemedView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Search and Filter Bar */}
      <View style={styles.searchContainer}>
        <SearchBar
          value={displaySearchText}
          onChangeText={setDisplaySearchText}
          onSearch={setSearchText}
          placeholder="Buscar..."
          style={styles.searchBar}
          debounceMs={300}
        />
        <View style={styles.buttonContainer}>
          <Pressable
            style={({ pressed }) => [
              styles.actionButton,
              { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border },
              pressed && styles.actionButtonPressed
            ]}
            onPress={() => setShowFilters(true)}
          >
            <IconFilter size={24} color={colors.foreground} />
            {activeFiltersCount > 0 && (
              <Badge style={styles.actionBadge} variant="destructive" size="sm">
                <ThemedText style={styles.actionBadgeText}>
                  {activeFiltersCount}
                </ThemedText>
              </Badge>
            )}
          </Pressable>
        </View>
      </View>

      {/* Filter Tags */}
      <{Entity}FilterTags
        filters={filters}
        searchText={searchText}
        onFilterChange={handleApplyFilters}
        onSearchChange={(text) => {
          setSearchText(text);
          setDisplaySearchText(text);
        }}
        onClearAll={handleClearFilters}
      />

      {/* Content Area */}
      {hasItems ? (
        <>
          <{Entity}Table
            items={items}
            onItemPress={handle{Entity}Press}
            onItemEdit={handleEdit{Entity}}
            onItemDelete={handleDelete{Entity}}
            onRefresh={handleRefresh}
            onEndReached={canLoadMore ? loadMore : undefined}
            refreshing={refreshing}
            loading={isLoading && !isRefetching}
            loadingMore={isFetchingNextPage}
            showSelection={showSelection}
            selectedItems={selectedItems}
            onSelectionChange={setSelectedItems}
            sortConfigs={sortConfigs}
            onSort={setSortConfigs}
            enableSwipeActions={true}
          />
          <ItemsCountDisplay
            loadedCount={totalItemsLoaded}
            totalCount={undefined}
            isLoading={isFetchingNextPage}
          />
        </>
      ) : (
        <View style={styles.emptyContainer}>
          <EmptyState
            icon={searchText ? "search" : "package"}
            title={searchText ? "Nenhum item encontrado" : "Nenhum item cadastrado"}
            description={searchText ?
              `Nenhum resultado para "${searchText}"` :
              "Comece cadastrando seu primeiro item"
            }
            actionLabel={searchText ? undefined : "Cadastrar Item"}
            onAction={searchText ? undefined : handleCreate{Entity}}
          />
        </View>
      )}

      {hasItems && <FAB icon="plus" onPress={handleCreate{Entity}} />}

      {/* Filter Modal */}
      <{Entity}FilterModal
        visible={showFilters}
        onClose={() => setShowFilters(false)}
        onApply={handleApplyFilters}
        currentFilters={filters}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchContainer: {
    flexDirection: "row",
    paddingHorizontal: 8,
    paddingVertical: 8,
    gap: 8,
    alignItems: "center",
  },
  searchBar: {
    flex: 1,
  },
  buttonContainer: {
    flexDirection: "row",
    gap: 8,
  },
  actionButton: {
    height: 48,
    width: 48,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  actionBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 3,
  },
  actionBadgeText: {
    fontSize: 9,
    fontWeight: "600",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  actionButtonPressed: {
    opacity: 0.8,
  },
});
```

### Key Features Required

1. **Search**: Debounced search with separate display and query states
2. **Filters**: Modal/Drawer with badge showing active filter count
3. **Filter Tags**: Horizontal scrollable chips showing active filters
4. **Sorting**: Multi-column sorting with visual indicators
5. **Infinite Scroll**: Load more on scroll with loading indicator
6. **Pull to Refresh**: Standard refresh control
7. **Selection Mode**: Multi-select with checkboxes
8. **Swipe Actions**: Edit/Delete/View actions on rows
9. **Empty States**: Conditional messaging based on search/filters
10. **Loading States**: Skeleton screens for initial load
11. **Error Handling**: Error boundary with retry capability

---

## Detail Pages Architecture

### Core Implementation Pattern

```typescript
// /src/app/(tabs)/{module}/{entity}/details/[id].tsx

import React, { useState, useCallback } from "react";
import { View, ScrollView, RefreshControl, StyleSheet, TouchableOpacity } from "react-native";
import { useLocalSearchParams, router } from "expo-router";

// Hooks
import { use{Entity} } from '@/hooks';

// UI Components
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ThemedText } from "@/components/ui/themed-text";
import { Header } from "@/components/ui/header";

// Entity Components
import { {Entity}Card } from "@/components/{module}/{entity}/detail";
import { {Entity}DetailSkeleton } from "@/components/{module}/{entity}/skeleton/{entity}-detail-skeleton";
import { ChangelogTimeline } from "@/components/ui/changelog-timeline";

// Utils
import { useTheme } from "@/lib/theme";
import { spacing } from "@/constants/design-system";
import { formatDateTime } from '@/utils';
import { IconRefresh, IconEdit, IconHistory } from "@tabler/icons-react-native";
import { routes, CHANGE_LOG_ENTITY_TYPE } from '@/constants';
import { routeToMobilePath } from "@/lib/route-mapper";
import { showToast } from "@/components/ui/toast";

export default function {Entity}DetailsScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const [refreshing, setRefreshing] = useState(false);

  const id = params?.id || "";

  // Fetch entity data
  const {
    data: response,
    isLoading,
    error,
    refetch,
  } = use{Entity}(id, {
    include: {
      // Define relationships to include
    },
    enabled: !!id && id !== "",
  });

  const entity = response?.data;

  // Handlers
  const handleEdit = () => {
    if (entity) {
      router.push(routeToMobilePath(routes.{module}.{entity}.edit(entity.id)) as any);
    }
  };

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    refetch().finally(() => {
      setRefreshing(false);
      showToast({ message: "Dados atualizados com sucesso", type: "success" });
    });
  }, [refetch]);

  // Loading state
  if (isLoading) {
    return (
      <View style={[styles.screenContainer, { backgroundColor: colors.background }]}>
        <Header
          title="Detalhes"
          showBackButton={true}
          onBackPress={() => router.back()}
        />
        <{Entity}DetailSkeleton />
      </View>
    );
  }

  // Error state
  if (error || !entity || !id || id === "") {
    return (
      <View style={[styles.screenContainer, { backgroundColor: colors.background }]}>
        <Header
          title="Detalhes"
          showBackButton={true}
          onBackPress={() => router.back()}
        />
        <ScrollView style={[styles.scrollView, { backgroundColor: colors.background }]}>
          <View style={styles.container}>
            <Card>
              <CardContent style={styles.errorContent}>
                <View style={[styles.errorIcon, { backgroundColor: colors.muted }]}>
                  <Icon{Entity} size={32} color={colors.mutedForeground} />
                </View>
                <ThemedText style={[styles.errorTitle, { color: colors.foreground }]}>
                  Item não encontrado
                </ThemedText>
                <ThemedText style={[styles.errorDescription, { color: colors.mutedForeground }]}>
                  O item solicitado não foi encontrado ou pode ter sido removido.
                </ThemedText>
              </CardContent>
            </Card>
          </View>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={[styles.screenContainer, { backgroundColor: colors.background }]}>
      {/* Header with Actions */}
      <Header
        title={entity.name}
        showBackButton={true}
        onBackPress={() => router.back()}
        rightAction={
          <View style={{ flexDirection: "row", gap: 8 }}>
            <TouchableOpacity
              onPress={handleRefresh}
              style={{
                width: 36,
                height: 36,
                borderRadius: 8,
                backgroundColor: colors.muted,
                alignItems: "center",
                justifyContent: "center",
              }}
              activeOpacity={0.7}
              disabled={refreshing}
            >
              <IconRefresh size={18} color={colors.foreground} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleEdit}
              style={{
                width: 36,
                height: 36,
                borderRadius: 8,
                backgroundColor: colors.primary,
                alignItems: "center",
                justifyContent: "center",
              }}
              activeOpacity={0.7}
            >
              <IconEdit size={18} color={colors.primaryForeground} />
            </TouchableOpacity>
          </View>
        }
      />

      {/* Scrollable Content */}
      <ScrollView
        style={[styles.scrollView, { backgroundColor: colors.background }]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.container}>
          {/* Main Entity Card */}
          <{Entity}Card entity={entity} />

          {/* Additional Information Cards */}
          {/* Add entity-specific cards here */}

          {/* System Information Card */}
          <Card>
            <CardHeader>
              <CardTitle>Informações do Sistema</CardTitle>
            </CardHeader>
            <CardContent>
              <View style={styles.infoRow}>
                <ThemedText style={[styles.infoLabel, { color: colors.mutedForeground }]}>
                  ID
                </ThemedText>
                <ThemedText style={[styles.infoValue, { color: colors.foreground }]}>
                  {entity.id}
                </ThemedText>
              </View>
              <View style={styles.infoRow}>
                <ThemedText style={[styles.infoLabel, { color: colors.mutedForeground }]}>
                  Criado em
                </ThemedText>
                <ThemedText style={[styles.infoValue, { color: colors.foreground }]}>
                  {formatDateTime(new Date(entity.createdAt))}
                </ThemedText>
              </View>
              <View style={styles.infoRow}>
                <ThemedText style={[styles.infoLabel, { color: colors.mutedForeground }]}>
                  Última Atualização
                </ThemedText>
                <ThemedText style={[styles.infoValue, { color: colors.foreground }]}>
                  {formatDateTime(new Date(entity.updatedAt))}
                </ThemedText>
              </View>
            </CardContent>
          </Card>

          {/* Changelog Timeline */}
          <Card>
            <CardHeader>
              <CardTitle style={styles.sectionTitle}>
                <View style={styles.titleRow}>
                  <View style={[styles.titleIcon, { backgroundColor: colors.primary + "10" }]}>
                    <IconHistory size={18} color={colors.primary} />
                  </View>
                  <ThemedText style={[styles.titleText, { color: colors.foreground }]}>
                    Histórico de Alterações
                  </ThemedText>
                </View>
              </CardTitle>
            </CardHeader>
            <CardContent style={{ paddingHorizontal: 0 }}>
              <ChangelogTimeline
                entityType={CHANGE_LOG_ENTITY_TYPE.{ENTITY}}
                entityId={entity.id}
                entityName={entity.name}
                entityCreatedAt={entity.createdAt}
                maxHeight={400}
              />
            </CardContent>
          </Card>

          {/* Bottom spacing for mobile navigation */}
          <View style={{ height: spacing.xxl * 2 }} />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    gap: spacing.lg,
  },
  errorContent: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.xxl * 2,
  },
  errorIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.lg,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: spacing.sm,
    textAlign: "center",
  },
  errorDescription: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: spacing.xl,
    paddingHorizontal: spacing.xl,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: spacing.sm,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: "500",
  },
  infoValue: {
    fontSize: 14,
    textAlign: "right",
    flex: 1,
    marginLeft: spacing.md,
  },
  sectionTitle: {
    flexDirection: "row",
    alignItems: "center",
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  titleIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  titleText: {
    fontSize: 16,
    fontWeight: "600",
  },
});
```

### Detail Card Pattern

```typescript
// /src/components/{module}/{entity}/detail/{entity}-card.tsx

import React from "react";
import { View, StyleSheet } from "react-native";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { ThemedText } from "@/components/ui/themed-text";
import { useTheme } from "@/lib/theme";
import { spacing, borderRadius, fontSize, fontWeight } from "@/constants/design-system";
import { Icon{Entity} } from "@tabler/icons-react-native";

interface {Entity}CardProps {
  entity: {Entity};
}

export function {Entity}Card({ entity }: {Entity}CardProps) {
  const { colors } = useTheme();

  return (
    <Card>
      <CardContent style={styles.content}>
        {/* Header Section with Avatar/Icon */}
        <View style={styles.headerSection}>
          <Avatar
            size="large"
            label={entity.name}
            uri={entity.avatarUrl}
            style={[styles.avatar, { backgroundColor: colors.primary }]}
          />
          <View style={styles.headerInfo}>
            <ThemedText style={[styles.entityName, { color: colors.foreground }]}>
              {entity.name}
            </ThemedText>
            {/* Add entity-specific header info */}
            <View style={styles.badgeRow}>
              <Badge variant="success" style={styles.statusBadge}>
                Status Text
              </Badge>
            </View>
          </View>
        </View>

        {/* Quick Info Grid */}
        <View style={styles.infoGrid}>
          <View style={styles.infoItem}>
            <View style={[styles.infoIcon, { backgroundColor: colors.primary + "10" }]}>
              <Icon{Field} size={18} color={colors.primary} />
            </View>
            <View style={styles.infoText}>
              <ThemedText style={[styles.infoLabel, { color: colors.mutedForeground }]}>
                Field Label
              </ThemedText>
              <ThemedText style={[styles.infoValue, { color: colors.foreground }]}>
                {entity.fieldValue}
              </ThemedText>
            </View>
          </View>
          {/* Add more info items */}
        </View>
      </CardContent>
    </Card>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.lg,
  },
  headerSection: {
    flexDirection: "row",
    gap: spacing.lg,
    alignItems: "flex-start",
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  headerInfo: {
    flex: 1,
    gap: spacing.xs,
  },
  entityName: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
  },
  badgeRow: {
    flexDirection: "row",
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  statusBadge: {
    alignSelf: "flex-start",
  },
  infoGrid: {
    gap: spacing.md,
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  infoIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  infoText: {
    flex: 1,
  },
  infoLabel: {
    fontSize: fontSize.xs,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
  },
});
```

---

## Filter System Architecture

### Filter Modal vs Filter Drawer

**Use Filter Modal when:**
- Simple filters (< 5 filter types)
- All filters fit on one screen
- No complex nested options
- Example: User filters

**Use Filter Drawer when:**
- Complex filters (> 5 filter types)
- Collapsible sections needed
- Long lists of options
- Range inputs
- Example: Item filters

### Filter Modal Pattern

```typescript
// /src/components/{module}/{entity}/list/{entity}-filter-modal.tsx

import React, { useState, useEffect, useMemo } from "react";
import { Modal, View, ScrollView, TouchableOpacity, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { IconChevronUp, IconChevronDown, IconX } from "@tabler/icons-react-native";
import { useTheme } from "@/lib/theme";
import { spacing, fontSize, fontWeight } from "@/constants/design-system";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { MultiCombobox } from "@/components/ui/multi-combobox";
import { Switch } from "@/components/ui/switch";
import { ThemedText } from "@/components/ui/themed-text";

interface {Entity}FilterModalProps {
  visible: boolean;
  onClose: () => void;
  onApply: (filters: Partial<{Entity}GetManyFormData>) => void;
  currentFilters: Partial<{Entity}GetManyFormData>;
}

interface FilterState {
  // Define filter state shape
  statuses?: string[];
  categoryIds?: string[];
  // ... more filters
}

export function {Entity}FilterModal({
  visible,
  onClose,
  onApply,
  currentFilters
}: {Entity}FilterModalProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [filters, setFilters] = useState<FilterState>(currentFilters || {});
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(["status", "categories"])
  );

  // Load filter options via hooks
  // const { data: optionsData } = useFilterOptions();

  useEffect(() => {
    setFilters(currentFilters || {});
  }, [currentFilters, visible]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.statuses?.length) count++;
    if (filters.categoryIds?.length) count++;
    return count;
  }, [filters]);

  const handleArrayChange = (key: keyof FilterState, value: string[]) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value.length > 0 ? value : undefined,
    }));
  };

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  const handleApply = () => {
    onApply(filters);
  };

  const handleClear = () => {
    setFilters({});
    onApply({});
  };

  const Section = ({ title, sectionKey, children }) => {
    const isExpanded = expandedSections.has(sectionKey);
    return (
      <View style={styles.section}>
        <TouchableOpacity
          style={styles.sectionHeader}
          onPress={() => toggleSection(sectionKey)}
        >
          <ThemedText style={styles.sectionTitle}>{title}</ThemedText>
          {isExpanded ?
            <IconChevronUp size={20} color={colors.foreground} /> :
            <IconChevronDown size={20} color={colors.foreground} />
          }
        </TouchableOpacity>
        {isExpanded && <View style={styles.sectionContent}>{children}</View>}
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[
        styles.container,
        {
          backgroundColor: colors.background,
          paddingTop: insets.top,
          paddingBottom: insets.bottom
        }
      ]}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <View style={styles.headerLeft}>
            <ThemedText style={styles.title}>Filtros</ThemedText>
            {activeFilterCount > 0 && (
              <Badge variant="secondary" size="sm">
                {activeFilterCount}
              </Badge>
            )}
          </View>
          <TouchableOpacity onPress={onClose}>
            <IconX size={24} color={colors.foreground} />
          </TouchableOpacity>
        </View>

        {/* Content */}
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <Section title="Status" sectionKey="status">
            <View style={styles.fieldGroup}>
              <Label>Status Options</Label>
              <MultiCombobox
                options={[/* status options */]}
                selectedValues={filters.statuses || []}
                onChange={(values) => handleArrayChange("statuses", values)}
                placeholder="Selecione..."
              />
            </View>
          </Section>

          <Separator />

          {/* More sections */}
        </ScrollView>

        {/* Footer */}
        <View style={[styles.footer, { borderTopColor: colors.border }]}>
          <Button variant="outline" onPress={handleClear} style={styles.footerButton}>
            Limpar Filtros
          </Button>
          <Button onPress={handleApply} style={styles.footerButton}>
            Aplicar Filtros
          </Button>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  title: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  section: {
    paddingVertical: spacing.md,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: spacing.sm,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
  },
  sectionContent: {
    paddingTop: spacing.md,
    gap: spacing.md,
  },
  fieldGroup: {
    gap: spacing.sm,
  },
  footer: {
    flexDirection: "row",
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
  },
  footerButton: {
    flex: 1,
  },
});
```

### Filter Tags Pattern

```typescript
// /src/components/{module}/{entity}/list/{entity}-filter-tags.tsx

import React from "react";
import { View, ScrollView, TouchableOpacity, StyleSheet } from "react-native";
import { IconX, IconSearch } from "@tabler/icons-react-native";
import { useTheme } from "@/lib/theme";
import { spacing, fontSize, fontWeight } from "@/constants/design-system";
import { Badge } from "@/components/ui/badge";
import { ThemedText } from "@/components/ui/themed-text";
import { Button } from "@/components/ui/button";

interface {Entity}FilterTagsProps {
  filters: any;
  searchText?: string;
  onFilterChange: (filters: any) => void;
  onSearchChange?: (text: string) => void;
  onClearAll: () => void;
}

export function {Entity}FilterTags({
  filters,
  searchText,
  onFilterChange,
  onSearchChange,
  onClearAll,
}: {Entity}FilterTagsProps) {
  const { colors } = useTheme();

  const removeFilter = (filterKey: string, filterId?: string) => {
    const newFilters = { ...filters };

    if (filterId && Array.isArray(newFilters[filterKey])) {
      const newArray = newFilters[filterKey].filter((id: string) => id !== filterId);
      newFilters[filterKey] = newArray.length > 0 ? newArray : undefined;
    } else {
      newFilters[filterKey] = undefined;
    }

    Object.keys(newFilters).forEach((key) => {
      if (newFilters[key] === undefined) {
        delete newFilters[key];
      }
    });

    onFilterChange(newFilters);
  };

  const renderFilterTags = () => {
    const tags = [];

    // Search tag
    if (searchText) {
      tags.push(
        <Badge key="search" variant="secondary" style={styles.filterTag}>
          <View style={styles.tagContent}>
            <IconSearch size={12} color={colors.mutedForeground} />
            <ThemedText style={styles.tagText}>Busca: {searchText}</ThemedText>
            <TouchableOpacity
              onPress={() => onSearchChange?.("")}
              style={styles.removeButton}
            >
              <IconX size={12} color={colors.mutedForeground} />
            </TouchableOpacity>
          </View>
        </Badge>
      );
    }

    // Add more filter tags based on active filters
    // Example: Status filters
    if (filters.statuses && Array.isArray(filters.statuses)) {
      filters.statuses.forEach((status: string) => {
        tags.push(
          <Badge key={`status-${status}`} variant="secondary" style={styles.filterTag}>
            <View style={styles.tagContent}>
              <ThemedText style={styles.tagText}>Status: {status}</ThemedText>
              <TouchableOpacity
                onPress={() => removeFilter("statuses", status)}
                style={styles.removeButton}
              >
                <IconX size={12} color={colors.mutedForeground} />
              </TouchableOpacity>
            </View>
          </Badge>
        );
      });
    }

    return tags;
  };

  const filterTags = renderFilterTags();
  const hasActiveFilters = filterTags.length > 0;

  if (!hasActiveFilters) {
    return null;
  }

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {filterTags}
        {filterTags.length > 1 && (
          <Button variant="ghost" size="sm" onPress={onClearAll}>
            <IconX size={14} color={colors.destructive} />
            <ThemedText style={{ color: colors.destructive }}>
              Limpar tudo
            </ThemedText>
          </Button>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: spacing.xs,
  },
  scrollContent: {
    paddingHorizontal: spacing.md,
    gap: spacing.xs,
    alignItems: "center",
  },
  filterTag: {
    paddingVertical: 4,
    paddingHorizontal: spacing.sm,
  },
  tagContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  tagText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
  },
  removeButton: {
    marginLeft: 2,
  },
});
```

---

## Table Components

### Table Component Pattern

```typescript
// /src/components/{module}/{entity}/list/{entity}-table.tsx

import React, { useState, useCallback, useMemo, useRef } from "react";
import {
  FlatList,
  View,
  TouchableOpacity,
  Pressable,
  RefreshControl,
  ActivityIndicator,
  Dimensions,
  ScrollView,
  StyleSheet
} from "react-native";
import { Icon } from "@/components/ui/icon";
import { ThemedText } from "@/components/ui/themed-text";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { useTheme } from "@/lib/theme";
import { useSwipeRow } from "@/contexts/swipe-row-context";
import { spacing, fontSize, fontWeight } from "@/constants/design-system";
import { {Entity}TableRowSwipe } from "./{entity}-table-row-swipe";
import { extendedColors } from "@/lib/theme/extended-colors";

export interface TableColumn {
  key: string;
  header: string;
  accessor: (item: {Entity}) => React.ReactNode;
  width: number;
  align?: "left" | "center" | "right";
  sortable?: boolean;
}

export interface SortConfig {
  columnKey: string;
  direction: "asc" | "desc";
}

interface {Entity}TableProps {
  items: {Entity}[];
  onItemPress?: (itemId: string) => void;
  onItemEdit?: (itemId: string) => void;
  onItemDelete?: (itemId: string) => void;
  onRefresh?: () => Promise<void>;
  onEndReached?: () => void;
  refreshing?: boolean;
  loading?: boolean;
  loadingMore?: boolean;
  showSelection?: boolean;
  selectedItems?: Set<string>;
  onSelectionChange?: (selectedItems: Set<string>) => void;
  sortConfigs?: SortConfig[];
  onSort?: (configs: SortConfig[]) => void;
  visibleColumnKeys?: string[];
  enableSwipeActions?: boolean;
}

const { width: screenWidth } = Dimensions.get("window");
const availableWidth = screenWidth - 32;

// Define all available columns with their renderers
const createColumnDefinitions = (): TableColumn[] => [
  {
    key: "name",
    header: "Nome",
    align: "left",
    sortable: true,
    width: 0,
    accessor: (item: {Entity}) => (
      <ThemedText style={styles.cellText} numberOfLines={1}>
        {item.name}
      </ThemedText>
    ),
  },
  // Add more columns
];

export const {Entity}Table = React.memo<{Entity}TableProps>(({
  items,
  onItemPress,
  onItemEdit,
  onItemDelete,
  onRefresh,
  onEndReached,
  refreshing = false,
  loading = false,
  loadingMore = false,
  showSelection = false,
  selectedItems = new Set(),
  onSelectionChange,
  sortConfigs = [],
  onSort,
  visibleColumnKeys = ["name"],
  enableSwipeActions = true,
}) => {
  const { colors, isDark } = useTheme();
  const { activeRowId, closeActiveRow } = useSwipeRow();
  const flatListRef = useRef<FlatList>(null);

  const allColumns = useMemo(() => createColumnDefinitions(), []);

  const displayColumns = useMemo(() => {
    const columnWidthRatios: Record<string, number> = {
      name: 2.0,
      // Define width ratios for each column
    };

    const visible = allColumns.filter((col) => visibleColumnKeys.includes(col.key));
    const totalRatio = visible.reduce((sum, col) =>
      sum + (columnWidthRatios[col.key] || 1.0), 0
    );

    return visible.map((col) => {
      const ratio = columnWidthRatios[col.key] || 1.0;
      const width = Math.floor((availableWidth * ratio) / totalRatio);
      return { ...col, width };
    });
  }, [allColumns, visibleColumnKeys]);

  const tableWidth = useMemo(() => {
    let width = displayColumns.reduce((sum, col) => sum + col.width, 0);
    if (showSelection) width += 50;
    return width;
  }, [displayColumns, showSelection]);

  const handleSort = useCallback((columnKey: string) => {
    if (!onSort) return;

    const existingConfig = sortConfigs?.find((config) =>
      config.columnKey === columnKey
    );

    if (existingConfig) {
      if (existingConfig.direction === "asc") {
        onSort([{ columnKey, direction: "desc" }]);
      } else {
        onSort([]);
      }
    } else {
      onSort([{ columnKey, direction: "asc" }]);
    }
  }, [sortConfigs, onSort]);

  const renderHeader = useCallback(() => (
    <View style={styles.headerWrapper}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        scrollEnabled={tableWidth > availableWidth}
        style={[
          styles.headerContainer,
          {
            backgroundColor: isDark ?
              extendedColors.neutral[800] :
              extendedColors.neutral[100],
            borderBottomColor: isDark ?
              extendedColors.neutral[700] :
              extendedColors.neutral[200],
          },
        ]}
        contentContainerStyle={{ paddingHorizontal: 16 }}
      >
        <View style={[styles.headerRow, { width: tableWidth }]}>
          {showSelection && (
            <View style={[styles.headerCell, styles.checkboxCell]}>
              <Checkbox
                checked={items.length > 0 && items.every((item) =>
                  selectedItems.has(item.id)
                )}
                onCheckedChange={() => {/* handle select all */}}
              />
            </View>
          )}
          {displayColumns.map((column) => {
            const sortConfig = sortConfigs?.find((config) =>
              config.columnKey === column.key
            );

            return (
              <TouchableOpacity
                key={column.key}
                style={[styles.headerCell, { width: column.width }]}
                onPress={() => column.sortable && handleSort(column.key)}
                disabled={!column.sortable}
              >
                <View style={styles.headerCellContent}>
                  <ThemedText
                    style={[
                      styles.headerText,
                      { color: isDark ?
                        extendedColors.neutral[200] :
                        "#000000"
                      }
                    ]}
                    numberOfLines={1}
                  >
                    {column.header}
                  </ThemedText>
                  {column.sortable && (
                    sortConfig ? (
                      <Icon
                        name={sortConfig.direction === "asc" ?
                          "chevron-up" :
                          "chevron-down"
                        }
                        size="sm"
                        color={colors.foreground}
                      />
                    ) : (
                      <Icon
                        name="arrows-sort"
                        size="sm"
                        color={colors.mutedForeground}
                      />
                    )
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    </View>
  ), [
    colors,
    isDark,
    tableWidth,
    displayColumns,
    showSelection,
    selectedItems,
    items.length,
    sortConfigs,
    handleSort
  ]);

  const renderRow = useCallback(({ item, index }: { item: {Entity}; index: number }) => {
    const isSelected = selectedItems.has(item.id);
    const isEven = index % 2 === 0;

    if (enableSwipeActions && (onItemEdit || onItemDelete)) {
      return (
        <{Entity}TableRowSwipe
          key={item.id}
          itemId={item.id}
          itemName={item.name}
          onEdit={onItemEdit}
          onDelete={onItemDelete}
          disabled={showSelection}
        >
          {(isActive) => (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              scrollEnabled={tableWidth > availableWidth}
              style={[
                styles.row,
                {
                  backgroundColor: isEven ?
                    colors.background :
                    isDark ?
                      extendedColors.neutral[900] :
                      extendedColors.neutral[50],
                  borderBottomColor: isDark ?
                    extendedColors.neutral[700] :
                    extendedColors.neutral[200],
                },
                isSelected && { backgroundColor: colors.primary + "20" },
              ]}
              contentContainerStyle={{ paddingHorizontal: 16 }}
            >
              <Pressable
                style={[styles.rowContent, { width: tableWidth }]}
                onPress={() => onItemPress?.(item.id)}
              >
                {showSelection && (
                  <View style={[styles.cell, styles.checkboxCell]}>
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => {/* handle select */}}
                    />
                  </View>
                )}
                {displayColumns.map((column) => (
                  <View
                    key={column.key}
                    style={[
                      styles.cell,
                      { width: column.width },
                      column.align === "center" && styles.centerAlign,
                      column.align === "right" && styles.rightAlign,
                    ]}
                  >
                    {column.accessor(item)}
                  </View>
                ))}
              </Pressable>
            </ScrollView>
          )}
        </{Entity}TableRowSwipe>
      );
    }

    return (/* non-swipeable row */);
  }, [
    colors,
    tableWidth,
    displayColumns,
    showSelection,
    selectedItems,
    onItemPress,
    enableSwipeActions,
    onItemEdit,
    onItemDelete,
    isDark,
  ]);

  const renderFooter = useCallback(() => {
    if (!loadingMore) return null;
    return (
      <View style={styles.loadingFooter}>
        <ActivityIndicator size="small" color={colors.primary} />
        <ThemedText style={styles.loadingText}>Carregando mais...</ThemedText>
      </View>
    );
  }, [loadingMore, colors.primary]);

  const renderEmpty = useCallback(() => (
    <View style={styles.emptyContainer}>
      <Icon name="package" size="xl" variant="muted" />
      <ThemedText style={styles.emptyTitle}>Nenhum item encontrado</ThemedText>
    </View>
  ), []);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <ThemedText style={styles.loadingText}>Carregando...</ThemedText>
      </View>
    );
  }

  return (
    <View style={styles.wrapper}>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {renderHeader()}
        <FlatList
          ref={flatListRef}
          data={items}
          renderItem={renderRow}
          keyExtractor={(item) => item.id}
          refreshControl={
            onRefresh ? (
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={[colors.primary]}
                tintColor={colors.primary}
              />
            ) : undefined
          }
          onEndReached={onEndReached}
          onEndReachedThreshold={0.2}
          ListFooterComponent={renderFooter}
          ListEmptyComponent={renderEmpty}
          removeClippedSubviews={true}
          maxToRenderPerBatch={10}
          windowSize={5}
          initialNumToRender={15}
          getItemLayout={(data, index) => ({
            length: 50,
            offset: 50 * index,
            index,
          })}
          style={styles.flatList}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ flexGrow: 1 }}
        />
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    paddingHorizontal: 8,
    paddingBottom: 16,
    backgroundColor: "transparent",
  },
  container: {
    flex: 1,
    backgroundColor: "white",
    borderRadius: 8,
    overflow: "hidden",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  headerWrapper: {
    marginTop: 12,
  },
  headerContainer: {
    borderBottomWidth: 2,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 56,
  },
  headerCell: {
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.sm,
    minHeight: 56,
    justifyContent: "center",
  },
  headerText: {
    fontSize: 10,
    fontWeight: fontWeight.bold,
    textTransform: "uppercase",
    lineHeight: 12,
  },
  headerCellContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
  },
  checkboxCell: {
    width: 50,
    justifyContent: "center",
    alignItems: "center",
  },
  flatList: {
    flex: 1,
  },
  row: {
    borderBottomWidth: 1,
  },
  rowContent: {
    flexDirection: "row",
    alignItems: "stretch",
    minHeight: 50,
  },
  cell: {
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.sm,
    justifyContent: "center",
    minHeight: 50,
  },
  centerAlign: {
    alignItems: "center",
  },
  rightAlign: {
    alignItems: "flex-end",
  },
  cellText: {
    fontSize: fontSize.sm,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: spacing.md,
  },
  loadingFooter: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: spacing.lg,
    gap: spacing.sm,
  },
  loadingText: {
    fontSize: fontSize.sm,
    opacity: 0.7,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: spacing.xxl,
    gap: spacing.md,
  },
  emptyTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
  },
});

{Entity}Table.displayName = "{Entity}Table";
```

### Swipeable Row Pattern

```typescript
// /src/components/{module}/{entity}/list/{entity}-table-row-swipe.tsx

import React, { useRef } from "react";
import { View, Animated, StyleSheet, Alert } from "react-native";
import { Swipeable } from "react-native-gesture-handler";
import { IconEdit, IconTrash, IconEye } from "@tabler/icons-react-native";
import { TouchableOpacity } from "react-native";
import { useTheme } from "@/lib/theme";
import { useSwipeRow } from "@/contexts/swipe-row-context";
import { spacing } from "@/constants/design-system";

interface {Entity}TableRowSwipeProps {
  itemId: string;
  itemName: string;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  onView?: (id: string) => void;
  disabled?: boolean;
  children: (isActive: boolean) => React.ReactNode;
}

export function {Entity}TableRowSwipe({
  itemId,
  itemName,
  onEdit,
  onDelete,
  onView,
  disabled = false,
  children,
}: {Entity}TableRowSwipeProps) {
  const { colors } = useTheme();
  const swipeableRef = useRef<Swipeable>(null);
  const { activeRowId, setActiveRowId, closeActiveRow } = useSwipeRow();

  const isActive = activeRowId === itemId;

  const handleSwipeOpen = () => {
    if (activeRowId && activeRowId !== itemId) {
      closeActiveRow();
    }
    setActiveRowId(itemId);
  };

  const handleDelete = () => {
    Alert.alert(
      "Confirmar exclusão",
      `Tem certeza que deseja excluir "${itemName}"?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Excluir",
          style: "destructive",
          onPress: () => {
            swipeableRef.current?.close();
            onDelete?.(itemId);
          },
        },
      ]
    );
  };

  const renderRightActions = (
    progress: Animated.AnimatedInterpolation<number>,
    dragX: Animated.AnimatedInterpolation<number>
  ) => {
    const trans = dragX.interpolate({
      inputRange: [-100, 0],
      outputRange: [0, 100],
      extrapolate: "clamp",
    });

    return (
      <Animated.View
        style={[
          styles.actionsContainer,
          { transform: [{ translateX: trans }] },
        ]}
      >
        {onView && (
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.primary }]}
            onPress={() => {
              swipeableRef.current?.close();
              onView(itemId);
            }}
          >
            <IconEye size={20} color="white" />
          </TouchableOpacity>
        )}
        {onEdit && (
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.warning }]}
            onPress={() => {
              swipeableRef.current?.close();
              onEdit(itemId);
            }}
          >
            <IconEdit size={20} color="white" />
          </TouchableOpacity>
        )}
        {onDelete && (
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.destructive }]}
            onPress={handleDelete}
          >
            <IconTrash size={20} color="white" />
          </TouchableOpacity>
        )}
      </Animated.View>
    );
  };

  if (disabled) {
    return <>{children(false)}</>;
  }

  return (
    <Swipeable
      ref={swipeableRef}
      renderRightActions={renderRightActions}
      onSwipeableOpen={handleSwipeOpen}
      overshootRight={false}
      friction={2}
    >
      {children(isActive)}
    </Swipeable>
  );
}

const styles = StyleSheet.create({
  actionsContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  actionButton: {
    width: 60,
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
});
```

---

## State Management Patterns

### Query Parameter Management

```typescript
// Build query parameters with sorting
const buildOrderBy = () => {
  if (!sortConfigs || sortConfigs.length === 0) {
    return { name: "asc" };
  }

  // Single sort
  if (sortConfigs.length === 1) {
    const config = sortConfigs[0];
    switch (config.columnKey) {
      case "name":
        return { name: config.direction };
      case "email":
        return { email: config.direction };
      // Add more cases
      default:
        return { name: "asc" };
    }
  }

  // Multiple sorts
  return sortConfigs.map((config) => {
    switch (config.columnKey) {
      case "name":
        return { name: config.direction };
      // Add more cases
      default:
        return { name: "asc" };
    }
  });
};

const queryParams = {
  orderBy: buildOrderBy(),
  ...(searchText ? { searchingFor: searchText } : {}),
  ...filters,
  include: {
    // Define relationships
  },
};
```

### State Variables Pattern

```typescript
// Standard state variables for list pages
const [refreshing, setRefreshing] = useState(false);
const [searchText, setSearchText] = useState("");
const [displaySearchText, setDisplaySearchText] = useState("");
const [showFilters, setShowFilters] = useState(false);
const [filters, setFilters] = useState<Partial<EntityGetManyFormData>>({});
const [sortConfigs, setSortConfigs] = useState<SortConfig[]>([
  { columnKey: "name", direction: "asc" }
]);
const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
const [showSelection, setShowSelection] = useState(false);
const [visibleColumnKeys, setVisibleColumnKeys] = useState<string[]>([
  "name", "status"
]);
```

### Callback Handlers Pattern

```typescript
// Use useCallback for all event handlers to prevent re-renders
const handleRefresh = useCallback(async () => {
  setRefreshing(true);
  try {
    await refresh();
  } finally {
    setRefreshing(false);
  }
}, [refresh]);

const handleSearch = useCallback((text: string) => {
  setSearchText(text);
}, []);

const handleApplyFilters = useCallback((newFilters: Partial<EntityGetManyFormData>) => {
  setFilters(newFilters);
  setShowFilters(false);
}, []);

const handleClearFilters = useCallback(() => {
  setFilters({});
  setSearchText("");
  setDisplaySearchText("");
  setSelectedItems(new Set());
  setShowSelection(false);
}, []);
```

---

## Styling Patterns

### Design System Tokens

Always use design system tokens from `/src/constants/design-system.ts`:

```typescript
import { spacing, borderRadius, fontSize, fontWeight, shadow } from "@/constants/design-system";

// Spacing values
spacing.xs    // 4
spacing.sm    // 8
spacing.md    // 16
spacing.lg    // 24
spacing.xl    // 32
spacing.xxl   // 48

// Border radius
borderRadius.xs   // 2
borderRadius.sm   // 4
borderRadius.md   // 8
borderRadius.lg   // 12
borderRadius.xl   // 16
borderRadius.full // 9999

// Font sizes
fontSize.xs    // 12
fontSize.sm    // 14
fontSize.base  // 16
fontSize.lg    // 18
fontSize.xl    // 20
fontSize["2xl"] // 24
fontSize["3xl"] // 30

// Font weights
fontWeight.normal    // "400"
fontWeight.medium    // "500"
fontWeight.semibold  // "600"
fontWeight.bold      // "700"
```

### Theme Colors

```typescript
import { useTheme } from "@/lib/theme";

const { colors, isDark } = useTheme();

// Primary colors
colors.primary
colors.primaryForeground

// Semantic colors
colors.success
colors.warning
colors.destructive
colors.error
colors.info

// Background colors
colors.background
colors.foreground
colors.card
colors.border
colors.input
colors.muted
colors.mutedForeground
```

### Extended Colors for Tables

```typescript
import { extendedColors } from "@/lib/theme/extended-colors";

// Neutral colors
extendedColors.neutral[50]
extendedColors.neutral[100]
extendedColors.neutral[200]
// ... up to 900

// Other color palettes
extendedColors.red[...]
extendedColors.green[...]
extendedColors.blue[...]
extendedColors.yellow[...]
// etc.
```

### Card Layouts

```typescript
// Standard card structure
<Card>
  <CardHeader>
    <CardTitle style={styles.sectionTitle}>
      <View style={styles.titleRow}>
        <View style={[styles.titleIcon, { backgroundColor: colors.primary + "10" }]}>
          <IconComponent size={18} color={colors.primary} />
        </View>
        <ThemedText style={[styles.titleText, { color: colors.foreground }]}>
          Title Text
        </ThemedText>
      </View>
    </CardTitle>
  </CardHeader>
  <CardContent>
    {/* Card content */}
  </CardContent>
</Card>

// Standard card styles
const styles = StyleSheet.create({
  sectionTitle: {
    flexDirection: "row",
    alignItems: "center",
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  titleIcon: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  titleText: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
  },
});
```

### Field Display Patterns

```typescript
// Info row pattern (label + value)
<View style={styles.infoRow}>
  <ThemedText style={[styles.infoLabel, { color: colors.mutedForeground }]}>
    Label
  </ThemedText>
  <ThemedText style={[styles.infoValue, { color: colors.foreground }]}>
    Value
  </ThemedText>
</View>

// Field row pattern (with background)
<View style={[styles.fieldRow, { backgroundColor: colors.muted + "50" }]}>
  <ThemedText style={[styles.fieldLabel, { color: colors.mutedForeground }]}>
    Label
  </ThemedText>
  <ThemedText style={[styles.fieldValue, { color: colors.foreground }]}>
    Value
  </ThemedText>
</View>

// Info item with icon
<View style={styles.infoItem}>
  <View style={[styles.infoIcon, { backgroundColor: colors.primary + "10" }]}>
    <IconComponent size={18} color={colors.primary} />
  </View>
  <View style={styles.infoText}>
    <ThemedText style={[styles.infoLabel, { color: colors.mutedForeground }]}>
      Label
    </ThemedText>
    <ThemedText style={[styles.infoValue, { color: colors.foreground }]}>
      Value
    </ThemedText>
  </View>
</View>

const styles = StyleSheet.create({
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: spacing.sm,
  },
  infoLabel: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  infoValue: {
    fontSize: fontSize.sm,
    textAlign: "right",
    flex: 1,
    marginLeft: spacing.md,
  },
  fieldRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
  },
  fieldLabel: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  fieldValue: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  infoIcon: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  infoText: {
    flex: 1,
  },
});
```

### Badge System

```typescript
import { Badge } from "@/components/ui/badge";
import { getBadgeVariant } from '@/constants/badge-colors';

// Usage
const statusVariant = getBadgeVariant(entity.status, "ENTITY_TYPE");

<Badge variant={statusVariant} size="sm">
  {getStatusLabel(entity.status)}
</Badge>

// Badge variants
variant="default"      // Primary color
variant="secondary"    // Muted color
variant="success"      // Green
variant="destructive"  // Red
variant="warning"      // Yellow/Orange
variant="info"         // Blue
variant="outline"      // Transparent with border

// Badge sizes
size="sm"    // Small
size="default" // Default
size="lg"    // Large
```

---

## Navigation Patterns

### Route Structure

```typescript
// /src/constants/routes.ts

export const routes = {
  {module}: {
    {entity}: {
      list: "/{module}/{entity}/list",
      create: "/{module}/{entity}/create",
      edit: (id: string) => `/{module}/{entity}/edit/${id}`,
      details: (id: string) => `/{module}/{entity}/details/${id}`,
    },
  },
};
```

### Navigation Implementation

```typescript
import { useRouter } from "expo-router";
import { routes } from '@/constants';
import { routeToMobilePath } from "@/lib/route-mapper";

const router = useRouter();

// Navigate to list
router.push(routeToMobilePath(routes.{module}.{entity}.list) as any);

// Navigate to create
router.push(routeToMobilePath(routes.{module}.{entity}.create) as any);

// Navigate to details
router.push(routeToMobilePath(routes.{module}.{entity}.details(id)) as any);

// Navigate to edit
router.push(routeToMobilePath(routes.{module}.{entity}.edit(id)) as any);

// Navigate back
router.back();

// Replace (no history)
router.replace(routeToMobilePath(routes.{module}.{entity}.list) as any);
```

### Parameter Passing

```typescript
// With URL params (preferred for IDs)
router.push(routeToMobilePath(routes.{module}.{entity}.details(id)) as any);

// With query params (for optional data)
router.push({
  pathname: routeToMobilePath(routes.{module}.{entity}.create) as any,
  params: { duplicateFrom: sourceId },
});

// Receiving params
import { useLocalSearchParams } from "expo-router";

const params = useLocalSearchParams<{ id: string; duplicateFrom?: string }>();
const id = params?.id || "";
const duplicateFrom = params?.duplicateFrom;
```

---

## Performance Optimization

### FlatList Optimization

```typescript
<FlatList
  data={items}
  renderItem={renderRow}
  keyExtractor={(item) => item.id}
  // Performance props
  removeClippedSubviews={true}
  maxToRenderPerBatch={10}
  windowSize={5}
  initialNumToRender={15}
  updateCellsBatchingPeriod={50}
  getItemLayout={(data, index) => ({
    length: 50, // Fixed row height
    offset: 50 * index,
    index,
  })}
  // Infinite scroll
  onEndReached={onEndReached}
  onEndReachedThreshold={0.2}
  // Pull to refresh
  refreshControl={
    <RefreshControl
      refreshing={refreshing}
      onRefresh={onRefresh}
      colors={[colors.primary]}
      tintColor={colors.primary}
    />
  }
/>
```

### React.memo Usage

```typescript
// Wrap components in React.memo to prevent unnecessary re-renders
export const EntityTable = React.memo<EntityTableProps>(({
  items,
  onItemPress,
  // ... props
}) => {
  // Component implementation
});

EntityTable.displayName = "EntityTable";
```

### useCallback for Event Handlers

```typescript
// Always use useCallback for event handlers passed to child components
const handleItemPress = useCallback((id: string) => {
  router.push(routeToMobilePath(routes.{module}.{entity}.details(id)) as any);
}, [router]);

const handleSort = useCallback((configs: SortConfig[]) => {
  setSortConfigs(configs);
}, []);
```

### useMemo for Expensive Computations

```typescript
// Use useMemo for computed values
const displayColumns = useMemo(() => {
  const columnWidthRatios: Record<string, number> = { /* ... */ };
  const visible = allColumns.filter((col) => visibleColumnKeys.includes(col.key));
  const totalRatio = visible.reduce((sum, col) =>
    sum + (columnWidthRatios[col.key] || 1.0), 0
  );

  return visible.map((col) => {
    const ratio = columnWidthRatios[col.key] || 1.0;
    const width = Math.floor((availableWidth * ratio) / totalRatio);
    return { ...col, width };
  });
}, [allColumns, visibleColumnKeys]);

const activeFilterCount = useMemo(() => {
  return Object.entries(filters).filter(
    ([key, value]) => value !== undefined && value !== null &&
    (Array.isArray(value) ? value.length > 0 : true)
  ).length;
}, [filters]);
```

### Debounced Search

```typescript
// SearchBar component handles debouncing internally
<SearchBar
  value={displaySearchText}
  onChangeText={setDisplaySearchText}  // Updates immediately for UI
  onSearch={setSearchText}             // Debounced, triggers API call
  placeholder="Buscar..."
  debounceMs={300}
/>
```

---

## Accessibility Guidelines

### Touch Targets

```typescript
// Minimum touch target size: 44x44 points
<TouchableOpacity
  style={{
    minWidth: 44,
    minHeight: 44,
    justifyContent: "center",
    alignItems: "center",
  }}
>
  <Icon size={20} />
</TouchableOpacity>

// Add hitSlop for small touch targets
<TouchableOpacity
  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
>
  <Icon size={16} />
</TouchableOpacity>
```

### Keyboard Navigation

```typescript
// Always provide keyboard types
<Input
  keyboardType="numeric"  // For numbers
  keyboardType="email-address"  // For emails
  keyboardType="phone-pad"  // For phone numbers
/>

// Auto-capitalize appropriately
<Input
  autoCapitalize="words"  // For names
  autoCapitalize="none"   // For emails/usernames
/>
```

### Screen Reader Support

```typescript
// Add accessible labels
<TouchableOpacity
  accessibilityLabel="Edit user"
  accessibilityHint="Double tap to edit user details"
>
  <IconEdit size={20} />
</TouchableOpacity>

// Mark decorative images
<Image
  source={logo}
  accessibilityRole="image"
  accessibilityLabel="Company logo"
/>

// Group related content
<View accessibilityRole="header">
  <ThemedText>Section Title</ThemedText>
</View>
```

### Color Contrast

```typescript
// Always use theme colors for proper contrast
<ThemedText style={{ color: colors.foreground }}>
  Main text
</ThemedText>

<ThemedText style={{ color: colors.mutedForeground }}>
  Secondary text
</ThemedText>

// Don't rely on color alone for information
<Badge variant="destructive">
  <IconAlert size={12} />  // Icon provides additional context
  <ThemedText>Error</ThemedText>
</Badge>
```

---

## Implementation Checklist

### Creating a New List Page

- [ ] Create page file: `/src/app/(tabs)/{module}/{entity}/list.tsx`
- [ ] Import required hooks: `use{Entity}sInfiniteMobile`, `use{Entity}Mutations`
- [ ] Set up state variables (search, filters, sorting, selection)
- [ ] Implement `buildOrderBy()` function
- [ ] Create query parameters object
- [ ] Implement event handlers (refresh, search, filter, sort, CRUD)
- [ ] Add loading state with skeleton
- [ ] Add error state with retry
- [ ] Add empty state (no data vs no results)
- [ ] Implement search bar with debouncing
- [ ] Add filter button with badge
- [ ] Add filter tags component
- [ ] Add table component
- [ ] Add items count display
- [ ] Add FAB for create action
- [ ] Add filter modal/drawer
- [ ] Style with design system tokens
- [ ] Test infinite scroll
- [ ] Test pull to refresh
- [ ] Test swipe actions
- [ ] Test multi-select
- [ ] Test sorting
- [ ] Test filtering

### Creating a New Detail Page

- [ ] Create page file: `/src/app/(tabs)/{module}/{entity}/details/[id].tsx`
- [ ] Import required hook: `use{Entity}`
- [ ] Set up refreshing state
- [ ] Extract ID from params
- [ ] Configure include relationships
- [ ] Add loading state with skeleton
- [ ] Add error state
- [ ] Add header with back button
- [ ] Add refresh action
- [ ] Add edit action
- [ ] Create main entity card component
- [ ] Add additional info cards
- [ ] Add system info card
- [ ] Add changelog timeline
- [ ] Add bottom spacing for navigation
- [ ] Implement refresh control
- [ ] Style with design system tokens
- [ ] Test refresh
- [ ] Test navigation (back, edit)
- [ ] Test on different screen sizes

### Creating Entity Components

#### Detail Card Component
- [ ] Create file: `/src/components/{module}/{entity}/detail/{entity}-card.tsx`
- [ ] Define props interface
- [ ] Add header section with avatar/icon
- [ ] Add entity name and status badges
- [ ] Add quick info grid with icons
- [ ] Style with design system tokens
- [ ] Export from index.ts

#### Table Component
- [ ] Create file: `/src/components/{module}/{entity}/list/{entity}-table.tsx`
- [ ] Define column definitions with accessors
- [ ] Define default visible columns
- [ ] Implement sort handler
- [ ] Implement selection handlers
- [ ] Implement render functions (header, row, footer, empty)
- [ ] Add loading states
- [ ] Add swipe actions support
- [ ] Style with design system tokens
- [ ] Export interfaces and component

#### Filter Modal/Drawer
- [ ] Create file: `/src/components/{module}/{entity}/list/{entity}-filter-modal.tsx`
- [ ] Define filter state interface
- [ ] Load filter options via hooks
- [ ] Implement collapsible sections
- [ ] Add filter controls (combobox, switch, range)
- [ ] Calculate active filter count
- [ ] Implement apply/clear handlers
- [ ] Style with design system tokens

#### Filter Tags
- [ ] Create file: `/src/components/{module}/{entity}/list/{entity}-filter-tags.tsx`
- [ ] Load filter options for labels
- [ ] Implement tag rendering for each filter type
- [ ] Implement individual tag removal
- [ ] Add clear all button
- [ ] Style with design system tokens

#### Skeleton Components
- [ ] Create list skeleton: `/src/components/{module}/{entity}/skeleton/{entity}-list-skeleton.tsx`
- [ ] Create detail skeleton: `/src/components/{module}/{entity}/skeleton/{entity}-detail-skeleton.tsx`
- [ ] Match skeleton to actual layout
- [ ] Use SkeletonCard component

---

## File Structure Template

```
/src
├── app
│   └── (tabs)
│       └── {module}
│           └── {entity}
│               ├── list.tsx                    # List page
│               ├── create.tsx                  # Create page
│               ├── edit
│               │   └── [id].tsx               # Edit page
│               └── details
│                   └── [id].tsx               # Detail page
│
├── components
│   └── {module}
│       └── {entity}
│           ├── detail
│           │   ├── {entity}-card.tsx          # Main detail card
│           │   ├── [specific-cards].tsx       # Additional cards
│           │   └── index.ts                   # Exports
│           ├── list
│           │   ├── {entity}-table.tsx         # Table component
│           │   ├── {entity}-table-row-swipe.tsx  # Swipe wrapper
│           │   ├── {entity}-filter-modal.tsx  # Simple filter modal
│           │   ├── {entity}-filter-drawer.tsx # Complex filter drawer
│           │   ├── {entity}-filter-tags.tsx   # Active filters
│           │   └── column-visibility-drawer.tsx  # Column manager
│           ├── form
│           │   ├── {entity}-form.tsx          # Create form
│           │   └── {entity}-edit-form.tsx     # Edit form
│           └── skeleton
│               ├── {entity}-list-skeleton.tsx # List loading
│               └── {entity}-detail-skeleton.tsx # Detail loading
│
├── hooks
│   ├── use-{entity}.ts                        # Single entity query
│   ├── use-{entity}s.ts                       # List query
│   ├── use-{entity}s-infinite.ts              # Infinite scroll
│   ├── use-{entity}s-infinite-mobile.ts       # Mobile infinite
│   └── use-{entity}-mutations.ts              # CRUD mutations
│
├── constants
│   ├── routes.ts                              # Route definitions
│   ├── badge-colors.ts                        # Badge variants
│   └── {entity}-constants.ts                  # Entity constants
│
└── types
    └── {entity}.ts                            # Entity types
```

---

## Best Practices Summary

### DO's

1. **Use design system tokens** for all spacing, colors, and typography
2. **Wrap event handlers in useCallback** to prevent re-renders
3. **Use useMemo for computed values** that are passed to child components
4. **Implement proper loading states** with skeleton screens
5. **Handle errors gracefully** with retry capability
6. **Use React.memo** for components that receive stable props
7. **Implement proper accessibility** with labels and touch targets
8. **Follow naming conventions** consistently
9. **Use infinite scroll** for large datasets
10. **Debounce search inputs** to reduce API calls
11. **Show active filters** with removable tags
12. **Provide empty states** with actionable messages
13. **Use swipe actions** for mobile-friendly interactions
14. **Implement pull to refresh** on list pages
15. **Add changelog timeline** to detail pages

### DON'Ts

1. **Don't hardcode colors or spacing** - use design system tokens
2. **Don't forget loading and error states**
3. **Don't render all items at once** - use FlatList with proper optimization
4. **Don't create inline functions** in render - use useCallback
5. **Don't fetch data on every render** - use proper dependencies
6. **Don't ignore TypeScript warnings**
7. **Don't skip accessibility features**
8. **Don't create deeply nested component trees**
9. **Don't duplicate code** - extract reusable components
10. **Don't forget to cleanup subscriptions** in useEffect

---

## Code Quality Standards

### TypeScript

- Use proper type definitions for all props and state
- Avoid `any` type - use specific types or `unknown`
- Define interfaces for complex objects
- Export types that are used in multiple files

### Component Structure

```typescript
// 1. Imports (grouped)
import React, { useState, useCallback } from "react";
import { View, StyleSheet } from "react-native";
import { useRouter } from "expo-router";

// 2. Types/Interfaces
interface ComponentProps {
  // ...
}

// 3. Component
export default function Component({ prop }: ComponentProps) {
  // 3a. Hooks
  const router = useRouter();
  const { colors } = useTheme();

  // 3b. State
  const [state, setState] = useState();

  // 3c. Event handlers
  const handleEvent = useCallback(() => {
    // ...
  }, [dependencies]);

  // 3d. Effects
  useEffect(() => {
    // ...
  }, [dependencies]);

  // 3e. Render
  return (
    // ...
  );
}

// 4. Styles
const styles = StyleSheet.create({
  // ...
});
```

### Error Handling

```typescript
// Always wrap async operations in try-catch
const handleAction = useCallback(async () => {
  try {
    await performAction();
    showToast({ message: "Success", type: "success" });
  } catch (error) {
    console.error("Action failed:", error);
    Alert.alert("Error", "Action failed. Please try again.");
  }
}, [dependencies]);

// Use ErrorBoundary for component errors
<TableErrorBoundary onRetry={handleRefresh}>
  <EntityTable items={items} />
</TableErrorBoundary>
```

---

## Conclusion

This design system provides a comprehensive blueprint for building consistent, performant, and accessible list and detail pages across the mobile application. By following these patterns and guidelines, developers can:

1. **Maintain consistency** across all entity pages
2. **Reduce development time** with reusable patterns
3. **Improve code quality** with established best practices
4. **Enhance user experience** with optimized performance
5. **Ensure accessibility** for all users

When implementing new entity pages, refer to this document and use the existing User, Customer, and Items pages as reference implementations.

For questions or clarifications, consult the existing implementations:
- **User Pages**: `/src/app/(tabs)/administration/users/` and `/src/components/administration/user/`
- **Items Pages**: `/src/app/(tabs)/inventory/products/` and `/src/components/inventory/item/`
- **Customer Pages**: `/src/components/administration/customer/`
