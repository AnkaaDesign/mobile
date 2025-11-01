import { useState, useMemo } from "react";
import { View, FlatList, RefreshControl, StyleSheet, TouchableOpacity } from "react-native";
import { router } from "expo-router";
import { SearchBar } from "@/components/ui/search-bar";
import { TaskTable, createColumnDefinitions } from "@/components/production/task/list/task-table";
import { getDefaultVisibleColumns } from "@/components/production/task/list/column-visibility-manager";
import { ColumnVisibilityDrawer } from "@/components/ui/column-visibility-drawer";
import { ThemedText } from "@/components/ui/themed-text";
import { useTheme } from "@/lib/theme";
import { useAuth } from "@/contexts/auth-context";
import { useTasksInfiniteMobile } from "@/hooks/use-tasks-infinite-mobile";
import { useTaskMutations } from '../../../../hooks';
import { spacing } from "@/constants/design-system";
import { TASK_STATUS, SECTOR_PRIVILEGES } from '../../../../constants';
import { hasPrivilege, groupTasksBySector } from '../../../../utils';
import type { Task } from '../../../../types';
import { useDebounce } from "@/hooks/use-debounce";
import { showToast } from "@/components/ui/toast";
import { ActivityIndicator } from "react-native";

// Type for sector group data
type SectorGroup = {
  sectorName: string;
  tasks: Task[];
};

// Tab types
type HistoryTab = "completed" | "cancelled" | "all";

