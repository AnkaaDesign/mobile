import { useRouter } from "expo-router";
import { useState, useEffect } from "react";
import { Alert } from "react-native";
import { Stack } from "expo-router";
import { BudgetCreateWizard } from "@/components/financial/budget/budget-create-wizard";
import { useScreenReady } from "@/hooks";
import { useAuth } from "@/contexts/auth-context";
import { canEditQuote } from "@/utils/permissions/quote-permissions";

export default function BudgetCreateScreen() {
  const router = useRouter();
  const { user } = useAuth();

  useScreenReady();
  const [checkingPermission, setCheckingPermission] = useState(true);

  // Check permissions - only ADMIN and COMMERCIAL can create budgets
  const userPrivilege = user?.sector?.privileges;
  const canCreate = canEditQuote(userPrivilege || "");

  useEffect(() => {
    if (user !== undefined) {
      setCheckingPermission(false);

      if (!canCreate) {
        Alert.alert(
          "Acesso negado",
          "Voce nao tem permissao para criar orcamentos"
        );
        router.replace("/(tabs)/financeiro/orcamento/listar" as any);
      }
    }
  }, [user, canCreate, router]);

  if (checkingPermission || !user || !canCreate) {
    return null;
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <BudgetCreateWizard />
    </>
  );
}
