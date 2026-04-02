import { View } from "react-native";
import type { HomeDashboardData } from "@/types";
import { SECTOR_PRIVILEGES } from "@/constants";
import { TaskDeadlineList } from "./task-deadline-list";
import { ServiceOrderList } from "./service-order-list";
import { LowStockList } from "./low-stock-list";
import { CompletedTasksList } from "./completed-tasks-list";
import { AwaitingApprovalTasksList } from "./awaiting-approval-tasks-list";
import { AwaitingQuoteApprovalList } from "./awaiting-quote-approval-list";
import { AwaitingBudgetApprovalList } from "./awaiting-budget-approval-list";
import { TimeEntriesCard } from "./time-entries-card";

interface HomeDashboardSectionProps {
  data: HomeDashboardData;
  sector?: string;
  showTimeEntries?: boolean;
}

export function HomeDashboardSection({ data, sector, showTimeEntries }: HomeDashboardSectionProps) {
  const isAdmin = sector === SECTOR_PRIVILEGES.ADMIN;

  const hasContent =
    (data.tasksCloseDeadline && data.tasksCloseDeadline.length > 0) ||
    (data.openServiceOrders && data.openServiceOrders.length > 0) ||
    (data.tasksCloseForecast && data.tasksCloseForecast.length > 0) ||
    (data.lowStockItems && data.lowStockItems.length > 0) ||
    (data.completedTasks && data.completedTasks.length > 0) ||
    (data.tasksAwaitingPaymentApproval && data.tasksAwaitingPaymentApproval.length > 0) ||
    (data.tasksAwaitingQuoteApproval && data.tasksAwaitingQuoteApproval.length > 0) ||
    (data.tasksAwaitingBudgetApproval && data.tasksAwaitingBudgetApproval.length > 0) ||
    showTimeEntries;

  if (!hasContent) return null;

  const deadlineViewAllLink = sector === SECTOR_PRIVILEGES.PRODUCTION
    ? "/producao/cronograma"
    : "/producao/agenda";

  return (
    <View style={{ gap: 24 }}>
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

      {data.completedTasks && data.completedTasks.length > 0 && (
        <CompletedTasksList tasks={data.completedTasks} />
      )}

      {data.tasksAwaitingPaymentApproval && data.tasksAwaitingPaymentApproval.length > 0 && (
        <AwaitingApprovalTasksList tasks={data.tasksAwaitingPaymentApproval} />
      )}

      {data.tasksAwaitingQuoteApproval && data.tasksAwaitingQuoteApproval.length > 0 && (
        <AwaitingQuoteApprovalList tasks={data.tasksAwaitingQuoteApproval} />
      )}

      {data.tasksAwaitingBudgetApproval && data.tasksAwaitingBudgetApproval.length > 0 && (
        <AwaitingBudgetApprovalList tasks={data.tasksAwaitingBudgetApproval} />
      )}

      {data.lowStockItems && data.lowStockItems.length > 0 && (
        <LowStockList items={data.lowStockItems} totalCount={data.counts.lowStockItems} />
      )}

      {showTimeEntries && <TimeEntriesCard />}
    </View>
  );
}
