import { useRouter } from "expo-router";
import { showToast } from "@/components/ui/toast";
import { ThemedView } from "@/components/ui/themed-view";
import { ActivityBatchCreateForm } from "@/components/inventory/activity/form/activity-batch-create-form";
import { useActivityBatchMutations } from '../../../../hooks';
import { routeToMobilePath } from "@/lib/route-mapper";
import { routes } from '../../../../constants';

export default function InventoryMovementsCreateScreen() {
  const router = useRouter();
  const { batchCreateAsync, batchCreateMutation } = useActivityBatchMutations();

  const handleSubmit = async (data: any) => {
    try {
      // Transform data to match API schema
      const activities = data.items.map((item: any) => ({
        itemId: item.itemId,
        quantity: item.quantity,
        operation: data.operation,
        userId: data.userId || undefined,
        reason: data.reason || undefined,
      }));

      const result = await batchCreateAsync({
        activities,
      });

      if (result.success) {
        showToast({
          message: `${activities.length} movimentação(ões) criada(s) com sucesso!`,
          type: "success",
        });
        router.replace("/(tabs)/inventory/movements/list");
      }
    } catch (error) {
      // Error handled by mutation hook
      console.error("Error creating activities:", error);
    }
  };

  const handleCancel = () => {
    router.replace("/(tabs)/inventory/movements/list");
  };

  return (
    <ThemedView className="flex-1">
      <ActivityBatchCreateForm
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        isSubmitting={batchCreateMutation.isPending}
      />
    </ThemedView>
  );
}
