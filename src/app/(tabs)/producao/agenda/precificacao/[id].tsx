import { Stack, useLocalSearchParams } from "expo-router";
import { TaskQuoteWizard } from "@/components/production/task/quote/task-quote-wizard";
import { useScreenReady } from '@/hooks/use-screen-ready';

export default function TaskQuoteScreen() {
  useScreenReady();
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <>
      <Stack.Screen
        options={{
          title: "Orçamento da Tarefa",
          headerBackTitle: "Voltar",
          headerShown: true,
        }}
      />
      <TaskQuoteWizard taskId={id} />
    </>
  );
}
