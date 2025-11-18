import React, { useEffect, useState } from "react";
import { View, StyleSheet, ActivityIndicator } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { showToast } from "@/components/ui/toast";
import { ThemedView } from "@/components/ui/themed-view";
import { ThemedText } from "@/components/ui/themed-text";
import { Button } from "@/components/ui/button";
import { TaskForm } from "@/components/production/task/form/task-form";
import { SkeletonCard } from "@/components/ui/loading";
import { useTaskDetail, useTaskMutations, useLayoutsByTruck } from "@/hooks";
import { useAuth } from "@/contexts/auth-context";
import { useTheme } from "@/lib/theme";
import { routeToMobilePath } from "@/lib/route-mapper";
import { routes, SECTOR_PRIVILEGES } from "@/constants";
import { spacing } from "@/constants/design-system";

export default function EditScheduleScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const { colors } = useTheme();
  const { updateAsync, isLoading } = useTaskMutations();
  const [checkingPermission, setCheckingPermission] = useState(true);

  // Check permissions - Only ADMIN and FINANCIAL can edit tasks
  const userPrivilege = user?.sector?.privileges;
  const canEdit = userPrivilege === SECTOR_PRIVILEGES.ADMIN ||
                  userPrivilege === SECTOR_PRIVILEGES.FINANCIAL;

  useEffect(() => {
    // Wait for user to load
    if (user !== undefined) {
      setCheckingPermission(false);

      // Redirect if no permission
      if (!canEdit) {
        showToast({
          title: "Acesso negado",
          message: "Você não tem permissão para editar tarefas",
          type: "error",
        });
        router.replace("/producao/cronograma");
      }
    }
  }, [user, canEdit, router]);

  const {
    data: response,
    isLoading: isLoadingTask,
    error,
  } = useTaskDetail(id!, {
    include: {
      customer: true,
      sector: true,
      generalPainting: true,
      logoPaints: true,
      services: true,
      truck: true, // ✅ Include truck to get truckId
    },
  });

  const task = response?.data;

  // Fetch truck layouts if task has a truck
  const truckId = task?.truck?.id || task?.truckId;
  const { data: layoutsData } = useLayoutsByTruck(truckId || "", {
    include: { layoutSections: true },
    enabled: !!truckId,
  });

  // Transform layout data from backend format to LayoutCreateFormData format
  // Must be before conditional returns to maintain hook order
  const existingLayouts = React.useMemo(() => {
    if (!layoutsData) return undefined;

    const layouts: any = {};

    // Transform left side layout
    if (layoutsData.leftSideLayout?.layoutSections) {
      layouts.left = {
        height: layoutsData.leftSideLayout.height,
        sections: layoutsData.leftSideLayout.layoutSections.map((s: any) => ({
          width: s.width,
          isDoor: s.isDoor,
          doorOffset: s.doorOffset,
          position: s.position,
        })),
        photoId: layoutsData.leftSideLayout.photoId,
      };
    }

    // Transform right side layout
    if (layoutsData.rightSideLayout?.layoutSections) {
      layouts.right = {
        height: layoutsData.rightSideLayout.height,
        sections: layoutsData.rightSideLayout.layoutSections.map((s: any) => ({
          width: s.width,
          isDoor: s.isDoor,
          doorOffset: s.doorOffset,
          position: s.position,
        })),
        photoId: layoutsData.rightSideLayout.photoId,
      };
    }

    // Transform back side layout
    if (layoutsData.backSideLayout?.layoutSections) {
      layouts.back = {
        height: layoutsData.backSideLayout.height,
        sections: layoutsData.backSideLayout.layoutSections.map((s: any) => ({
          width: s.width,
          isDoor: s.isDoor,
          doorOffset: s.doorOffset,
          position: s.position,
        })),
        photoId: layoutsData.backSideLayout.photoId,
      };
    }

    return Object.keys(layouts).length > 0 ? layouts : undefined;
  }, [layoutsData]);

  const handleSubmit = async (data: any) => {
    if (!id) return;

    try {
      const result = await updateAsync({ id, data });

      if (result.success) {
        showToast({
          message: "Tarefa atualizada com sucesso!",
          type: "success",
        });
        router.replace(routeToMobilePath(routes.production.schedule.root) as any);
      }
    } catch (error) {
      console.error("Error updating task:", error);
    }
  };

  const handleCancel = () => {
    router.replace(routeToMobilePath(routes.production.schedule.root) as any);
  };

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
  if (!canEdit) {
    return null;
  }

  if (isLoadingTask) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.skeletonContainer}>
          <SkeletonCard style={styles.skeleton} />
          <SkeletonCard style={styles.skeleton} />
          <SkeletonCard style={styles.skeleton} />
        </View>
      </ThemedView>
    );
  }

  if (error || !task) {
    return (
      <ThemedView className="flex-1">
        <View className="flex-1 items-center justify-center px-4">
          <ThemedText className="text-2xl font-semibold mb-2 text-center">Tarefa não encontrada</ThemedText>
          <ThemedText className="text-muted-foreground mb-4 text-center">
            A tarefa que você está procurando não existe ou foi removida.
          </ThemedText>
          <Button onPress={handleCancel}>
            <ThemedText className="text-white">Voltar para lista</ThemedText>
          </Button>
        </View>
      </ThemedView>
    );
  }

  console.log('[EditScheduleScreen] Existing layouts:', existingLayouts);

  return (
    <ThemedView className="flex-1">
      <TaskForm
        mode="edit"
        initialData={{
          name: task.name,
          customerId: task.customerId || "",
          sectorId: task.sectorId ?? undefined,
          serialNumber: task.serialNumber ?? undefined,
          chassisNumber: task.chassisNumber ?? undefined,
          plate: task.plate ?? undefined,
          details: task.details ?? undefined,
          entryDate: task.entryDate ? new Date(task.entryDate) : undefined,
          term: task.term ? new Date(task.term) : undefined,
          generalPaintingId: task.paintId ?? undefined,
          paintIds: task.logoPaints?.filter((p) => p && p.id).map((p) => p.id) || [],
          services: task.services?.map((s) => ({
            description: s.description,
            status: s.status ?? undefined,
          })) || [],
          status: task.status,
          commission: task.commission ?? null,
          startedAt: task.startedAt ? new Date(task.startedAt) : null,
          finishedAt: task.finishedAt ? new Date(task.finishedAt) : null,
        }}
        initialCustomer={task.customer}
        existingLayouts={existingLayouts}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        isSubmitting={isLoading}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  skeletonContainer: {
    padding: spacing.lg,
    gap: spacing.lg,
  },
  skeleton: {
    height: 200,
  },
});
