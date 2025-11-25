import { Stack, useRouter } from "expo-router";
import { showToast } from "@/components/ui/toast";
import { ThemedView } from "@/components/ui/themed-view";
import { PaintForm } from "@/components/painting/forms/painting-form";
import { usePaintMutations } from "@/hooks";
import { routeToMobilePath } from '@/utils/route-mapper';
import { routes } from "@/constants";

export default function CreateCatalogScreen() {
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
        router.replace(routeToMobilePath(routes.painting.catalog.root) as any);
      }
    } catch (error) {
      console.error("Error creating paint:", error);
    }
  };

  const handleCancel = () => {
    router.replace(routeToMobilePath(routes.painting.catalog.root) as any);
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
