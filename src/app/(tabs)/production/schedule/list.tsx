import React, { useState, useMemo, useCallback } from "react";
import { View, ScrollView, RefreshControl, StyleSheet } from "react-native";
import { router } from "expo-router";
import { FAB } from "@/components/ui/fab";
import { Badge } from "@/components/ui/badge";
import { SearchBar } from "@/components/ui/search-bar";
import { Button } from "@/components/ui/button";
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
import { hasPrivilege } from '../../../../utils';
import type { Task } from '../../../../types';
import { FilterModal, FilterTag } from "@/components/ui/filter-modal";
import { useDebounce } from "@/hooks/use-debounce";
import { showToast } from "@/components/ui/toast";
import { Alert, ActivityIndicator } from "react-native";
import { IconList, IconFilter } from "@tabler/icons-react-native";

export default function ScheduleListScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const { delete: deleteTask, update } = useTaskMutations();

  // Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<TASK_STATUS[]>([
    TASK_STATUS.PENDING,
    TASK_STATUS.IN_PRODUCTION,
    TASK_STATUS.ON_HOLD,
  ]);
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState<"createdAt" | "term" | "priority">("term");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  // Selection state
  const [selectedTasks, setSelectedTasks] = useState<Set<string>>(new Set());
  const [isSelectionMode, setIsSelectionMode] = useState(false);

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

  // Build query params with sector filtering
  const queryParams = useMemo(() => {
    const params: any = {
      include: {
        customer: true,
        sector: true,
        services: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { [sortBy]: sortOrder },
    };

    const whereConditions: any[] = [];

    // Status filter
    if (selectedStatus.length > 0) {
      whereConditions.push({ status: { in: selectedStatus } });
    }

    // Search filter
    if (debouncedSearch) {
      whereConditions.push({
        OR: [
          { name: { contains: debouncedSearch, mode: "insensitive" } },
          { serialNumber: { contains: debouncedSearch } },
          { customer: { name: { contains: debouncedSearch, mode: "insensitive" } } },
        ],
      });
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
  }, [selectedStatus, debouncedSearch, sortBy, sortOrder, isProduction, user?.sectorId]);

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

  // Handle batch actions
  const handleBatchDelete = () => {
    if (!canDelete) {
      showToast({ message: "Você não tem permissão para excluir tarefas", type: "error" });
      return;
    }

    Alert.alert(
      "Excluir Tarefas Selecionadas",
      `Tem certeza que deseja excluir ${selectedTasks.size} tarefas? Esta ação não pode ser desfeita.`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Excluir",
          style: "destructive",
          onPress: async () => {
            try {
              // Delete tasks one by one
              for (const taskId of selectedTasks) {
                await deleteTask(taskId);
              }
              showToast({ message: `${selectedTasks.size} tarefas excluídas`, type: "success" });
              setSelectedTasks(new Set());
              setIsSelectionMode(false);
            } catch (error) {
              showToast({ message: "Erro ao excluir tarefas", type: "error" });
            }
          },
        },
      ]
    );
  };

  // Filter modal content
  const renderFilterModal = () => (
    <FilterModal
      visible={showFilters}
      onClose={() => setShowFilters(false)}
      title="Filtrar Tarefas"
    >
      <View style={styles.filterSection}>
        <ThemedText style={styles.filterLabel}>Status</ThemedText>
        <View style={styles.filterOptions}>
          {Object.values(TASK_STATUS).map((status) => (
            <FilterTag
              key={status}
              label={TASK_STATUS_LABELS[status as keyof typeof TASK_STATUS_LABELS]}
              selected={selectedStatus.includes(status)}
              onPress={() => {
                if (selectedStatus.includes(status)) {
                  setSelectedStatus(selectedStatus.filter((s) => s !== status));
                } else {
                  setSelectedStatus([...selectedStatus, status]);
                }
              }}
            />
          ))}
        </View>
      </View>

      <View style={styles.filterSection}>
        <ThemedText style={styles.filterLabel}>Ordenar por</ThemedText>
        <View style={styles.filterOptions}>
          <FilterTag
            label="Data de Criação"
            selected={sortBy === "createdAt"}
            onPress={() => setSortBy("createdAt")}
          />
          <FilterTag
            label="Prazo"
            selected={sortBy === "term"}
            onPress={() => setSortBy("term")}
          />
          <FilterTag
            label="Prioridade"
            selected={sortBy === "priority"}
            onPress={() => setSortBy("priority")}
          />
        </View>
      </View>

      <View style={styles.filterSection}>
        <ThemedText style={styles.filterLabel}>Ordem</ThemedText>
        <View style={styles.filterOptions}>
          <FilterTag
            label="Crescente"
            selected={sortOrder === "asc"}
            onPress={() => setSortOrder("asc")}
          />
          <FilterTag
            label="Decrescente"
            selected={sortOrder === "desc"}
            onPress={() => setSortOrder("desc")}
          />
        </View>
      </View>
    </FilterModal>
  );

  // Active filter count
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (selectedStatus.length > 0 && selectedStatus.length !== Object.values(TASK_STATUS).length) {
      count++;
    }
    if (sortBy !== "term") count++;
    if (sortOrder !== "asc") count++;
    return count;
  }, [selectedStatus, sortBy, sortOrder]);

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
      <View style={StyleSheet.flatten([styles.header, { backgroundColor: colors.card }])}>
        <SearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Buscar tarefas..."
          style={styles.searchBar}
        />
        <View style={styles.headerActions}>
          <View style={styles.buttonWrapper}>
            <Button
              variant="outline"
              onPress={() => setShowColumnManager(true)}
              style={{ ...styles.actionButton, backgroundColor: colors.input }}
            >
              <IconList size={20} color={colors.foreground} />
            </Button>
            <Badge style={{ ...styles.actionBadge, backgroundColor: colors.primary }} size="sm">
              <ThemedText style={{ ...styles.actionBadgeText, color: colors.primaryForeground }}>{visibleColumnKeys.length}</ThemedText>
            </Badge>
          </View>
          <View style={styles.buttonWrapper}>
            <Button
              variant="outline"
              onPress={() => setShowFilters(true)}
              style={{ ...styles.actionButton, backgroundColor: colors.input }}
            >
              <IconFilter size={20} color={colors.foreground} />
            </Button>
            {activeFilterCount > 0 && (
              <Badge style={styles.actionBadge} variant="destructive" size="sm">
                <ThemedText style={{ ...styles.actionBadgeText, color: "white" }}>{activeFilterCount}</ThemedText>
              </Badge>
            )}
          </View>
          {canEdit && (
            <IconButton
              name={isSelectionMode ? "x" : "check-square"}
              variant="default"
              onPress={() => {
                setIsSelectionMode(!isSelectionMode);
                setSelectedTasks(new Set());
              }}
            />
          )}
        </View>
      </View>

      {/* Selection toolbar */}
      {isSelectionMode && selectedTasks.size > 0 && (
        <View style={StyleSheet.flatten([styles.selectionToolbar, { backgroundColor: colors.primary }])}>
          <ThemedText style={styles.selectionText}>
            {selectedTasks.size} selecionada{selectedTasks.size > 1 ? "s" : ""}
          </ThemedText>
          <View style={styles.selectionActions}>
            {canDelete && (
              <IconButton
                name="trash"
                variant="default"
                onPress={handleBatchDelete}
              />
            )}
          </View>
        </View>
      )}

      {/* Sector notice for production users */}
      {isProduction && !hasPrivilege(user, SECTOR_PRIVILEGES.ADMIN) && (
        <View style={StyleSheet.flatten([styles.notice, { backgroundColor: colors.primary + "10" }])}>
          <ThemedText style={StyleSheet.flatten([styles.noticeText, { color: colors.primary }])}>
            Exibindo tarefas do seu setor e não atribuídas
          </ThemedText>
        </View>
      )}

      {/* Task table */}
      {isLoading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <ThemedText style={styles.loadingText}>Carregando tarefas...</ThemedText>
        </View>
      ) : (
        <TaskTable
          tasks={tasks || []}
          onTaskPress={handleTaskPress}
          onTaskEdit={canEdit ? handleEditTask : undefined}
          onTaskDelete={canDelete ? handleDeleteTask : undefined}
          onTaskStatusChange={canEdit ? handleStatusChange : undefined}
          onRefresh={handleRefresh}
          refreshing={isRefetching}
          onEndReached={() => {
            if (hasNextPage && !isFetchingNextPage) {
              fetchNextPage();
            }
          }}
          loadingMore={isFetchingNextPage}
          showSelection={isSelectionMode}
          selectedTasks={selectedTasks}
          onSelectionChange={setSelectedTasks}
          enableSwipeActions={!isSelectionMode}
          visibleColumnKeys={visibleColumnKeys}
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

      {/* Filter modal */}
      {renderFilterModal()}

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
  buttonWrapper: {
    position: "relative",
  },
  actionButton: {
    height: 48,
    width: 48,
    borderRadius: 10,
    paddingHorizontal: 0,
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
  selectionToolbar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  selectionText: {
    color: "#fff",
    fontWeight: "600",
  },
  selectionActions: {
    flexDirection: "row",
    gap: spacing.sm,
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
