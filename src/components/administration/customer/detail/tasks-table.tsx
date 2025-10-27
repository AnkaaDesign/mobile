import React, { useState, useMemo, useCallback } from "react";
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
import { routes, TASK_STATUS } from '../../../../constants';
import { routeToMobilePath } from "@/lib/route-mapper";
import { TaskTable, createColumnDefinitions } from "@/components/production/task/list/task-table";
import { getDefaultVisibleColumns } from "@/components/production/task/list/column-visibility-manager";
import { ColumnVisibilityDrawerV2 } from "@/components/inventory/item/list/column-visibility-drawer-v2";
import { useDebounce } from "@/hooks/use-debounce";
import { useTasks } from "@/hooks";

interface TasksTableProps {
  customer: Customer;
  maxHeight?: number;
}

// Local storage key for column preferences
const STORAGE_KEY = "customer_tasks_visible_columns";

export function TasksTable({ customer, maxHeight = 500 }: TasksTableProps) {
  const { colors } = useTheme();
  const totalTasks = customer._count?.tasks || 0;

  // Load saved column preferences from localStorage on mount
  const [visibleColumnKeys, setVisibleColumnKeys] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return Array.isArray(parsed) ? parsed : Array.from(getDefaultVisibleColumns());
      }
    } catch (error) {
      console.warn("Failed to load column preferences:", error);
    }
    return Array.from(getDefaultVisibleColumns());
  });

  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery, 300);

  // Column visibility drawer state
  const [showColumnManager, setShowColumnManager] = useState(false);

  // Fetch tasks for this customer
  const {
    data: tasksResponse,
    isLoading,
    error,
  } = useTasks({
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
    search: debouncedSearch || undefined,
    enabled: true,
  });

  const tasks = tasksResponse?.data || [];

  // Get all column definitions
  const allColumns = useMemo(() => createColumnDefinitions(), []);

  // Handle columns change and persist to localStorage
  const handleColumnsChange = useCallback((newColumns: Set<string>) => {
    const newColumnsArray = Array.from(newColumns);
    setVisibleColumnKeys(newColumnsArray);

    // Persist to localStorage
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newColumnsArray));
    } catch (error) {
      console.warn("Failed to save column preferences:", error);
    }
  }, []);

  const handleTaskPress = (taskId: string) => {
    router.push(routeToMobilePath(routes.production.schedule.details(taskId)) as any);
  };

  if (totalTasks === 0) {
    return (
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
    );
  }

  return (
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
            onPress={() => setShowColumnManager(true)}
            badgeCount={visibleColumnKeys.length}
            badgeVariant="primary"
          />
        </View>

        {/* Task Table */}
        <View style={[styles.tableContainer, maxHeight ? { maxHeight } : undefined]}>
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
            <TaskTable
              tasks={tasks}
              onTaskPress={handleTaskPress}
              enableSwipeActions={false}
              visibleColumnKeys={visibleColumnKeys}
            />
          )}
        </View>
      </View>

      {/* Column Visibility Drawer */}
      <ColumnVisibilityDrawerV2
        columns={allColumns}
        visibleColumns={new Set(visibleColumnKeys)}
        onVisibilityChange={handleColumnsChange}
        open={showColumnManager}
        onOpenChange={setShowColumnManager}
      />
    </Card>
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
    gap: spacing.md,
  },
  controlsContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.sm,
  },
  searchBar: {
    flex: 1,
  },
  tableContainer: {
    flex: 1,
  },
  loadingContainer: {
    padding: spacing.xxl,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.md,
  },
  loadingText: {
    fontSize: fontSize.sm,
    opacity: 0.7,
  },
  emptyState: {
    padding: spacing.xl,
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
