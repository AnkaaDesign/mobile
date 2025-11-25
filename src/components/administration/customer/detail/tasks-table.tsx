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
import type { Customer } from '../../../../types';
import { routes } from "@/constants";
import { routeToMobilePath } from '@/utils/route-mapper';
import { TaskTable, createColumnDefinitions } from "@/components/production/task/list/task-table";

import { SlideInPanel } from "@/components/ui/slide-in-panel";
import { ColumnVisibilitySlidePanel } from "@/components/ui/column-visibility-slide-panel";
import { useDebounce } from "@/hooks/useDebouncedSearch";
import { useTasks } from "@/hooks";

interface TasksTableProps {
  customer: Customer;
  maxHeight?: number;
}

export function TasksTable({ customer, maxHeight = 500 }: TasksTableProps) {
  const { colors } = useTheme();

  // Column panel state
  const [isColumnPanelOpen, setIsColumnPanelOpen] = useState(false);

  // Use only name and serialNumber columns for customer detail view
  const [visibleColumnKeys, setVisibleColumnKeys] = useState<string[]>(() => {
    return ["name", "serialNumber"];
  });

  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery, 300);

  // Fetch tasks for this specific customer
  const queryParams = {
    where: {
      customerId: customer.id,
    },
    include: {
      customer: true,
      sector: true,
      generalPainting: true,
      services: {
        select: {
          id: true,
          name: true,
        },
      },
      createdBy: {
        select: {
          name: true,
          id: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
    searchingFor: debouncedSearch || undefined,
    page: 1,
    limit: 50, // Get up to 50 tasks for this customer
    enabled: true,
  };

  const {
    data: tasksResponse,
    isLoading,
    error,
  } = useTasks(queryParams);

  const tasks = tasksResponse?.data || [];

  // Get all column definitions
  const allColumns = useMemo(() => createColumnDefinitions(), []);

  // Handle columns change
  const handleColumnsChange = useCallback((newColumns: Set<string>) => {
    const newColumnsArray = Array.from(newColumns);
    setVisibleColumnKeys(newColumnsArray);
    // Note: In React Native, we would use AsyncStorage to persist preferences
  }, []);

  // Get default visible columns (for the customer detail view)
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

  // Don't rely on totalTasks from _count since it might not be accurate
  // Instead, check if we're still loading or have actual data
  if (!isLoading && tasks.length === 0 && !searchQuery) {
    return (
      <>
        <Card style={styles.card}>
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <View style={styles.headerLeft}>
              <IconClipboardList size={20} color={colors.mutedForeground} />
              <ThemedText style={styles.title}>Tarefas Relacionadas</ThemedText>
            </View>
          </View>
          <View style={styles.content}>
            <View style={StyleSheet.flatten([styles.emptyState, { backgroundColor: colors.muted + "20" }])}>
              <IconAlertCircle size={48} color={colors.mutedForeground} />
              <ThemedText style={StyleSheet.flatten([styles.emptyText, { color: colors.mutedForeground }])}>
                Nenhuma tarefa associada a este cliente.
              </ThemedText>
            </View>
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

  return (
    <>
      <Card style={styles.card}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <View style={styles.headerLeft}>
          <IconClipboardList size={20} color={colors.mutedForeground} />
          <ThemedText style={styles.title}>
            Tarefas Relacionadas {tasks.length > 0 && `(${tasks.length})`}
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
        ) : tasks.length === 0 ? (
          <View style={StyleSheet.flatten([styles.emptyState, { backgroundColor: colors.muted + "20" }])}>
            <IconAlertCircle size={48} color={colors.mutedForeground} />
            <ThemedText style={StyleSheet.flatten([styles.emptyText, { color: colors.mutedForeground }])}>
              {searchQuery
                ? `Nenhuma tarefa encontrada para "${searchQuery}".`
                : "Nenhuma tarefa associada a este cliente."}
            </ThemedText>
          </View>
        ) : (
          <View style={[styles.tableContainer, { height: maxHeight || 400 }]}>
            <TaskTable
              tasks={tasks}
              onTaskPress={handleTaskPress}
              enableSwipeActions={false}
              visibleColumnKeys={visibleColumnKeys}
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
    flex: 1,
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
});
