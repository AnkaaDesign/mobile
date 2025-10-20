import React, { useState, useMemo, useCallback } from "react";
import { View, FlatList, RefreshControl, StyleSheet } from "react-native";
import { router } from "expo-router";
import { FAB } from "@/components/ui/fab";
import { SearchBar } from "@/components/ui/search-bar";
import { ListActionButton } from "@/components/ui/list-action-button";
import { TaskTable, createColumnDefinitions } from "@/components/production/task/list/task-table";
import { getDefaultVisibleColumns } from "@/components/production/task/list/column-visibility-manager";
import { ColumnVisibilityDrawerV2 } from "@/components/inventory/item/list/column-visibility-drawer-v2";
import { IconButton } from "@/components/ui/icon-button";
import { ThemedText } from "@/components/ui/themed-text";
import { useTheme } from "@/lib/theme";
import { useAuth } from "@/contexts/auth-context";
import { useTasksInfiniteMobile } from "@/hooks/use-tasks-infinite-mobile";
import { useTaskMutations } from '../../../../hooks';
import { spacing } from "@/constants/design-system";
import { TASK_STATUS, SECTOR_PRIVILEGES, TASK_STATUS_LABELS } from '../../../../constants';
import { hasPrivilege, groupTasksBySector } from '../../../../utils';
import type { Task } from '../../../../types';
import { useDebounce } from "@/hooks/use-debounce";
import { showToast } from "@/components/ui/toast";
import { Alert, ActivityIndicator } from "react-native";
import { IconList } from "@tabler/icons-react-native";

// Type for sector group data
type SectorGroup = {
  sectorName: string;
  tasks: Task[];
};

