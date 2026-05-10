import { ItemForm } from "@/components/inventory/item/form/item-form";
import { PrivilegeGate } from "@/components/auth/privilege-gate";
import { useFormScreenKey, useItemMutations, useScreenReady } from "@/hooks";
import { itemCreateSchema, type ItemCreateFormData } from "@/schemas";
import { useNav } from "@/contexts/nav";
import { mobileRoute } from "@/constants/routes.types";
import { SECTOR_PRIVILEGES, routes } from "@/constants";

export default function ItemCreateScreen() {
  return (
    <PrivilegeGate
      required={{ any: [SECTOR_PRIVILEGES.WAREHOUSE, SECTOR_PRIVILEGES.ADMIN] }}
    >
      <ItemCreateScreenInner />
    </PrivilegeGate>
  );
}

function ItemCreateScreenInner() {
  const nav = useNav();
  const { createAsync, createMutation } = useItemMutations();

  useScreenReady();
  const formKey = useFormScreenKey();

  const handleSubmit = async (data: ItemCreateFormData) => {
    try {
      const validatedData = itemCreateSchema.parse(data);
      const result = await createAsync(validatedData);
      if (result.success && result.data) {
        nav.replace(mobileRoute(routes.inventory.products.details(result.data.id)));
      }
    } catch (error) {
      // API client surfaces error.
      console.error("Error creating item:", error);
    }
  };

  const handleCancel = () => {
    nav.goBack({ fallback: mobileRoute(routes.inventory.products.root) });
  };

  return (
    <ItemForm
      key={formKey}
      mode="create"
      onSubmit={handleSubmit}
      onCancel={handleCancel}
      isSubmitting={createMutation.isPending}
    />
  );
}
