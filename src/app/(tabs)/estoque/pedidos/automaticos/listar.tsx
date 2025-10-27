import React, { useState, useCallback } from "react";
import { View, Alert, Pressable , StyleSheet} from "react-native";
import { useRouter } from "expo-router";
import { IconPlus, IconFilter, IconClock, IconCalendar } from "@tabler/icons-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useOrderScheduleMutations, useOrderSchedules } from '../../../../../hooks';
import type { OrderScheduleGetManyFormData } from '../../../../../schemas';
import { ThemedView, ThemedText, FAB, ErrorScreen, EmptyState, SearchBar, ListActionButton } from "@/components/ui";
import { OrderScheduleTable } from "@/components/inventory/order/schedule/order-schedule-table";
import type { SortConfig } from "@/components/inventory/order/schedule/order-schedule-table";
import { OrderScheduleFilterModal } from "@/components/inventory/order/schedule/order-schedule-filter-modal";
import { OrderScheduleFilterTags } from "@/components/inventory/order/schedule/order-schedule-filter-tags";
import { TableErrorBoundary } from "@/components/ui/table-error-boundary";
import { ItemsCountDisplay } from "@/components/ui/items-count-display";
import { OrderScheduleListSkeleton } from "@/components/inventory/order/schedule/skeleton/order-schedule-list-skeleton";
import { useTheme } from "@/lib/theme";
import { routes } from '../../../../../constants';
import { routeToMobilePath } from "@/lib/route-mapper";
import { useAuth } from "@/contexts/auth-context";
import { hasPrivilege } from '../../../../../utils';
import { SECTOR_PRIVILEGES } from '../../../../../constants';

