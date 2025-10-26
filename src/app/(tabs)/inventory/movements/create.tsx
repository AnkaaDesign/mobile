import { useRouter } from "expo-router";
import { Alert } from "react-native";
import { ThemedView } from "@/components/ui/themed-view";
import { ActivitySimpleForm } from "@/components/inventory/activity/form/activity-simple-form";
import { useActivityMutations } from "@/hooks";
import { routeToMobilePath } from "@/lib/route-mapper";
import { routes } from "@/constants";
import type { ActivityCreateFormData } from "@/schemas";

export default function InventoryMovementsCreateScreen() {
  const router = useRouter();
  const { createAsync, isCreating } = useActivityMutations();

  const handleSubmit = async (data: ActivityCreateFormData) => {
    try {
      const result = await createAsync(data);

      if (result?.data) {
        Alert.alert("Sucesso", "Movimentação registrada com sucesso!", [
          {
            text: "OK",
            onPress: () => {
              router.replace(routeToMobilePath(routes.inventory.movements.list) as any);
            },
          },
        ]);
      } else {
        Alert.alert("Erro", "Erro ao registrar movimentação");
      }
    } catch (error: any) {
      Alert.alert("Erro", error.message || "Erro ao registrar movimentação. Tente novamente.");
    }
  };

  const handleCancel = () => {
    router.back();
  };

  return (
    <ThemedView style={{ flex: 1 }}>
      <ActivitySimpleForm
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        isSubmitting={isCreating}
      />
    </ThemedView>
  );
}
