import { Alert } from "react-native";

import { TaskFormWithProvider } from "@/components/production/task/form/task-form-with-provider";
import { useTaskMutations, useScreenReady, useFormScreenKey } from "@/hooks";
import { useNav } from "@/contexts/nav";
import { PrivilegeGate } from "@/components/auth/privilege-gate";
import { SECTOR_PRIVILEGES } from "@/constants";

function CreateAgendaTaskInner() {
  const nav = useNav();
  const { createAsync, isLoading } = useTaskMutations();

  useScreenReady(!isLoading);
  const formKey = useFormScreenKey();

  const handleSubmit = async (data: any) => {
    try {
      const result = await createAsync(data);

      if (result.success && result.data) {
        nav.goBack();
      } else {
        Alert.alert(
          "Erro ao criar tarefa",
          result?.message || "Não foi possível criar a tarefa. Tente novamente.",
        );
      }
    } catch (error: any) {
      console.error("[CreateAgendaTask] Error creating task:", error);
    }
  };

  const handleCancel = () => {
    nav.goBack();
  };

  return (
    <TaskFormWithProvider
      key={formKey}
      mode="create"
      onSubmit={handleSubmit}
      onCancel={handleCancel}
      isSubmitting={isLoading}
    />
  );
}

export default function CreateAgendaTaskScreen() {
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
      <CreateAgendaTaskInner />
    </PrivilegeGate>
  );
}
