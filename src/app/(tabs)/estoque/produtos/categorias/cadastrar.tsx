import { useRouter } from "expo-router";
// import { showToast } from "@/components/ui/toast";
import { ItemCategoryForm } from "@/components/inventory/item/category/form/category-form";
import { useItemCategoryMutations } from "@/hooks";
import { itemCategoryCreateSchema, type ItemCategoryCreateFormData } from '../../../../../schemas';
import { routeToMobilePath } from '@/utils/route-mapper';
import { routes } from "@/constants";

export default function CategoryCreateScreen() {
  const router = useRouter();
  const { createAsync, createMutation } = useItemCategoryMutations();

  const handleSubmit = async (data: ItemCategoryCreateFormData) => {
    try {
      // Validate data with schema
      const validatedData = itemCategoryCreateSchema.parse(data);

      const result = await createAsync(validatedData);

      if (result.success) {
        // API client already shows success alert
        router.replace(routeToMobilePath(routes.inventory.products.categories.root) as any);
      }
    } catch (error) {
      // API client already shows error alert
      console.error("Error creating category:", error);
    }
  };

  const handleCancel = () => {
    router.replace(routeToMobilePath(routes.inventory.products.categories.root) as any);
  };

  return <ItemCategoryForm mode="create" onSubmit={handleSubmit} onCancel={handleCancel} isSubmitting={createMutation.isPending} />;
}
