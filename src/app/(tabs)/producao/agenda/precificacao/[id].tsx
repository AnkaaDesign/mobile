import { Stack, useLocalSearchParams } from "expo-router";
import { TaskPricingWizard } from "@/components/production/task/pricing/task-pricing-wizard";

export default function TaskPricingScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <>
      <Stack.Screen
        options={{
          title: "Or\u00e7amento",
          headerBackTitle: "Voltar",
          headerShown: false,
        }}
      />
      <TaskPricingWizard taskId={id} />
    </>
  );
}
