import React from "react";
import { Alert } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { TaskForm } from "@/components/production/task/form/task-form";
import { useTaskMutations } from "@/hooks";
import { routes } from "@/constants";
import { routeToMobilePath } from "@/lib/route-mapper";
import type { TaskCreateFormData } from "@/schemas";

export default function CreateServiceOrderScreen() {
  const router = useRouter();
  const { createAsync, isCreating } = useTaskMutations();

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
                  routes.production.serviceOrders.details(result.data.id)
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
    Alert.alert(
      "Descartar Cadastro",
      "Deseja descartar o cadastro da ordem de serviço?",
      [
        { text: "Continuar Editando", style: "cancel" },
        { text: "Descartar", style: "destructive", onPress: () => router.back() },
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
