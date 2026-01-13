import { View } from "react-native";
import { Stack, router } from "expo-router";
import { TaskScheduleLayout } from "@/components/production/task/schedule/TaskScheduleLayout";
import { tasksListConfig } from "@/config/list/production/tasks";
import { SECTOR_PRIVILEGES } from "@/constants";
import { useAuth } from "@/contexts/auth-context";
import { FAB } from "@/components/ui/fab";
import { useMemo } from "react";
import type { ListConfig } from "@/components/list/types";
import type { Task } from "@/types";
import { routes } from "@/constants/routes";

export default function ProductionPreparationScreen() {
  const { user } = useAuth();

  // Only ADMIN users can create tasks
  const canCreateTasks = user?.sector?.privileges === SECTOR_PRIVILEGES.ADMIN;

  const handleCreateTask = () => {
    router.push("/producao/agenda/cadastrar");
  };

  // Create a config specifically for the agenda page
  // Uses universal agenda display logic (not role-based):
  // - Excludes CANCELLED tasks
  // - Excludes COMPLETED tasks only if they have all 4 SO types AND all SOs are completed
  const agendaConfig: ListConfig<Task> = useMemo(() => {
    // Build filter values with agenda display logic
    const defaultFilters: any = {
      shouldDisplayInAgenda: true,
    };

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
  }, []);

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
