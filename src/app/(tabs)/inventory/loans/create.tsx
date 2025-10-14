import { useRouter } from "expo-router";
import { showToast } from "@/components/ui/toast";
import { ThemedView } from "@/components/ui/themed-view";
import { BorrowBatchCreateForm } from "@/components/inventory/borrow/form/borrow-batch-create-form";
import { useBorrowBatchMutations } from '../../../../hooks';
import { routeToMobilePath } from "@/lib/route-mapper";
import { routes } from '../../../../constants';

export default function EstoqueEmprestimosCadastrarScreen() {
  const router = useRouter();
  const { batchCreateAsync, batchCreateMutation } = useBorrowBatchMutations();

  const handleSubmit = async (data: any) => {
    try {
      // Transform data to match API schema
      const borrows = data.items.map((item: any) => ({
        itemId: item.itemId,
        quantity: item.quantity,
        userId: data.userId,
      }));

      const result = await batchCreateAsync({
        borrows,
      });

      if (result.success) {
        showToast({
          message: `${borrows.length} empréstimo(s) criado(s) com sucesso!`,
          type: "success",
        });
        router.replace(routeToMobilePath(routes.inventory.loans.root) as any);
      }
    } catch (error) {
      // Error handled by mutation hook
      console.error("Error creating borrows:", error);
    }
  };

  const handleCancel = () => {
    router.replace(routeToMobilePath(routes.inventory.loans.root) as any);
  };

  return (
    <ThemedView className="flex-1">
      <BorrowBatchCreateForm
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        isSubmitting={batchCreateMutation.isPending}
      />
    </ThemedView>
  );
}
