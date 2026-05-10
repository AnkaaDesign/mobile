import { Stack } from "expo-router";

import { BudgetCreateWizard } from "@/components/financial/budget/budget-create-wizard";
import { useScreenReady } from "@/hooks";
import { PrivilegeGate } from "@/components/auth/privilege-gate";
import { SECTOR_PRIVILEGES } from "@/constants";

export default function BudgetCreateScreen() {
  useScreenReady();

  return (
    <PrivilegeGate
      required={{ any: [SECTOR_PRIVILEGES.ADMIN, SECTOR_PRIVILEGES.COMMERCIAL] }}
      fallback="unauthorized"
    >
      <Stack.Screen
        options={{
          title: "Novo Orçamento",
          headerShown: true,
        }}
      />
      <BudgetCreateWizard />
    </PrivilegeGate>
  );
}
