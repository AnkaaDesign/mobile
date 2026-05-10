import { Stack, useLocalSearchParams } from "expo-router";

import { CopyFromTaskWizard } from "@/components/production/task/copy/copy-from-task-wizard";
import { useScreenReady } from "@/hooks/use-screen-ready";
import { PrivilegeGate } from "@/components/auth/privilege-gate";
import { SECTOR_PRIVILEGES } from "@/constants";

export default function CopyFromTaskScreen() {
  useScreenReady();
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <PrivilegeGate
      required={{
        any: [
          SECTOR_PRIVILEGES.ADMIN,
          SECTOR_PRIVILEGES.COMMERCIAL,
          SECTOR_PRIVILEGES.LOGISTIC,
          SECTOR_PRIVILEGES.PRODUCTION_MANAGER,
        ],
      }}
      fallback="unauthorized"
    >
      <Stack.Screen
        options={{
          title: "Copiar de Outra Tarefa",
          headerBackTitle: "Voltar",
          headerShown: true,
        }}
      />
      <CopyFromTaskWizard taskId={id} />
    </PrivilegeGate>
  );
}
