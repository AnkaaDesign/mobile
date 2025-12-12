import { useRouter } from "expo-router";
import { useState, useEffect } from "react";
import { View, ActivityIndicator, Alert } from "react-native";
// import { showToast } from "@/components/ui/toast";
import { ThemedView } from "@/components/ui/themed-view";
import { ThemedText } from "@/components/ui/themed-text";
import { TaskForm } from "@/components/production/task/form/task-form";
import { useTaskMutations } from "@/hooks";
import { useAuth } from "@/contexts/auth-context";
import { useTheme } from "@/lib/theme";
import { routeToMobilePath } from '@/utils/route-mapper';
import { routes, SECTOR_PRIVILEGES } from "@/constants";

export default function CreateScheduleScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { colors } = useTheme();
  const { createAsync, isLoading } = useTaskMutations();
  const [checkingPermission, setCheckingPermission] = useState(true);

  // Check permissions - Only ADMIN and FINANCIAL can create tasks
  const userPrivilege = user?.sector?.privileges;
  const canCreate = userPrivilege === SECTOR_PRIVILEGES.ADMIN ||
                    userPrivilege === SECTOR_PRIVILEGES.FINANCIAL;

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
        router.replace("/producao/cronograma");
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

  const handleSubmit = async (data: any) => {
    try {
      console.log('[CreateSchedule] Starting task creation...');
      console.log('[CreateSchedule] Task data:', JSON.stringify(data, null, 2));

      // Layouts are now consolidated in the truck object (leftSideLayout, rightSideLayout, backSideLayout)
      // The backend handles everything in a single transaction
      const result = await createAsync(data);
      console.log('[CreateSchedule] API result:', result);

      if (result.success && result.data) {
        console.log('[CreateSchedule] Task created successfully');
        // API client already shows success alert
        router.replace(routeToMobilePath(routes.production.schedule.root) as any);
      } else {
        // API returned failure
        console.error('[CreateSchedule] Task creation failed:', result);
        Alert.alert(
          "Erro ao criar tarefa",
          result?.message || "Não foi possível criar a tarefa. Tente novamente."
        );
      }
    } catch (error: any) {
      console.error("[CreateSchedule] Error creating task:", error);
      // API client already shows error alert
    }
  };

  const handleCancel = () => {
    router.replace(routeToMobilePath(routes.production.schedule.root) as any);
  };

  return (
    <ThemedView className="flex-1">
      <TaskForm
        mode="create"
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        isSubmitting={isLoading}
      />
    </ThemedView>
  );
}
