import { useRouter } from "expo-router";
import { ThemedView } from "@/components/ui/themed-view";
import { BorrowBatchCreateForm } from "@/components/inventory/borrow/form";
import { useBorrowBatchMutations, useScreenReady } from "@/hooks";
import { routeToMobilePath } from '@/utils/route-mapper';
import { routes } from "@/constants";

export default function EstoqueEmprestimosCadastrarScreen() {
  const router = useRouter();
  const { batchCreateAsync, isLoading: isBatchCreating } = useBorrowBatchMutations();

  // End navigation loading overlay when screen mounts
  useScreenReady(true);

  const handleSubmit = async (data: {
    userId: string;
    items: Array<{ itemId: string; quantity: number }>;
  }) => {
    // Create batch borrows - one borrow per item
    const borrows = data.items.map((item) => ({
      userId: data.userId,
      itemId: item.itemId,
      quantity: item.quantity,
    }));

    const result = await batchCreateAsync({ borrows });

    // Return the result to be displayed in the modal
    return result?.data;
  };

  const handleCancel = () => {
    router.replace(routeToMobilePath(routes.inventory.borrows.root) as any);
  };

  return (
    <ThemedView style={{ flex: 1 }}>
      <BorrowBatchCreateForm
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        isSubmitting={isBatchCreating}
      />
    </ThemedView>
  );
}
