import { Stack, useLocalSearchParams } from "expo-router";
import { CopyFromTaskWizard } from "@/components/production/task/copy/copy-from-task-wizard";
import { useScreenReady } from '@/hooks/use-screen-ready';

export default function CopyFromTaskScreen() {
  useScreenReady();
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <>
      <Stack.Screen
        options={{
          title: "Copiar de Outra Tarefa",
          headerBackTitle: "Voltar",
          headerShown: true,
        }}
      />
      <CopyFromTaskWizard taskId={id} />
    </>
  );
}