export default function ProductionHistoryScreen() {
  const { colors, isDark } = useTheme();
  const { user } = useAuth();
  const { deleteAsync: deleteTask } = useTaskMutations();

  // Tab state
  const [activeTab, setActiveTab] = useState<HistoryTab>("all");

  // Filter states
  const [searchQuery, setSearchQuery] = useState("");

  // Column visibility state
  const [showColumnManager, setShowColumnManager] = useState(false);
  const [visibleColumnKeys, setVisibleColumnKeys] = useState<Set<string>>(getDefaultVisibleColumns());

  // Debounced search
  const debouncedSearch = useDebounce(searchQuery, 500);

  // Check user permissions
  const canDelete = hasPrivilege(user, SECTOR_PRIVILEGES.ADMIN);
  const isProduction = user?.sector?.name === "Produção";

  // Build query params based on active tab
  const queryParams = useMemo(() => {
    const params: any = {
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
      },
      orderBy: { updatedAt: "desc" }, // Show most recently updated first
    };

    const whereConditions: any[] = [];

    // Status filter based on active tab
    if (activeTab === "completed") {
      whereConditions.push({
        status: TASK_STATUS.COMPLETED,
      });
    } else if (activeTab === "cancelled") {
      whereConditions.push({
        status: TASK_STATUS.CANCELLED,
      });
    } else {
      // "all" tab shows both completed and cancelled
      whereConditions.push({
        status: {
          in: [TASK_STATUS.COMPLETED, TASK_STATUS.CANCELLED],
        },
      });
    }

    // Search filter
    if (debouncedSearch) {
      params.search = debouncedSearch;
    }

    // Sector-based filtering for production users
    if (isProduction && !hasPrivilege(user, SECTOR_PRIVILEGES.ADMIN)) {
      whereConditions.push({
        OR: [
          { sectorId: user?.sectorId }, // Tasks assigned to user's sector
          { sectorId: null }, // Unassigned tasks
        ],
      });
    }

    if (whereConditions.length > 0) {
      params.where = whereConditions.length === 1 ? whereConditions[0] : { AND: whereConditions };
    }

    return params;
  }, [activeTab, debouncedSearch, isProduction, user?.sectorId]);

  // Fetch tasks with infinite scroll
  const { items, loadMore: fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, isError, error, refetch } = useTasksInfiniteMobile(queryParams);

  // Flatten and group tasks by sector
  const tasksBySector = useMemo(() => {
    const grouped = groupTasksBySector(items);
    return Object.entries(grouped).map(([sectorName, tasks]) => ({
      sectorName,
      tasks,
    }));
  }, [items]);

  // Column definitions
  const columnDefinitions = useMemo(() => createColumnDefinitions(), []);

  // Handlers
  const handleLoadMore = () => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  };

  const handleTaskPress = (taskId: string) => {
    router.push(`/producao/cronograma/detalhes/${taskId}` as any);
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      await deleteTask(taskId);
      showToast({
        message: "Tarefa excluída com sucesso",
        type: "success",
      });
      refetch();
    } catch (error) {
      showToast({
        title: "Erro ao excluir tarefa",
        message: error instanceof Error ? error.message : "Ocorreu um erro desconhecido",
        type: "error",
      });
    }
  };

  // Render list header with tabs
  const ListHeaderComponent = () => (
    <View style={styles.header}>
      <ThemedText size="2xl" weight="bold" style={styles.title}>
        Histórico de Tarefas
      </ThemedText>

      {/* Tabs */}
      <View style={[styles.tabContainer, { backgroundColor: isDark ? colors.background : "#f3f4f6" }]}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "all" && { backgroundColor: colors.primary }]}
          onPress={() => setActiveTab("all")}
        >
          <ThemedText style={[styles.tabText, activeTab === "all" && styles.activeTabText]}>Todos</ThemedText>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === "completed" && { backgroundColor: colors.primary }]}
          onPress={() => setActiveTab("completed")}
        >
          <ThemedText style={[styles.tabText, activeTab === "completed" && styles.activeTabText]}>Finalizadas</ThemedText>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === "cancelled" && { backgroundColor: colors.primary }]}
          onPress={() => setActiveTab("cancelled")}
        >
          <ThemedText style={[styles.tabText, activeTab === "cancelled" && styles.activeTabText]}>Canceladas</ThemedText>
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <SearchBar
        value={searchQuery}
        onChangeText={setSearchQuery}
        placeholder="Buscar por cliente, placa, chassi..."
        style={styles.searchBar}
      />

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: colors.background }]}
          onPress={() => setShowColumnManager(true)}
        >
          <ThemedText style={styles.actionButtonText}>Colunas</ThemedText>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderSectorGroup = ({ item }: { item: SectorGroup }) => (
    <View key={item.sectorName} style={styles.sectorGroup}>
      <ThemedText size="lg" weight="semibold" style={styles.sectorTitle}>
        {item.sectorName}
      </ThemedText>
      <TaskTable
        tasks={item.tasks}
        visibleColumnKeys={Array.from(visibleColumnKeys)}
        onTaskPress={handleTaskPress}
        onTaskDelete={canDelete ? handleDeleteTask : undefined}
      />
    </View>
  );

  const ListFooterComponent = () => {
    if (isFetchingNextPage) {
      return (
        <View style={styles.loadingMore}>
          <ActivityIndicator size="small" color={colors.primary} />
        </View>
      );
    }
    return null;
  };

  const ListEmptyComponent = () => {
    if (isLoading) {
      return (
        <View style={styles.emptyState}>
          <ActivityIndicator size="large" color={colors.primary} />
          <ThemedText style={styles.emptyStateText}>Carregando histórico...</ThemedText>
        </View>
      );
    }

    if (isError) {
      return (
        <View style={styles.emptyState}>
          <ThemedText style={styles.emptyStateText}>Erro ao carregar histórico</ThemedText>
          <ThemedText style={styles.errorText}>{error?.message}</ThemedText>
        </View>
      );
    }

    return (
      <View style={styles.emptyState}>
        <ThemedText style={styles.emptyStateText}>
          {activeTab === "completed" && "Nenhuma tarefa finalizada encontrada"}
          {activeTab === "cancelled" && "Nenhuma tarefa cancelada encontrada"}
          {activeTab === "all" && "Nenhuma tarefa no histórico"}
        </ThemedText>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={tasksBySector}
        renderItem={renderSectorGroup}
        keyExtractor={(item) => item.sectorName || "unknown-sector"}
        ListHeaderComponent={ListHeaderComponent}
        ListFooterComponent={ListFooterComponent}
        ListEmptyComponent={ListEmptyComponent}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        refreshControl={<RefreshControl refreshing={isLoading && !isFetchingNextPage} onRefresh={refetch} colors={[colors.primary]} />}
        contentContainerStyle={tasksBySector.length === 0 ? styles.emptyListContent : undefined}
      />

      {/* Column Visibility Manager */}
      <ColumnVisibilityDrawer
        open={showColumnManager}
        onOpenChange={setShowColumnManager}
        columns={columnDefinitions}
        visibleColumns={visibleColumnKeys}
        onVisibilityChange={setVisibleColumnKeys}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: spacing.md,
    gap: spacing.md,
  },
  title: {
    marginBottom: spacing.sm,
  },
  tabContainer: {
    flexDirection: "row",
    borderRadius: 8,
    padding: 4,
    gap: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 6,
    alignItems: "center",
  },
  tabText: {
    fontSize: 14,
    fontWeight: "500",
  },
  activeTabText: {
    color: "#fff",
    fontWeight: "600",
  },
  searchBar: {
    marginTop: spacing.sm,
  },
  actionButtons: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  actionButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 8,
    alignItems: "center",
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: "500",
  },
  sectorGroup: {
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.md,
  },
  sectorTitle: {
    marginBottom: spacing.md,
  },
  loadingMore: {
    paddingVertical: spacing.lg,
    alignItems: "center",
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: spacing.xl * 2,
  },
  emptyStateText: {
    fontSize: 16,
    textAlign: "center",
    marginTop: spacing.md,
  },
  errorText: {
    fontSize: 14,
    textAlign: "center",
    marginTop: spacing.sm,
    opacity: 0.7,
  },
  emptyListContent: {
    flexGrow: 1,
  },
});
