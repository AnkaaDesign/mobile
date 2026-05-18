import { View, StyleSheet } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

import { ThemedText } from "@/components/ui/themed-text";
import { Button } from "@/components/ui/button";
import { ItemEditForm } from "@/components/inventory/item/form/item-edit-form";
import { ItemEditSkeleton } from "@/components/inventory/item/skeleton/item-edit-skeleton";
import { PrivilegeGate } from "@/components/auth/privilege-gate";
import { useItem, useItemMutations, useScreenReady } from "@/hooks";
import { type ItemUpdateFormData } from "@/schemas";
import { useNav } from "@/contexts/nav";
import { mobileRoute } from "@/constants/routes.types";
import { SECTOR_PRIVILEGES, routes } from "@/constants";
import { spacing } from "@/constants/design-system";
import { useTheme } from "@/lib/theme";

export default function ItemEditScreenWrapper() {
  return (
    <PrivilegeGate
      required={{ any: [SECTOR_PRIVILEGES.WAREHOUSE, SECTOR_PRIVILEGES.ADMIN] }}
    >
      <ItemEditScreen />
    </PrivilegeGate>
  );
}

function ItemEditScreen() {
  const nav = useNav();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { updateAsync } = useItemMutations();
  const { colors } = useTheme();

  const { data: response, isLoading, error } = useItem(id!, {
    select: {
      id: true,
      name: true,
      uniCode: true,
      quantity: true,
      reorderPoint: true,
      reorderQuantity: true,
      maxQuantity: true,
      monthlyConsumption: true,
      monthlyConsumptionTrendPercent: true,
      abcCategoryOrder: true,
      xyzCategoryOrder: true,
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
      ppeType: true,
      ppeSize: true,
      ppeCA: true,
      ppeDeliveryMode: true,
      ppeStandardQuantity: true,
      brand: { select: { id: true, name: true } },
      category: { select: { id: true, name: true, type: true } },
      supplier: { select: { id: true, fantasyName: true } },
      measures: {
        select: { id: true, value: true, unit: true, measureType: true },
      },
      prices: {
        take: 1,
        orderBy: { createdAt: "desc" },
        select: { id: true, value: true, createdAt: true },
      },
    },
  });

  useScreenReady(!isLoading);

  const item = response?.data;

  const handleFormSubmit = async (changedData: Partial<ItemUpdateFormData>) => {
    if (!id) return;
    try {
      await updateAsync({ id, data: changedData });
      nav.replace(mobileRoute(routes.inventory.products.details(id)));
    } catch (error) {
      // API client surfaces error.
      console.error("Error updating item:", error);
    }
  };

  const handleCancel = () => {
    nav.goBack({ fallback: mobileRoute(routes.inventory.products.root) });
  };

  if (isLoading) {
    return <ItemEditSkeleton />;
  }

  if (error || !item) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
        edges={["bottom"]}
      >
        <View style={styles.errorContainer}>
          <ThemedText style={styles.errorTitle}>Item não encontrado</ThemedText>
          <ThemedText style={styles.errorMessage}>
            O item que você está procurando não existe ou foi removido.
          </ThemedText>
          <Button onPress={handleCancel}>
            <ThemedText style={styles.buttonText}>Voltar para lista</ThemedText>
          </Button>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <ItemEditForm
      key={id}
      item={item}
      onSubmit={handleFormSubmit}
      onCancel={handleCancel}
      isSubmitting={false}
    />
  );
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