export default function ScheduleListScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const { delete: deleteTask, update } = useTaskMutations();

  // Filter states - simplified for schedule view (only search, no filter drawer)
  const [searchQuery, setSearchQuery] = useState("");

  // Column visibility state
  const [showColumnManager, setShowColumnManager] = useState(false);
  const [visibleColumnKeys, setVisibleColumnKeys] = useState<string[]>(Array.from(getDefaultVisibleColumns()));

  // Debounced search
  const debouncedSearch = useDebounce(searchQuery, 500);

  // Check user permissions
  const canCreate = hasPrivilege(user, SECTOR_PRIVILEGES.WAREHOUSE);
  const canEdit = hasPrivilege(user, SECTOR_PRIVILEGES.WAREHOUSE);
  const canDelete = hasPrivilege(user, SECTOR_PRIVILEGES.ADMIN);
  const isProduction = user?.sector?.name === "Produção";
  const isAdmin = hasPrivilege(user, SECTOR_PRIVILEGES.ADMIN);

  // Build query params with sector filtering
  // Schedule view shows: PENDING, IN_PRODUCTION, ON_HOLD tasks by default, sorted by deadline (term)
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
      orderBy: { term: "asc" }, // Always sort by deadline for schedule view
    };

    const whereConditions: any[] = [];

    // Default status filter for schedule view
    whereConditions.push({
      status: {
        in: [TASK_STATUS.PENDING, TASK_STATUS.IN_PRODUCTION, TASK_STATUS.ON_HOLD],
      },
    });

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
  }, [debouncedSearch, isProduction, user?.sectorId]);

  // Fetch tasks
  const {
    items: tasks,
    loadMore: fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    error,
    refetch,
    isRefetching,
  } = useTasksInfiniteMobile({ ...queryParams, enabled: true });

  // Handle refresh
  const handleRefresh = async () => {
    await refetch();
    showToast({ message: "Lista atualizada", type: "success" });
  };

  // Handle task actions
  const handleEditTask = (taskId: string) => {
    if (!canEdit) {
      showToast({ message: "Você não tem permissão para editar tarefas", type: "error" });
      return;
    }
    router.push(`/production/schedule/edit/${taskId}`);
  };

  const handleDeleteTask = (taskId: string) => {
    if (!canDelete) {
      showToast({ message: "Você não tem permissão para excluir tarefas", type: "error" });
      return;
    }

    Alert.alert(
      "Excluir Tarefa",
      "Tem certeza que deseja excluir esta tarefa? Esta ação não pode ser desfeita.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Excluir",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteTask(taskId);
              showToast({ message: "Tarefa excluída com sucesso", type: "success" });
            } catch (error) {
              showToast({ message: "Erro ao excluir tarefa", type: "error" });
            }
          },
        },
      ]
    );
  };

  const handleStatusChange = async (taskId: string, newStatus: TASK_STATUS) => {
    if (!canEdit) {
      showToast({ message: "Você não tem permissão para alterar o status", type: "error" });
      return;
    }

    try {
      const updateData: any = { status: newStatus };

      // Add timestamps based on status
      if (newStatus === TASK_STATUS.IN_PRODUCTION) {
        updateData.startedAt = new Date();
      } else if (newStatus === TASK_STATUS.COMPLETED) {
        updateData.finishedAt = new Date();
      }

      await update({ id: taskId, data: updateData });
      showToast({ message: `Status alterado para ${TASK_STATUS_LABELS[newStatus as keyof typeof TASK_STATUS_LABELS]}`, type: "success" });
    } catch (error) {
      showToast({ message: "Erro ao alterar status", type: "error" });
    }
  };

  const handleTaskPress = (taskId: string) => {
    router.push(`/production/schedule/details/${taskId}`);
  };


  // Group tasks by sector and convert to array for FlatList
  const sectorGroups = useMemo(() => {
    if (!tasks) return [];

    const grouped = groupTasksBySector(tasks);

    // For admin, return all sectors
    let sectorsToShow = grouped;

    // For non-admin users, return only their sector and "Sem setor"
    if (!isAdmin) {
      const userSectorName = user?.sector?.name || "";
      const filtered: Record<string, Task[]> = {};

      if (grouped[userSectorName]) {
        filtered[userSectorName] = grouped[userSectorName];
      }
      if (grouped["Sem setor"]) {
        filtered["Sem setor"] = grouped["Sem setor"];
      }

      sectorsToShow = filtered;
    }

    // Convert to array format for FlatList
    return Object.entries(sectorsToShow).map(([sectorName, sectorTasks]): SectorGroup => ({
      sectorName,
      tasks: sectorTasks,
    }));
  }, [tasks, isAdmin, user?.sector?.name]);


  // Get all column definitions
  const allColumns = useMemo(() => createColumnDefinitions(), []);

  // Handle columns change
  const handleColumnsChange = useCallback((newColumns: Set<string>) => {
    setVisibleColumnKeys(Array.from(newColumns));
  }, []);

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <ThemedText style={styles.errorText}>Erro ao carregar tarefas</ThemedText>
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
    <View style={StyleSheet.flatten([styles.container, { backgroundColor: colors.background }])}>
      {/* Header */}
      <View style={StyleSheet.flatten([styles.header, { backgroundColor: colors.background }])}>
        <SearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Buscar tarefas..."
          style={styles.searchBar}
        />
        <View style={styles.headerActions}>
          <ListActionButton
            icon={<IconList size={20} color={colors.foreground} />}
            onPress={() => setShowColumnManager(true)}
            badgeCount={visibleColumnKeys.length}
            badgeVariant="primary"
          />
        </View>
      </View>

      {/* Sector notice for production users */}
      {isProduction && !hasPrivilege(user, SECTOR_PRIVILEGES.ADMIN) && (
        <View style={StyleSheet.flatten([styles.notice, { backgroundColor: colors.primary + "10" }])}>
          <ThemedText style={StyleSheet.flatten([styles.noticeText, { color: colors.primary }])}>
            Exibindo tarefas do seu setor e não atribuídas
          </ThemedText>
        </View>
      )}

      {/* Task list grouped by sector */}
      {isLoading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <ThemedText style={styles.loadingText}>Carregando tarefas...</ThemedText>
        </View>
      ) : (
        <FlatList
          data={sectorGroups}
          keyExtractor={(item) => item.sectorName}
          renderItem={({ item }) => (
            <View style={styles.sectorGroup}>
              <ThemedText style={styles.sectorTitle}>{item.sectorName}</ThemedText>
              <TaskTable
                tasks={item.tasks}
                onTaskPress={handleTaskPress}
                onTaskEdit={canEdit ? handleEditTask : undefined}
                onTaskDelete={canDelete ? handleDeleteTask : undefined}
                onTaskStatusChange={canEdit ? handleStatusChange : undefined}
                onEndReached={() => {
                  if (hasNextPage && !isFetchingNextPage) {
                    fetchNextPage();
                  }
                }}
                loadingMore={isFetchingNextPage}
                enableSwipeActions={true}
                visibleColumnKeys={visibleColumnKeys}
              />
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <ThemedText style={styles.emptyText}>Nenhuma tarefa encontrada</ThemedText>
            </View>
          }
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={handleRefresh} colors={[colors.primary]} tintColor={colors.primary} />
          }
          contentContainerStyle={sectorGroups.length === 0 ? styles.emptyListContainer : undefined}
        />
      )}

      {/* FAB */}
      {canCreate && (
        <FAB
          icon="plus"
          onPress={() => router.push("/production/schedule/create")}
          style={styles.fab}
        />
      )}

      {/* Column Visibility Drawer */}
      <ColumnVisibilityDrawerV2
        columns={allColumns}
        visibleColumns={new Set(visibleColumnKeys)}
        onVisibilityChange={handleColumnsChange}
        open={showColumnManager}
        onOpenChange={setShowColumnManager}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 8,
    gap: 8,
  },
  searchBar: {
    flex: 1,
  },
  headerActions: {
    flexDirection: "row",
    gap: 8,
  },
  notice: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginHorizontal: spacing.md,
    marginTop: spacing.sm,
    borderRadius: 8,
  },
  noticeText: {
    fontSize: 12,
    textAlign: "center",
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
  emptyListContainer: {
    flex: 1,
  },
  sectorGroup: {
    marginBottom: spacing.lg,
  },
  sectorTitle: {
    fontSize: 14,
    fontWeight: "600",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginBottom: spacing.xs,
  },
  emptyContainer: {
    padding: spacing.xl,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 14,
    opacity: 0.6,
  },
  fab: {
    position: "absolute",
    right: spacing.md,
    bottom: spacing.xl,
  },
});
