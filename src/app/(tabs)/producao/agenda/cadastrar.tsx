import { useRouter } from "expo-router";
import { useState, useEffect } from "react";
import { View, ActivityIndicator, Alert } from "react-native";
import { ThemedText } from "@/components/ui/themed-text";
import { SimpleTaskCreateForm } from "@/components/production/task/form/simple-task-create-form";
import { useTaskMutations } from "@/hooks";
import { useAuth } from "@/contexts/auth-context";
import { useNavigationHistory } from "@/contexts/navigation-history-context";
import { useTheme } from "@/lib/theme";
import { routeToMobilePath } from '@/utils/route-mapper';
import { routes, SECTOR_PRIVILEGES } from "@/constants";

export default function CreateAgendaTaskScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { colors } = useTheme();
  const { goBack, getBackPath } = useNavigationHistory();
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
        router.replace("/producao/agenda");
      }
    }
  }, [user, canCreate, router]);

  // Show loading while checking permission
  if (checkingPermission || !user) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
        <ThemedText style={{ marginTop: 16 }}>Verificando permissões...</ThemedText>
      </View>
    );
  }

  // If no permission, show nothing (redirect will happen)
  if (!canCreate) {
    return null;
  }

  const handleNavigateBack = () => {
    const backPath = getBackPath();
    if (backPath) {
      goBack();
    } else {
      // Fallback if no history
      router.replace(routeToMobilePath(routes.production.agenda.root) as any);
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
