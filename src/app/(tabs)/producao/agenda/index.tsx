import { View } from "react-native";
import { Stack, router } from "expo-router";
import { TaskScheduleLayout } from "@/components/production/task/schedule/TaskScheduleLayout";
import { tasksListConfig } from "@/config/list/production/tasks";
import { TASK_STATUS, SECTOR_PRIVILEGES } from "@/constants";
import { useAuth } from "@/contexts/auth-context";
import { FAB } from "@/components/ui/fab";
import { useMemo } from "react";
import type { ListConfig } from "@/components/list/types";
import type { Task } from "@/types";
import { routes } from "@/constants/routes";
import { hasPrivilege } from "@/utils";

export default function ProductionPreparationScreen() {
  const { user } = useAuth();

  // Only ADMIN users can create tasks
  const canCreateTasks = user?.sector?.privileges === SECTOR_PRIVILEGES.ADMIN;
  const isAdmin = user?.sector?.privileges === SECTOR_PRIVILEGES.ADMIN;
  const isFinancial = user && hasPrivilege(user, SECTOR_PRIVILEGES.FINANCIAL);

  const handleCreateTask = () => {
    router.push("/producao/agenda/cadastrar");
  };

  // Create a config specifically for the agenda page with PREPARATION filter
  const agendaConfig: ListConfig<Task> = useMemo(() => {
    // Build filter values with service order filtering
    const defaultFilters: any = {
      status: [TASK_STATUS.PREPARATION],
    };

    // Add service order filtering based on user role
    if (isAdmin) {
      // Admin: show tasks with no service orders OR incomplete NEGOTIATION/PRODUCTION/ARTWORK service orders
      defaultFilters.hasIncompleteNonFinancialServiceOrders = true;
    } else if (isFinancial) {
      // Financial: show tasks with ANY incomplete service orders (including FINANCIAL type)
      defaultFilters.hasIncompleteServiceOrders = true;
    }

    return {
      ...tasksListConfig,
      filters: {
        ...tasksListConfig.filters,
        defaultValues: defaultFilters,
      },
    // Configure default visible columns for agenda
    table: {
      ...tasksListConfig.table,
      groupBySector: false, // Agenda should not group by sector
      defaultVisible: ['name', 'forecastDate', 'services'],
      // Override view action to navigate to agenda details
      actions: tasksListConfig.table.actions?.map(action =>
        action.key === 'view'
          ? {
              ...action,
              onPress: (task, router) => {
                router.push(routes.production.agenda.details(task.id) as any);
              },
            }
          : action
      ),
    },
    // Add create action for agenda page
    actions: {
      ...tasksListConfig.actions,
      create: {
        label: 'Criar Tarefa',
        route: '/producao/agenda/cadastrar',
        canCreate: (user) => user?.sector?.privileges === SECTOR_PRIVILEGES.ADMIN,
      },
    },
  };
  }, [isAdmin, isFinancial]);

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
