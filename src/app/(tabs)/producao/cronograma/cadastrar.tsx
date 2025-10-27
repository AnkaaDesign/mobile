import { useRouter } from "expo-router";
import { showToast } from "@/components/ui/toast";
import { ThemedView } from "@/components/ui/themed-view";
import { TaskForm } from "@/components/production/task/form/task-form";
import { useTaskMutations } from '../../../../hooks';
import { routeToMobilePath } from "@/lib/route-mapper";
import { routes } from '../../../../constants';

export default function CreateScheduleScreen() {
  const router = useRouter();
  const { createAsync, isLoading } = useTaskMutations();

  const handleSubmit = async (data: any) => {
    try {
      const result = await createAsync(data);

      if (result.success) {
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
