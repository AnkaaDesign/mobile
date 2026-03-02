import { View } from "react-native";
import type { HomeDashboardData } from "@/types";
import { SECTOR_PRIVILEGES } from "@/constants";
import { TaskDeadlineList } from "./task-deadline-list";
import { ServiceOrderList } from "./service-order-list";
import { LowStockList } from "./low-stock-list";
import { CompletedTasksList } from "./completed-tasks-list";

interface HomeDashboardSectionProps {
  data: HomeDashboardData;
  sector?: string;
}

export function HomeDashboardSection({ data, sector }: HomeDashboardSectionProps) {
  const hasContent =
    (data.tasksCloseDeadline && data.tasksCloseDeadline.length > 0) ||
    (data.openServiceOrders && data.openServiceOrders.length > 0) ||
    (data.tasksCloseForecast && data.tasksCloseForecast.length > 0) ||
    (data.lowStockItems && data.lowStockItems.length > 0) ||
    (data.completedTasks && data.completedTasks.length > 0) ||
    (data.openFinancialSOs && data.openFinancialSOs.length > 0);

  if (!hasContent) return null;

  const deadlineViewAllLink = sector === SECTOR_PRIVILEGES.PRODUCTION
    ? "/producao/cronograma"
    : "/producao/agenda";

  return (
    <View style={{ gap: 12 }}>
      {data.tasksCloseDeadline && data.tasksCloseDeadline.length > 0 && (
        <TaskDeadlineList
          tasks={data.tasksCloseDeadline}
          title="Tarefas com Prazo Hoje"
          variant="deadline"
          viewAllLink={deadlineViewAllLink}
        />
      )}

      {data.openServiceOrders && data.openServiceOrders.length > 0 && (
        <ServiceOrderList orders={data.openServiceOrders} title="Ordens de Serviço Abertas" />
      )}

      {data.tasksCloseForecast && data.tasksCloseForecast.length > 0 && (
        <TaskDeadlineList
          tasks={data.tasksCloseForecast}
          title="Tarefas com Liberação Próxima"
          variant="forecast"
          viewAllLink="/producao/agenda"
        />
      )}

      {data.lowStockItems && data.lowStockItems.length > 0 && (
        <LowStockList items={data.lowStockItems} totalCount={data.counts.lowStockItems} />
      )}

      {data.completedTasks && data.completedTasks.length > 0 && (
        <CompletedTasksList tasks={data.completedTasks} />
      )}

      {data.openFinancialSOs && data.openFinancialSOs.length > 0 && (
        <ServiceOrderList orders={data.openFinancialSOs} title="OS Financeiras Pendentes" />
      )}
    </View>
  );
}
