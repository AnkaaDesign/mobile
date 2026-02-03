import { useState, useMemo, useCallback } from "react";
import { View, StyleSheet, ActivityIndicator } from "react-native";
import { router } from "expo-router";
import { Card } from "@/components/ui/card";
import { ThemedText } from "@/components/ui/themed-text";
import { SearchBar } from "@/components/ui/search-bar";
import { ListActionButton } from "@/components/ui/list-action-button";
import { useTheme } from "@/lib/theme";
import { spacing, fontSize } from "@/constants/design-system";
import { IconClipboardList, IconAlertCircle, IconList } from "@tabler/icons-react-native";
import type { Paint, Task } from "@/types";
import { routes } from "@/constants";
import { routeToMobilePath } from "@/utils/route-mapper";
import { TaskTable, createColumnDefinitions } from "@/components/production/task/list/task-table";
import { SlideInPanel } from "@/components/ui/slide-in-panel";
import { ColumnVisibilitySlidePanel } from "@/components/ui/column-visibility-slide-panel";
import { useDebounce } from "@/hooks/useDebouncedSearch";
import { useTasksInfiniteMobile } from "@/hooks";

interface PaintTasksCardProps {
  paint: Paint;
  maxHeight?: number;
}

export function PaintTasksCard({ paint, maxHeight = 500 }: PaintTasksCardProps) {
  const { colors } = useTheme();

  // Column panel state
  const [isColumnPanelOpen, setIsColumnPanelOpen] = useState(false);

  // Default visible columns for paint detail view
  const [visibleColumnKeys, setVisibleColumnKeys] = useState<string[]>(() => {
    return ["name", "serialNumber"];
  });

  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery, 300);

  // Fetch tasks for this specific paint with infinite scroll
  // Uses optimized select patterns for better performance
  const {
    items: tasks,
    isLoading,
    error,
    loadMore,
    canLoadMore,
    isFetchingNextPage,
    totalCount,
  } = useTasksInfiniteMobile({
    where: {
      OR: [
        { paintId: paint.id },
        { logoPaints: { some: { id: paint.id } } },
      ],
    },
    include: {
      customer: {
        select: {
          id: true,
          fantasyName: true,
        }
      },
    },
    orderBy: { createdAt: "desc" },
    enabled: !!paint.id,
  });

  // Filter tasks based on search (client-side for already loaded items)
  const filteredTasks = useMemo(() => {
    if (!debouncedSearch) return tasks;

    const searchLower = debouncedSearch.toLowerCase();
    return tasks.filter((task: Task) =>
      task.name?.toLowerCase().includes(searchLower) ||
      task.customer?.fantasyName?.toLowerCase().includes(searchLower) ||
      task.serialNumber?.toLowerCase().includes(searchLower)
    );
  }, [tasks, debouncedSearch]);

  // Get all column definitions
  const allColumns = useMemo(() => createColumnDefinitions(), []);

  // Handle columns change
  const handleColumnsChange = useCallback((newColumns: Set<string>) => {
    setVisibleColumnKeys(Array.from(newColumns));
  }, []);

  // Get default visible columns
  const getDefaultVisibleColumns = useCallback(() => {
    return ["name", "serialNumber"];
  }, []);

  // Handle opening column panel
  const handleOpenColumns = useCallback(() => {
    setIsColumnPanelOpen(true);
  }, []);

  const handleCloseColumns = useCallback(() => {
    setIsColumnPanelOpen(false);
  }, []);

  const handleTaskPress = (taskId: string) => {
    router.push(routeToMobilePath(routes.production.schedule.details(taskId)) as any);
  };

  // Don't show if no tasks and not loading
  if (!isLoading && tasks.length === 0 && !searchQuery) {
    return null;
  }

  return (
    <>
      <Card style={styles.card}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <View style={styles.headerLeft}>
            <IconClipboardList size={20} color={colors.mutedForeground} />
            <ThemedText style={styles.title}>
              Tarefas Relacionadas {tasks.length > 0 && `(${tasks.length}${totalCount ? `/${totalCount}` : ""})`}
            </ThemedText>
          </View>
        </View>

        <View style={styles.content}>
          {/* Search and Column Visibility Controls */}
          <View style={styles.controlsContainer}>
            <SearchBar
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Buscar tarefas..."
              style={styles.searchBar}
            />
            <ListActionButton
              icon={<IconList size={20} color={colors.foreground} />}
              onPress={handleOpenColumns}
              badgeCount={visibleColumnKeys.length}
              badgeVariant="primary"
            />
          </View>

          {/* Task Table */}
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
              <ThemedText style={styles.loadingText}>Carregando tarefas...</ThemedText>
            </View>
          ) : error ? (
            <View style={StyleSheet.flatten([styles.emptyState, { backgroundColor: colors.muted + "20" }])}>
              <IconAlertCircle size={48} color={colors.mutedForeground} />
              <ThemedText style={StyleSheet.flatten([styles.emptyText, { color: colors.mutedForeground }])}>
                Erro ao carregar tarefas.
              </ThemedText>
            </View>
          ) : filteredTasks.length === 0 ? (
            <View style={StyleSheet.flatten([styles.emptyState, { backgroundColor: colors.muted + "20" }])}>
              <IconAlertCircle size={48} color={colors.mutedForeground} />
              <ThemedText style={StyleSheet.flatten([styles.emptyText, { color: colors.mutedForeground }])}>
                {searchQuery
                  ? `Nenhuma tarefa encontrada para "${searchQuery}".`
                  : "Nenhuma tarefa utiliza esta tinta."}
              </ThemedText>
            </View>
          ) : (
            <View style={[styles.tableContainer, { maxHeight }]}>
              <TaskTable
                tasks={filteredTasks}
                onTaskPress={handleTaskPress}
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
    overflow: "hidden",
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
