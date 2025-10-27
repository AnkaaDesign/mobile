import { View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { showToast } from "@/components/ui/toast";
import { ThemedView } from "@/components/ui/themed-view";
import { ThemedText } from "@/components/ui/themed-text";
import { Button } from "@/components/ui/button";
import { ItemEditForm } from "@/components/inventory/item/form/item-edit-form";
import { ItemEditSkeleton } from "@/components/inventory/item/skeleton/item-edit-skeleton";
import { PrivilegeGuard } from "@/components/privilege-guard";
import { useItem, useItemMutations } from '../../../../../hooks';
import { type ItemUpdateFormData } from '../../../../../schemas';
import { routeToMobilePath } from "@/lib/route-mapper";
import { routes, SECTOR_PRIVILEGES } from '../../../../../constants';

export default function ItemEditScreenWrapper() {
  return (
    <PrivilegeGuard requiredPrivilege={[SECTOR_PRIVILEGES.WAREHOUSE, SECTOR_PRIVILEGES.ADMIN]} requireAll={false}>
      <ItemEditScreen />
    </PrivilegeGuard>
  );
}

function ItemEditScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { updateAsync } = useItemMutations();

  const {
    data: response,
    isLoading,
    error,
  } = useItem(id!, {
    include: {
      brand: true,
      category: true,
      supplier: true,
      prices: {
        orderBy: { createdAt: "desc" },
      },
    },
  });

  const item = response?.data;

  const handleFormSubmit = async (changedData: Partial<ItemUpdateFormData>) => {
    if (!id) return;

    try {
      console.log("Sending only changed fields:", changedData);

      await updateAsync({
        id,
        data: changedData,
      });

      showToast({
        message: "Item atualizado com sucesso!",
        type: "success",
      });
      router.replace(routeToMobilePath(routes.inventory.products.root) as any);
    } catch (error) {
      // Error handled by mutation hook
      console.error("Error updating item:", error);
    }
  };

  const handleCancel = () => {
    router.replace(routeToMobilePath(routes.inventory.products.root) as any);
  };

  if (isLoading) {
    return <ItemEditSkeleton />;
  }

  if (error || !item) {
    return (
      <ThemedView className="flex-1">
        <View className="flex-1 items-center justify-center px-4">
          <ThemedText className="text-2xl font-semibold mb-2 text-center">Item não encontrado</ThemedText>
          <ThemedText className="text-muted-foreground mb-4 text-center">O item que você está procurando não existe ou foi removido.</ThemedText>
          <Button onPress={handleCancel}>
            <ThemedText className="text-white">Voltar para lista</ThemedText>
          </Button>
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView className="flex-1">
      <ItemEditForm item={item} onSubmit={handleFormSubmit} onCancel={handleCancel} isSubmitting={false} />
    </ThemedView>
  );
}
