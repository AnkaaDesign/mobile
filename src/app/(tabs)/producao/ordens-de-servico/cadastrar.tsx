import { Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { TaskForm } from "@/components/production/task/form";
import { useTaskMutations, useScreenReady, useFormScreenKey } from "@/hooks";
import { useNav } from "@/contexts/nav";
import { mobileRoute } from "@/constants/routes.types";
import { PrivilegeGate } from "@/components/auth/privilege-gate";
import { SECTOR_PRIVILEGES, routes } from "@/constants";
import type { TaskCreateFormData } from "@/schemas";

export default function CreateServiceOrderScreen() {
  return (
    <PrivilegeGate
      required={{
        any: [
          SECTOR_PRIVILEGES.PRODUCTION,
          SECTOR_PRIVILEGES.PRODUCTION_MANAGER,
          SECTOR_PRIVILEGES.ADMIN,
          SECTOR_PRIVILEGES.COMMERCIAL,
        ],
      }}
    >
      <CreateServiceOrderInner />
    </PrivilegeGate>
  );
}

function CreateServiceOrderInner() {
  const nav = useNav();
  const { createAsync, isLoading: isCreating } = useTaskMutations();

  useScreenReady(!isCreating);
  const formKey = useFormScreenKey();

  const handleSubmit = async (data: TaskCreateFormData) => {
    try {
      const result = await nav.withLoading(async () => createAsync(data));

      if (result?.data) {
        nav.replace(
          mobileRoute(
            routes.production.serviceOrders.details(result.data?.id || ""),
          ),
        );
      } else {
        Alert.alert("Erro", "Erro ao criar ordem de serviço");
      }
    } catch {
      // Error toast is handled by the api-client interceptor.
    }
  };

  const handleCancel = () => {
    Alert.alert(
      "Descartar Cadastro",
      "Deseja descartar o cadastro da ordem de serviço?",
      [
        { text: "Continuar Editando", style: "cancel" },
        {
          text: "Descartar",
          style: "destructive",
          onPress: () => {
            nav.goBack({
              fallback: mobileRoute(routes.production.serviceOrders.root),
            });
          },
        },
      ],
    );
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <TaskForm
        key={formKey}
        mode="create"
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        isSubmitting={isCreating}
      />
    </SafeAreaView>
  );
}
