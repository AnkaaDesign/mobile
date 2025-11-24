import { useRouter } from "expo-router";
import { useState, useEffect } from "react";
import { View, ActivityIndicator } from "react-native";
import { showToast } from "@/components/ui/toast";
import { ThemedView } from "@/components/ui/themed-view";
import { ThemedText } from "@/components/ui/themed-text";
import { TaskForm } from "@/components/production/task/form/task-form";
import { useTaskMutations, useLayoutMutations } from "@/hooks";
import { useAuth } from "@/contexts/auth-context";
import { useTheme } from "@/lib/theme";
import { routeToMobilePath } from "@/lib/route-mapper";
import { routes, SECTOR_PRIVILEGES } from "@/constants";

export default function CreateScheduleScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { colors } = useTheme();
  const { createAsync, isLoading } = useTaskMutations();
  const { createOrUpdateTruckLayout } = useLayoutMutations();
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
        showToast({
          title: "Acesso negado",
          message: "Você não tem permissão para criar tarefas",
          type: "error",
        });
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

      // Extract layouts from data if present (they come as truckLayoutData from form)
      const { truckLayoutData, layouts: taskLayouts, ...taskData } = data;
      const layoutsToCreate = truckLayoutData || taskLayouts;

      console.log('[CreateSchedule] Task data:', JSON.stringify(taskData, null, 2));
      console.log('[CreateSchedule] Layouts to create:', layoutsToCreate);

      const result = await createAsync(taskData);
      console.log('[CreateSchedule] API result:', result);

      if (result.success && result.data) {
        const createdTask = result.data;
        const truckId = createdTask.truck?.id;

        console.log('[CreateSchedule] Task created successfully, truckId:', truckId);

        // Create layouts if truck was created and layouts exist
        if (truckId && layoutsToCreate) {
          console.log('[CreateSchedule] Creating layouts for truck:', truckId);

          const layoutPromises = [];

          // Transform layout data to match API schema
          const transformLayoutForAPI = (layoutData: any) => {
            if (!layoutData?.sections) return null;

            // CRITICAL FIX: Clone the object to ensure arrays don't get corrupted by Axios (aligned with web)
            const sections = layoutData.sections.map((section: any, index: number) => ({
              width: section.width,
              isDoor: section.isDoor,
              doorOffset: section.isDoor ? section.doorOffset : null,
              position: index,
            }));

            const transformed = {
              height: layoutData.height,
              sections,
              photoId: layoutData.photoId || null,
            };

            // Clone to prevent Axios corruption (like web does)
            return JSON.parse(JSON.stringify(transformed));
          };

          // Create layouts for each side - check both old format (left/right/back) and new format (leftSide/rightSide/backSide)
          const leftLayout = layoutsToCreate.left || layoutsToCreate.leftSide;
          const rightLayout = layoutsToCreate.right || layoutsToCreate.rightSide;
          const backLayout = layoutsToCreate.back || layoutsToCreate.backSide;

          if (leftLayout?.sections?.length > 0) {
            const leftLayoutData = transformLayoutForAPI(leftLayout);
            if (leftLayoutData) {
              console.log('[CreateSchedule] Adding left layout:', leftLayoutData);
              layoutPromises.push(
                createOrUpdateTruckLayout({ truckId, side: 'left', data: leftLayoutData })
              );
            }
          }

          if (rightLayout?.sections?.length > 0) {
            const rightLayoutData = transformLayoutForAPI(rightLayout);
            if (rightLayoutData) {
              console.log('[CreateSchedule] Adding right layout:', rightLayoutData);
              layoutPromises.push(
                createOrUpdateTruckLayout({ truckId, side: 'right', data: rightLayoutData })
              );
            }
          }

          if (backLayout?.sections?.length > 0) {
            const backLayoutData = transformLayoutForAPI(backLayout);
            if (backLayoutData) {
              console.log('[CreateSchedule] Adding back layout:', backLayoutData);
              layoutPromises.push(
                createOrUpdateTruckLayout({ truckId, side: 'back', data: backLayoutData })
              );
            }
          }

          // Create all layouts in parallel
          if (layoutPromises.length > 0) {
            try {
              await Promise.all(layoutPromises);
              console.log('[CreateSchedule] Successfully created all layouts for truck:', truckId);
            } catch (layoutError: any) {
              console.error('[CreateSchedule] Error creating layouts:', layoutError);
              // Task was created successfully, show partial success message
              showToast({
                title: "Tarefa criada",
                message: `Tarefa criada, mas erro ao criar layouts: ${layoutError?.message || 'Erro desconhecido'}`,
                type: "error",
                duration: 8000,
              });
              // Still navigate since task was created
              router.replace(routeToMobilePath(routes.production.schedule.root) as any);
              return;
            }
          }
        }

        showToast({
          message: "Tarefa criada com sucesso!",
          type: "success",
        });
        router.replace(routeToMobilePath(routes.production.schedule.root) as any);
      } else {
        // API returned failure
        console.error('[CreateSchedule] Task creation failed:', result);
        showToast({
          title: "Erro ao criar tarefa",
          message: result?.message || "Não foi possível criar a tarefa. Tente novamente.",
          type: "error",
        });
      }
    } catch (error: any) {
      console.error("[CreateSchedule] Error creating task:", error);
      showToast({
        title: "Erro ao criar tarefa",
        message: error?.message || "Ocorreu um erro inesperado. Por favor, tente novamente.",
        type: "error",
      });
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
