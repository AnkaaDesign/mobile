import { View, StyleSheet } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { showToast } from "@/components/ui/toast";
import { ThemedView } from "@/components/ui/themed-view";
import { ThemedText } from "@/components/ui/themed-text";
import { Button } from "@/components/ui/button";
import { TaskForm } from "@/components/production/task/form/task-form";
import { SkeletonCard } from "@/components/ui/loading";
import { useTaskDetail, useTaskMutations } from '../../../../../hooks';
import { routeToMobilePath } from "@/lib/route-mapper";
import { routes } from '../../../../../constants';
import { spacing } from "@/constants/design-system";

export default function EditScheduleScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { updateAsync, isLoading } = useTaskMutations();

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
    },
  });

  const task = response?.data;

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

  return (
    <ThemedView className="flex-1">
      <TaskForm
        mode="edit"
        initialData={{
          name: task.name,
          customerId: task.customerId || "",
          sectorId: task.sectorId ?? undefined,
          serialNumber: task.serialNumber ?? undefined,
          plate: task.plate ?? undefined,
          details: task.details ?? undefined,
          entryDate: task.entryDate ? new Date(task.entryDate) : undefined,
          term: task.term ? new Date(task.term) : undefined,
          generalPaintingId: task.paintId ?? undefined,
          paintIds: task.logoPaints?.map((p) => p.id) || [],
          services: task.services?.map((s) => ({
            description: s.description,
            status: s.status ?? undefined,
          })) || [],
          status: task.status,
          startedAt: task.startedAt ? new Date(task.startedAt) : null,
          finishedAt: task.finishedAt ? new Date(task.finishedAt) : null,
        }}
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
