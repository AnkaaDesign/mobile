import { useRouter } from "expo-router";
import { useState, useEffect } from "react";
import { Alert } from "react-native";
import { TaskFormWithProvider } from "@/components/production/task/form/task-form-with-provider";
import { useTaskMutations, useScreenReady} from '@/hooks';
import { useAuth } from "@/contexts/auth-context";
import { useNavigationHistory } from "@/contexts/navigation-history-context";
import { useNavigationLoading } from "@/contexts/navigation-loading-context";
import { SECTOR_PRIVILEGES } from "@/constants";

export default function CreateAgendaTaskScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { replaceWithLoading } = useNavigationLoading();
  const { goBack } = useNavigationHistory();
  const { createAsync, isLoading } = useTaskMutations();

  useScreenReady(!isLoading);
  const [checkingPermission, setCheckingPermission] = useState(true);

  // Check permissions - ADMIN, COMMERCIAL, and LOGISTIC can create tasks
  const userPrivilege = user?.sector?.privileges;
  const canCreate =
    userPrivilege === SECTOR_PRIVILEGES.ADMIN ||
    userPrivilege === SECTOR_PRIVILEGES.COMMERCIAL ||
    userPrivilege === SECTOR_PRIVILEGES.LOGISTIC;

  useEffect(() => {
    // Wait for user to load
    if (user !== undefined) {
      setCheckingPermission(false);

      // Redirect if no permission
      if (!canCreate) {
        Alert.alert(
          "Acesso negado",
          "Você não tem permissão para criar tarefas"
        );
        router.replace("/(tabs)/producao/agenda" as any);
      }
    }
  }, [user, canCreate, router]);

  // Don't show anything while checking permissions
  if (checkingPermission || !user || !canCreate) {
    return null;
  }

  const handleNavigateBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.push("/(tabs)/producao/agenda" as any);
    }
  };

  const handleSubmit = async (data: any) => {
    try {
      console.log('[CreateAgendaTask] Starting task creation...');

      const result = await createAsync(data);

      if (result.success && result.data) {
        console.log('[CreateAgendaTask] Task created successfully');
        handleNavigateBack();
      } else {
        console.error('[CreateAgendaTask] Task creation failed:', result);
        Alert.alert(
          "Erro ao criar tarefa",
          result?.message || "Não foi possível criar a tarefa. Tente novamente."
        );
      }
    } catch (error: any) {
      console.error("[CreateAgendaTask] Error creating task:", error);
    }
  };

  const handleCancel = () => {
    handleNavigateBack();
  };

  return (
    <TaskFormWithProvider
      mode="create"
      onSubmit={handleSubmit}
      onCancel={handleCancel}
      isSubmitting={isLoading}
    />
  );
}
