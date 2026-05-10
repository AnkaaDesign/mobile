import { View, StyleSheet } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

import { ThemedText } from "@/components/ui/themed-text";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ItemBrandForm } from "@/components/inventory/item/brand/form/brand-form";
import { PrivilegeGate } from "@/components/auth/privilege-gate";
import { useItemBrand, useItemBrandMutations, useScreenReady } from "@/hooks";
import { type ItemBrandUpdateFormData } from "@/schemas";
import { useNav } from "@/contexts/nav";
import { mobileRoute } from "@/constants/routes.types";
import { SECTOR_PRIVILEGES, routes } from "@/constants";
import { spacing } from "@/constants/design-system";
import { useTheme } from "@/lib/theme";

export default function BrandEditScreenWrapper() {
  return (
    <PrivilegeGate
      required={{ any: [SECTOR_PRIVILEGES.WAREHOUSE, SECTOR_PRIVILEGES.ADMIN] }}
    >
      <BrandEditScreen />
    </PrivilegeGate>
  );
}

function BrandEditScreen() {
  const nav = useNav();
  const { colors } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { updateAsync } = useItemBrandMutations();

  const { data: response, isLoading, error } = useItemBrand(id!, {
    select: { id: true, name: true },
  });

  useScreenReady(!isLoading);

  const brand = response?.data;

  const handleFormSubmit = async (changedData: Partial<ItemBrandUpdateFormData>) => {
    if (!id) return;
    try {
      await updateAsync({ id, data: changedData });
      nav.replace(mobileRoute(routes.inventory.products.brands.details(id)));
    } catch (error) {
      // API client surfaces error.
      console.error("Error updating brand:", error);
    }
  };

  const handleCancel = () => {
    nav.goBack({ fallback: mobileRoute(routes.inventory.products.brands.root) });
  };

  if (isLoading) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
        edges={["bottom"]}
      >
        <View style={{ flex: 1, padding: 16, gap: 16, backgroundColor: colors.background }}>
          <Skeleton style={{ height: 24, width: "40%", borderRadius: 4 }} />
          <View
            style={{
              backgroundColor: colors.card,
              borderRadius: 8,
              borderWidth: 1,
              borderColor: colors.border,
              padding: 16,
              gap: 12,
            }}
          >
            <Skeleton style={{ height: 16, width: "70%", borderRadius: 4 }} />
            <Skeleton style={{ height: 16, width: "50%", borderRadius: 4 }} />
            <Skeleton style={{ height: 16, width: "60%", borderRadius: 4 }} />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !brand) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
        edges={["bottom"]}
      >
        <View style={styles.errorContainer}>
          <ThemedText style={styles.errorTitle}>Marca não encontrada</ThemedText>
          <ThemedText style={styles.errorMessage}>
            A marca que você está procurando não existe ou foi removida.
          </ThemedText>
          <Button onPress={handleCancel}>
            <ThemedText style={styles.buttonText}>Voltar para lista</ThemedText>
          </Button>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <ItemBrandForm
      key={id}
      mode="update"
      defaultValues={{ name: brand.name }}
      onSubmit={handleFormSubmit}
      onCancel={handleCancel}
      isSubmitting={false}
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
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
  buttonText: { color: "white" },
});
