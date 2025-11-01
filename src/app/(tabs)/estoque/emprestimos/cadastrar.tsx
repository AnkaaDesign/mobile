import { useRouter } from "expo-router";
import { Alert } from "react-native";
import { ThemedView } from "@/components/ui/themed-view";
import { BorrowSimpleForm } from "@/components/inventory/borrow/form/borrow-simple-form";
import { useBorrowMutations } from "@/hooks";
import { routeToMobilePath } from "@/lib/route-mapper";
import { routes } from "@/constants";
import type { BorrowCreateFormData } from "@/schemas";

export default function EstoqueEmprestimosCadastrarScreen() {
  const router = useRouter();
  const { createAsync, isCreating } = useBorrowMutations();

  const handleSubmit = async (data: BorrowCreateFormData) => {
    try {
      const result = await createAsync(data);

      if (result?.data) {
        Alert.alert("Sucesso", "Empréstimo registrado com sucesso!", [
          {
            text: "OK",
            onPress: () => {
              router.replace(routeToMobilePath(routes.inventory.borrows.root) as any);
            },
          },
        ]);
      } else {
        Alert.alert("Erro", "Erro ao registrar empréstimo");
      }
    } catch (error: any) {
      Alert.alert("Erro", error.message || "Erro ao registrar empréstimo. Tente novamente.");
    }
  };

  const handleCancel = () => {
    router.back();
  };

  return (
    <ThemedView style={{ flex: 1 }}>
      <BorrowSimpleForm
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        isSubmitting={isCreating}
      />
    </ThemedView>
  );
}
