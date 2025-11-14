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
  const [layouts, setLayouts] = useState<any>(null);
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
      // Extract layouts from data if present
      const { layouts: taskLayouts, ...taskData } = data;
      if (taskLayouts) {
        setLayouts(taskLayouts);
      }

      const result = await createAsync(taskData);

      if (result.success && result.data) {
        const createdTask = result.data;
        const truckId = createdTask.truck?.id;

        // Create layouts if truck was created and layouts exist
        if (truckId && taskLayouts) {
          console.log('Creating layouts for truck:', truckId);

          const layoutPromises = [];

          // Transform layout data to match API schema
          const transformLayoutForAPI = (layoutData: any) => {
            if (!layoutData?.sections) return null;

            const sections = layoutData.sections.map((section: any, index: number) => ({
              width: section.width,
              isDoor: section.isDoor,
              doorOffset: section.isDoor ? section.doorOffset : null,
              position: index,
            }));

            return {
              height: layoutData.height,
              sections,
              photoId: layoutData.photoId || null,
            };
          };

          // Create layouts for each side
          if (taskLayouts.left?.sections?.length > 0) {
            const leftLayoutData = transformLayoutForAPI(taskLayouts.left);
            if (leftLayoutData) {
              layoutPromises.push(
                createOrUpdateTruckLayout({ truckId, side: 'left', data: leftLayoutData })
              );
            }
          }

          if (taskLayouts.right?.sections?.length > 0) {
            const rightLayoutData = transformLayoutForAPI(taskLayouts.right);
            if (rightLayoutData) {
              layoutPromises.push(
                createOrUpdateTruckLayout({ truckId, side: 'right', data: rightLayoutData })
              );
            }
          }

          if (taskLayouts.back?.sections?.length > 0) {
            const backLayoutData = transformLayoutForAPI(taskLayouts.back);
            if (backLayoutData) {
              layoutPromises.push(
                createOrUpdateTruckLayout({ truckId, side: 'back', data: backLayoutData })
              );
            }
          }

          // Create all layouts in parallel
          if (layoutPromises.length > 0) {
            try {
              await Promise.all(layoutPromises);
              console.log('Successfully created layouts for truck:', truckId);
            } catch (layoutError) {
              console.error('Error creating layouts:', layoutError);
              showToast({
                message: "Tarefa criada, mas erro ao criar layouts",
                type: "error",
              });
              return;
            }
          }
        }

        showToast({
          message: "Tarefa criada com sucesso!",
          type: "success",
        });
        router.replace(routeToMobilePath(routes.production.schedule.root) as any);
      }
    } catch (error) {
      console.error("Error creating task:", error);
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
