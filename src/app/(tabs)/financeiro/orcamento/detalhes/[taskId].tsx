import { Stack, useLocalSearchParams } from "expo-router";

import { TaskQuoteWizard } from "@/components/production/task/quote/task-quote-wizard";
import { useScreenReady } from "@/hooks/use-screen-ready";
import { PrivilegeGate } from "@/components/auth/privilege-gate";
import { SECTOR_PRIVILEGES } from "@/constants";

export default function BudgetDetailScreen() {
  useScreenReady();
  const { taskId } = useLocalSearchParams<{ taskId: string }>();

  return (
    <PrivilegeGate
      required={{
        any: [
          SECTOR_PRIVILEGES.ADMIN,
          SECTOR_PRIVILEGES.FINANCIAL,
          SECTOR_PRIVILEGES.COMMERCIAL,
        ],
      }}
      fallback="unauthorized"
    >
      <Stack.Screen
        options={{
          title: "Orçamento",
          headerShown: true,
        }}
      />
      <TaskQuoteWizard taskId={taskId} />
    </PrivilegeGate>
  );
}
