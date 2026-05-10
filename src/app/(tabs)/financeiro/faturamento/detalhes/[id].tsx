import { Stack, useLocalSearchParams } from "expo-router";

import { TaskQuoteWizard } from "@/components/production/task/quote/task-quote-wizard";
import { useScreenReady } from "@/hooks/use-screen-ready";
import { PrivilegeGate } from "@/components/auth/privilege-gate";
import { SECTOR_PRIVILEGES } from "@/constants";

/**
 * Billing detail page — opens the TaskQuoteWizard for the given task ID.
 * This matches the web behavior where /financeiro/faturamento/detalhes/:id
 * navigates to the task's quote detail/wizard view.
 */
export default function BillingDetailScreen() {
  useScreenReady();
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <PrivilegeGate
      required={{ any: [SECTOR_PRIVILEGES.ADMIN, SECTOR_PRIVILEGES.FINANCIAL] }}
      fallback="unauthorized"
    >
      <Stack.Screen
        options={{
          title: "Fatura",
          headerShown: true,
        }}
      />
      <TaskQuoteWizard taskId={id} mode="billing" />
    </PrivilegeGate>
  );
}
