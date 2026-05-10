import { ThemedView } from "@/components/ui/themed-view";
import { BorrowBatchCreateForm } from "@/components/inventory/borrow/form";
import { PrivilegeGate } from "@/components/auth/privilege-gate";
import { useBorrowBatchMutations, useScreenReady, useFormScreenKey } from "@/hooks";
import { useNav } from "@/contexts/nav";
import { mobileRoute } from "@/constants/routes.types";
import { routes, SECTOR_PRIVILEGES } from "@/constants";

export default function EstoqueEmprestimosCadastrarScreen() {
  return (
    <PrivilegeGate
      required={{ any: [SECTOR_PRIVILEGES.WAREHOUSE, SECTOR_PRIVILEGES.ADMIN] }}
    >
      <BorrowCreateInner />
    </PrivilegeGate>
  );
}

function BorrowCreateInner() {
  const nav = useNav();
  const { batchCreateAsync, isLoading: isBatchCreating } = useBorrowBatchMutations();

  useScreenReady(true);
  const formKey = useFormScreenKey();

  const handleSubmit = async (data: {
    userId: string;
    items: Array<{ itemId: string; quantity: number }>;
  }) => {
    const borrows = data.items.map((item) => ({
      userId: data.userId,
      itemId: item.itemId,
      quantity: item.quantity,
    }));

    const result = await batchCreateAsync({ borrows });
    return result?.data;
  };

  const handleCancel = () => {
    nav.replace(mobileRoute(routes.inventory.borrows.root));
  };

  return (
    <ThemedView style={{ flex: 1 }}>
      <BorrowBatchCreateForm
        key={formKey}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        isSubmitting={isBatchCreating}
      />
    </ThemedView>
  );
}
