import { ThemedView } from "@/components/ui/themed-view";
import { ActivityBatchCreateForm } from "@/components/inventory/activity/form";
import { PrivilegeGate } from "@/components/auth/privilege-gate";
import { useActivityBatchMutations, useFormScreenKey, useScreenReady } from "@/hooks";
import { useNav } from "@/contexts/nav";
import { mobileRoute } from "@/constants/routes.types";
import { ACTIVITY_OPERATION, SECTOR_PRIVILEGES, routes } from "@/constants";

export default function InventoryMovementsCreateScreen() {
  return (
    <PrivilegeGate
      required={{ any: [SECTOR_PRIVILEGES.WAREHOUSE, SECTOR_PRIVILEGES.ADMIN] }}
    >
      <InventoryMovementsCreateInner />
    </PrivilegeGate>
  );
}

function InventoryMovementsCreateInner() {
  const nav = useNav();
  const { batchCreateAsync, isBatchCreating } = useActivityBatchMutations();

  useScreenReady();
  const formKey = useFormScreenKey();

  const handleSubmit = async (data: {
    operation: typeof ACTIVITY_OPERATION.INBOUND | typeof ACTIVITY_OPERATION.OUTBOUND;
    userId?: string | null;
    reason?: string | null;
    orderId?: string | null;
    orderItemId?: string | null;
    items: Array<{ itemId: string; quantity: number }>;
  }) => {
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
    return result?.data;
  };

  const handleCancel = () => {
    nav.replace(mobileRoute(routes.inventory.activities.list));
  };

  return (
    <ThemedView style={{ flex: 1 }}>
      <ActivityBatchCreateForm
        key={formKey}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        isSubmitting={isBatchCreating}
      />
    </ThemedView>
  );
}
