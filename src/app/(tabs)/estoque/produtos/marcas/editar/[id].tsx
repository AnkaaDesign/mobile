import { View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { showToast } from "@/components/ui/toast";
import { ThemedView } from "@/components/ui/themed-view";
import { ThemedText } from "@/components/ui/themed-text";
import { Button } from "@/components/ui/button";
import { ItemBrandForm } from "@/components/inventory/item/brand/form/brand-form";
import { SkeletonCard } from "@/components/ui/loading";
import { PrivilegeGuard } from "@/components/privilege-guard";
import { useItemBrand, useItemBrandMutations } from "@/hooks";
import { type ItemBrandUpdateFormData } from '../../../../../../schemas';
import { routeToMobilePath } from "@/lib/route-mapper";
import { routes, SECTOR_PRIVILEGES } from "@/constants";
import { StyleSheet } from "react-native";
import { spacing } from "@/constants/design-system";

export default function BrandEditScreenWrapper() {
  return (
    <PrivilegeGuard requiredPrivilege={[SECTOR_PRIVILEGES.WAREHOUSE, SECTOR_PRIVILEGES.ADMIN]} requireAll={false}>
      <BrandEditScreen />
    </PrivilegeGuard>
  );
}

function BrandEditScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { updateAsync } = useItemBrandMutations();

  const {
    data: response,
    isLoading,
    error,
  } = useItemBrand(id!, {
    include: {
      items: true,
    },
  });

  const brand = response?.data;

  const handleFormSubmit = async (changedData: Partial<ItemBrandUpdateFormData>) => {
    if (!id) return;

    try {
      console.log("Sending only changed fields:", changedData);

      await updateAsync({
        id,
        data: changedData,
      });

      showToast({
        message: "Marca atualizada com sucesso!",
        type: "success",
      });
      router.replace(routeToMobilePath(routes.inventory.products.brands.root) as any);
    } catch (error) {
      // Error handled by mutation hook
      console.error("Error updating brand:", error);
    }
  };

  const handleCancel = () => {
    router.replace(routeToMobilePath(routes.inventory.products.brands.root) as any);
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

  if (error || !brand) {
    return (
      <ThemedView className="flex-1">
        <View className="flex-1 items-center justify-center px-4">
          <ThemedText className="text-2xl font-semibold mb-2 text-center">Marca não encontrada</ThemedText>
          <ThemedText className="text-muted-foreground mb-4 text-center">A marca que você está procurando não existe ou foi removida.</ThemedText>
          <Button onPress={handleCancel}>
            <ThemedText className="text-white">Voltar para lista</ThemedText>
          </Button>
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView className="flex-1">
      <ItemBrandForm
        mode="update"
        defaultValues={{
          name: brand.name,
        }}
        onSubmit={handleFormSubmit}
        onCancel={handleCancel}
        isSubmitting={false}
      />
    </ThemedView>
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
