import { Stack, useRouter } from "expo-router";
import { showToast } from "@/components/ui/toast";
import { ThemedView } from "@/components/ui/themed-view";
import { PaintForm } from "@/components/painting/forms/painting-form";
import { usePaintMutations } from "@/hooks";

export default function CreatePaintScreen() {
  const router = useRouter();
  const { createAsync, isLoading } = usePaintMutations();

  const handleSubmit = async (data: any) => {
    try {
      const result = await createAsync(data);

      if (result.success) {
        showToast({
          message: "Tinta criada com sucesso!",
          type: "success",
        });
        router.back();
      }
    } catch (error) {
      console.error("Error creating paint:", error);
      showToast({
        message: "Erro ao criar tinta",
        type: "error",
      });
    }
  };

  const handleCancel = () => {
    router.back();
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: "Cadastrar Tinta",
          headerBackTitle: "Voltar",
        }}
      />
      <ThemedView className="flex-1">
        <PaintForm
          mode="create"
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isSubmitting={isLoading}
        />
      </ThemedView>
    </>
  );
}
