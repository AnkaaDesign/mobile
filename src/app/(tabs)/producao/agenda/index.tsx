import { View } from "react-native";
import { Stack, router } from "expo-router";
import { TaskScheduleLayout } from "@/components/production/task/schedule/TaskScheduleLayout";
import { tasksListAgendaConfig } from "@/config/list/production/tasks-agenda";
import { SECTOR_PRIVILEGES } from "@/constants";
import { useAuth } from "@/contexts/auth-context";
import { FAB } from "@/components/ui/fab";
import { useMemo, useCallback, useRef } from "react";
import { useFocusEffect } from "@react-navigation/native";
import type { ListConfig } from "@/components/list/types";
import type { Task } from "@/types";
import { routes } from "@/constants/routes";
import { useNavigationLoading } from "@/contexts/navigation-loading-context";
import { navigationTracker } from "@/utils/navigation-tracker";
import { useQueryClient } from "@tanstack/react-query";
import { useTaskDetailMinimalInclude } from "@/hooks/use-task-detail-include";
import { getTaskById } from "@/api-client";
import { taskKeys } from "@/hooks/queryKeys";
export default function ProductionPreparationScreen() {
  // useScreenReady is called inside TaskScheduleLayout with data loading state
  const { user } = useAuth();
  const { pushWithLoading } = useNavigationLoading();
  const queryClient = useQueryClient();
  const taskInclude = useTaskDetailMinimalInclude(user);

  // Refetch task lists when screen regains focus (e.g., returning from detail page)
  const isFirstMount = useRef(true);
  useFocusEffect(
    useCallback(() => {
      if (isFirstMount.current) {
        isFirstMount.current = false;
        return;
      }
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
    }, [])
  );

  // ADMIN, COMMERCIAL, LOGISTIC, and PRODUCTION_MANAGER can create tasks
  const canCreateTasks =
    user?.sector?.privileges === SECTOR_PRIVILEGES.ADMIN ||
    user?.sector?.privileges === SECTOR_PRIVILEGES.COMMERCIAL ||
    user?.sector?.privileges === SECTOR_PRIVILEGES.LOGISTIC ||
    user?.sector?.privileges === SECTOR_PRIVILEGES.PRODUCTION_MANAGER;

  const handleCreateTask = () => {
    pushWithLoading("/(tabs)/producao/agenda/cadastrar");
  };

  // Determine user privileges for agenda filtering
  // Use EXACT privilege match (===) to match web behavior (task-preparation-view.tsx:419-452)
  // hasPrivilege() returns true for ADMIN on any check, which would skip exclusion flags incorrectly
  const isFinancialUser = user?.sector?.privileges === SECTOR_PRIVILEGES.FINANCIAL;
  const isDesignerUser = user?.sector?.privileges === SECTOR_PRIVILEGES.DESIGNER;

  // Create a config specifically for the agenda page
  // Role-based agenda display logic (matching web behavior):
  // - FINANCIAL users: Require FINANCIAL SOs, exclude LOGISTIC → see PROD, COM, ART, FIN
  // - DESIGNER users: Special logic — only tasks with incomplete/missing ARTWORK SOs
  // - Everyone else (ADMIN, LOGISTIC, PRODUCTION, etc.): Exclude FINANCIAL, require LOGISTIC → see PROD, COM, ART, LOG
  const agendaConfig: ListConfig<Task> = useMemo(() => {
    // Build filter values with preparation display logic
    // IMPORTANT: Do NOT include status filter - the web deletes it (task-preparation-view.tsx:454)
    // and lets shouldDisplayInPreparation handle the filtering. Status grouping happens client-side.
    const defaultFilters: any = {};

    // DESIGNER users have special display logic: only show tasks with incomplete artwork SOs or no artwork SOs
    if (isDesignerUser) {
      defaultFilters.shouldDisplayForDesigner = true;
    } else {
      // Non-designer users use the standard preparation display logic
      defaultFilters.shouldDisplayInPreparation = true;

      // FINANCIAL users exclude LOGISTIC SOs from the completion check
      if (isFinancialUser) {
        defaultFilters.preparationExcludeLogistic = true;
      }
    }

    return {
      ...tasksListAgendaConfig,
      // Override default sort to forecastDate (like web agenda)
      query: {
        ...tasksListAgendaConfig.query,
        defaultSort: { field: 'forecastDate', direction: 'asc' },
      },
      filters: {
        fields: tasksListAgendaConfig.filters?.fields ?? [],
        defaultValues: defaultFilters,
      },
    // Configure default visible columns for agenda
    table: {
      ...tasksListAgendaConfig.table,
      groupBySector: false, // Agenda should not group by sector
      groupByStatus: true, // Enable 3-table workflow: Preparation, In Production, Completed
      defaultVisible: ['name', 'forecastDate', 'services'],
      // Disable term-based row coloring for agenda - use neutral alternating colors for all tables
      getRowStyle: () => undefined,
      // Override view action to navigate to agenda details
      actions: tasksListAgendaConfig.table.actions?.map(action =>
        action.key === 'view'
          ? {
              ...action,
              onPress: (task, router) => {
                // Prefetch task detail data before navigation starts
                queryClient.prefetchQuery({
                  queryKey: taskKeys.detail(task.id, taskInclude),
                  queryFn: () => getTaskById(task.id, { include: taskInclude }),
                  staleTime: 1000 * 60 * 10,
                });
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
      ...tasksListAgendaConfig.actions,
      create: {
        label: 'Criar Tarefa',
        route: '/(tabs)/producao/agenda/cadastrar',
        canCreate: (user) =>
          user?.sector?.privileges === SECTOR_PRIVILEGES.ADMIN ||
          user?.sector?.privileges === SECTOR_PRIVILEGES.COMMERCIAL ||
          user?.sector?.privileges === SECTOR_PRIVILEGES.LOGISTIC ||
          user?.sector?.privileges === SECTOR_PRIVILEGES.PRODUCTION_MANAGER,
      },
    },
  };
  }, [isFinancialUser, isDesignerUser, queryClient, taskInclude]);

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
