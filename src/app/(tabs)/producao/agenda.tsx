import { View } from "react-native";
import { router } from "expo-router";
import { TaskScheduleLayout } from "@/components/production/task/schedule/TaskScheduleLayout";
import { tasksListConfig } from "@/config/list/production/tasks";
import { TASK_STATUS, SECTOR_PRIVILEGES } from "@/constants";
import { useAuth } from "@/contexts/auth-context";
import { FAB } from "@/components/ui/fab";
import { useMemo } from "react";
import type { ListConfig } from "@/components/list/types";
import type { Task } from "@/types";

export default function ProductionPreparationScreen() {
  const { user } = useAuth();

  // Only ADMIN users can create tasks
  const canCreateTasks = user?.sector?.privileges === SECTOR_PRIVILEGES.ADMIN;

  const handleCreateTask = () => {
    router.push("/producao/cronograma/cadastrar");
  };

  // Create a config specifically for the agenda page with PREPARATION filter
  const agendaConfig: ListConfig<Task> = useMemo(() => ({
    ...tasksListConfig,
    filters: {
      ...tasksListConfig.filters,
      defaultValues: {
        status: [TASK_STATUS.PREPARATION],
      },
    },
    // Configure default visible columns for agenda
    table: {
      ...tasksListConfig.table,
      defaultVisible: ['name', 'customer.fantasyName', 'serialNumber', 'term', 'services'],
    },
    // Add create action for agenda page
    actions: {
      ...tasksListConfig.actions,
      create: {
        label: 'Criar Tarefa',
        route: '/producao/cronograma/cadastrar',
        canCreate: (user) => user?.sector?.privileges === SECTOR_PRIVILEGES.ADMIN,
      },
    },
  }), []);

  return (
    <View style={{ flex: 1 }}>
      <TaskScheduleLayout config={agendaConfig} />

      {canCreateTasks && (
        <FAB
          icon="plus"
          onPress={handleCreateTask}
        />
      )}
    </View>
  );
}
