import { ItemBrandForm } from "@/components/inventory/item/brand/form/brand-form";
import { PrivilegeGate } from "@/components/auth/privilege-gate";
import { useFormScreenKey, useItemBrandMutations, useScreenReady } from "@/hooks";
import { itemBrandCreateSchema, type ItemBrandCreateFormData } from "@/schemas";
import { useNav } from "@/contexts/nav";
import { mobileRoute } from "@/constants/routes.types";
import { SECTOR_PRIVILEGES, routes } from "@/constants";

export default function BrandCreateScreen() {
  return (
    <PrivilegeGate
      required={{ any: [SECTOR_PRIVILEGES.WAREHOUSE, SECTOR_PRIVILEGES.ADMIN] }}
    >
      <BrandCreateScreenInner />
    </PrivilegeGate>
  );
}

function BrandCreateScreenInner() {
  const nav = useNav();
  const { createAsync, createMutation } = useItemBrandMutations();

  useScreenReady();
  const formKey = useFormScreenKey();

  const handleSubmit = async (data: ItemBrandCreateFormData) => {
    try {
      const validatedData = itemBrandCreateSchema.parse(data);
      const result = await createAsync(validatedData);
      if (result.success && result.data) {
        nav.replace(mobileRoute(routes.inventory.products.brands.details(result.data.id)));
      }
    } catch (error) {
      // API client surfaces error.
      console.error("Error creating brand:", error);
    }
  };

  const handleCancel = () => {
    nav.goBack({ fallback: mobileRoute(routes.inventory.products.brands.root) });
  };

  return (
    <ItemBrandForm
      key={formKey}
      mode="create"
      onSubmit={handleSubmit}
      onCancel={handleCancel}
      isSubmitting={createMutation.isPending}
    />
  );
}
