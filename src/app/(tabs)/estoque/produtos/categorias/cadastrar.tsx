import { ItemCategoryForm } from "@/components/inventory/item/category/form/category-form";
import { PrivilegeGate } from "@/components/auth/privilege-gate";
import { useFormScreenKey, useItemCategoryMutations, useScreenReady } from "@/hooks";
import { itemCategoryCreateSchema, type ItemCategoryCreateFormData } from "@/schemas";
import { useNav } from "@/contexts/nav";
import { mobileRoute } from "@/constants/routes.types";
import { SECTOR_PRIVILEGES, routes } from "@/constants";

export default function CategoryCreateScreen() {
  return (
    <PrivilegeGate
      required={{ any: [SECTOR_PRIVILEGES.WAREHOUSE, SECTOR_PRIVILEGES.ADMIN] }}
    >
      <CategoryCreateScreenInner />
    </PrivilegeGate>
  );
}

function CategoryCreateScreenInner() {
  const nav = useNav();
  const { createAsync, createMutation } = useItemCategoryMutations();

  useScreenReady();
  const formKey = useFormScreenKey();

  const handleSubmit = async (data: ItemCategoryCreateFormData) => {
    try {
      const validatedData = itemCategoryCreateSchema.parse(data);
      const result = await createAsync(validatedData);
      if (result.success && result.data) {
        nav.replace(mobileRoute(routes.inventory.products.categories.details(result.data.id)));
      }
    } catch (error) {
      // API client surfaces error.
      console.error("Error creating category:", error);
    }
  };

  const handleCancel = () => {
    nav.goBack({ fallback: mobileRoute(routes.inventory.products.categories.root) });
  };

  return (
    <ItemCategoryForm
      key={formKey}
      mode="create"
      onSubmit={handleSubmit}
      onCancel={handleCancel}
      isSubmitting={createMutation.isPending}
    />
  );
}
