import { useRouter } from "expo-router";
// import { showToast } from "@/components/ui/toast";
import { ItemForm } from "@/components/inventory/item/form/item-form";
import { useItemMutations } from "@/hooks";
import { itemCreateSchema, type ItemCreateFormData } from '../../../../schemas';
import { routeToMobilePath } from '@/utils/route-mapper';
import { routes } from "@/constants";

export default function ItemCreateScreen() {
  const router = useRouter();
  const { createAsync, createMutation } = useItemMutations();

  const handleSubmit = async (data: ItemCreateFormData) => {
    try {
      // Validate data with schema
      const validatedData = itemCreateSchema.parse(data);

      const result = await createAsync(validatedData);

      if (result.success) {
        // API client already shows success alert
        router.replace(routeToMobilePath(routes.inventory.products.root) as any);
      }
    } catch (error) {
      // API client already shows error alert
      console.error("Error creating item:", error);
    }
  };

  const handleCancel = () => {
    router.back();
  };

  return (
    <ItemForm
      mode="create"
      onSubmit={handleSubmit}
      onCancel={handleCancel}
      isSubmitting={createMutation.isPending}
    />
  );
}
