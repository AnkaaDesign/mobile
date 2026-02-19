import { Stack, useLocalSearchParams } from "expo-router";
import { TaskPricingWizard } from "@/components/production/task/pricing/task-pricing-wizard";
import { useScreenReady } from '@/hooks/use-screen-ready';

export default function TaskPricingScreen() {
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
      <TaskPricingWizard taskId={id} />
    </>
  );
}
