import { View, StyleSheet } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
// import { showToast } from "@/components/ui/toast";
import { ThemedText } from "@/components/ui/themed-text";
import { Button } from "@/components/ui/button";
import { ItemEditForm } from "@/components/inventory/item/form/item-edit-form";
import { ItemEditSkeleton } from "@/components/inventory/item/skeleton/item-edit-skeleton";
import { PrivilegeGuard } from "@/components/privilege-guard";
import { useItem, useItemMutations, useScreenReady } from "@/hooks";
import { type ItemUpdateFormData } from '../../../../../schemas';
import { routeToMobilePath } from '@/utils/route-mapper';
import { routes, SECTOR_PRIVILEGES } from "@/constants";
import { spacing } from "@/constants/design-system";
import { useTheme } from "@/lib/theme";
import { useNavigationLoading } from "@/contexts/navigation-loading-context";

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
  const { goBack } = useNavigationLoading();

  // End navigation loading overlay when screen mounts
  useScreenReady();

  const {
    data: response,
    isLoading,
    error,
  } = useItem(id!, {
    // Use select to fetch only fields needed for the edit form
    select: {
      // Core item fields for editing
      id: true,
      name: true,
      uniCode: true,
      quantity: true,
      reorderPoint: true,
      reorderQuantity: true,
      maxQuantity: true,
      isManualMaxQuantity: true,
      isManualReorderPoint: true,
      boxQuantity: true,
      icms: true,
      ipi: true,
      barcodes: true,
      shouldAssignToUser: true,
      abcCategory: true,
      xyzCategory: true,
      brandId: true,
      categoryId: true,
      supplierId: true,
      estimatedLeadTime: true,
      isActive: true,
      // PPE fields
      ppeType: true,
      ppeSize: true,
      ppeCA: true,
      ppeDeliveryMode: true,
      ppeStandardQuantity: true,
      // Related entities - only fields needed to display in selectors
      brand: {
        select: {
          id: true,
          name: true,
        },
      },
      category: {
        select: {
          id: true,
          name: true,
          type: true,
        },
      },
      supplier: {
        select: {
          id: true,
          fantasyName: true,
        },
      },
      measures: {
        select: {
          id: true,
          value: true,
          unit: true,
          measureType: true,
        },
      },
      prices: {
        take: 1,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          value: true,
          createdAt: true,
        },
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

      // API client already shows success alert
      router.replace(routeToMobilePath(routes.inventory.products.root) as any);
    } catch (error) {
      // API client already shows error alert
      console.error("Error updating item:", error);
    }
  };

  const handleCancel = () => {
    goBack({ fallbackRoute: routeToMobilePath(routes.inventory.products.root) });
  };

  if (isLoading) {
    return <ItemEditSkeleton />;
  }

  if (error || !item) {
    const { colors } = useTheme();
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={["bottom"]}>
        <View style={styles.errorContainer}>
          <ThemedText style={styles.errorTitle}>Item não encontrado</ThemedText>
          <ThemedText style={styles.errorMessage}>O item que você está procurando não existe ou foi removido.</ThemedText>
          <Button onPress={handleCancel}>
            <ThemedText style={styles.buttonText}>Voltar para lista</ThemedText>
          </Button>
        </View>
      </SafeAreaView>
    );
  }

  return <ItemEditForm item={item} onSubmit={handleFormSubmit} onCancel={handleCancel} isSubmitting={false} />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: "600",
    marginBottom: spacing.sm,
    textAlign: "center",
  },
  errorMessage: {
    marginBottom: spacing.lg,
    textAlign: "center",
    opacity: 0.7,
  },
  buttonText: {
    color: "white",
  },
});