export default function AutomaticOrderListScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [displaySearchText, setDisplaySearchText] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<Partial<OrderScheduleGetManyFormData>>({});
  const [sortConfigs, setSortConfigs] = useState<SortConfig[]>([{ columnKey: "createdAt", direction: "desc" }]);
  const [selectedSchedules, setSelectedSchedules] = useState<Set<string>>(new Set());
  const [showSelection, setShowSelection] = useState(false);
  const [visibleColumnKeys, setVisibleColumnKeys] = useState<string[]>(["frequency", "isActive", "nextRun", "supplier"]);

  // Check permissions
  const canCreate = user && hasPrivilege(user as any, SECTOR_PRIVILEGES.WAREHOUSE);
  const canEdit = user && hasPrivilege(user as any, SECTOR_PRIVILEGES.WAREHOUSE);
  const canDelete = user && hasPrivilege(user as any, SECTOR_PRIVILEGES.ADMIN);

  // Build query parameters with sorting
  const buildOrderBy = () => {
    if (!sortConfigs || sortConfigs.length === 0) return { createdAt: "desc" };

    // If only one sort, return as object
    if (sortConfigs.length === 1) {
      const config = sortConfigs[0 as keyof typeof sortConfigs];
      switch (config.columnKey) {
        case "frequency":
          return { frequency: config.direction };
        case "isActive":
          return { isActive: config.direction };
        case "nextRun":
          return { nextRun: config.direction };
        case "supplier":
          return { supplier: { name: config.direction } };
        case "createdAt":
          return { createdAt: config.direction };
        case "finishedAt":
          return { finishedAt: config.direction };
        default:
          return { createdAt: "desc" };
      }
    }

    // Multiple sorts, return as array
    return sortConfigs.map((config) => {
      switch (config.columnKey) {
        case "frequency":
          return { frequency: config.direction };
        case "isActive":
          return { isActive: config.direction };
        case "nextRun":
          return { nextRun: config.direction };
        case "supplier":
          return { supplier: { name: config.direction } };
        case "createdAt":
          return { createdAt: config.direction };
        case "finishedAt":
          return { finishedAt: config.direction };
        default:
          return { createdAt: "desc" };
      }
    });
  };

  const queryParams = {
    orderBy: buildOrderBy(),
    ...(searchText ? { searchingFor: searchText } : {}),
    ...filters,
    include: {
      supplier: { select: { id: true, name: true } },
    },
  };

  const {
    data: orderSchedulesData,
    isLoading,
    error,
    refetch,
    isRefetching,
  } = useOrderSchedules(queryParams);

  const schedules = orderSchedulesData?.data || [];

  const { delete: deleteOrderSchedule } = useOrderScheduleMutations();

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refetch();
    } finally {
      setRefreshing(false);
    }
  }, [refetch]);

  const handleCreateSchedule = () => {
    router.push(routeToMobilePath(routes.inventory.orders.automatic.create) as any);
  };

  const handleSchedulePress = (scheduleId: string) => {
    router.push(routeToMobilePath(routes.inventory.orders.automatic.details(scheduleId)) as any);
  };

  const handleEditSchedule = (scheduleId: string) => {
    if (!canEdit) {
      Alert.alert("Sem permissão", "Você não tem permissão para editar agendamentos automáticos");
      return;
    }
    router.push(routeToMobilePath(routes.inventory.orders.automatic.edit(scheduleId)) as any);
  };

  const handleDeleteSchedule = useCallback(
    async (scheduleId: string) => {
      if (!canDelete) {
        Alert.alert("Sem permissão", "Você não tem permissão para excluir agendamentos automáticos");
        return;
      }

      Alert.alert(
        "Confirmar Exclusão",
        "Tem certeza que deseja excluir este agendamento automático?",
        [
          { text: "Cancelar", style: "cancel" },
          {
            text: "Excluir",
            style: "destructive",
            onPress: async () => {
              try {
                await deleteOrderSchedule(scheduleId);
                // Clear selection if the deleted schedule was selected
                if (selectedSchedules.has(scheduleId)) {
                  const newSelection = new Set(selectedSchedules);
                  newSelection.delete(scheduleId);
                  setSelectedSchedules(newSelection);
                }
              } catch (error) {
                Alert.alert("Erro", "Não foi possível excluir o agendamento. Tente novamente.");
              }
            },
          },
        ],
      );
    },
    [deleteOrderSchedule, selectedSchedules, canDelete],
  );

  const handleToggleActive = useCallback(
    async (scheduleId: string, currentActive: boolean) => {
      if (!canEdit) {
        Alert.alert("Sem permissão", "Você não tem permissão para alterar agendamentos automáticos");
        return;
      }

      const { update } = useOrderScheduleMutations();
      try {
        await update({ id: scheduleId, data: { isActive: !currentActive } });
      } catch (error) {
        Alert.alert("Erro", "Não foi possível alterar o status do agendamento. Tente novamente.");
      }
    },
    [canEdit],
  );

  const handleSort = useCallback((configs: SortConfig[]) => {
    setSortConfigs(configs);
  }, []);

  const handleSelectionChange = useCallback((newSelection: Set<string>) => {
    setSelectedSchedules(newSelection);
  }, []);

  const handleSearch = useCallback((text: string) => {
    setSearchText(text);
  }, []);

  const handleDisplaySearchChange = useCallback((text: string) => {
    setDisplaySearchText(text);
  }, []);

  const handleApplyFilters = useCallback((newFilters: Partial<OrderScheduleGetManyFormData>) => {
    setFilters(newFilters);
    setShowFilters(false);
  }, []);

  const handleClearFilters = useCallback(() => {
    setFilters({});
    setSearchText("");
    setDisplaySearchText("");
    setSelectedSchedules(new Set());
    setShowSelection(false);
  }, []);

  // Count active filters
  const activeFiltersCount = Object.entries(filters).filter(
    ([key, value]) => value !== undefined && value !== null && (Array.isArray(value) ? value.length > 0 : true),
  ).length;

  if (isLoading && !isRefetching) {
    return <OrderScheduleListSkeleton />;
  }

  if (error) {
    return (
      <ThemedView style={styles.container}>
        <ErrorScreen
          message="Erro ao carregar agendamentos automáticos"
          detail={error.message}
          onRetry={handleRefresh}
        />
      </ThemedView>
    );
  }

  const hasSchedules = Array.isArray(schedules) && schedules.length > 0;

  return (
    <ThemedView style={StyleSheet.flatten([styles.container, { backgroundColor: colors.background, paddingBottom: insets.bottom }])}>
      {/* Search, Filter and Sort */}
      <View style={StyleSheet.flatten([styles.searchContainer])}>
        <SearchBar
          value={displaySearchText}
          onChangeText={handleDisplaySearchChange}
          onSearch={handleSearch}
          placeholder="Buscar agendamentos automáticos..."
          style={styles.searchBar}
          debounceMs={300}
        />
        <View style={styles.buttonContainer}>
          <ListActionButton
            icon={<IconFilter size={20} color={colors.foreground} />}
            onPress={() => setShowFilters(true)}
            badgeCount={activeFiltersCount}
            badgeVariant="destructive"
            showBadge={activeFiltersCount > 0}
          />
        </View>
      </View>

      {/* Individual filter tags */}
      <OrderScheduleFilterTags
        filters={filters}
        searchText={searchText}
        onFilterChange={handleApplyFilters}
        onSearchChange={(text) => {
          setSearchText(text);
          setDisplaySearchText(text);
        }}
        onClearAll={handleClearFilters}
      />

      {hasSchedules ? (
        <TableErrorBoundary onRetry={handleRefresh}>
          <OrderScheduleTable
            schedules={schedules}
            onSchedulePress={handleSchedulePress}
            onScheduleEdit={handleEditSchedule}
            onScheduleDelete={handleDeleteSchedule}
            onScheduleToggleActive={handleToggleActive}
            onRefresh={handleRefresh}
            refreshing={refreshing}
            loading={isLoading && !isRefetching}
            showSelection={showSelection}
            selectedSchedules={selectedSchedules}
            onSelectionChange={handleSelectionChange}
            sortConfigs={sortConfigs}
            onSort={handleSort}
            visibleColumnKeys={visibleColumnKeys}
            enableSwipeActions={true}
          />
        </TableErrorBoundary>
      ) : (
        <View style={styles.emptyContainer}>
          <EmptyState
            icon={searchText ? "search" : "clock"}
            title={searchText ? "Nenhum agendamento encontrado" : "Nenhum agendamento automático"}
            description={
              searchText
                ? `Nenhum resultado para "${searchText}"`
                : "Automatize seus pedidos configurando agendamentos"
            }
            actionLabel={searchText || !canCreate ? undefined : "Criar Agendamento"}
            onAction={searchText || !canCreate ? undefined : handleCreateSchedule}
          />
        </View>
      )}

      {/* Items count */}
      {hasSchedules && (
        <ItemsCountDisplay
          loadedCount={schedules.length}
          totalCount={orderSchedulesData?.meta?.totalRecords}
          isLoading={false}
        />
      )}

      {hasSchedules && canCreate && <FAB icon="plus" onPress={handleCreateSchedule} />}

      {/* Filter Modal */}
      <OrderScheduleFilterModal
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
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});