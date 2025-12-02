import { useRouter } from "expo-router";
import { Alert } from "react-native";
import { ThemedView } from "@/components/ui/themed-view";
import { BorrowBatchCreateForm } from "@/components/inventory/borrow/form";
import { useBorrowBatchMutations } from "@/hooks";
import { routeToMobilePath } from '@/utils/route-mapper';
import { routes } from "@/constants";

export default function EstoqueEmprestimosCadastrarScreen() {
  const router = useRouter();
  const { batchCreateAsync, isLoading: isBatchCreating } = useBorrowBatchMutations();

  const handleSubmit = async (data: {
    userId: string;
    items: Array<{ itemId: string; quantity: number }>;
  }) => {
    try {
      // Create batch borrows - one borrow per item
      const borrows = data.items.map((item) => ({
        userId: data.userId,
        itemId: item.itemId,
        quantity: item.quantity,
      }));

      const result = await batchCreateAsync({ borrows });

      if (result?.data) {
        const successCount = result.data.totalSuccess;
        const failCount = result.data.totalFailed;

        if (failCount === 0) {
          Alert.alert(
            "Sucesso",
            `${successCount} empréstimo(s) registrado(s) com sucesso!`,
            [
              {
                text: "OK",
                onPress: () => {
                  router.replace(routeToMobilePath(routes.inventory.borrows.root) as any);
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
                  router.replace(routeToMobilePath(routes.inventory.borrows.root) as any);
                },
              },
            ],
          );
        }
      } else {
        Alert.alert("Erro", "Erro ao registrar empréstimos");
      }
    } catch (error: any) {
      Alert.alert("Erro", error.message || "Erro ao registrar empréstimos. Tente novamente.");
    }
  };

  const handleCancel = () => {
    router.back();
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
