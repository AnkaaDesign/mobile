import { useState, useMemo, useCallback } from "react";
import { View, StyleSheet, ActivityIndicator } from "react-native";
import { router } from "expo-router";
import { Card } from "@/components/ui/card";
import { ThemedText } from "@/components/ui/themed-text";
import { SearchBar } from "@/components/ui/search-bar";
import { ListActionButton } from "@/components/ui/list-action-button";
import { useTheme } from "@/lib/theme";
import { spacing, fontSize } from "@/constants/design-system";
import { IconUsers, IconAlertCircle, IconList } from "@tabler/icons-react-native";
import type { Position } from '../../../../types';
import { routes } from "@/constants";
import { routeToMobilePath } from '@/utils/route-mapper';
import { UserTable } from "@/components/administration/user/list/user-table";

import { SlideInPanel } from "@/components/ui/slide-in-panel";
import { ColumnVisibilitySlidePanel } from "@/components/ui/column-visibility-slide-panel";
import { useDebounce } from "@/hooks/useDebouncedSearch";
import { useUsersInfiniteMobile } from "@/hooks";

interface RelatedUsersCardProps {
  position: Position;
  maxHeight?: number;
}

// Create column definitions for the user table
const createColumnDefinitions = () => {
  return [
    { key: "name", header: "Nome" },
    { key: "sector.name", header: "Setor" },
    { key: "email", header: "Email" },
    { key: "phone", header: "Telefone" },
    { key: "status", header: "Status" },
  ];
};

export function RelatedUsersCard({ position, maxHeight = 500 }: RelatedUsersCardProps) {
  const { colors } = useTheme();

  // Column panel state
  const [isColumnPanelOpen, setIsColumnPanelOpen] = useState(false);

  // Default to name and sector columns
  const [visibleColumnKeys, setVisibleColumnKeys] = useState<string[]>(() => {
    return ["name", "sector.name"];
  });

  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery, 300);

  // Fetch users for this specific position with infinite scroll
  const {
    items: users,
    isLoading,
    error,
    loadMore,
    canLoadMore,
    isFetchingNextPage,
    totalCount,
  } = useUsersInfiniteMobile({
    where: {
      positionId: position.id,
    },
    include: {
      sector: true,
      position: true,
    },
    orderBy: { name: "asc" },
    enabled: !!position.id,
  });

  // Filter users based on search (client-side for already loaded items)
  const filteredUsers = useMemo(() => {
    if (!debouncedSearch) return users;

    const lowerSearch = debouncedSearch.toLowerCase();
    return users.filter((user: any) =>
      user.name?.toLowerCase().includes(lowerSearch) ||
      user.email?.toLowerCase().includes(lowerSearch) ||
      user.sector?.name?.toLowerCase().includes(lowerSearch)
    );
  }, [users, debouncedSearch]);

  // Get all column definitions
  const allColumns = useMemo(() => createColumnDefinitions(), []);

  // Handle columns change
  const handleColumnsChange = useCallback((newColumns: Set<string>) => {
    setVisibleColumnKeys(Array.from(newColumns));
  }, []);

  // Get default visible columns
  const getDefaultVisibleColumns = useCallback(() => {
    return ["name", "sector.name"];
  }, []);

  // Handle opening column panel
  const handleOpenColumns = useCallback(() => {
    setIsColumnPanelOpen(true);
  }, []);

  const handleCloseColumns = useCallback(() => {
    setIsColumnPanelOpen(false);
  }, []);

  const handleUserPress = (userId: string) => {
    router.push(routeToMobilePath(routes.administration.users.details(userId)) as any);
  };

  // Don't show if no users and not loading
  if (!isLoading && users.length === 0 && !searchQuery) {
    return null;
  }

  return (
    <>
      <Card style={styles.card}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <View style={styles.headerLeft}>
            <IconUsers size={20} color={colors.mutedForeground} />
            <ThemedText style={styles.title}>
              Funcionários com este Cargo {users.length > 0 && `(${users.length}${totalCount ? `/${totalCount}` : ""})`}
            </ThemedText>
          </View>
        </View>

        <View style={styles.content}>
          {/* Search and Column Visibility Controls */}
          <View style={styles.controlsContainer}>
            <SearchBar
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Buscar funcionários..."
              style={styles.searchBar}
            />
            <ListActionButton
              icon={<IconList size={20} color={colors.foreground} />}
              onPress={handleOpenColumns}
              badgeCount={visibleColumnKeys.length}
              badgeVariant="primary"
            />
          </View>

          {/* User Table */}
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
              <ThemedText style={styles.loadingText}>Carregando funcionários...</ThemedText>
            </View>
          ) : error ? (
            <View style={StyleSheet.flatten([styles.emptyState, { backgroundColor: colors.muted + "20" }])}>
              <IconAlertCircle size={48} color={colors.mutedForeground} />
              <ThemedText style={StyleSheet.flatten([styles.emptyText, { color: colors.mutedForeground }])}>
                Erro ao carregar funcionários.
              </ThemedText>
            </View>
          ) : filteredUsers.length === 0 ? (
            <View style={StyleSheet.flatten([styles.emptyState, { backgroundColor: colors.muted + "20" }])}>
              <IconAlertCircle size={48} color={colors.mutedForeground} />
              <ThemedText style={StyleSheet.flatten([styles.emptyText, { color: colors.mutedForeground }])}>
                {searchQuery
                  ? `Nenhum funcionário encontrado para "${searchQuery}".`
                  : "Nenhum funcionário com este cargo."}
              </ThemedText>
            </View>
          ) : (
            <View style={[styles.tableContainer, { maxHeight }]}>
              <UserTable
                users={filteredUsers}
                onUserPress={handleUserPress}
                enableSwipeActions={false}
                visibleColumnKeys={visibleColumnKeys}
                onEndReached={() => canLoadMore && loadMore()}
                onEndReachedThreshold={0.5}
                ListFooterComponent={
                  isFetchingNextPage ? (
                    <View style={styles.footerLoader}>
                      <ActivityIndicator size="small" color={colors.primary} />
                    </View>
                  ) : null
                }
              />
            </View>
          )}
        </View>
      </Card>

      <SlideInPanel isOpen={isColumnPanelOpen} onClose={handleCloseColumns}>
        <ColumnVisibilitySlidePanel
          columns={allColumns}
          visibleColumns={new Set(visibleColumnKeys)}
          onVisibilityChange={handleColumnsChange}
          onClose={handleCloseColumns}
          defaultColumns={new Set(getDefaultVisibleColumns())}
        />
      </SlideInPanel>
    </>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: spacing.md,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  title: {
    fontSize: fontSize.lg,
    fontWeight: "500",
  },
  content: {
    gap: spacing.sm,
  },
  controlsContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  searchBar: {
    flex: 1,
  },
  tableContainer: {
    minHeight: 200,
    overflow: 'hidden',
    marginHorizontal: -8,
  },
  loadingContainer: {
    paddingVertical: spacing.xxl,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.md,
  },
  loadingText: {
    fontSize: fontSize.sm,
    opacity: 0.7,
  },
  emptyState: {
    paddingVertical: spacing.xl,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.md,
  },
  emptyText: {
    fontSize: fontSize.sm,
    textAlign: "center",
  },
  footerLoader: {
    paddingVertical: spacing.md,
    alignItems: "center",
  },
});
