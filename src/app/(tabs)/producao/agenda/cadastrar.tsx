import { useRouter } from "expo-router";
import { useState, useEffect } from "react";
import { View, ActivityIndicator, Alert } from "react-native";
import { ThemedText } from "@/components/ui/themed-text";
import { SimpleTaskCreateForm } from "@/components/production/task/form/simple-task-create-form";
import { useTaskMutations } from "@/hooks";
import { useAuth } from "@/contexts/auth-context";
import { useNavigationHistory } from "@/contexts/navigation-history-context";
import { useNavigationLoading } from "@/contexts/navigation-loading-context";
import { useTheme } from "@/lib/theme";
import { routeToMobilePath } from '@/utils/route-mapper';
import { routes, SECTOR_PRIVILEGES } from "@/constants";

export default function CreateAgendaTaskScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { colors } = useTheme();
  const { replaceWithLoading } = useNavigationLoading();
  const { goBack } = useNavigationHistory();
  const { createAsync, isLoading } = useTaskMutations();
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
        // Use direct replace for permission denials (no loading needed)
        router.replace("/(tabs)/producao/agenda" as any);
      }
    }
  }, [user, canCreate, router]);

  // Don't show anything while checking permissions - the navigation overlay is already showing
  // The form will appear instantly when ready, or redirect will happen if no permission
  if (checkingPermission || !user || !canCreate) {
    return null;
  }

  const handleNavigateBack = () => {
    console.log('[CreateAgendaTask] handleNavigateBack called');

    // Use router.back() for proper stack navigation
    if (router.canGoBack()) {
      router.back();
    } else {
      // Fallback to agenda list if can't go back
      router.push("/(tabs)/producao/agenda" as any);
    }
  };

  const handleSubmit = async (data: any) => {
    try {
      console.log('[CreateAgendaTask] Starting task creation...');
      console.log('[CreateAgendaTask] Task data:', JSON.stringify(data, null, 2));

      const result = await createAsync(data);
      console.log('[CreateAgendaTask] API result:', result);

      if (result.success && result.data) {
        console.log('[CreateAgendaTask] Task created successfully');
        // API client already shows success alert
        handleNavigateBack();
      } else {
        // API returned failure
        console.error('[CreateAgendaTask] Task creation failed:', result);
        Alert.alert(
          "Erro ao criar tarefa",
          result?.message || "Não foi possível criar a tarefa. Tente novamente."
        );
      }
    } catch (error: any) {
      console.error("[CreateAgendaTask] Error creating task:", error);
      // API client already shows error alert
    }
  };

  const handleCancel = () => {
    console.log('[CreateAgendaTask] handleCancel called');
    handleNavigateBack();
  };

  return (
    <SimpleTaskCreateForm
      onSubmit={handleSubmit}
      onCancel={handleCancel}
      isSubmitting={isLoading}
    />
  );
}
