import { Stack, useLocalSearchParams } from "expo-router";
import { TaskQuoteWizard } from "@/components/production/task/quote/task-quote-wizard";
import { useScreenReady } from '@/hooks/use-screen-ready';

export default function BudgetDetailScreen() {
  useScreenReady();
  const { taskId } = useLocalSearchParams<{ taskId: string }>();

  return (
    <>
      <Stack.Screen
        options={{
          title: "Orçamento",
          headerShown: true,
        }}
      />
      <TaskQuoteWizard taskId={taskId} />
    </>
  );
}
