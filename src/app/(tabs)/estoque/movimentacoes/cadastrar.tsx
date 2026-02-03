import { useRouter } from "expo-router";
import { ThemedView } from "@/components/ui/themed-view";
import { ActivityBatchCreateForm } from "@/components/inventory/activity/form";
import { useActivityBatchMutations, useScreenReady } from "@/hooks";
import { routeToMobilePath } from '@/utils/route-mapper';
import { routes, ACTIVITY_OPERATION } from "@/constants";

export default function InventoryMovementsCreateScreen() {
  const router = useRouter();
  const { batchCreateAsync, isBatchCreating } = useActivityBatchMutations();

  // End navigation loading overlay when screen mounts
  useScreenReady();

  const handleSubmit = async (data: {
    operation: typeof ACTIVITY_OPERATION.INBOUND | typeof ACTIVITY_OPERATION.OUTBOUND;
    userId?: string | null;
    reason?: string | null;
    orderId?: string | null;
    orderItemId?: string | null;
    items: Array<{ itemId: string; quantity: number }>;
  }) => {
    // Create batch activities - one activity per item
    const activities = data.items.map((item) => ({
      operation: data.operation,
      userId: data.userId,
      itemId: item.itemId,
      quantity: item.quantity,
      reason: data.reason,
      orderId: data.orderId,
      orderItemId: data.orderItemId,
    }));

    const result = await batchCreateAsync({ activities });

    // Return the result to be displayed in the modal
    return result?.data;
  };

  const handleCancel = () => {
    router.replace(routeToMobilePath(routes.inventory.activities.list) as any);
  };

  return (
    <ThemedView style={{ flex: 1 }}>
      <ActivityBatchCreateForm
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        isSubmitting={isBatchCreating}
      />
    </ThemedView>
  );
}
