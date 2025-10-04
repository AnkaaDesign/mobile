import { View, KeyboardAvoidingView, Platform } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { showToast } from "@/components/ui/toast";
import { ThemedView } from "@/components/ui/themed-view";
import { ThemedScrollView } from "@/components/ui/themed-scroll-view";
import { ThemedText } from "@/components/ui/themed-text";
import { Button } from "@/components/ui/button";
import { ItemCategoryForm } from "@/components/inventory/item/category/form/category-form";
import { SkeletonCard } from "@/components/ui/loading";
import { PrivilegeGuard } from "@/components/privilege-guard";
import { useItemCategory, useItemCategoryMutations } from '../../../../../../hooks';
import { type ItemCategoryUpdateFormData } from '../../../../../../schemas';
import { routeToMobilePath } from "@/lib/route-mapper";
import { routes, SECTOR_PRIVILEGES } from '../../../../../../constants';
import { StyleSheet } from "react-native";
import { spacing } from "@/constants/design-system";

export default function CategoryEditScreenWrapper() {
  return (
    <PrivilegeGuard requiredPrivilege={[SECTOR_PRIVILEGES.WAREHOUSE, SECTOR_PRIVILEGES.ADMIN]} requireAll={false}>
      <CategoryEditScreen />
    </PrivilegeGuard>
  );
}

function CategoryEditScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { updateAsync } = useItemCategoryMutations();

  const {
    data: response,
    isLoading,
    error,
  } = useItemCategory(id!, {
    include: {
      items: true,
    },
  });

  const category = response?.data;

  const handleFormSubmit = async (changedData: Partial<ItemCategoryUpdateFormData>) => {
    if (!id) return;

    try {
      console.log("Sending only changed fields:", changedData);

      await updateAsync({
        id,
        data: changedData,
      });

      showToast({
        message: "Categoria atualizada com sucesso!",
        type: "success",
      });
      router.replace(routeToMobilePath(routes.inventory.products.categories.root) as any);
    } catch (error) {
      // Error handled by mutation hook
      console.error("Error updating category:", error);
    }
  };

  const handleCancel = () => {
    router.replace(routeToMobilePath(routes.inventory.products.categories.root) as any);
  };

  if (isLoading) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.skeletonContainer}>
          <SkeletonCard style={styles.skeleton} />
          <SkeletonCard style={styles.skeleton} />
          <SkeletonCard style={styles.skeleton} />
        </View>
      </ThemedView>
    );
  }

  if (error || !category) {
    return (
      <ThemedView className="flex-1">
        <View className="flex-1 items-center justify-center px-4">
          <ThemedText className="text-2xl font-semibold mb-2 text-center">Categoria não encontrada</ThemedText>
          <ThemedText className="text-muted-foreground mb-4 text-center">A categoria que você está procurando não existe ou foi removida.</ThemedText>
          <Button onPress={handleCancel}>
            <ThemedText className="text-white">Voltar para lista</ThemedText>
          </Button>
        </View>
      </ThemedView>
    );
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
      <ThemedScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: spacing.lg, paddingBottom: spacing.lg }}>
        <ItemCategoryForm
          mode="update"
          defaultValues={{
            name: category.name,
            type: category.type,
          }}
          onSubmit={handleFormSubmit}
          onCancel={handleCancel}
          isSubmitting={false}
        />
      </ThemedScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  skeletonContainer: {
    padding: spacing.lg,
    gap: spacing.lg,
  },
  skeleton: {
    height: 200,
  },
});
