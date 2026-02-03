
import { Alert } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { TaskForm } from "@/components/production/task/form";
import { useTaskMutations } from "@/hooks";
import { routes } from "@/constants";
import { routeToMobilePath } from '@/utils/route-mapper';
import { useNavigationLoading } from "@/contexts/navigation-loading-context";
import { useNavigationHistory } from "@/contexts/navigation-history-context";
import type { TaskCreateFormData } from "@/schemas";

export default function CreateServiceOrderScreen() {
  const router = useRouter();
  const { goBack } = useNavigationLoading();
  const { getBackPath } = useNavigationHistory();
  // Fixed: isCreating doesn't exist, use isLoading instead
  const { createAsync, isLoading: isCreating } = useTaskMutations();

  const handleSubmit = async (data: TaskCreateFormData) => {
    try {
      const result = await createAsync(data);

      if (result?.data) {
        Alert.alert("Sucesso", "Ordem de serviço criada com sucesso!", [
          {
            text: "OK",
            onPress: () => {
              router.replace(
                routeToMobilePath(
                  routes.production.serviceOrders.details(result.data?.id || '')
                ) as any
              );
            },
          },
        ]);
      } else {
        Alert.alert("Erro", "Erro ao criar ordem de serviço");
      }
    } catch (error: any) {
      Alert.alert(
        "Erro",
        error.message || "Erro ao criar ordem de serviço. Tente novamente."
      );
    }
  };

  const handleCancel = () => {
    console.log('[CreateServiceOrder] handleCancel called');
    Alert.alert(
      "Descartar Cadastro",
      "Deseja descartar o cadastro da ordem de serviço?",
      [
        { text: "Continuar Editando", style: "cancel" },
        {
          text: "Descartar",
          style: "destructive",
          onPress: () => {
            console.log('[CreateServiceOrder] User confirmed discard, going back');
            const backPath = getBackPath();
            if (backPath) {
              goBack();
            } else {
              // Fallback to service orders list
              router.replace(routeToMobilePath(routes.production.serviceOrders.root) as any);
            }
          }
        },
      ]
    );
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <TaskForm
        mode="create"
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        isSubmitting={isCreating}
      />
    </SafeAreaView>
  );
}
