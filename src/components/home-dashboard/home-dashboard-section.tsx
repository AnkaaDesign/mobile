import { View } from "react-native";
import type { HomeDashboardData } from "@/types";
import { ServiceOrderList } from "./service-order-list";
import { LowStockList } from "./low-stock-list";
import { CompletedTasksList } from "./completed-tasks-list";
import { AwaitingApprovalTasksList } from "./awaiting-approval-tasks-list";
import { AwaitingQuoteApprovalList } from "./awaiting-quote-approval-list";
import { AwaitingBudgetApprovalList } from "./awaiting-budget-approval-list";
import { TimeEntriesCard } from "./time-entries-card";

// Legacy "Tarefas com Prazo Hoje" / "Tarefas com Liberação Próxima" lists
// were removed — the widget-system task-table widget (with
// `filters.onlyOverdue` + sort by term + accent + density config) is a
// strict superset and the source of truth for task lists on the home
// screen. Users can recreate the same view by adding a Task widget to
// their dashboard configured with the appropriate filters.

interface HomeDashboardSectionProps {
  data: HomeDashboardData;
  sector?: string;
  showTimeEntries?: boolean;
}

export function HomeDashboardSection({ data, showTimeEntries }: HomeDashboardSectionProps) {
  const hasContent =
    (data.openServiceOrders && data.openServiceOrders.length > 0) ||
    (data.lowStockItems && data.lowStockItems.length > 0) ||
    (data.completedTasks && data.completedTasks.length > 0) ||
    (data.tasksAwaitingPaymentApproval && data.tasksAwaitingPaymentApproval.length > 0) ||
    (data.tasksAwaitingQuoteApproval && data.tasksAwaitingQuoteApproval.length > 0) ||
    (data.tasksAwaitingBudgetApproval && data.tasksAwaitingBudgetApproval.length > 0) ||
    showTimeEntries;

  if (!hasContent) return null;

  return (
    <View style={{ gap: 24 }}>
      {data.openServiceOrders && data.openServiceOrders.length > 0 && (
        <ServiceOrderList orders={data.openServiceOrders} title="Ordens de Serviço Abertas" />
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
