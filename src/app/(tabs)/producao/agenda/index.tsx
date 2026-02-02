import { View } from "react-native";
import { Stack, router } from "expo-router";
import { TaskScheduleLayout } from "@/components/production/task/schedule/TaskScheduleLayout";
import { tasksListOptimizedConfig } from "@/config/list/production/tasks-optimized";
import { SECTOR_PRIVILEGES } from "@/constants";
import { useAuth } from "@/contexts/auth-context";
import { FAB } from "@/components/ui/fab";
import { useMemo } from "react";
import type { ListConfig } from "@/components/list/types";
import type { Task } from "@/types";
import { routes } from "@/constants/routes";
import { hasPrivilege } from "@/utils/user";
import { useNavigationLoading } from "@/contexts/navigation-loading-context";
import { navigationTracker } from "@/utils/navigation-tracker";

export default function ProductionPreparationScreen() {
  const { user } = useAuth();
  const { pushWithLoading } = useNavigationLoading();

  // ADMIN, COMMERCIAL, and LOGISTIC can create tasks
  const canCreateTasks =
    user?.sector?.privileges === SECTOR_PRIVILEGES.ADMIN ||
    user?.sector?.privileges === SECTOR_PRIVILEGES.COMMERCIAL ||
    user?.sector?.privileges === SECTOR_PRIVILEGES.LOGISTIC;

  const handleCreateTask = () => {
    pushWithLoading("/(tabs)/producao/agenda/cadastrar");
  };

  // Determine user privileges for agenda filtering
  // Use hasPrivilege to match web behavior - ADMIN users have all privileges
  const isFinancialUser = hasPrivilege(user, SECTOR_PRIVILEGES.FINANCIAL);
  const isLogisticUser = hasPrivilege(user, SECTOR_PRIVILEGES.LOGISTIC);

  // Create a config specifically for the agenda page
  // Role-based agenda display logic (matching web behavior):
  // - ADMIN users: See ALL tasks (no exclusions - hasPrivilege returns true for all privileges)
  // - FINANCIAL users: Need PRODUCTION, COMMERCIAL, ARTWORK, FINANCIAL (exclude LOGISTIC)
  // - LOGISTIC users: Need PRODUCTION, COMMERCIAL, ARTWORK, LOGISTIC (exclude FINANCIAL)
  // - All other users: Only need PRODUCTION, COMMERCIAL, ARTWORK (exclude both FINANCIAL and LOGISTIC)
  const agendaConfig: ListConfig<Task> = useMemo(() => {
    // Build filter values with preparation display logic
    // IMPORTANT: Do NOT include status filter - the web deletes it (line 381 of task-history-list.tsx)
    // and lets shouldDisplayInPreparation handle the filtering. Status grouping happens client-side.
    const defaultFilters: any = {
      shouldDisplayInPreparation: true,
    };

    // Only FINANCIAL users see FINANCIAL service order requirements
    if (!isFinancialUser) {
      defaultFilters.preparationExcludeFinancial = true;
    }
    // Only LOGISTIC users see LOGISTIC service order requirements
    if (!isLogisticUser) {
      defaultFilters.preparationExcludeLogistic = true;
    }

    return {
      ...tasksListOptimizedConfig,
      // Override default sort to forecastDate (like web agenda)
      query: {
        ...tasksListOptimizedConfig.query,
        defaultSort: { field: 'forecastDate', direction: 'asc' },
      },
      filters: {
        ...tasksListOptimizedConfig.filters,
        defaultValues: defaultFilters,
      },
    // Configure default visible columns for agenda
    table: {
      ...tasksListOptimizedConfig.table,
      groupBySector: false, // Agenda should not group by sector
      groupByStatus: true, // Enable 3-table workflow: Preparation, In Production, Completed
      defaultVisible: ['name', 'forecastDate', 'services'],
      // Disable term-based row coloring for agenda - use neutral alternating colors for all tables
      getRowStyle: () => undefined,
      // Override view action to navigate to agenda details
      actions: tasksListOptimizedConfig.table.actions?.map(action =>
        action.key === 'view'
          ? {
              ...action,
              onPress: (task, router) => {
                // Store where we came from for proper back navigation
                navigationTracker.setSource('/(tabs)/producao/agenda');
                router.push(`/(tabs)/producao/agenda/detalhes/${task.id}` as any);
              },
            }
          : action
      ),
    },
    // Add create action for agenda page
    actions: {
      ...tasksListOptimizedConfig.actions,
      create: {
        label: 'Criar Tarefa',
        route: '/(tabs)/producao/agenda/cadastrar',
        canCreate: (user) =>
          user?.sector?.privileges === SECTOR_PRIVILEGES.ADMIN ||
          user?.sector?.privileges === SECTOR_PRIVILEGES.COMMERCIAL ||
          user?.sector?.privileges === SECTOR_PRIVILEGES.LOGISTIC,
      },
    },
  };
  }, [isFinancialUser, isLogisticUser]);

  return (
    <>
      <Stack.Screen
        options={{
          title: "Agenda",
          headerBackTitle: "Voltar",
        }}
      />
      <View style={{ flex: 1 }}>
        <TaskScheduleLayout config={agendaConfig} />

        {canCreateTasks && (
          <FAB
            icon="plus"
            onPress={handleCreateTask}
          />
        )}
      </View>
    </>
  );
}
