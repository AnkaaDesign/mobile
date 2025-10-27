import { useRouter } from "expo-router";
import { KeyboardAvoidingView, Platform } from "react-native";
import { showToast } from "@/components/ui/toast";
import { ThemedView } from "@/components/ui/themed-view";
import { ThemedScrollView } from "@/components/ui/themed-scroll-view";
import { ItemCategoryForm } from "@/components/inventory/item/category/form/category-form";
import { useItemCategoryMutations } from '../../../../../hooks';
import { itemCategoryCreateSchema, type ItemCategoryCreateFormData } from '../../../../../schemas';
import { routeToMobilePath } from "@/lib/route-mapper";
import { routes } from '../../../../../constants';
import { spacing } from "@/constants/design-system";

export default function CategoryCreateScreen() {
  const router = useRouter();
  const { createAsync, createMutation } = useItemCategoryMutations();

  const handleSubmit = async (data: ItemCategoryCreateFormData) => {
    try {
      // Validate data with schema
      const validatedData = itemCategoryCreateSchema.parse(data);

      const result = await createAsync(validatedData);

      if (result.success) {
        showToast({
          message: "Categoria criada com sucesso!",
          type: "success",
        });
        router.replace(routeToMobilePath(routes.inventory.products.categories.root) as any);
      }
    } catch (error) {
      // Error handled by mutation hook
      console.error("Error creating category:", error);
    }
  };

  const handleCancel = () => {
    router.replace(routeToMobilePath(routes.inventory.products.categories.root) as any);
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
      <ThemedScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: spacing.lg, paddingBottom: spacing.lg }}>
        <ItemCategoryForm mode="create" onSubmit={handleSubmit} onCancel={handleCancel} isSubmitting={createMutation.isPending} />
      </ThemedScrollView>
    </KeyboardAvoidingView>
  );
}
