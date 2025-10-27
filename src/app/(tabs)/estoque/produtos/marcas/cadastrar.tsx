import { useRouter } from "expo-router";
import { showToast } from "@/components/ui/toast";
import { ThemedView } from "@/components/ui/themed-view";
import { ItemBrandForm } from "@/components/inventory/item/brand/form/brand-form";
import { useItemBrandMutations } from '../../../../../hooks';
import { itemBrandCreateSchema, type ItemBrandCreateFormData } from '../../../../../schemas';
import { routeToMobilePath } from "@/lib/route-mapper";
import { routes } from '../../../../../constants';

export default function BrandCreateScreen() {
  const router = useRouter();
  const { createAsync, createMutation } = useItemBrandMutations();

  const handleSubmit = async (data: ItemBrandCreateFormData) => {
    try {
      // Validate data with schema
      const validatedData = itemBrandCreateSchema.parse(data);

      const result = await createAsync(validatedData);

      if (result.success) {
        showToast({
          message: "Marca criada com sucesso!",
          type: "success",
        });
        router.replace(routeToMobilePath(routes.inventory.products.brands.root) as any);
      }
    } catch (error) {
      // Error handled by mutation hook
      console.error("Error creating brand:", error);
    }
  };

  const handleCancel = () => {
    router.replace(routeToMobilePath(routes.inventory.products.brands.root) as any);
  };

  return (
    <ThemedView className="flex-1">
      <ItemBrandForm mode="create" onSubmit={handleSubmit} onCancel={handleCancel} isSubmitting={createMutation.isPending} />
    </ThemedView>
  );
}
