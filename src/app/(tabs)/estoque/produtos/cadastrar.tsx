import { useRouter } from "expo-router";
// import { showToast } from "@/components/ui/toast";
import { ItemForm } from "@/components/inventory/item/form/item-form";
import { useItemMutations, useScreenReady } from "@/hooks";
import { itemCreateSchema, type ItemCreateFormData } from '../../../../schemas';
import { routeToMobilePath } from '@/utils/route-mapper';
import { routes } from "@/constants";
import { useNavigationLoading } from "@/contexts/navigation-loading-context";

export default function ItemCreateScreen() {
  const router = useRouter();
  const { createAsync, createMutation } = useItemMutations();
  const { goBack } = useNavigationLoading();

  // End navigation loading overlay when screen mounts
  useScreenReady();

  const handleSubmit = async (data: ItemCreateFormData) => {
    try {
      // Validate data with schema
      const validatedData = itemCreateSchema.parse(data);

      const result = await createAsync(validatedData);

      if (result.success && result.data) {
        // API client already shows success alert
        router.replace(routeToMobilePath(routes.inventory.products.details(result.data.id)) as any);
      }
    } catch (error) {
      // API client already shows error alert
      console.error("Error creating item:", error);
    }
  };

  const handleCancel = () => {
    goBack({ fallbackRoute: routeToMobilePath(routes.inventory.products.root) });
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
