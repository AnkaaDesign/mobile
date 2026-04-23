import { Stack, useLocalSearchParams } from "expo-router";
import { TaskQuoteWizard } from "@/components/production/task/quote/task-quote-wizard";
import { useScreenReady } from "@/hooks/use-screen-ready";

/**
 * Billing detail page — opens the TaskQuoteWizard for the given task ID.
 * This matches the web behavior where /financeiro/faturamento/detalhes/:id
 * navigates to the task's quote detail/wizard view.
 */
export default function BillingDetailScreen() {
  useScreenReady();
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <>
      <Stack.Screen
        options={{
          title: "Fatura",
          headerShown: true,
        }}
      />
      <TaskQuoteWizard taskId={id} mode="billing" />
    </>
  );
}
