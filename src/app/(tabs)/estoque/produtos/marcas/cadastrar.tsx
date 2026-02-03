import { useRouter } from "expo-router";
// import { showToast } from "@/components/ui/toast";
import { ItemBrandForm } from "@/components/inventory/item/brand/form/brand-form";
import { useItemBrandMutations, useScreenReady } from "@/hooks";
import { itemBrandCreateSchema, type ItemBrandCreateFormData } from '../../../../../schemas';
import { routeToMobilePath } from '@/utils/route-mapper';
import { routes } from "@/constants";
import { useNavigationLoading } from "@/contexts/navigation-loading-context";

export default function BrandCreateScreen() {
  const router = useRouter();
  const { createAsync, createMutation } = useItemBrandMutations();
  const { goBack } = useNavigationLoading();

  // End navigation loading overlay when screen mounts
  useScreenReady();

  const handleSubmit = async (data: ItemBrandCreateFormData) => {
    try {
      // Validate data with schema
      const validatedData = itemBrandCreateSchema.parse(data);

      const result = await createAsync(validatedData);

      if (result.success) {
        // API client already shows success alert
        router.replace(routeToMobilePath(routes.inventory.products.brands.root) as any);
      }
    } catch (error) {
      // API client already shows error alert
      console.error("Error creating brand:", error);
    }
  };

  const handleCancel = () => {
    goBack({ fallbackRoute: routeToMobilePath(routes.inventory.products.brands.root) });
  };

  return <ItemBrandForm mode="create" onSubmit={handleSubmit} onCancel={handleCancel} isSubmitting={createMutation.isPending} />;
}
