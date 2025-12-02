import { useRouter } from "expo-router";
import { Alert } from "react-native";
import { ThemedView } from "@/components/ui/themed-view";
import { ActivityBatchCreateForm } from "@/components/inventory/activity/form";
import { useActivityBatchMutations } from "@/hooks";
import { routeToMobilePath } from '@/utils/route-mapper';
import { routes, ACTIVITY_OPERATION } from "@/constants";

export default function InventoryMovementsCreateScreen() {
  const router = useRouter();
  const { batchCreateAsync, isBatchCreating } = useActivityBatchMutations();

  const handleSubmit = async (data: {
    operation: typeof ACTIVITY_OPERATION.INBOUND | typeof ACTIVITY_OPERATION.OUTBOUND;
    userId?: string | null;
    reason?: string | null;
    orderId?: string | null;
    orderItemId?: string | null;
    items: Array<{ itemId: string; quantity: number }>;
  }) => {
    try {
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

      if (result?.data) {
        const successCount = result.data.totalSuccess;
        const failCount = result.data.totalFailed;

        if (failCount === 0) {
          Alert.alert(
            "Sucesso",
            `${successCount} movimentação(ões) registrada(s) com sucesso!`,
            [
              {
                text: "OK",
                onPress: () => {
                  router.replace(routeToMobilePath(routes.inventory.activities.list) as any);
                },
              },
            ],
          );
        } else {
          Alert.alert(
            "Parcialmente Concluído",
            `${successCount} sucesso(s), ${failCount} falha(s)`,
            [
              {
                text: "OK",
                onPress: () => {
                  router.replace(routeToMobilePath(routes.inventory.activities.list) as any);
                },
              },
            ],
          );
        }
      } else {
        Alert.alert("Erro", "Erro ao registrar movimentações");
      }
    } catch (error: any) {
      Alert.alert("Erro", error.message || "Erro ao registrar movimentações. Tente novamente.");
    }
  };

  const handleCancel = () => {
    router.back();
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
